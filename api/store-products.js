/* /api/store-products — CRUD for store products */
const https = require('https');

const SB_HOST = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co')
  .replace('https://', '').replace(/\/$/, '');
const SVC = process.env.SUPABASE_SERVICE_KEY;
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const KEY = SVC || ANON;

function sb(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST, path, method,
      headers: {
        apikey: key || KEY,
        Authorization: 'Bearer ' + (key || KEY),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ── GET: public product list for a store ── */
  if (req.method === 'GET') {
    const storeId = req.query?.store_id || new URL('https://x.com' + (req.url || '')).searchParams.get('store_id');
    if (!storeId) return res.status(400).json({ error: 'Missing store_id' });
    const r = await sb('GET',
      `/rest/v1/store_products?store_id=eq.${storeId}&available=eq.true&order=created_at.desc&select=*`,
      null, KEY);
    res.setHeader('Cache-Control', 'public, s-maxage=30');
    return res.status(200).json(JSON.parse(r.b || '[]'));
  }

  /* Auth required for write operations */
  const jwt = (req.headers.authorization || '').replace('Bearer ', '');
  if (!jwt) return res.status(401).json({ error: 'Not authenticated' });
  const user = await getUser(jwt);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  /* Verify caller owns an approved store */
  const storeCheck = await sb('GET',
    `/rest/v1/store_applications?user_id=eq.${user.id}&status=eq.approved&select=id,store_name`,
    null, KEY);
  const stores = JSON.parse(storeCheck.b || '[]');
  if (!stores.length) return res.status(403).json({ error: 'No approved store' });
  const storeId = stores[0].id;

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  /* ── POST: add product ── */
  if (req.method === 'POST') {
    const { title, description, price, neg, category_id, category_name, condition, photos, stock_qty, loc } = body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
    const r = await sb('POST', '/rest/v1/store_products', {
      store_id: storeId, user_id: user.id,
      title: title.trim(), description: description || '',
      price: price || null, neg: !!neg,
      category_id: category_id || null, category_name: category_name || null,
      condition: condition || 'New',
      photos: Array.isArray(photos) ? photos : [],
      stock_qty: stock_qty || null, loc: loc || '',
      available: true
    }, KEY);
    if (r.s !== 201 && r.s !== 200) return res.status(502).json({ error: 'DB error', detail: r.b });
    const rows = JSON.parse(r.b || '[]');
    return res.status(201).json(Array.isArray(rows) ? rows[0] : rows);
  }

  /* ── PATCH: update product ── */
  if (req.method === 'PATCH') {
    const { id, ...fields } = body;
    if (!id) return res.status(400).json({ error: 'Missing product id' });
    /* Verify ownership */
    const own = await sb('GET', `/rest/v1/store_products?id=eq.${id}&select=store_id`, null, KEY);
    const rows = JSON.parse(own.b || '[]');
    if (!rows.length || rows[0].store_id !== storeId) return res.status(403).json({ error: 'Not your product' });
    const allowed = ['title','description','price','neg','category_id','category_name','condition','photos','stock_qty','loc','available'];
    const patch = {};
    allowed.forEach(k => { if (k in fields) patch[k] = fields[k]; });
    const r = await sb('PATCH', `/rest/v1/store_products?id=eq.${id}`, patch, KEY);
    if (r.s !== 200 && r.s !== 204) return res.status(502).json({ error: 'DB error' });
    return res.status(200).json({ ok: true });
  }

  /* ── DELETE: remove product ── */
  if (req.method === 'DELETE') {
    const id = body.id || new URL('https://x.com' + (req.url || '')).searchParams.get('id');
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const own = await sb('GET', `/rest/v1/store_products?id=eq.${id}&select=store_id`, null, KEY);
    const rows = JSON.parse(own.b || '[]');
    if (!rows.length || rows[0].store_id !== storeId) return res.status(403).json({ error: 'Not your product' });
    await sb('DELETE', `/rest/v1/store_products?id=eq.${id}`, null, KEY);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
};
