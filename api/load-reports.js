/* Admin-only — list reported ads for review.
   Reports are written by js/em-analytics.js (emReport) into the `reports`
   table (see supabase-reports.sql). This just reads them back.
*/
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

function sbReq(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST,
      path,
      method: 'GET',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    }, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  try {
    const r = await sbReq('/rest/v1/reports?select=*&order=created_at.desc&limit=500');
    if (r.status !== 200) {
      /* Table may not exist yet if supabase-reports.sql hasn't been run */
      if (r.status === 404 || /relation .* does not exist/i.test(r.body)) {
        return res.status(200).json([]);
      }
      console.error('[load-reports] Supabase error', r.status, r.body);
      return res.status(502).json({ error: 'DB error ' + r.status });
    }
    return res.status(200).json(JSON.parse(r.body || '[]'));
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
