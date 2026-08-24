/* Vercel serverless — edit an existing ad with time-gated field restrictions */
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON    = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

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

function sbReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST, path, method,
      headers: {
        'apikey':          SB_KEY,
        'Authorization':   'Bearer ' + SB_KEY,
        'Content-Type':    'application/json',
        'Prefer':          method === 'PATCH' ? 'return=minimal' : '',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
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
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY)                 return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const caller = await getAuthUser(req.headers.authorization);
  if (!caller) return res.status(401).json({ error: 'Sign in to edit this ad.' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { id, title, description, price, photos, cond, neg } = body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Fetch current ad
  const getR = await sbReq('GET',
    `/rest/v1/ads?id=eq.${encodeURIComponent(id)}&select=id,user_id,created_at,price,photos,title,description,cond,neg`,
    null);
  if (getR.status !== 200) return res.status(502).json({ error: 'Failed to fetch ad' });

  let ads;
  try { ads = JSON.parse(getR.body); } catch { return res.status(502).json({ error: 'Invalid DB response' }); }
  if (!ads.length) return res.status(404).json({ error: 'Ad not found' });
  const ad = ads[0];

  // Ownership check — derived from the verified session, never from client input
  if (!ad.user_id || String(ad.user_id) !== String(caller.id)) {
    return res.status(403).json({ error: 'Not your ad' });
  }

  const ageMs       = Date.now() - new Date(ad.created_at).getTime();
  const withinWindow = ageMs <= EDIT_WINDOW_MS;
  const patch       = {};

  if (withinWindow) {
    // Full edit
    if (title       !== undefined) patch.title       = String(title).trim().slice(0, 200);
    if (description !== undefined) patch.description = String(description).trim().slice(0, 5000);
    if (price       !== undefined) patch.price       = Math.max(0, Number(price) || 0);
    if (cond        !== undefined) patch.cond        = String(cond).trim().slice(0, 50);
    if (neg         !== undefined) patch.neg         = !!neg;
    if (photos !== undefined && Array.isArray(photos)) patch.photos = photos.slice(0, 10);
  } else {
    // Restricted edit: price reduction + add photos only
    if (price !== undefined) {
      const newPrice = Math.max(0, Number(price) || 0);
      if (newPrice > (ad.price || 0)) {
        return res.status(400).json({ error: 'You can only reduce the price after 24 hours of posting.' });
      }
      if (newPrice !== (ad.price || 0)) patch.price = newPrice;
    }
    if (photos !== undefined && Array.isArray(photos)) {
      const existing = ad.photos || [];
      const removedAny = existing.some(p => !photos.includes(p));
      if (removedAny) {
        return res.status(400).json({ error: 'You cannot remove existing photos after 24 hours of posting.' });
      }
      if (photos.length !== existing.length) patch.photos = photos.slice(0, 10);
    }
  }

  if (!Object.keys(patch).length) {
    return res.status(400).json({ error: 'No changes detected.' });
  }

  const patchR = await sbReq('PATCH', `/rest/v1/ads?id=eq.${encodeURIComponent(id)}`, patch);
  if (patchR.status !== 200 && patchR.status !== 204) {
    return res.status(502).json({ error: 'Failed to save changes.' });
  }

  return res.status(200).json({ ok: true, restricted: !withinWindow, patch });
};
