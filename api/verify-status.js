/* GET /api/verify-status
   Returns the full verification status for the authenticated user.
   Used to populate the Verification Center modal.
   Never exposes biometric scores, ID numbers, full phone numbers, or receipts.
*/
'use strict';
const https = require('https');

const SB_URL  = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL.replace('https://', '');
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON = process.env.SUPABASE_ANON_KEY ||
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

function sbRequest(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST, path, method: 'GET',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.end();
  });
}

function maskPhone(phone) {
  if (!phone || phone.length < 6) return null;
  /* +27 82 *** 1234 */
  const digits = phone.replace(/\D/g, '');
  return '+' + digits.slice(0, 4) + ' *** ' + digits.slice(-4);
}

function getLevel(email, phone, biometric, manualVerified) {
  if (manualVerified || (email && phone && biometric === 'approved')) return 'Verified Seller';
  if (biometric === 'processing' || biometric === 'review') return 'Verification Pending';
  return 'Not Verified';
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

  const userId = user.id;

  /* Fetch phone and biometric records in parallel */
  const [phoneRes, bioRes] = await Promise.all([
    sbRequest(
      `/rest/v1/phone_verifications?user_id=eq.${encodeURIComponent(userId)}&status=eq.verified&select=phone_number,verified_at&order=verified_at.desc&limit=1`
    ),
    sbRequest(
      `/rest/v1/biometric_verifications?user_id=eq.${encodeURIComponent(userId)}&select=status,decision,selfie_verified,id_face_match_verified,rejection_reason,admin_decision,verified_at&limit=1`
    )
  ]);

  let phoneRow = null;
  let bioRow   = null;
  try { const r = JSON.parse(phoneRes.body); phoneRow = Array.isArray(r) ? r[0] : null; } catch {}
  try { const r = JSON.parse(bioRes.body);   bioRow   = Array.isArray(r) ? r[0] : null; } catch {}

  const emailVerified   = !!user.email_confirmed_at;
  const phoneVerified   = !!phoneRow;
  const biometricStatus = bioRow?.status || 'none';

  /* Effective biometric verification considers admin override */
  const effectiveBio = bioRow?.admin_decision === 'approved' ? 'approved' :
                       bioRow?.admin_decision === 'rejected' ? 'rejected' : biometricStatus;

  return res.status(200).json({
    email: {
      verified:   emailVerified,
      address:    user.email
    },
    phone: {
      verified:   phoneVerified,
      maskedNumber: phoneVerified ? maskPhone(phoneRow.phone_number) : null,
      verifiedAt:   phoneRow?.verified_at || null
    },
    biometric: {
      status:          effectiveBio,              /* none | processing | approved | review | rejected */
      selfieVerified:  bioRow?.selfie_verified  || false,
      idMatchVerified: bioRow?.id_face_match_verified || false,
      rejectionReason: effectiveBio === 'rejected' ? (bioRow?.rejection_reason || 'Verification failed') : null,
      verifiedAt:      bioRow?.verified_at || null
    },
    level: getLevel(emailVerified, phoneVerified, effectiveBio, !!user.user_metadata?.verified)
  });
};
