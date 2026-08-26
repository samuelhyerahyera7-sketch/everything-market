/* Admin-only — attach ID/selfie evidence an admin received outside the app
   (e.g. WhatsApp, email) to a registered user's verification record, so it
   shows up in the same "Review photos" viewer as self-serve submissions.

   Only works for registered users (a real Supabase Auth uuid). Guest/
   listing-only sellers have no user_id to attach evidence to yet.
*/
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

function sbReq(method, path, body, extraHeaders = {}) {
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
        ...extraHeaders,
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

function parseImageUpload(file, label) {
  const dataUrl = String(file?.dataUrl || '');
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error(`${label} must be a JPEG, PNG, or WebP image`);
  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) throw new Error(`${label} is empty`);
  if (buffer.length > 8 * 1024 * 1024) throw new Error(`${label} must be 8 MB or smaller`);
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  return { contentType, buffer, ext };
}

function uploadStorageObject(storagePath, parsed) {
  const safePath = storagePath.replace(/\.\./g, '').replace(/^\//, '');
  const encodedPath = safePath.split('/').map(encodeURIComponent).join('/');
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST,
      path: `/storage/v1/object/biometric-temp/${encodedPath}`,
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        'Content-Type': parsed.contentType,
        'Cache-Control': 'no-store',
        'x-upsert': 'true',
        'Content-Length': parsed.buffer.length
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`Could not save ${safePath}`));
        resolve({ path: safePath, contentType: parsed.contentType, size: parsed.buffer.length });
      });
    });
    req.on('error', reject);
    req.write(parsed.buffer);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { userId, idPhoto, selfiePhoto, adminNote } = body || {};
  if (!userId) return res.status(400).json({ error: 'userId required (guest/listing sellers with no account cannot be attached yet)' });
  if (!idPhoto || !selfiePhoto) return res.status(400).json({ error: 'ID photo and selfie photo are both required' });

  try {
    const parsedId = parseImageUpload(idPhoto, 'ID photo');
    const parsedSelfie = parseImageUpload(selfiePhoto, 'Selfie photo');
    const stamp = Date.now();
    const idPath = `${userId}/${stamp}/admin-upload-id.${parsedId.ext}`;
    const selfiePath = `${userId}/${stamp}/admin-upload-selfie.${parsedSelfie.ext}`;
    const [idMeta, selfieMeta] = await Promise.all([
      uploadStorageObject(idPath, parsedId),
      uploadStorageObject(selfiePath, parsedSelfie)
    ]);

    const now = new Date().toISOString();
    const receipt = {
      mode: 'manual_identity_review',
      submitted_by: 'admin',
      submitted_at: now,
      files: { id_photo: idMeta, selfie_photo: selfieMeta }
    };

    const r = await sbReq('POST', '/rest/v1/biometric_verifications?on_conflict=user_id', {
      user_id: userId,
      status: 'review',
      admin_decision: null,
      verification_provider: 'manual-admin-review',
      receipt,
      admin_notes: String(adminNote || 'Photos attached by admin from evidence received outside the app').slice(0, 500),
      updated_at: now
    }, { Prefer: 'resolution=merge-duplicates,return=minimal' });
    if (r.status !== 200 && r.status !== 201 && r.status !== 204) {
      return res.status(502).json({ error: 'DB error ' + r.status, detail: r.body });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
};
