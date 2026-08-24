/* Vercel serverless — load messages for a specific email using service key */
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

function sbGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST, path, method: 'GET',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY)                 return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const email = req.query?.email || (req.url.includes('?') ? new URLSearchParams(req.url.split('?')[1]).get('email') : null);
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const enc = encodeURIComponent(email);
  try {
    const [r1, r2] = await Promise.all([
      sbGet(`/rest/v1/events?event_type=eq.em_message&payload->>recipient_email=eq.${enc}&order=created_at.desc&limit=100&select=id,created_at,payload`),
      sbGet(`/rest/v1/events?event_type=eq.em_message&payload->>sender_email=eq.${enc}&order=created_at.desc&limit=100&select=id,created_at,payload`)
    ]);
    const received = r1.status === 200 ? JSON.parse(r1.body) : [];
    const sent     = r2.status === 200 ? JSON.parse(r2.body) : [];
    return res.status(200).json({ received, sent });
  } catch(e) {
    return res.status(500).json({ error: String(e) });
  }
};
