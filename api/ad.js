/* Vercel serverless — pre-rendered listing page for SEO
   Route: /ad/:id  →  this handler via vercel.json rewrite
   Returns full HTML with listing content in <head> and <body> so Google
   indexes the actual title, price, location, description — not just JS.
*/
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtPrice(price) {
  if (!price || price === 0) return 'Contact for price';
  return 'R ' + Number(price).toLocaleString('en-ZA');
}

async function fetchAd(id) {
  return new Promise((resolve, reject) => {
    const path = `/rest/v1/ads?id=eq.${encodeURIComponent(id)}&select=*&limit=1`;
    const req = https.request({
      hostname: SB_HOST, path, method: 'GET',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch(e) { resolve([]); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  const url = new URL('https://www.everythingmarket.co.za' + (req.url || ''));
  const pathId = url.pathname.replace(/^\/ad\//, '').replace(/^\/api\/ad\/?/, '');
  const id = String(req.query?.id || url.searchParams.get('id') || pathId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) return res.status(400).send('Missing ad id');

  let ad = null;
  try {
    const rows = await fetchAd(id);
    ad = Array.isArray(rows) ? rows[0] : null;
  } catch(e) {
    ad = null;
  }

  if (!ad) {
    /* Redirect to homepage if ad not found */
    res.setHeader('Location', '/');
    return res.status(302).end();
  }

  const title       = esc(ad.title || 'Listing');
  const price       = esc(fmtPrice(ad.price));
  const location    = esc(ad.loc || ad.location || 'South Africa');
  const seller      = esc(ad.seller || ad.contact_name || '');
  const description = esc((ad.description || ad.desc || '').slice(0, 300));
  const cat         = esc(ad.cat || ad.category || '');
  const photo       = (Array.isArray(ad.photos) && ad.photos[0]) ? ad.photos[0] : 'https://www.everythingmarket.co.za/logo.png';
  const pageUrl     = `https://www.everythingmarket.co.za/ad/${id}`;

  const metaTitle = `${ad.title} — ${fmtPrice(ad.price)} | Everything Market`;
  const metaDesc  = `${ad.title} for sale in ${ad.loc || 'South Africa'}. ${fmtPrice(ad.price)}. ${(ad.description || '').slice(0, 120)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ad.title || 'Everything Market listing',
    description: (ad.description || ad.desc || '').slice(0, 500),
    image: photo,
    url: pageUrl,
    category: ad.cat || ad.category || 'Marketplace listing',
    areaServed: {
      '@type': 'Country',
      name: 'South Africa',
    },
    offers: {
      '@type': 'Offer',
      price: Number(ad.price) || 0,
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
      seller: {
        '@type': 'Person',
        name: ad.seller || ad.contact_name || 'Everything Market seller',
      },
      availableAtOrFrom: {
        '@type': 'Place',
        name: ad.loc || ad.location || 'South Africa',
      },
    },
  };

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(metaTitle)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${pageUrl}">
<link rel="icon" type="image/png" href="/logo.png">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(metaTitle)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${esc(photo)}">
<meta property="og:site_name" content="Everything Market – Marketplace South Africa">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(metaTitle)}">
<meta name="twitter:image" content="${esc(photo)}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f8; color: #111; }
  .bar { background: #0A3D22; padding: 14px 20px; display: flex; align-items: center; gap: 16px; }
  .bar a { color: #fff; text-decoration: none; font-weight: 800; font-size: 17px; }
  .bar a span { color: #E09A12; }
  .bar small { color: rgba(255,255,255,.65); font-size: 12px; margin-left: auto; }
  .card { max-width: 680px; margin: 28px auto; background: #fff; border-radius: 14px; box-shadow: 0 2px 16px rgba(0,0,0,.08); overflow: hidden; }
  .photo { width: 100%; max-height: 380px; object-fit: cover; display: block; background: #eee; }
  .body { padding: 22px 24px; }
  h1 { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 6px; }
  .price { font-size: 26px; font-weight: 900; color: #0A3D22; margin-bottom: 10px; }
  .meta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  .chip { background: #f0f4f1; color: #444; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
  .desc { font-size: 14.5px; line-height: 1.7; color: #333; margin-bottom: 20px; white-space: pre-wrap; }
  .btn { display: block; text-align: center; background: #1A7A42; color: #fff; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 15px; text-decoration: none; }
  .btn:hover { background: #145C35; }
  .back { display: inline-block; margin: 16px 20px 0; color: #1A7A42; font-size: 13px; text-decoration: none; font-weight: 600; }
  .back:hover { text-decoration: underline; }
  @media (max-width: 600px) { .body { padding: 16px; } h1 { font-size: 18px; } .price { font-size: 22px; } }
</style>
</head>
<body>
<div class="bar">
  <a href="/">Everything<span>Market</span></a>
  <small>South Africa's Free Marketplace</small>
</div>
<a class="back" href="/">← Back to all ads</a>
<div class="card">
  ${photo !== 'https://www.everythingmarket.co.za/logo.png' ? `<img class="photo" src="${esc(photo)}" alt="${title}" loading="eager">` : ''}
  <div class="body">
    <h1>${title}</h1>
    <div class="price">${price}</div>
    <div class="meta">
      ${location ? `<span class="chip">📍 ${location}</span>` : ''}
      ${cat ? `<span class="chip">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>` : ''}
      ${seller ? `<span class="chip">👤 ${seller}</span>` : ''}
    </div>
    ${description ? `<div class="desc">${description}</div>` : ''}
    <a class="btn" href="/?ad=${esc(id)}">💬 Chat with Seller on Everything Market</a>
  </div>
</div>
<script>
  /* After the main app loads, open this listing's modal automatically */
  window._autoOpenAdId = ${JSON.stringify(id)};
</script>
</body>
</html>`);
};
