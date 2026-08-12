/* Diagnostic endpoint — visit /api/debug to see DB connection status.
   Remove or protect this endpoint before going to production. */
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();
const ANON_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const ACTIVE_KEY  = SERVICE_KEY || ANON_KEY;

function jwtRole(jwt) {
  try { return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString()).role; }
  catch (_) { return 'unknown'; }
}

function sbReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: SB_HOST,
      path,
      method,
      headers: {
        'apikey': ACTIVE_KEY,
        'Authorization': 'Bearer ' + ACTIVE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const keyRole    = jwtRole(ACTIVE_KEY);
  const usingService = !!SERVICE_KEY;

  /* Test 1: SELECT */
  let selectOk = false, selectCount = 0, selectErr = '';
  try {
    const r = await sbReq('GET', '/rest/v1/ads?select=id&limit=5');
    if (r.status === 200) {
      selectOk = true;
      try { selectCount = JSON.parse(r.body).length; } catch(_) {}
    } else {
      selectErr = r.status + ' ' + r.body.slice(0, 200);
    }
  } catch(e) { selectErr = String(e); }

  /* Test 2: INSERT (uses a clearly-test title, deleted right after) */
  let insertOk = false, insertErr = '', insertedId = null;
  const testPayload = {
    id: Date.now(),
    title: '__debug_test__', cat: 'other', price: 0,
    loc: 'test', seller: 'test', seller_type: 'private',
    description: 'debug test', cond: 'N/A', neg: false,
    photos: [], phone: '', contact_email: '', verified: false,
  };
  try {
    const ri = await sbReq('POST', '/rest/v1/ads', testPayload);
    if (ri.status === 201 || ri.status === 204) {
      insertOk = true;
    } else {
      insertErr = ri.status + ' ' + ri.body.slice(0, 400);
    }
  } catch(e) { insertErr = String(e); }

  /* Test 3: DELETE the test row */
  if (insertOk) {
    try {
      await sbReq('DELETE', '/rest/v1/ads?title=eq.__debug_test__');
    } catch(_) {}
  }

  const result = {
    key_type:       usingService ? 'SERVICE_ROLE (correct)' : 'ANON (wrong — set SUPABASE_SERVICE_KEY in Vercel)',
    jwt_role:       keyRole,
    key_ok:         usingService && keyRole === 'service_role',
    select_ok:      selectOk,
    select_count:   selectCount,
    select_error:   selectErr || null,
    insert_ok:      insertOk,
    insert_error:   insertErr || null,
    verdict: (usingService && keyRole === 'service_role' && insertOk)
      ? '✅ All good — service key is working and inserts succeed'
      : (!usingService || keyRole !== 'service_role')
        ? '❌ Wrong key — SUPABASE_SERVICE_KEY is not set or is the anon key, not the service_role key'
        : '❌ Insert blocked — service key is set but Supabase still rejected the insert. Run supabase-fix.sql.',
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(result);
};
