/* Vercel serverless — set/unset verified flag on a Supabase auth user */
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

function sbReq(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST,
      path,
      method,
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { userId, verified, email, adminNote } = req.body || {};
  /* Sellers who posted a listing as a guest have no Supabase Auth account —
     load-users.js gives them a synthetic id like "seller:someone@example.com".
     There is no auth user to update, so verify them by their listings instead. */
  const isListingSeller = !userId || String(userId).startsWith('seller:');
  if (!isListingSeller && !userId) return res.status(400).json({ error: 'userId required' });
  if (isListingSeller && !email) return res.status(400).json({ error: 'email required to verify a seller with no account' });

  try {
    const now = new Date().toISOString();

    if (!isListingSeller) {
      const existing = await sbReq('GET', `/auth/v1/admin/users/${userId}`);
      let existingMeta = {};
      if (existing.status === 200) {
        try { existingMeta = JSON.parse(existing.body).user_metadata || {}; } catch {}
      }
      const r = await sbReq('PUT', `/auth/v1/admin/users/${userId}`, {
        user_metadata: {
          ...existingMeta,
          verified: !!verified,
          manual_verified: !!verified,
          verified_by_admin_at: verified ? now : null,
        }
      });
      if (r.status !== 200) return res.status(502).json({ error: 'Auth API error ' + r.status, detail: r.body });

      const bioPatch = {
        user_id: userId,
        status: verified ? 'approved' : 'review',
        admin_decision: verified ? 'approved' : 'rejected',
        admin_notes: String(adminNote || (verified ? 'Manual admin approval' : 'Manual admin removal')).slice(0, 500),
        admin_reviewed_by: 'Everything Market Admin',
        admin_reviewed_at: now,
        updated_at: now,
        ...(verified ? { verified_at: now } : {}),
      };
      await sbReq('POST', '/rest/v1/biometric_verifications?on_conflict=user_id', bioPatch, {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }).catch(() => {});
    }

    const adUpdates = [];
    if (!isListingSeller) {
      adUpdates.push(sbReq('PATCH', `/rest/v1/ads?user_id=eq.${encodeURIComponent(userId)}`, { verified: !!verified }).catch(e => ({ error: String(e) })));
    }
    if (email) {
      adUpdates.push(sbReq('PATCH', `/rest/v1/ads?contact_email=eq.${encodeURIComponent(String(email).toLowerCase())}`, { verified: !!verified }).catch(e => ({ error: String(e) })));
    }
    await Promise.all(adUpdates);

    return res.status(200).json({ ok: true, syncedListings: true });
  } catch(e) {
    return res.status(500).json({ error: String(e) });
  }
};
