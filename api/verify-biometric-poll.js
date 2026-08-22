/* GET /api/verify-biometric-poll?jobId=...
   Polls the biometric service for job completion, then stores the result
   in Supabase and updates user_metadata. Safe to call repeatedly.
   Returns: { status, decision, similarityCalibrated, livenessScore, reason }
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
const BIO_URL    = (process.env.BIOMETRIC_API_URL || '').replace(/\/$/, '');
const BIO_SECRET = process.env.BIOMETRIC_JWT_SECRET || '';
const BIO_ISSUER = process.env.BIOMETRIC_JWT_ISSUER || 'biometrical';

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

function updateUserMeta(userId, meta) {
  return new Promise(resolve => {
    const data = JSON.stringify({ user_metadata: meta });
    const req = https.request({
      hostname: SB_HOST,
      path:     `/auth/v1/admin/users/${userId}`,
      method:   'PUT',
      headers: {
        'apikey':         SB_KEY,
        'Authorization':  'Bearer ' + SB_KEY,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', () => resolve({ status: 500 }));
    req.write(data);
    req.end();
  });
}

async function hasVerifiedPhone(userId) {
  const r = await sbRequest('GET',
    `/rest/v1/phone_verifications?user_id=eq.${encodeURIComponent(userId)}&status=eq.verified&select=id&limit=1`
  );
  try {
    const rows = JSON.parse(r.body);
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

async function syncListingVerification(userId, verified) {
  await sbRequest('PATCH', `/rest/v1/ads?user_id=eq.${encodeURIComponent(userId)}`, { verified: !!verified })
    .catch(() => {});
}

function mintBioJwt(userId) {
  if (!BIO_SECRET) throw new Error('BIOMETRIC_JWT_SECRET not configured');
  const hdr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const pl  = Buffer.from(JSON.stringify({
    sub: userId.replace(/-/g, '').slice(0, 64),
    iss: BIO_ISSUER,
    aud: 'biometrical-verify',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', BIO_SECRET)
    .update(hdr + '.' + pl).digest('base64url');
  return hdr + '.' + pl + '.' + sig;
}

function callBioGet(path, jwt) {
  const bioHost = new URL(BIO_URL).hostname;
  const bioPort = new URL(BIO_URL).port || (BIO_URL.startsWith('https') ? 443 : 80);
  const lib     = BIO_URL.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request({
      hostname: bioHost,
      port:     Number(bioPort),
      path, method: 'GET',
      headers: { 'Authorization': 'Bearer ' + jwt }
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY) return res.status(500).json({ error: 'Server configuration error' });

  const user = await getAuthUser(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const jobId = (req.query?.jobId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!jobId) return res.status(400).json({ error: 'jobId required' });

  /* Verify job belongs to this user */
  const ownerCheck = await sbRequest('GET',
    `/rest/v1/biometric_verifications?user_id=eq.${encodeURIComponent(user.id)}&job_id=eq.${encodeURIComponent(jobId)}&select=id,status`
  );
  let existing;
  try {
    const rows = JSON.parse(ownerCheck.body);
    existing   = Array.isArray(rows) ? rows[0] : null;
  } catch {}

  if (!existing) return res.status(404).json({ error: 'Verification job not found' });

  /* If already terminal, return cached result without re-calling biometric service */
  if (['approved', 'review', 'rejected'].includes(existing.status)) {
    return res.status(200).json({ status: existing.status });
  }

  if (!BIO_URL) return res.status(503).json({ error: 'Biometric service not configured' });

  let jwt;
  try { jwt = mintBioJwt(user.id); }
  catch { return res.status(500).json({ error: 'Server configuration error' }); }

  let bioResult;
  try {
    const r = await callBioGet(`/api/v1/verify/${encodeURIComponent(jobId)}`, jwt);
    if (r.status === 404) return res.status(404).json({ error: 'Job not found on biometric service' });
    if (r.status !== 200) return res.status(502).json({ error: 'Biometric service error' });
    bioResult = JSON.parse(r.body);
  } catch (e) {
    console.error('[bio-poll] Error:', e.message);
    return res.status(502).json({ error: 'Could not reach biometric service' });
  }

  const { status: bioStatus, decision, similarity, similarity_calibrated,
          liveness_score, is_live, challenge_passed, deepfake_suspicious, reason } = bioResult;

  /* Still running */
  if (bioStatus === 'queued' || bioStatus === 'running') {
    return res.status(200).json({ status: 'processing' });
  }

  /* Map biometric decision to our status */
  const ourStatus = bioStatus === 'error'  ? 'rejected' :
                    decision  === 'APPROVE' ? 'approved' :
                    decision  === 'REVIEW'  ? 'review'   : 'rejected';
  const now = new Date().toISOString();

  /* Update biometric_verifications */
  const update = {
    status:                     ourStatus,
    decision,
    selfie_verified:            is_live === true,
    id_face_match_verified:     decision === 'APPROVE',
    face_match_score:           similarity            != null ? similarity            : undefined,
    face_match_score_calibrated: similarity_calibrated != null ? similarity_calibrated : undefined,
    liveness_score:             liveness_score        != null ? liveness_score        : undefined,
    is_live:                    is_live,
    challenge_passed:           challenge_passed,
    deepfake_suspicious:        deepfake_suspicious,
    rejection_reason:           reason || undefined,
    updated_at:                 now,
    ...(ourStatus === 'approved' ? { verified_at: now } : {})
  };
  /* Remove undefined keys */
  Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

  await sbRequest('PATCH',
    `/rest/v1/biometric_verifications?user_id=eq.${encodeURIComponent(user.id)}&job_id=eq.${encodeURIComponent(jobId)}`,
    update
  ).catch(() => {});

  /* Update user_metadata on approval (do NOT store scores or biometric data) */
  if (ourStatus === 'approved') {
    const fullyVerified = !!user.email_confirmed_at && await hasVerifiedPhone(user.id);
    await updateUserMeta(user.id, {
      ...(user.user_metadata || {}),
      biometric_verified: true,
      id_verified:        true,
      verified:           fullyVerified
    });
    if (fullyVerified) await syncListingVerification(user.id, true);
  } else if (ourStatus === 'review') {
    await updateUserMeta(user.id, { ...(user.user_metadata || {}), biometric_verified: 'review', verified: false });
  }

  /* Return only what the client needs — never forward receipt or raw scores */
  return res.status(200).json({
    status:               ourStatus,
    decision,
    similarityCalibrated: similarity_calibrated,
    livenessScore:        liveness_score,
    reason:               reason || null
  });
};
