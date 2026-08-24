/* Vercel serverless — load all ads server-side using service key to bypass RLS.
   This ensures every visitor sees every ad regardless of Supabase SELECT policies.
   Required env var: SUPABASE_SERVICE_KEY (add in Vercel dashboard)
*/
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

function sbGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SB_HOST,
      path,
      method: 'GET',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    /* Hide suspended sellers' listings. The suspended column is optional
       (added by supabase-suspend.sql) — if it doesn't exist yet, this filtered
       query 400s and we fall back to the unfiltered one below. */
    let r = await sbGet('/rest/v1/ads?select=*&suspended=eq.false&order=created_at.desc&limit=500');
    if (r.status !== 200) {
      r = await sbGet('/rest/v1/ads?select=*&order=created_at.desc&limit=500');
    }
    if (r.status !== 200) {
      console.error('[load-ads] Supabase responded', r.status, r.body);
      return res.status(502).json({ error: 'DB error ' + r.status });
    }
    const ads = JSON.parse(r.body);
    console.log('[load-ads] returned', ads.length, 'ads');
    return res.status(200).json(ads);
  } catch (e) {
    console.error('[load-ads] exception:', e);
    return res.status(500).json({ error: String(e) });
  }
};
