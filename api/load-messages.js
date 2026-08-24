/* Vercel serverless — load messages for a specific email using service key */
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON    = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY)                 return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const email = req.query?.email || (req.url.includes('?') ? new URLSearchParams(req.url.split('?')[1]).get('email') : null);
  if (!email) return res.status(400).json({ error: 'Missing email' });

  /* Only the signed-in owner of this inbox can read it. */
  const caller = await getAuthUser(req.headers.authorization);
  if (!caller || String(caller.email || '').toLowerCase() !== String(email).toLowerCase()) {
    return res.status(401).json({ error: 'Sign in as this user to view their messages.' });
  }

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
