/* Delete an ad from Supabase by id, using the service key. */
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

function sbDelete(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: SB_HOST,
      path,
      method: 'DELETE',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
    };
    const req = https.request(opts, res => {
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const id = body && body.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const r = await sbDelete('/rest/v1/ads?id=eq.' + encodeURIComponent(String(id)));
    if (r.status !== 200 && r.status !== 204) {
      console.error('[delete-ad] Supabase error', r.status, r.body);
      return res.status(502).json({ error: 'DB error ' + r.status });
    }
    console.log('[delete-ad] deleted ad id:', id);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[delete-ad] exception:', e);
    return res.status(500).json({ error: String(e) });
  }
};
