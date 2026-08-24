/* Upload a single photo to Supabase Storage using the service key.
   Accepts: { adId, index, dataUrl } in request body.
   Returns: { url } on success.
*/
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const SB_ANON    = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

function getAuthUser(authHeader) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return Promise.resolve(null);
  return new Promise(resolve => {
    const req = https.request({
      hostname: SB_HOST, path: '/auth/v1/user', method: 'GET',
      headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + token }
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

function sbGetAd(adId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST,
      path: '/rest/v1/ads?id=eq.' + encodeURIComponent(adId) + '&select=user_id,contact_email&limit=1',
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

function uploadToStorage(path, buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: SB_HOST,
      path: '/storage/v1/object/ad-photos/' + path,
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
        'x-upsert': 'true',
      },
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(buffer);
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

  const { adId, index, dataUrl } = body || {};
  if (!adId || index == null || !dataUrl || !dataUrl.startsWith('data:')) {
    return res.status(400).json({ error: 'Missing adId, index, or dataUrl' });
  }

  /* Posting is allowed without an account (guest sellers), so this can't
     require sign-in outright. But if the ad already exists AND belongs to a
     registered account, only that account may overwrite its photos — this
     is what stops a stranger from clobbering another user's ad photos by
     guessing an adId. A brand-new post, or a guest-owned ad (no user_id),
     has no stronger account-level proof to check, matching how the rest of
     this codebase already treats guest-owned ads. */
  try {
    const existing = await sbGetAd(adId);
    if (existing.status === 200) {
      const rows = JSON.parse(existing.body);
      const ad = rows[0];
      if (ad && ad.user_id) {
        const caller = await getAuthUser(req.headers.authorization);
        if (!caller || String(ad.user_id) !== String(caller.id)) {
          return res.status(403).json({ error: 'You do not own this ad.' });
        }
      }
    }
  } catch (e) {
    console.error('[upload-photo] ownership check failed:', e);
  }

  /* Parse base64 data URL */
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'Invalid dataUrl format' });
  const mimeType = matches[1] || 'image/jpeg';
  const ext      = mimeType.split('/')[1] || 'jpg';
  const buffer   = Buffer.from(matches[2], 'base64');

  if (buffer.length > 8 * 1024 * 1024) {
    return res.status(413).json({ error: 'Image too large (max 8 MB)' });
  }

  const path = 'ad-' + String(adId) + '/' + index + '.' + ext;

  try {
    const r = await uploadToStorage(path, buffer, mimeType);
    if (r.status !== 200 && r.status !== 201) {
      console.error('[upload-photo] Storage error', r.status, r.body);
      return res.status(502).json({ error: 'Storage error ' + r.status });
    }
    const publicUrl = SB_URL_RAW + '/storage/v1/object/public/ad-photos/' + path;
    return res.status(200).json({ url: publicUrl });
  } catch (e) {
    console.error('[upload-photo] exception:', e);
    return res.status(500).json({ error: String(e) });
  }
};
