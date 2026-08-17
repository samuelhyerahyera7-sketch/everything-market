/* Vercel serverless — edit an existing ad with time-gated field restrictions */
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY)                 return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { id, user_id, title, description, price, photos, cond, neg } = body;
  if (!id || !user_id) return res.status(400).json({ error: 'Missing id or user_id' });

  // Fetch current ad
  const getR = await sbReq('GET',
    `/rest/v1/ads?id=eq.${encodeURIComponent(id)}&select=id,user_id,created_at,price,photos,title,description,cond,neg`,
    null);
  if (getR.status !== 200) return res.status(502).json({ error: 'Failed to fetch ad' });

  let ads;
  try { ads = JSON.parse(getR.body); } catch { return res.status(502).json({ error: 'Invalid DB response' }); }
  if (!ads.length) return res.status(404).json({ error: 'Ad not found' });
  const ad = ads[0];

  // Ownership check
  if (!ad.user_id || String(ad.user_id) !== String(user_id)) {
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
