/* GET /api/load-stores — returns approved stores with product counts */
const https = require('https');

const SB_HOST = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co')
  .replace('https://', '').replace(/\/$/, '');
const SVC  = process.env.SUPABASE_SERVICE_KEY;
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const KEY  = SVC || ANON;

function sb(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST, path, method: 'GET',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  /* Approved stores */
  const storesRaw = await sb('/rest/v1/store_applications?status=eq.approved&order=approved_at.desc&select=id,user_id,store_name,store_description,store_type,approved_at').catch(() => '[]');
  const stores = JSON.parse(storesRaw || '[]');
  if (!stores.length) return res.json([]);

  const storeIds = stores.map(s => 'store_id=eq.' + s.id).join(',');

  /* Product counts from store_products (not ads) */
  const prodsRaw = await sb(`/rest/v1/store_products?available=eq.true&or=(${storeIds})&select=store_id,loc`).catch(() => '[]');
  const prods = JSON.parse(prodsRaw || '[]');

  const countMap = {};
  const locMap   = {};
  prods.forEach(p => {
    countMap[p.store_id] = (countMap[p.store_id] || 0) + 1;
    if (p.loc && !locMap[p.store_id]) locMap[p.store_id] = p.loc;
  });

  return res.json(stores.map(s => ({
    storeId:     s.id,
    userId:      s.user_id,
    storeName:   s.store_name,
    description: s.store_description || '',
    storeType:   s.store_type || 'retail',
    count:       countMap[s.id] || 0,
    loc:         locMap[s.id]   || '',
    approvedAt:  s.approved_at
  })));
};
