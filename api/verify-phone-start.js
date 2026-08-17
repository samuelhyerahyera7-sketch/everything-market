/* POST /api/verify-phone-start
   Creates a WhatsApp verification session for the authenticated user.
   Returns: { sessionId, displayToken, waLink, expiresAt }
   Security: JWT-authenticated, rate-limited, cryptographically secure token
*/
'use strict';
const https  = require('https');
const crypto = require('crypto');

const SB_URL  = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL.replace('https://', '');
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const WA_NUMBER = (process.env.META_WHATSAPP_BUSINESS_NUMBER || '').replace(/\D/g, '');

/* ── HTTP helpers ──────────────────────────────────────────────────── */
function sbRequest(method, path, body, overrideKey) {
  const key = overrideKey || SB_KEY;
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST, path, method,
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
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

function getAuthUser(authHeader) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return Promise.resolve(null);
  return new Promise(resolve => {
    const req = https.request({
      hostname: SB_HOST, path: '/auth/v1/user', method: 'GET',
      headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + token }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        if (res.statusCode !== 200) return resolve(null);
        try { resolve(JSON.parse(raw)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

/* ── Handler ───────────────────────────────────────────────────────── */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY)        return res.status(500).json({ error: 'Server configuration error' });
  if (!WA_NUMBER)     return res.status(503).json({ error: 'WhatsApp verification not configured' });

  const user = await getAuthUser(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const userId = user.id;
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

  /* Rate limit: max 5 phone-verification attempts per user per 30 minutes */
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const rateRes = await sbRequest('GET',
    `/rest/v1/verification_attempts?user_id=eq.${encodeURIComponent(userId)}&type=eq.phone&attempted_at=gte.${encodeURIComponent(since)}&select=id`
  );
  try {
    const rows = JSON.parse(rateRes.body);
    if (Array.isArray(rows) && rows.length >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Please wait 30 minutes before trying again.' });
    }
  } catch {}

  /* Check if phone already verified for this user */
  if (user.user_metadata?.phone_verified) {
    return res.status(400).json({ error: 'Phone number already verified on this account.' });
  }

  /* Generate cryptographically secure token: "XXXX-XXXX" (8 uppercase hex chars) */
  const rawToken     = crypto.randomBytes(4).toString('hex').toUpperCase();
  const displayToken = rawToken.slice(0, 4) + '-' + rawToken.slice(4);
  const tokenHash    = crypto.createHash('sha256').update(displayToken).digest('hex');
  const expiresAt    = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  /* Insert verification session */
  const insertRes = await sbRequest('POST', '/rest/v1/phone_verifications', {
    user_id:    userId,
    token_hash: tokenHash,
    status:     'pending',
    expires_at: expiresAt
  });

  let sessionId;
  try {
    const rows = JSON.parse(insertRes.body);
    sessionId  = Array.isArray(rows) ? rows[0]?.id : rows?.id;
  } catch {}

  if (!sessionId) {
    console.error('[verify-phone-start] Insert failed:', insertRes.status, insertRes.body.slice(0, 200));
    return res.status(500).json({ error: 'Failed to create verification session' });
  }

  /* Log attempt (for rate-limiting + POPIA audit — no sensitive data stored) */
  sbRequest('POST', '/rest/v1/verification_attempts', { user_id: userId, type: 'phone', ip })
    .catch(() => {});

  /* Build WhatsApp deep link */
  const waText = 'VERIFY ' + displayToken;
  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`;

  return res.status(200).json({ sessionId, displayToken, waLink, expiresAt });
};
