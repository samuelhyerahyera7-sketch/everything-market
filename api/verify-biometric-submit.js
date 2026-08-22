/* POST /api/verify-biometric-submit
   Manual identity review submission.
   Body: { idStoragePath, selfieStoragePath }
   Stores private Supabase Storage paths for admin review.
*/
'use strict';
const https = require('https');
const crypto = require('crypto');

const SB_URL  = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL.replace('https://', '');
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

module.exports.config = { api: { bodyParser: { sizeLimit: '1mb' } } };

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

function sbRequest(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST, path, method,
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(method !== 'GET' && method !== 'DELETE' ? { 'Prefer': 'return=representation' } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
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

function fetchStorageMeta(storagePath) {
  const safePath = storagePath.replace(/\.\./g, '').replace(/^\//, '');
  const encodedPath = safePath.split('/').map(encodeURIComponent).join('/');
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST,
      path: `/storage/v1/object/biometric-temp/${encodedPath}`,
      method: 'GET',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    }, res => {
      if (res.statusCode !== 200) return reject(new Error(`Storage file missing: ${safePath}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        resolve({
          path: safePath,
          contentType: res.headers['content-type'] || 'application/octet-stream',
          size: Buffer.concat(chunks).length
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function safeReviewRef() {
  return 'manual-' + crypto.randomBytes(8).toString('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY) return res.status(500).json({ error: 'Server configuration error' });

  const user = await getAuthUser(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { idStoragePath, selfieStoragePath } = req.body || {};
  if (!idStoragePath || !selfieStoragePath) {
    return res.status(400).json({ error: 'ID photo and selfie photo are required' });
  }

  const userId = user.id;
  if (!idStoragePath.startsWith(userId + '/') || !selfieStoragePath.startsWith(userId + '/')) {
    return res.status(403).json({ error: 'Storage path does not belong to your account' });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rateRes = await sbRequest('GET',
    `/rest/v1/verification_attempts?user_id=eq.${encodeURIComponent(userId)}&type=eq.biometric&attempted_at=gte.${encodeURIComponent(since)}&select=id`
  );
  try {
    const rows = JSON.parse(rateRes.body);
    if (Array.isArray(rows) && rows.length >= 5) {
      return res.status(429).json({ error: 'Too many submissions. Please try again tomorrow.' });
    }
  } catch {}

  let idMeta, selfieMeta;
  try {
    [idMeta, selfieMeta] = await Promise.all([
      fetchStorageMeta(idStoragePath),
      fetchStorageMeta(selfieStoragePath)
    ]);
  } catch (e) {
    return res.status(400).json({ error: 'Could not retrieve uploaded photos. Please upload again.' });
  }

  const allowedImg = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedImg.includes(idMeta.contentType) || !allowedImg.includes(selfieMeta.contentType)) {
    return res.status(400).json({ error: 'Photos must be JPEG, PNG, or WebP images' });
  }
  if (idMeta.size > 8 * 1024 * 1024 || selfieMeta.size > 8 * 1024 * 1024) {
    return res.status(400).json({ error: 'Each photo must be 8 MB or smaller' });
  }

  const now = new Date().toISOString();
  const reference = safeReviewRef();
  const receipt = {
    mode: 'manual_identity_review',
    submitted_at: now,
    files: {
      id_photo: idMeta,
      selfie_photo: selfieMeta
    }
  };

  const upsert = await sbRequest('POST', '/rest/v1/biometric_verifications?on_conflict=user_id', {
    user_id: userId,
    job_id: reference,
    status: 'review',
    decision: 'REVIEW',
    selfie_verified: false,
    id_face_match_verified: false,
    rejection_reason: null,
    verification_provider: 'manual-admin-review',
    verification_reference: reference,
    receipt,
    admin_decision: null,
    admin_notes: null,
    admin_reviewed_at: null,
    files_deleted_at: null,
    updated_at: now
  }, {
    Prefer: 'resolution=merge-duplicates,return=representation'
  });

  if (upsert.status < 200 || upsert.status >= 300) {
    return res.status(500).json({ error: 'Could not create manual review request' });
  }

  sbRequest('POST', '/rest/v1/verification_attempts', { user_id: userId, type: 'biometric', ip: 'manual-review' })
    .catch(() => {});

  return res.status(200).json({ status: 'review', reference });
};
