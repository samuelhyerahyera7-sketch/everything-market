/* TEMPORARY — delete test/junk ads by title pattern. Remove after use. */
const https = require('https');
const SB_HOST = 'jucphfbaueowzlbjhxmm.supabase.co';
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY || '';

function sbReq(method, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: SB_HOST, path, method,
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
    }, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => resolve({ status: res.statusCode, body: b })); });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!SB_KEY) return res.status(500).json({ error: 'No service key' });

  /* Fetch all ads */
  const r = await sbReq('GET', '/rest/v1/ads?select=id,title,seller');
  const ads = JSON.parse(r.body);

  /* Delete ones whose title looks like a test */
  const testTitles = ['game test', 'tes mug', 'test mug', '__debug_test__'];
  const toDelete = ads.filter(a =>
    testTitles.some(t => (a.title || '').toLowerCase().includes(t))
  );

  const deleted = [];
  for (const ad of toDelete) {
    await sbReq('DELETE', '/rest/v1/ads?id=eq.' + ad.id);
    deleted.push({ id: ad.id, title: ad.title });
  }

  return res.status(200).json({ deleted, total_ads: ads.length });
};
