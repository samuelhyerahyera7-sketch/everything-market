/* GET  /api/whatsapp-webhook — Meta hub.challenge verification
   POST /api/whatsapp-webhook — Incoming WhatsApp Cloud API events
   Security: X-Hub-Signature-256 verified, idempotent, rate-limit flagging
*/
'use strict';
const https  = require('https');
const crypto = require('crypto');

const SB_URL    = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST   = SB_URL.replace('https://', '');
const SB_KEY    = process.env.SUPABASE_SERVICE_KEY;
const WA_VERIFY = process.env.META_WEBHOOK_VERIFY_TOKEN || '';
const WA_SECRET = process.env.META_APP_SECRET || '';

/* Disable Vercel's body parser so we can read the raw body for signature verification */
module.exports.config = { api: { bodyParser: false } };

/* ── Helpers ───────────────────────────────────────────────────────── */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sbRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST, path, method,
      headers: {
        'apikey':        SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type':  'application/json',
        ...(method !== 'GET' && method !== 'DELETE' ? { 'Prefer': 'return=representation' } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function updateUserMeta(userId, meta) {
  return new Promise(resolve => {
    const data = JSON.stringify({ user_metadata: meta });
    const req = https.request({
      hostname: SB_HOST,
      path:     `/auth/v1/admin/users/${userId}`,
      method:   'PUT',
      headers: {
        'apikey':          SB_KEY,
        'Authorization':   'Bearer ' + SB_KEY,
        'Content-Type':    'application/json',
        'Content-Length':  Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', () => resolve({ status: 500 }));
    req.write(data);
    req.end();
  });
}

async function getAdminUser(userId) {
  const r = await sbRequest('GET', `/auth/v1/admin/users/${userId}`);
  if (r.status !== 200) return null;
  try { return JSON.parse(r.body); } catch { return null; }
}

async function hasApprovedIdentity(userId) {
  const r = await sbRequest('GET',
    `/rest/v1/biometric_verifications?user_id=eq.${encodeURIComponent(userId)}&select=status,admin_decision&limit=1`
  );
  try {
    const rows = JSON.parse(r.body);
    const row = Array.isArray(rows) ? rows[0] : null;
    return row?.admin_decision === 'approved' || row?.status === 'approved';
  } catch {
    return false;
  }
}

async function syncListingVerification(userId, verified) {
  await sbRequest('PATCH', `/rest/v1/ads?user_id=eq.${encodeURIComponent(userId)}`, { verified: !!verified })
    .catch(() => {});
}


function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  /* WA sender IDs arrive without '+', e.g. "27821234567" */
  if (digits.startsWith('27') && digits.length === 11) return '+' + digits;
  /* SA local format: 0821234567 */
  if (digits.startsWith('0') && digits.length === 10) return '+27' + digits.slice(1);
  /* Already international (unlikely from WA) */
  return '+' + digits;
}

function verifySig(rawBody, header) {
  if (!WA_SECRET) return true; /* dev mode — skip */
  const expected = 'sha256=' + crypto
    .createHmac('sha256', WA_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(String(header || '').padEnd(expected.length, '\x00')),
      Buffer.from(expected)
    );
  } catch { return false; }
}

async function markProcessed(messageId) {
  await sbRequest('POST', '/rest/v1/wa_processed_messages',
    { message_id: messageId }
  ).catch(() => {});
}

/* ── Core verification logic ────────────────────────────────────────── */
async function processMessage(from, msgId, text) {
  const upper = text.trim().toUpperCase();
  if (!upper.startsWith('VERIFY ')) return;

  const token = upper.replace(/^VERIFY\s+/, '').trim();
  /* Token must match format XXXX-XXXX (8 uppercase hex chars) */
  if (!/^[0-9A-F]{4}-[0-9A-F]{4}$/.test(token)) {
    console.log('[wa-webhook] Ignored malformed token from', from);
    return;
  }

  /* Idempotency: skip if this message was already processed */
  const dupCheck = await sbRequest('GET',
    `/rest/v1/wa_processed_messages?message_id=eq.${encodeURIComponent(msgId)}&select=message_id`
  );
  try {
    const rows = JSON.parse(dupCheck.body);
    if (Array.isArray(rows) && rows.length > 0) {
      console.log('[wa-webhook] Duplicate message, skipping:', msgId);
      return;
    }
  } catch {}

  /* Hash token and find matching pending session */
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now       = new Date().toISOString();
  const sessionRes = await sbRequest('GET',
    `/rest/v1/phone_verifications?token_hash=eq.${encodeURIComponent(tokenHash)}&status=eq.pending&expires_at=gt.${encodeURIComponent(now)}&select=id,user_id&limit=1`
  );

  let session = null;
  try {
    const rows = JSON.parse(sessionRes.body);
    session    = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch {}

  if (!session) {
    console.log('[wa-webhook] No active session found for token');
    await markProcessed(msgId);
    return;
  }

  const phone = normalizePhone(from);

  /* Check if phone number already verified under a DIFFERENT account */
  const phoneConflict = await sbRequest('GET',
    `/rest/v1/phone_verifications?phone_number=eq.${encodeURIComponent(phone)}&status=eq.verified&user_id=neq.${encodeURIComponent(session.user_id)}&select=id&limit=1`
  );
  try {
    const rows = JSON.parse(phoneConflict.body);
    if (Array.isArray(rows) && rows.length > 0) {
      console.warn('[wa-webhook] Phone already used by another account:', phone);
      await sbRequest('PATCH',
        `/rest/v1/phone_verifications?id=eq.${encodeURIComponent(session.id)}`,
        { status: 'failed', phone_number: phone, wa_message_id: msgId }
      );
      /* Flag suspicious repeated attempt */
      await sbRequest('POST', '/rest/v1/verification_attempts', {
        user_id: session.user_id, type: 'phone_duplicate', ip: from
      }).catch(() => {});
      await markProcessed(msgId);
      return;
    }
  } catch {}

  /* Mark session verified */
  const verifiedAt = new Date().toISOString();
  await sbRequest('PATCH',
    `/rest/v1/phone_verifications?id=eq.${encodeURIComponent(session.id)}`,
    {
      status:       'verified',
      phone_number: phone,
      verified_at:  verifiedAt,
      used_at:      verifiedAt,
      wa_message_id: msgId
    }
  );

  /* Update Supabase auth user_metadata. Public verified badge only turns on after all hardcore checks. */
  const user = await getAdminUser(session.user_id);
  const fullyVerified = !!user?.email_confirmed_at && await hasApprovedIdentity(session.user_id);
  await updateUserMeta(session.user_id, {
    ...(user?.user_metadata || {}),
    phone_verified: true,
    phone:          phone,
    verified:       fullyVerified
  });
  if (fullyVerified) await syncListingVerification(session.user_id, true);

  await markProcessed(msgId);
  console.log('[wa-webhook] Phone verified for user:', session.user_id, '→', phone.replace(/\d{4}$/, '****'));
}

/* ── Main handler ───────────────────────────────────────────────────── */
module.exports = async function handler(req, res) {
  /* GET — Meta webhook subscription verification challenge */
  if (req.method === 'GET') {
    const url       = new URL(req.url, 'https://x');
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === WA_VERIFY && challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  if (!SB_KEY) return res.status(500).send('Server configuration error');

  /* Read raw body for signature verification */
  const rawBody = await getRawBody(req);

  /* Verify X-Hub-Signature-256 */
  if (!verifySig(rawBody, req.headers['x-hub-signature-256'])) {
    console.error('[wa-webhook] Signature verification failed');
    return res.status(401).send('Unauthorized');
  }

  let body;
  try { body = JSON.parse(rawBody.toString('utf8')); }
  catch { return res.status(400).send('Invalid JSON'); }

  /* Acknowledge to Meta immediately — they retry if we don't respond fast */
  res.status(200).send('OK');

  /* Process messages asynchronously */
  const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
  if (!Array.isArray(messages)) return;

  for (const msg of messages) {
    if (msg.type !== 'text') continue;
    const from = msg.from;
    const id   = msg.id;
    const text = msg.text?.body || '';
    processMessage(from, id, text).catch(e => {
      console.error('[wa-webhook] processMessage error:', e.message);
    });
  }
};
