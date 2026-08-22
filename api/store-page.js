const https = require('https');

const SITE_URL = 'https://www.everythingmarket.co.za';
const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL_RAW.replace('https://', '');
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function sbGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST,
      path,
      method: 'GET',
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        Accept: 'application/json',
      },
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function fmtPrice(price) {
  if (!price || Number(price) === 0) return 'Contact for price';
  return 'R ' + Number(price).toLocaleString('en-ZA');
}

module.exports = async function handler(req, res) {
  const url = new URL('https://www.everythingmarket.co.za' + (req.url || ''));
  const pathId = url.pathname.replace(/^\/store\//, '').replace(/^\/api\/store-page\/?/, '');
  const storeId = String(req.query?.id || url.searchParams.get('id') || pathId || '').replace(/[^a-zA-Z0-9_-]/g, '');

  if (!storeId) return res.status(400).send('Missing store id');

  try {
    const storeResp = await sbGet(`/rest/v1/store_applications?id=eq.${encodeURIComponent(storeId)}&status=eq.approved&select=*&limit=1`);
    const stores = storeResp.status === 200 ? JSON.parse(storeResp.body || '[]') : [];
    const store = Array.isArray(stores) ? stores[0] : null;
    if (!store) {
      res.setHeader('Location', '/');
      return res.status(302).end();
    }

    const productsResp = await sbGet(`/rest/v1/store_products?store_id=eq.${encodeURIComponent(storeId)}&available=eq.true&order=created_at.desc&select=*&limit=12`);
    const products = productsResp.status === 200 ? JSON.parse(productsResp.body || '[]') : [];
    const safeProducts = Array.isArray(products) ? products : [];

    const storeName = store.store_name || 'Everything Market Store';
    const description = store.store_description || `Browse active listings from ${storeName} on Everything Market.`;
    const pageUrl = `${SITE_URL}/store/${storeId}`;
    const logo = store.logo_url || `${SITE_URL}/logo.png`;
    const loc = safeProducts.find(p => p.loc)?.loc || 'South Africa';
    const productCards = safeProducts.map(product => {
      const photo = Array.isArray(product.photos) && product.photos[0] ? product.photos[0] : '';
      return `<a class="product" href="/?store=${esc(storeId)}">
        ${photo ? `<img src="${esc(photo)}" alt="${esc(product.title)}" loading="lazy">` : '<div class="placeholder">EM</div>'}
        <strong>${esc(product.title)}</strong>
        <span>${esc(fmtPrice(product.price))}</span>
      </a>`;
    }).join('');

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: storeName,
      description,
      url: pageUrl,
      image: logo,
      areaServed: { '@type': 'Country', name: 'South Africa' },
    };

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(storeName)} | Everything Market Store</title>
  <meta name="description" content="${esc(description.slice(0, 155))}">
  <link rel="canonical" href="${esc(pageUrl)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(storeName)} | Everything Market">
  <meta property="og:description" content="${esc(description.slice(0, 155))}">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:image" content="${esc(logo)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f8;color:#111}
    .bar{background:#0A3D22;padding:14px 20px}.bar a{color:#fff;text-decoration:none;font-weight:900}.bar span{color:#E09A12}
    .wrap{max-width:920px;margin:0 auto;padding:22px 16px}
    .store{background:#fff;border-radius:14px;box-shadow:0 2px 16px rgba(0,0,0,.08);padding:24px}
    .head{display:flex;gap:16px;align-items:center;margin-bottom:18px}.logo{width:76px;height:76px;border-radius:14px;object-fit:contain;background:#eef4ef}
    h1{font-size:28px;color:#0A3D22;margin:0 0 6px}.meta{font-size:13px;color:#66756d;font-weight:700}.desc{font-size:15px;line-height:1.7;color:#3d4b44;margin:18px 0}
    .cta{display:inline-block;background:#1A7A42;color:#fff;text-decoration:none;font-weight:800;border-radius:10px;padding:13px 18px;margin-bottom:22px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.product{border:1px solid #e4eae5;border-radius:10px;text-decoration:none;color:#111;background:#fbfcfa;overflow:hidden}
    .product img,.placeholder{width:100%;height:130px;object-fit:cover;background:#e9f0ea;display:flex;align-items:center;justify-content:center;color:#0A3D22;font-weight:900}
    .product strong{display:block;padding:10px 10px 3px;font-size:13px}.product span{display:block;padding:0 10px 12px;color:#0A3D22;font-weight:900}
    @media(max-width:680px){.head{align-items:flex-start}.grid{grid-template-columns:1fr 1fr}h1{font-size:23px}}
  </style>
</head>
<body>
  <div class="bar"><a href="/">Everything<span>Market</span></a></div>
  <div class="wrap">
    <div class="store">
      <div class="head">
        <img class="logo" src="${esc(logo)}" alt="${esc(storeName)} logo" onerror="this.src='/logo.png'">
        <div>
          <h1>${esc(storeName)}</h1>
          <div class="meta">Verified ${esc(store.store_type || 'store')} · ${esc(loc)}</div>
        </div>
      </div>
      <div class="desc">${esc(description)}</div>
      <a class="cta" href="/?store=${esc(storeId)}">View active listings</a>
      ${safeProducts.length ? `<div class="grid">${productCards}</div>` : '<p class="desc">This store is approved and will be adding products soon.</p>'}
    </div>
  </div>
</body>
</html>`);
  } catch (error) {
    console.error('[store-page]', error);
    return res.status(500).send('Store page unavailable');
  }
};
