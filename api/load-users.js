/* Vercel serverless — list all registered users via Supabase Auth admin API */
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  try {
    /* Fetch up to 1000 users from auth admin API */
    const r = await sbReq('GET', '/auth/v1/admin/users?page=1&per_page=1000');
    if (r.status !== 200) return res.status(502).json({ error: 'Auth API error ' + r.status });
    const parsed = JSON.parse(r.body);
    const users = parsed.users || parsed || [];

    /* Also fetch ads to count per-user ad totals */
    const rAds = await sbReq('GET', '/rest/v1/ads?select=seller_email,created_at');
    const ads = rAds.status === 200 ? JSON.parse(rAds.body) : [];
    const adCounts = {};
    ads.forEach(a => { if (a.seller_email) adCounts[a.seller_email] = (adCounts[a.seller_email] || 0) + 1; });

    const out = users.map(u => ({
      id:         u.id,
      email:      u.email,
      name:       u.user_metadata?.name || u.user_metadata?.full_name || '',
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
      confirmed:  !!u.confirmed_at,
      ad_count:   adCounts[u.email] || 0,
    }));

    return res.status(200).json(out);
  } catch(e) {
    return res.status(500).json({ error: String(e) });
  }
};
