const SITE_URL = 'https://www.everythingmarket.co.za';

const CATEGORIES = {
  'cars-bakkies': {
    title: 'Cars & Bakkies for Sale in South Africa',
    h1: 'Cars & Bakkies for Sale in South Africa',
    description: 'Buy and sell second-hand cars, bakkies, motorcycles, spares and transport deals across South Africa on Everything Market.',
    keywords: ['used cars for sale South Africa', 'second hand bakkies', 'Toyota for sale', 'VW Polo for sale', 'Ford Ranger for sale'],
    cat: 'cars',
  },
  property: {
    title: 'Property for Sale & Rent in South Africa',
    h1: 'Property for Sale & Rent in South Africa',
    description: 'Find houses, flats, rooms, land and commercial property for sale or rent across South Africa.',
    keywords: ['property for sale South Africa', 'house to rent', 'flat to rent Johannesburg', 'rooms to rent', 'land for sale'],
    cat: 'prop',
  },
  electronics: {
    title: 'Second-Hand Electronics & Phones in South Africa',
    h1: 'Second-Hand Electronics & Phones in South Africa',
    description: 'Shop used phones, laptops, TVs, gaming consoles and electronics from local South African sellers.',
    keywords: ['iPhone for sale South Africa', 'Samsung phones second hand', 'laptops for sale', 'PS5 for sale', 'TVs for sale'],
    cat: 'elec',
  },
  furniture: {
    title: 'Used Furniture & Home Goods in South Africa',
    h1: 'Used Furniture & Home Goods in South Africa',
    description: 'Buy and sell couches, beds, fridges, tables, decor and household goods near you.',
    keywords: ['second hand furniture', 'couch for sale', 'double bed for sale', 'fridge for sale', 'home decor'],
    cat: 'furn',
  },
  jobs: {
    title: 'Jobs & Employment Listings in South Africa',
    h1: 'Jobs & Employment Listings in South Africa',
    description: 'Browse local job listings and advertise vacancies for drivers, retail, admin, domestic work, construction and more.',
    keywords: ['jobs South Africa', 'driver jobs', 'domestic worker jobs', 'admin jobs', 'retail jobs'],
    cat: 'jobs',
  },
  services: {
    title: 'Local Services in South Africa',
    h1: 'Local Services in South Africa',
    description: 'Find local plumbers, electricians, cleaners, designers, mechanics, tutors and small-business services.',
    keywords: ['services South Africa', 'plumber near me', 'electrician', 'cleaning services', 'mechanic'],
    cat: 'serv',
  },
  fashion: {
    title: 'Second-Hand Fashion & Clothing in South Africa',
    h1: 'Second-Hand Fashion & Clothing in South Africa',
    description: 'Buy and sell clothing, sneakers, accessories, watches and fashion deals across South Africa.',
    keywords: ['second hand clothing', 'sneakers for sale', 'fashion South Africa', 'used clothes', 'watches for sale'],
    cat: 'fash',
  },
};

const PROVINCES = {
  gauteng: 'Gauteng',
  'western-cape': 'Western Cape',
  'kwazulu-natal': 'KwaZulu-Natal',
  'eastern-cape': 'Eastern Cape',
  limpopo: 'Limpopo',
  mpumalanga: 'Mpumalanga',
  'north-west': 'North West',
  'northern-cape': 'Northern Cape',
  'free-state': 'Free State',
};

const CITIES = {
  johannesburg: { name: 'Johannesburg', province: 'Gauteng', areas: 'Sandton, Soweto, Randburg, Roodepoort and Midrand' },
  pretoria: { name: 'Pretoria', province: 'Gauteng', areas: 'Centurion, Mamelodi, Hatfield, Montana and Soshanguve' },
  'cape-town': { name: 'Cape Town', province: 'Western Cape', areas: 'Bellville, Mitchells Plain, Khayelitsha, Durbanville and Somerset West' },
  durban: { name: 'Durban', province: 'KwaZulu-Natal', areas: 'Umhlanga, Pinetown, Chatsworth, Umlazi and Ballito' },
  gqeberha: { name: 'Gqeberha', province: 'Eastern Cape', areas: 'Port Elizabeth, Uitenhage, Walmer, Summerstrand and nearby areas' },
  bloemfontein: { name: 'Bloemfontein', province: 'Free State', areas: 'Mangaung, Botshabelo, Universitas, Bayswater and nearby areas' },
  polokwane: { name: 'Polokwane', province: 'Limpopo', areas: 'Bendor, Seshego, Flora Park, Ladanna and nearby areas' },
  mbombela: { name: 'Mbombela', province: 'Mpumalanga', areas: 'Nelspruit, White River, Hazyview, Barberton and nearby areas' },
  rustenburg: { name: 'Rustenburg', province: 'North West', areas: 'Boitekong, Tlhabane, Phokeng, Waterfall East and nearby areas' },
  kimberley: { name: 'Kimberley', province: 'Northern Cape', areas: 'Galeshewe, Belgravia, Roodepan, Hadison Park and nearby areas' },
};

const POPULAR_SEARCHES = {
  'iphone-for-sale-south-africa': {
    title: 'iPhone for Sale in South Africa',
    query: 'iphone',
    description: 'Find second-hand iPhones and Apple accessories from local sellers across South Africa.',
  },
  'samsung-phones-second-hand': {
    title: 'Samsung Phones Second Hand in South Africa',
    query: 'samsung',
    description: 'Browse used Samsung phones and Android deals from South African sellers.',
  },
  'laptops-for-sale-south-africa': {
    title: 'Laptops for Sale in South Africa',
    query: 'laptop',
    description: 'Shop new and second-hand laptops for work, school, gaming and business across South Africa.',
  },
  'toyota-for-sale-south-africa': {
    title: 'Toyota for Sale in South Africa',
    query: 'toyota',
    description: 'Find used Toyota cars, bakkies and SUVs from private sellers and businesses in South Africa.',
  },
  'vw-polo-for-sale-south-africa': {
    title: 'VW Polo for Sale in South Africa',
    query: 'vw polo',
    description: 'Browse VW Polo and Volkswagen listings from local sellers across South Africa.',
  },
  'ford-ranger-for-sale-south-africa': {
    title: 'Ford Ranger for Sale in South Africa',
    query: 'ford ranger',
    description: 'Find Ford Ranger bakkies and related vehicle listings from South African sellers.',
  },
  'second-hand-couch-for-sale': {
    title: 'Second-Hand Couches for Sale in South Africa',
    query: 'couch',
    description: 'Buy and sell used couches, lounge suites and living-room furniture near you.',
  },
  'double-bed-for-sale-south-africa': {
    title: 'Double Beds for Sale in South Africa',
    query: 'bed',
    description: 'Find double beds, mattresses, bedroom furniture and household deals from South African sellers.',
  },
  'fridge-for-sale-south-africa': {
    title: 'Fridges for Sale in South Africa',
    query: 'fridge',
    description: 'Find new and second-hand fridges, freezers and kitchen appliances from local sellers.',
  },
  'house-to-rent-south-africa': {
    title: 'Houses to Rent in South Africa',
    query: 'house to rent',
    description: 'Browse houses, rooms, flats and rental property listings across South Africa.',
  },
  'flat-to-rent-johannesburg': {
    title: 'Flats to Rent in Johannesburg',
    query: 'flat johannesburg',
    description: 'Find flats, rooms and rental property in Johannesburg and nearby Gauteng areas.',
  },
  'ps5-for-sale-south-africa': {
    title: 'PS4 and PS5 for Sale in South Africa',
    query: 'playstation',
    description: 'Browse PlayStation consoles, PS5 games, PS4 games and gaming accessories for sale in South Africa.',
  },
  'xbox-for-sale-south-africa': {
    title: 'Xbox for Sale in South Africa',
    query: 'xbox',
    description: 'Find Xbox consoles, games, controllers and gaming accessories from local South African sellers.',
  },
  'puppies-for-sale-south-africa': {
    title: 'Puppies for Sale in South Africa',
    query: 'puppy',
    description: 'Browse pet listings and puppy ads from local South African sellers. Always meet safely and check seller details.',
  },
  'second-hand-bicycle-for-sale': {
    title: 'Second-Hand Bicycles for Sale in South Africa',
    query: 'bicycle',
    description: 'Find used bicycles, mountain bikes, road bikes and cycling gear for sale across South Africa.',
  },
  'domestic-worker-jobs': {
    title: 'Domestic Worker Jobs in South Africa',
    query: 'domestic worker',
    description: 'Find domestic work, cleaning jobs and household employment opportunities in South Africa.',
  },
  'driver-jobs-south-africa': {
    title: 'Driver Jobs in South Africa',
    query: 'driver',
    description: 'Browse driver jobs, delivery work and transport employment listings across South Africa.',
  },
  'generator-for-sale-south-africa': {
    title: 'Generators for Sale in South Africa',
    query: 'generator',
    description: 'Find generators, inverters and backup power equipment for sale in South Africa.',
  },
  'solar-panels-for-sale-south-africa': {
    title: 'Solar Panels for Sale in South Africa',
    query: 'solar',
    description: 'Browse solar panels, inverters, batteries and backup energy listings from local sellers.',
  },
  'gym-equipment-for-sale': {
    title: 'Gym Equipment for Sale in South Africa',
    query: 'gym',
    description: 'Buy and sell weights, treadmills, benches and home gym equipment across South Africa.',
  },
};

const STATIC_PAGES = {
  'sell-online-south-africa': {
    title: 'Sell Online in South Africa for Free',
    h1: 'Sell Online in South Africa for Free',
    description: 'Post a free ad on Everything Market and reach South African buyers looking for cars, property, phones, furniture, jobs, services and more.',
    intro: 'Everything Market helps private sellers, small businesses and local stores get discovered online. Post a free listing, share it on WhatsApp or Facebook, and reach buyers across South Africa without listing fees.',
    ctaHref: '/?post=ad',
  },
  'post-free-ad-south-africa': {
    title: 'Post a Free Ad in South Africa',
    h1: 'Post a Free Ad in South Africa',
    description: 'Post a free classified ad on Everything Market and reach buyers across South Africa for cars, phones, property, furniture, jobs, services and more.',
    intro: 'Post your ad for free and get a public listing link you can share on WhatsApp, Facebook and local groups. Everything Market helps South African sellers reach more buyers without listing fees.',
    ctaHref: '/?post=ad',
  },
  'seller-growth-kit': {
    title: 'Seller Growth Kit',
    h1: 'Seller Growth Kit for South African Sellers',
    description: 'A practical seller kit for posting better ads, sharing listings and getting more buyer messages on Everything Market.',
    intro: 'Use Everything Market as your free online selling page. Add clear photos, write honest details, share your listing link, and bring buyers from WhatsApp, Facebook and Google back to your ad.',
    ctaHref: '/?post=ad',
  },
  safety: {
    title: 'Marketplace Safety Tips for South Africa',
    h1: 'Marketplace Safety Tips for South Africa',
    description: 'Safety tips for buying and selling on Everything Market, including public meetups, payment caution, seller verification and scam reporting.',
    intro: 'Trade with confidence by meeting in public places, inspecting items before payment, keeping chats on-platform where possible, and reporting suspicious listings quickly.',
    ctaHref: '/',
  },
  'verified-sellers': {
    title: 'Verified Sellers on Everything Market',
    h1: 'Verified Sellers on Everything Market',
    description: 'Learn how verified sellers help buyers trust listings and help good South African sellers stand out.',
    intro: 'Verified seller badges help trustworthy sellers stand out and help buyers make better decisions. Everything Market is building safer local trade through identity, phone and business verification options.',
    ctaHref: '/',
  },
  'marketplace-south-africa': {
    title: 'Marketplace South Africa',
    h1: 'Marketplace South Africa',
    description: 'Everything Market is a free South African marketplace for buying and selling anything locally across all nine provinces.',
    intro: 'Looking for a marketplace in South Africa? Everything Market connects buyers and sellers across Gauteng, Western Cape, KwaZulu-Natal, Eastern Cape, Limpopo, Mpumalanga, North West, Free State and Northern Cape.',
    ctaHref: '/',
  },
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function pageShell({ title, description, canonical, h1, intro, links, ctaHref }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Everything Market',
      url: SITE_URL + '/',
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | Everything Market</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${SITE_URL}/logo.png">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body{margin:0;font-family:Inter,Arial,sans-serif;color:#102018;background:#f6f8f5}
    .wrap{max-width:980px;margin:0 auto;padding:28px 18px}
    header{background:#071A0F;color:#fff}
    .brand{font-weight:900;font-size:22px;color:#fff;text-decoration:none}.brand span{color:#D99518}
    main{background:#fff;border:1px solid #e5eadf;border-radius:10px;margin-top:22px;padding:30px}
    h1{font-size:34px;line-height:1.12;margin:0 0 14px;color:#0A3D22}
    p{font-size:16px;line-height:1.7;color:#41534a}
    .cta{display:inline-block;background:#1A7A42;color:#fff;text-decoration:none;font-weight:800;border-radius:8px;padding:13px 20px;margin:12px 0 24px}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:20px}
    .card{border:1px solid #e5eadf;border-radius:8px;padding:16px;text-decoration:none;color:#102018;background:#fbfcfa}
    .card strong{display:block;color:#0A3D22;margin-bottom:6px}.card span{font-size:13px;color:#607066}
    footer{font-size:13px;color:#607066;margin:22px 0}
    @media(max-width:640px){main{padding:22px}.grid{grid-template-columns:1fr}h1{font-size:28px}}
  </style>
</head>
<body>
  <header><div class="wrap"><a class="brand" href="/">Everything<span>Market</span></a></div></header>
  <div class="wrap">
    <main>
      <h1>${esc(h1)}</h1>
      <p>${esc(intro)}</p>
      <a class="cta" href="${esc(ctaHref)}">Browse live listings</a>
      <div class="grid">${links.map(link => `<a class="card" href="${esc(link.href)}"><strong>${esc(link.title)}</strong><span>${esc(link.text)}</span></a>`).join('')}</div>
    </main>
    <footer>Everything Market is South Africa's free online marketplace for local buyers and sellers.</footer>
  </div>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  const type = req.query.type || '';
  const slug = String(req.query.slug || '').toLowerCase();

  let page;
  if (type === 'category' && CATEGORIES[slug]) {
    const category = CATEGORIES[slug];
    page = {
      title: category.title,
      description: category.description,
      canonical: `${SITE_URL}/buy-sell/${slug}`,
      h1: category.h1,
      intro: `${category.description} Post a free ad or browse trusted local listings from sellers in every province.`,
      ctaHref: `/?cat=${encodeURIComponent(category.cat)}`,
      links: [
        ...category.keywords.map(term => ({
          href: `/?q=${encodeURIComponent(term)}`,
          title: term,
          text: 'View matching ads and related marketplace listings.',
        })),
        { href: '/province/gauteng', title: 'Browse Gauteng', text: 'Find local sellers in Johannesburg, Pretoria, Soweto and nearby areas.' },
        { href: '/province/western-cape', title: 'Browse Western Cape', text: 'Find local sellers in Cape Town, Stellenbosch, Paarl and nearby areas.' },
      ],
    };
  } else if (type === 'province-category') {
    const provinceSlug = String(req.query.province || '').toLowerCase();
    const categorySlug = String(req.query.category || '').toLowerCase();
    const province = PROVINCES[provinceSlug];
    const category = CATEGORIES[categorySlug];
    if (province && category) {
      page = {
        title: `${category.h1} in ${province}`,
        description: `${category.description.replace(/\.$/, '')} in ${province}. Browse local ads or post a free listing on Everything Market.`,
        canonical: `${SITE_URL}/province/${provinceSlug}/${categorySlug}`,
        h1: `${category.h1} in ${province}`,
        intro: `Browse ${category.h1.toLowerCase()} in ${province}. Everything Market connects local buyers and sellers with free listings, verified seller options and simple messaging.`,
        ctaHref: `/?cat=${encodeURIComponent(category.cat)}&province=${encodeURIComponent(province)}`,
        links: [
          { href: `/province/${provinceSlug}`, title: `All ads in ${province}`, text: `Browse every category available in ${province}.` },
          { href: `/buy-sell/${categorySlug}`, title: category.h1, text: 'View this category across all South African provinces.' },
          ...Object.entries(CATEGORIES).filter(([key]) => key !== categorySlug).slice(0, 5).map(([catSlug, related]) => ({
            href: `/province/${provinceSlug}/${catSlug}`,
            title: `${related.h1} in ${province}`,
            text: `Find more local ${province} listings on Everything Market.`,
          })),
        ],
      };
    }
  } else if (type === 'popular' && POPULAR_SEARCHES[slug]) {
    const item = POPULAR_SEARCHES[slug];
    page = {
      title: item.title,
      description: item.description,
      canonical: `${SITE_URL}/searches/${slug}`,
      h1: item.title,
      intro: `${item.description} Browse live listings, compare local deals, or post your own free ad on Everything Market.`,
      ctaHref: `/?q=${encodeURIComponent(item.query)}`,
      links: [
        { href: '/buy-sell/electronics', title: 'Electronics', text: 'Phones, laptops, TVs, gaming and more.' },
        { href: '/buy-sell/cars-bakkies', title: 'Cars & Bakkies', text: 'Used cars, bakkies, motorcycles and spares.' },
        { href: '/buy-sell/furniture', title: 'Furniture', text: 'Couches, beds, fridges and household goods.' },
        { href: '/province/gauteng', title: 'Browse Gauteng', text: 'Find local deals in Johannesburg, Pretoria and nearby areas.' },
      ],
    };
  } else if (type === 'city-category') {
    const citySlug = String(req.query.city || '').toLowerCase();
    const categorySlug = String(req.query.category || '').toLowerCase();
    const city = CITIES[citySlug];
    const category = CATEGORIES[categorySlug];
    if (city && category) {
      page = {
        title: `${category.h1} in ${city.name}`,
        description: `${category.description.replace(/\.$/, '')} in ${city.name}, ${city.province}. Browse local ads or post a free listing on Everything Market.`,
        canonical: `${SITE_URL}/city/${citySlug}/${categorySlug}`,
        h1: `${category.h1} in ${city.name}`,
        intro: `Browse ${category.h1.toLowerCase()} in ${city.name} and nearby areas like ${city.areas}. Everything Market helps local buyers and sellers trade without listing fees.`,
        ctaHref: `/?cat=${encodeURIComponent(category.cat)}&province=${encodeURIComponent(city.province)}`,
        links: [
          { href: `/city/${citySlug}`, title: `All ads in ${city.name}`, text: `Browse every marketplace category in ${city.name}.` },
          { href: `/buy-sell/${categorySlug}`, title: category.h1, text: 'View this category across South Africa.' },
          ...Object.entries(CATEGORIES).filter(([key]) => key !== categorySlug).slice(0, 5).map(([catSlug, related]) => ({
            href: `/city/${citySlug}/${catSlug}`,
            title: `${related.h1} in ${city.name}`,
            text: `Find more local listings in ${city.name}.`,
          })),
        ],
      };
    }
  } else if (type === 'city' && CITIES[slug]) {
    const city = CITIES[slug];
    page = {
      title: `Buy & Sell in ${city.name}`,
      description: `Browse free classified ads in ${city.name}, ${city.province}. Find cars, property, electronics, furniture, jobs, services and more on Everything Market.`,
      canonical: `${SITE_URL}/city/${slug}`,
      h1: `Buy & Sell in ${city.name}`,
      intro: `Find local deals in ${city.name}, including ${city.areas}. Everything Market helps people buy and sell cars, property, electronics, furniture, jobs and services for free.`,
      ctaHref: `/?province=${encodeURIComponent(city.province)}`,
      links: Object.entries(CATEGORIES).slice(0, 7).map(([catSlug, category]) => ({
        href: `/city/${slug}/${catSlug}`,
        title: `${category.h1} in ${city.name}`,
        text: `Browse ${category.h1.toLowerCase()} and related ads in ${city.name}.`,
      })),
    };
  } else if (type === 'static' && STATIC_PAGES[slug]) {
    const item = STATIC_PAGES[slug];
    page = {
      title: item.title,
      description: item.description,
      canonical: `${SITE_URL}/${slug}`,
      h1: item.h1,
      intro: item.intro,
      ctaHref: item.ctaHref,
      links: [
        { href: '/buy-sell/cars-bakkies', title: 'Cars & Bakkies', text: 'Browse vehicle listings across South Africa.' },
        { href: '/buy-sell/electronics', title: 'Electronics', text: 'Find phones, laptops, gaming and appliances.' },
        { href: '/province/gauteng', title: 'Gauteng Marketplace', text: 'Local listings in Johannesburg, Pretoria and Soweto.' },
        { href: '/searches/iphone-for-sale-south-africa', title: 'Popular Searches', text: 'See high-demand searches on Everything Market.' },
      ],
    };
  } else if (type === 'province' && PROVINCES[slug]) {
    const province = PROVINCES[slug];
    page = {
      title: `Buy & Sell in ${province}`,
      description: `Browse free classified ads in ${province}. Find cars, property, electronics, furniture, jobs, services and more on Everything Market.`,
      canonical: `${SITE_URL}/province/${slug}`,
      h1: `Buy & Sell in ${province}`,
      intro: `Find local deals in ${province}. Everything Market helps South Africans buy and sell cars, property, electronics, furniture, jobs and services without listing fees.`,
      ctaHref: `/?province=${encodeURIComponent(province)}`,
      links: Object.entries(CATEGORIES).slice(0, 7).map(([catSlug, category]) => ({
        href: `/buy-sell/${catSlug}`,
        title: category.h1,
        text: `Browse ${category.h1.toLowerCase()} and related ads in South Africa.`,
      })),
    };
  }

  if (!page) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(pageShell({
      title: 'Page not found',
      description: 'Everything Market page not found.',
      canonical: SITE_URL + '/',
      h1: 'Page not found',
      intro: 'This marketplace page could not be found. Browse the latest ads on Everything Market.',
      ctaHref: '/',
      links: [],
    }));
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(pageShell(page));
};
