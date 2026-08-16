/* Vercel serverless — delete a user from Supabase Auth + their ads */
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

function sbReq(method, path, body) {
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
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { userId, email } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    /* Delete their ads first (by email) */
    if (email) {
      await sbReq('DELETE', `/rest/v1/ads?seller_email=eq.${encodeURIComponent(email)}`);
    }
    /* Delete the auth user */
    const r = await sbReq('DELETE', `/auth/v1/admin/users/${encodeURIComponent(userId)}`);
    if (r.status === 200 || r.status === 204) return res.status(200).json({ ok: true });
    return res.status(502).json({ error: 'Auth delete failed ' + r.status, detail: r.body });
  } catch(e) {
    return res.status(500).json({ error: String(e) });
  }
};
