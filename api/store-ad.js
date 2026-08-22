/* Vercel serverless — insert an ad server-side so it's always public.
   Uses service key when available (bypasses RLS), falls back to anon key.
   Required env var: SUPABASE_SERVICE_KEY (add in Vercel dashboard)
*/
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

function sbPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: SB_HOST,
      path,
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=minimal',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getAuthUser(authHeader) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return Promise.resolve(null);
  return new Promise(resolve => {
    const req = https.request({
      hostname: SB_HOST,
      path: '/auth/v1/user',
      method: 'GET',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + token }
    }, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const required = ['title', 'cat', 'loc', 'seller'];
  for (const f of required) {
    if (!body[f] || !String(body[f]).trim())
      return res.status(400).json({ error: 'Missing field: ' + f });
  }

  const authUser = await getAuthUser(req.headers.authorization);
  const isSameUser = authUser?.id && body.user_id && String(authUser.id) === String(body.user_id);
  const isVerifiedUser = isSameUser && !!authUser.user_metadata?.verified;

  const payload = {
    title:         String(body.title).trim().slice(0, 200),
    cat:           String(body.cat).trim(),
    price:         Math.max(0, Number(body.price) || 0),
    loc:           String(body.loc).trim().slice(0, 100),
    seller:        String(body.seller).trim().slice(0, 100),
    seller_type:   body.seller_type === 'business' ? 'business' : 'private',
    description:   String(body.description || '').trim().slice(0, 5000),
    cond:          String(body.cond || 'N/A').trim().slice(0, 50),
    neg:           !!body.neg,
    photos:        Array.isArray(body.photos) ? body.photos.slice(0, 10) : [],
    phone:         String(body.phone || '').trim().slice(0, 30),
    contact_email: String(body.contact_email || '').trim().slice(0, 100),
    verified:      isVerifiedUser,
  };
  if (body.id)      payload.id      = Number(body.id);
  if (isSameUser) payload.user_id = String(authUser.id);

  try {
    const r = await sbPost('/rest/v1/ads?on_conflict=id', payload);
    /* 201 = Created, 204 = No Content (both mean success with return=minimal) */
    if (r.status !== 201 && r.status !== 204) {
      console.error('[store-ad] Supabase responded', r.status, r.body);
      return res.status(502).json({ error: 'DB error ' + r.status + ': ' + r.body });
    }
    console.log('[store-ad] ad inserted OK, title:', payload.title);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[store-ad] exception:', e);
    return res.status(500).json({ error: String(e) });
  }
};
