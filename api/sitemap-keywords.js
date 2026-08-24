const SITE_URL = 'https://www.everythingmarket.co.za';

const LOCATIONS = [
  'gauteng','western-cape','kwazulu-natal','eastern-cape','limpopo','mpumalanga','north-west','northern-cape','free-state',
  'johannesburg','tshwane','ekurhuleni','cape-town','ethekwini','nelson-mandela-bay','buffalo-city','mangaung',
  'bloemfontein',
  'soweto','sandton','midrand','centurion','boksburg','benoni','germiston','krugersdorp','vereeniging','vanderbijlpark',
  'stellenbosch','paarl','george','mossel-bay','worcester','knysna',
  'pietermaritzburg','richards-bay','newcastle','ladysmith','margate','ballito',
  'east-london','mthatha','komani','makhanda','kariega',
  'tzaneen','thohoyandou','polokwane','mokopane','bela-bela','lephalale','phalaborwa',
  'mbombela','emalahleni','middelburg','secunda','ermelo','white-river','hazyview',
  'klerksdorp','rustenburg','potchefstroom','mahikeng','brits','hartbeespoort',
  'upington','kimberley','kuruman','springbok','kathu',
  'welkom','bethlehem','sasolburg','kroonstad','parys',
];

const ITEMS = [
  'cars-for-sale','bakkies-for-sale','toyota-for-sale','vw-polo-for-sale','ford-ranger-for-sale','motorcycles-for-sale','trailers-for-sale',
  'property-for-sale','houses-to-rent','flats-to-rent','rooms-to-rent','land-for-sale',
  'iphones-for-sale','samsung-phones-for-sale','phones-for-sale','laptops-for-sale','tvs-for-sale','gaming-consoles-for-sale',
  'fridges-for-sale','washing-machines-for-sale','couches-for-sale','beds-for-sale','furniture-for-sale','appliances-for-sale',
  'jobs-near-me','driver-jobs','domestic-worker-jobs',
  'cleaning-services','plumbers-near-me','electricians-near-me','mechanics-near-me','builders-near-me','garden-services',
  'solar-panels-for-sale','generators-for-sale','tools-for-sale','building-materials',
  'clothes-for-sale','sneakers-for-sale','baby-items-for-sale','pets-for-sale','puppies-for-sale',
  'bicycles-for-sale','gym-equipment-for-sale','musical-instruments-for-sale','textbooks-for-sale',
];

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

module.exports = async function handler(req, res) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method not allowed');
  }

  const now = new Date().toISOString();
  const nearMeUrls = ITEMS.map(item =>
    `  <url><loc>${SITE_URL}/near-me/${esc(item)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.84</priority></url>`
  );
  const locationItemUrls = [];
  for (const location of LOCATIONS) {
    for (const item of ITEMS) {
      locationItemUrls.push(`  <url><loc>${SITE_URL}/marketplace-${esc(location)}/${esc(item)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.78</priority></url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nearMeUrls.concat(locationItemUrls).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  return res.status(200).send(xml);
};
