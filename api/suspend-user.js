/* Vercel serverless — suspend/unsuspend a seller.
   Registered accounts are banned via Supabase Auth (blocks sign-in).
   Sellers who only ever posted as a guest have no account to ban, so for
   them (and as a belt-and-braces step for registered sellers too) their
   listings are hidden from the public marketplace via ads.suspended. */
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

/* ~100 years — Supabase Auth has no "forever" ban, so this stands in for one.
   Unsuspending sends ban_duration: 'none' to lift it immediately. */
const SUSPEND_DURATION = '876000h';

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

  const { userId, suspended, email, adminNote } = req.body || {};
  const isListingSeller = !userId || String(userId).startsWith('seller:');
  if (!isListingSeller && !userId) return res.status(400).json({ error: 'userId required' });
  if (isListingSeller && !email) return res.status(400).json({ error: 'email required to suspend a seller with no account' });

  try {
    const now = new Date().toISOString();

    if (!isListingSeller) {
      const existing = await sbReq('GET', `/auth/v1/admin/users/${userId}`);
      let existingMeta = {};
      if (existing.status === 200) {
        try { existingMeta = JSON.parse(existing.body).user_metadata || {}; } catch {}
      }
      const r = await sbReq('PUT', `/auth/v1/admin/users/${userId}`, {
        ban_duration: suspended ? SUSPEND_DURATION : 'none',
        user_metadata: {
          ...existingMeta,
          suspended: !!suspended,
          suspended_by_admin_at: suspended ? now : null,
          suspend_reason: suspended ? String(adminNote || '').slice(0, 500) : null,
        }
      });
      if (r.status !== 200) return res.status(502).json({ error: 'Auth API error ' + r.status, detail: r.body });
    }

    /* Hide (or restore) their listings either way — this column is added by
       supabase-suspend.sql; if it hasn't been run yet these patches simply
       fail silently and only the account-level ban above takes effect. */
    const adUpdates = [];
    if (!isListingSeller) {
      adUpdates.push(sbReq('PATCH', `/rest/v1/ads?user_id=eq.${encodeURIComponent(userId)}`, { suspended: !!suspended }).catch(e => ({ error: String(e) })));
    }
    if (email) {
      adUpdates.push(sbReq('PATCH', `/rest/v1/ads?contact_email=eq.${encodeURIComponent(String(email).toLowerCase())}`, { suspended: !!suspended }).catch(e => ({ error: String(e) })));
    }
    await Promise.all(adUpdates);

    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: String(e) });
  }
};
