/* POST /api/verify-biometric-submit
   Fetches files from Supabase Storage, forwards to biometric service as
   multipart/form-data, stores job_id in biometric_verifications.
   Body: { idStoragePath, videoStoragePath, nonce, challenge, contractId }
   Returns: { jobId }
*/
'use strict';
const https  = require('https');
const crypto = require('crypto');
const http   = require('http');

const SB_URL    = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST   = SB_URL.replace('https://', '');
const SB_KEY    = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON   = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const BIO_URL   = (process.env.BIOMETRIC_API_URL || '').replace(/\/$/, '');
const BIO_SECRET = process.env.BIOMETRIC_JWT_SECRET || '';

/* Large files come via Supabase Storage, not as request body */
module.exports.config = { api: { bodyParser: { sizeLimit: '1mb' } } };

/* ── Helpers ──────────────────────────────────────────────────────── */
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

function sbRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST, path, method,
      headers: {
        'apikey':        SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type':  'application/json',
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

function fetchStorageFile(storagePath) {
  /* storagePath is relative to the bucket, e.g. "{userId}/{sessionId}/id.jpg" */
  const safePath = storagePath.replace(/\.\./g, '').replace(/^\//, '');
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST,
      path:     `/storage/v1/object/biometric-temp/${encodeURIComponent(safePath)}`,
      method:   'GET',
      headers:  { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        if (res.statusCode !== 200)
          return reject(new Error(`Storage fetch failed: HTTP ${res.statusCode} for ${safePath}`));
        resolve({
          buffer:      Buffer.concat(chunks),
          contentType: res.headers['content-type'] || 'application/octet-stream'
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function deleteStorageFile(storagePath) {
  const safePath = storagePath.replace(/\.\./g, '').replace(/^\//, '');
  return sbRequest('DELETE',
    `/storage/v1/object/biometric-temp/${encodeURIComponent(safePath)}`,
    null
  ).catch(() => {});
}

function mintBioJwt(userId) {
  if (!BIO_SECRET) throw new Error('BIOMETRIC_JWT_SECRET not configured');
  const hdr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const pl  = Buffer.from(JSON.stringify({
    sub: userId.replace(/-/g, '').slice(0, 64),
    iss: 'everything-market',
    aud: 'biometrical-verify',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', BIO_SECRET)
    .update(hdr + '.' + pl).digest('base64url');
  return hdr + '.' + pl + '.' + sig;
}

/* Build multipart/form-data body without any npm packages */
function buildMultipart(boundary, fields, files) {
  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
    ));
  }
  for (const { name, buffer, filename, mimeType } of files) {
    parts.push(Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`
      ),
      buffer,
      Buffer.from('\r\n')
    ]));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(parts);
}

function callBioSubmit(jwt, multipartBuffer, boundary) {
  const bioHost  = new URL(BIO_URL).hostname;
  const bioPort  = new URL(BIO_URL).port || (BIO_URL.startsWith('https') ? 443 : 80);
  const isHttps  = BIO_URL.startsWith('https');
  const lib      = isHttps ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request({
      hostname: bioHost,
      port:     Number(bioPort),
      path:     '/api/v1/verify/submit',
      method:   'POST',
      headers: {
        'Authorization':  'Bearer ' + jwt,
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBuffer.length
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(multipartBuffer);
    req.end();
  });
}

/* ── Main handler ─────────────────────────────────────────────────── */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY)    return res.status(500).json({ error: 'Server configuration error' });
  if (!BIO_URL)   return res.status(503).json({ error: 'Biometric service not configured' });

  const user = await getAuthUser(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { idStoragePath, videoStoragePath, nonce, challenge, contractId } = req.body || {};
  if (!idStoragePath || !videoStoragePath || !nonce || !challenge || !contractId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  /* Validate that storage paths belong to this user (path starts with userId) */
  const userId = user.id;
  if (!idStoragePath.startsWith(userId) || !videoStoragePath.startsWith(userId)) {
    return res.status(403).json({ error: 'Storage path does not belong to your account' });
  }

  /* Rate limit: max 3 biometric attempts per user per 24 hours */
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rateRes = await sbRequest('GET',
    `/rest/v1/verification_attempts?user_id=eq.${encodeURIComponent(userId)}&type=eq.biometric&attempted_at=gte.${encodeURIComponent(since)}&select=id`
  );
  try {
    const rows = JSON.parse(rateRes.body);
    if (Array.isArray(rows) && rows.length >= 3) {
      return res.status(429).json({ error: 'Too many attempts. Please try again tomorrow.' });
    }
  } catch {}

  /* Fetch files from Supabase Storage */
  let idFile, videoFile;
  try {
    [idFile, videoFile] = await Promise.all([
      fetchStorageFile(idStoragePath),
      fetchStorageFile(videoStoragePath)
    ]);
  } catch (e) {
    console.error('[bio-submit] Storage fetch error:', e.message);
    return res.status(400).json({ error: 'Could not retrieve uploaded files. Please upload again.' });
  }

  /* Validate file types */
  const allowedImg   = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideo = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (!allowedImg.includes(idFile.contentType)) {
    return res.status(400).json({ error: 'ID must be a JPEG, PNG, or WebP image' });
  }
  if (!allowedVideo.includes(videoFile.contentType)) {
    return res.status(400).json({ error: 'Selfie must be an MP4 or WebM video' });
  }

  /* File size caps (8MB ID, 25MB video) */
  if (idFile.buffer.length > 8 * 1024 * 1024) {
    return res.status(400).json({ error: 'ID image too large (max 8 MB)' });
  }
  if (videoFile.buffer.length > 25 * 1024 * 1024) {
    return res.status(400).json({ error: 'Selfie video too large (max 25 MB)' });
  }

  /* Mint JWT for biometric service */
  let jwt;
  try { jwt = mintBioJwt(userId); }
  catch (e) { return res.status(500).json({ error: 'Server configuration error' }); }

  /* Build multipart body */
  const boundary    = 'BioVerify' + crypto.randomBytes(8).toString('hex');
  const idExt       = idFile.contentType.split('/')[1] || 'jpg';
  const videoExt    = videoFile.contentType.includes('webm') ? 'webm' : 'mp4';
  const multipart   = buildMultipart(boundary, {
    contract_id: contractId,
    challenge,
    nonce
  }, [
    { name: 'id_image',      buffer: idFile.buffer,    filename: `id.${idExt}`,       mimeType: idFile.contentType },
    { name: 'selfie_video',  buffer: videoFile.buffer, filename: `selfie.${videoExt}`, mimeType: videoFile.contentType }
  ]);

  /* Log attempt BEFORE calling service */
  sbRequest('POST', '/rest/v1/verification_attempts', { user_id: userId, type: 'biometric', ip: 'server' })
    .catch(() => {});

  /* Submit to biometric service */
  let bioRes;
  try {
    bioRes = await callBioSubmit(jwt, multipart, boundary);
  } catch (e) {
    console.error('[bio-submit] Service call error:', e.message);
    return res.status(502).json({ error: 'Could not reach biometric service' });
  }

  if (bioRes.status !== 202) {
    console.error('[bio-submit] Service error:', bioRes.status, bioRes.body.slice(0, 300));
    return res.status(502).json({ error: 'Biometric service rejected the submission' });
  }

  let jobId;
  try { jobId = JSON.parse(bioRes.body).job_id; } catch {}
  if (!jobId) return res.status(502).json({ error: 'No job ID returned from biometric service' });

  /* Upsert biometric verification record */
  await sbRequest('POST', '/rest/v1/biometric_verifications', {
    user_id:               userId,
    job_id:                jobId,
    status:                'processing',
    verification_provider: 'biometrical-verify',
    verification_reference: contractId
  }).catch(() => {});

  /* Delete temporary files from storage after successful submission */
  /* POPIA: don't retain raw biometric files longer than necessary */
  Promise.all([
    deleteStorageFile(idStoragePath),
    deleteStorageFile(videoStoragePath)
  ]).then(() => {
    /* Mark files_deleted_at in DB */
    sbRequest('PATCH',
      `/rest/v1/biometric_verifications?user_id=eq.${encodeURIComponent(userId)}&job_id=eq.${encodeURIComponent(jobId)}`,
      { files_deleted_at: new Date().toISOString() }
    ).catch(() => {});
  }).catch(() => {});

  return res.status(200).json({ jobId });
};
