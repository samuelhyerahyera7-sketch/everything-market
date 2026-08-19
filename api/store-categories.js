/* /api/store-categories — manage store categories */
const https = require('https');

const SB_HOST = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co')
  .replace('https://', '').replace(/\/$/, '');
const SVC  = process.env.SUPABASE_SERVICE_KEY;
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const KEY  = SVC || ANON;

function sb(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST, path, method,
      headers: {
        apikey: key || KEY, Authorization: 'Bearer ' + (key || KEY),
        'Content-Type': 'application/json', Prefer: 'return=representation',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ s: res.statusCode, b: d })); });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getUser(jwt) {
  const r = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST, path: '/auth/v1/user', method: 'GET',
      headers: { apikey: ANON, Authorization: 'Bearer ' + jwt }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ s: res.statusCode, b: d })); });
    req.on('error', reject);
    req.end();
  });
  if (r.s !== 200) return null;
  try { return JSON.parse(r.b); } catch { return null; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* GET: public */
  if (req.method === 'GET') {
    const storeId = new URL('https://x.com' + (req.url || '')).searchParams.get('store_id');
    if (!storeId) return res.status(400).json({ error: 'Missing store_id' });
    const r = await sb('GET', `/rest/v1/store_categories?store_id=eq.${storeId}&order=sort_order.asc,name.asc&select=*`, null, KEY);
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).json(JSON.parse(r.b || '[]'));
  }

  /* Auth for writes */
  const jwt = (req.headers.authorization || '').replace('Bearer ', '');
  if (!jwt) return res.status(401).json({ error: 'Not authenticated' });
  const user = await getUser(jwt);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  const storeCheck = await sb('GET',
    `/rest/v1/store_applications?user_id=eq.${user.id}&status=eq.approved&select=id`, null, KEY);
  const stores = JSON.parse(storeCheck.b || '[]');
  if (!stores.length) return res.status(403).json({ error: 'No approved store' });
  const storeId = stores[0].id;

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  /* POST: add category */
  if (req.method === 'POST') {
    const { name, sort_order } = body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const r = await sb('POST', '/rest/v1/store_categories',
      { store_id: storeId, name: name.trim(), sort_order: sort_order || 0 }, KEY);
    if (r.s !== 201 && r.s !== 200) return res.status(502).json({ error: 'DB error' });
    const rows = JSON.parse(r.b || '[]');
    return res.status(201).json(Array.isArray(rows) ? rows[0] : rows);
  }

  /* DELETE: remove category */
  if (req.method === 'DELETE') {
    const id = body.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const own = await sb('GET', `/rest/v1/store_categories?id=eq.${id}&select=store_id`, null, KEY);
    const rows = JSON.parse(own.b || '[]');
    if (!rows.length || rows[0].store_id !== storeId) return res.status(403).json({ error: 'Not your category' });
    await sb('DELETE', `/rest/v1/store_categories?id=eq.${id}`, null, KEY);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
};
