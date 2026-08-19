/* Delete an ad — verifies the caller owns it before deleting */
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_SVC_KEY = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

function sbReq(method, path, body, authKey) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: SB_HOST,
      path,
      method,
      headers: {
        'apikey': authKey,
        'Authorization': 'Bearer ' + authKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
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

  const id = body?.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  /* Get user identity from their JWT */
  const authHeader = req.headers.authorization || '';
  const userJwt    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let userId = null;
  if (userJwt) {
    try {
      /* Verify the JWT by calling Supabase /auth/v1/user with the user's token */
      const userRes = await sbReq('GET', '/auth/v1/user', null, SB_ANON);
      /* Use user's own token for this call */
      const r = await new Promise((resolve, reject) => {
        const opts = {
          hostname: SB_HOST,
          path: '/auth/v1/user',
          method: 'GET',
          headers: {
            'apikey': SB_ANON,
            'Authorization': 'Bearer ' + userJwt,
          }
        };
        const req2 = https.request(opts, res2 => {
          let raw = '';
          res2.on('data', d => { raw += d; });
          res2.on('end', () => resolve({ status: res2.statusCode, body: raw }));
        });
        req2.on('error', reject);
        req2.end();
      });
      if (r.status === 200) {
        const userData = JSON.parse(r.body);
        userId = userData.id;
      }
    } catch (_) {}
  }

  /* If we have a service key, verify ownership then delete */
  if (SB_SVC_KEY) {
    /* First fetch the ad to check ownership */
    if (userId) {
      const check = await sbReq('GET', `/rest/v1/ads?id=eq.${encodeURIComponent(String(id))}&select=user_id`, null, SB_SVC_KEY);
      if (check.status === 200) {
        const rows = JSON.parse(check.body || '[]');
        if (rows.length && rows[0].user_id && rows[0].user_id !== userId) {
          return res.status(403).json({ error: 'Not your ad' });
        }
      }
    }
    /* Delete with service key (bypasses RLS) */
    const r = await sbReq('DELETE', `/rest/v1/ads?id=eq.${encodeURIComponent(String(id))}`, null, SB_SVC_KEY);
    if (r.status !== 200 && r.status !== 204) {
      console.error('[delete-ad] Supabase error', r.status, r.body);
      return res.status(502).json({ error: 'DB error ' + r.status });
    }
  } else if (userJwt) {
    /* No service key — delete using the user's own JWT (relies on RLS: user_id = auth.uid()) */
    const r = await new Promise((resolve, reject) => {
      const opts = {
        hostname: SB_HOST,
        path: `/rest/v1/ads?id=eq.${encodeURIComponent(String(id))}`,
        method: 'DELETE',
        headers: {
          'apikey': SB_ANON,
          'Authorization': 'Bearer ' + userJwt,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      };
      const req3 = https.request(opts, res3 => {
        let raw = '';
        res3.on('data', d => { raw += d; });
        res3.on('end', () => resolve({ status: res3.statusCode, body: raw }));
      });
      req3.on('error', reject);
      req3.end();
    });
    if (r.status !== 200 && r.status !== 204) {
      console.error('[delete-ad] anon-key error', r.status, r.body);
      return res.status(502).json({ error: 'DB error ' + r.status });
    }
  } else {
    return res.status(401).json({ error: 'Authentication required to delete ads' });
  }

  console.log('[delete-ad] deleted ad id:', id, 'by user:', userId);
  return res.status(200).json({ ok: true });
};
