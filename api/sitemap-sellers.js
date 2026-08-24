const SITE_URL = 'https://www.everythingmarket.co.za';

const LOCATIONS = [
  'gauteng','western-cape','kwazulu-natal','eastern-cape','limpopo','mpumalanga','north-west','northern-cape','free-state',
  'johannesburg','tshwane','ekurhuleni','cape-town','ethekwini','nelson-mandela-bay','buffalo-city','mangaung','bloemfontein',
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

const SELL_ITEMS = [
  'car','bakkie','motorcycle','trailer','house','property','land','phone','iphone','laptop','tv','playstation','xbox',
  'fridge','washing-machine','couch','bed','furniture','appliance','clothes','sneakers','baby-items','tools','generator',
  'solar','building-materials','bike','gym-equipment','musical-instrument','textbooks','pets','service','business','job',
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
  const sellMyUrls = SELL_ITEMS.map(item =>
    `  <url><loc>${SITE_URL}/sell-my/${esc(item)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.86</priority></url>`
  );
  const sellLocationUrls = [];
  for (const location of LOCATIONS) {
    for (const item of SELL_ITEMS) {
      sellLocationUrls.push(`  <url><loc>${SITE_URL}/sell/${esc(location)}/${esc(item)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sellMyUrls.concat(sellLocationUrls).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  return res.status(200).send(xml);
};
