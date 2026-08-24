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

const MARKETPLACE_LOCATIONS = {
  gauteng: { name: 'Gauteng', kind: 'province', province: 'Gauteng', areas: 'Johannesburg, Pretoria, Soweto, Sandton, Midrand, Centurion and Ekurhuleni' },
  'western-cape': { name: 'Western Cape', kind: 'province', province: 'Western Cape', areas: 'Cape Town, Bellville, Paarl, Stellenbosch, George and Somerset West' },
  'kwazulu-natal': { name: 'KwaZulu-Natal', kind: 'province', province: 'KwaZulu-Natal', areas: 'Durban, Pietermaritzburg, Umhlanga, Pinetown, Ballito and Richards Bay' },
  'eastern-cape': { name: 'Eastern Cape', kind: 'province', province: 'Eastern Cape', areas: 'Gqeberha, East London, Mthatha, Queenstown, Uitenhage and Port Alfred' },
  limpopo: { name: 'Limpopo', kind: 'province', province: 'Limpopo', areas: 'Polokwane, Tzaneen, Thohoyandou, Mokopane, Bela-Bela and Lephalale' },
  mpumalanga: { name: 'Mpumalanga', kind: 'province', province: 'Mpumalanga', areas: 'Mbombela, Nelspruit, Witbank, Middelburg, Secunda and White River' },
  'north-west': { name: 'North West', kind: 'province', province: 'North West', areas: 'Rustenburg, Klerksdorp, Potchefstroom, Mahikeng, Brits and Hartbeespoort' },
  'northern-cape': { name: 'Northern Cape', kind: 'province', province: 'Northern Cape', areas: 'Kimberley, Upington, Kuruman, Springbok, De Aar and Kathu' },
  'free-state': { name: 'Free State', kind: 'province', province: 'Free State', areas: 'Bloemfontein, Welkom, Bethlehem, Sasolburg, Parys and Kroonstad' },
  johannesburg: { name: 'Johannesburg', kind: 'metro', province: 'Gauteng', areas: 'Sandton, Soweto, Randburg, Roodepoort, Midrand and Fourways' },
  tshwane: { name: 'Tshwane', kind: 'metro', province: 'Gauteng', areas: 'Pretoria, Centurion, Mamelodi, Hatfield, Soshanguve and Montana' },
  ekurhuleni: { name: 'Ekurhuleni', kind: 'metro', province: 'Gauteng', areas: 'Boksburg, Benoni, Kempton Park, Germiston, Alberton and Springs' },
  'cape-town': { name: 'Cape Town', kind: 'metro', province: 'Western Cape', areas: 'Bellville, Mitchells Plain, Khayelitsha, Durbanville, Somerset West and the CBD' },
  ethekwini: { name: 'eThekwini', kind: 'metro', province: 'KwaZulu-Natal', areas: 'Durban, Umhlanga, Pinetown, Chatsworth, Umlazi and Amanzimtoti' },
  'nelson-mandela-bay': { name: 'Nelson Mandela Bay', kind: 'metro', province: 'Eastern Cape', areas: 'Gqeberha, Port Elizabeth, Uitenhage, Despatch, Walmer and Summerstrand' },
  'buffalo-city': { name: 'Buffalo City', kind: 'metro', province: 'Eastern Cape', areas: 'East London, Mdantsane, King William\'s Town, Bhisho and Beacon Bay' },
  mangaung: { name: 'Mangaung', kind: 'metro', province: 'Free State', areas: 'Bloemfontein, Botshabelo, Thaba Nchu, Universitas and Bayswater' },
  bloemfontein: { name: 'Bloemfontein', kind: 'city', province: 'Free State', areas: 'Mangaung, Universitas, Bayswater, Langenhoven Park, Heidedal and Botshabelo' },
  soweto: { name: 'Soweto', kind: 'city', province: 'Gauteng', areas: 'Orlando, Diepkloof, Protea Glen, Meadowlands, Pimville and nearby Johannesburg areas' },
  sandton: { name: 'Sandton', kind: 'city', province: 'Gauteng', areas: 'Fourways, Bryanston, Rivonia, Morningside, Woodmead and Alexandra' },
  midrand: { name: 'Midrand', kind: 'city', province: 'Gauteng', areas: 'Halfway House, Noordwyk, Vorna Valley, Carlswald, Kyalami and Waterfall' },
  centurion: { name: 'Centurion', kind: 'city', province: 'Gauteng', areas: 'Lyttelton, Irene, Rooihuiskraal, Wierdapark, Zwartkop and The Reeds' },
  boksburg: { name: 'Boksburg', kind: 'city', province: 'Gauteng', areas: 'Parkrand, Sunward Park, Beyers Park, Dawn Park, Atlasville and Jet Park' },
  benoni: { name: 'Benoni', kind: 'city', province: 'Gauteng', areas: 'Northmead, Farrarmere, Rynfield, Daveyton, Actonville and Lakefield' },
  germiston: { name: 'Germiston', kind: 'city', province: 'Gauteng', areas: 'Primrose, Bedfordview, Elsburg, Lambton, Wadeville and Edenvale' },
  krugersdorp: { name: 'Krugersdorp', kind: 'city', province: 'Gauteng', areas: 'Noordheuwel, Kenmare, Chancliff, Kagiso, Rant-en-Dal and Roodepoort' },
  vereeniging: { name: 'Vereeniging', kind: 'city', province: 'Gauteng', areas: 'Three Rivers, Duncanville, Arcon Park, Sebokeng, Meyerton and Vanderbijlpark' },
  'vanderbijlpark': { name: 'Vanderbijlpark', kind: 'city', province: 'Gauteng', areas: 'SE, SW, CE, CW, Boipatong, Bophelong and the Vaal Triangle' },
  stellenbosch: { name: 'Stellenbosch', kind: 'city', province: 'Western Cape', areas: 'Cloetesville, Kayamandi, Jamestown, Paradyskloof, Somerset West and Paarl' },
  paarl: { name: 'Paarl', kind: 'city', province: 'Western Cape', areas: 'Wellington, Mbekweni, Val de Vie, Franschhoek, Klapmuts and Stellenbosch' },
  george: { name: 'George', kind: 'city', province: 'Western Cape', areas: 'Wilderness, Pacaltsdorp, Blanco, Heather Park, Knysna and Mossel Bay' },
  'mossel-bay': { name: 'Mossel Bay', kind: 'city', province: 'Western Cape', areas: 'Hartenbos, Dana Bay, Great Brak River, Klein Brak River and George' },
  worcester: { name: 'Worcester', kind: 'city', province: 'Western Cape', areas: 'Rawsonville, De Doorns, Touws River, Robertson, Ceres and the Breede Valley' },
  knysna: { name: 'Knysna', kind: 'city', province: 'Western Cape', areas: 'Sedgefield, Brenton, Leisure Isle, Plettenberg Bay, George and the Garden Route' },
  'pietermaritzburg': { name: 'Pietermaritzburg', kind: 'city', province: 'KwaZulu-Natal', areas: 'Scottsville, Hayfields, Northdale, Hilton, Howick and Edendale' },
  'richards-bay': { name: 'Richards Bay', kind: 'city', province: 'KwaZulu-Natal', areas: 'Meerensee, Arboretum, Empangeni, Esikhawini, Mtunzini and eSikhaleni' },
  newcastle: { name: 'Newcastle', kind: 'city', province: 'KwaZulu-Natal', areas: 'Madadeni, Osizweni, Amajuba Park, Hutten Heights, Ladysmith and Dundee' },
  ladysmith: { name: 'Ladysmith', kind: 'city', province: 'KwaZulu-Natal', areas: 'Ezakheni, Acaciavale, Steadville, Colenso, Estcourt and Newcastle' },
  margate: { name: 'Margate', kind: 'city', province: 'KwaZulu-Natal', areas: 'Shelly Beach, Ramsgate, Port Shepstone, Uvongo, Southbroom and Hibberdene' },
  ballito: { name: 'Ballito', kind: 'city', province: 'KwaZulu-Natal', areas: 'Salt Rock, Shaka\'s Rock, Zimbali, Tongaat, Umhlanga and Stanger' },
  'east-london': { name: 'East London', kind: 'city', province: 'Eastern Cape', areas: 'Beacon Bay, Gonubie, Mdantsane, Amalinda, King William\'s Town and Bhisho' },
  mthatha: { name: 'Mthatha', kind: 'city', province: 'Eastern Cape', areas: 'Norwood, Southernwood, Ngangelizwe, Libode, Qumbu and Port St Johns' },
  komani: { name: 'Komani', kind: 'city', province: 'Eastern Cape', areas: 'Queenstown, Ezibeleni, Mlungisi, Whittlesea, Cofimvaba and Tarkastad' },
  makhanda: { name: 'Makhanda', kind: 'city', province: 'Eastern Cape', areas: 'Grahamstown, Joza, Alicedale, Kenton-on-Sea, Port Alfred and Bathurst' },
  kariega: { name: 'Kariega', kind: 'city', province: 'Eastern Cape', areas: 'Uitenhage, Despatch, KwaNobuhle, Gqeberha and Nelson Mandela Bay' },
  tzaneen: { name: 'Tzaneen', kind: 'city', province: 'Limpopo', areas: 'Nkowankowa, Letsitele, Haenertsburg, Modjadjiskloof, Phalaborwa and Polokwane' },
  thohoyandou: { name: 'Thohoyandou', kind: 'city', province: 'Limpopo', areas: 'Sibasa, Shayandima, Louis Trichardt, Malamulele, Giyani and Venda' },
  polokwane: { name: 'Polokwane', kind: 'city', province: 'Limpopo', areas: 'Bendor, Seshego, Flora Park, Ladanna, Mankweng and Pietersburg' },
  mokopane: { name: 'Mokopane', kind: 'city', province: 'Limpopo', areas: 'Potgietersrus, Mahwelereng, Mookgophong, Polokwane and Bela-Bela' },
  'bela-bela': { name: 'Bela-Bela', kind: 'city', province: 'Limpopo', areas: 'Warmbaths, Modimolle, Thabazimbi, Hammanskraal and Waterberg' },
  lephalale: { name: 'Lephalale', kind: 'city', province: 'Limpopo', areas: 'Ellisras, Onverwacht, Marapong, Vaalwater, Thabazimbi and Waterberg' },
  phalaborwa: { name: 'Phalaborwa', kind: 'city', province: 'Limpopo', areas: 'Namanga, Lulekani, Gravelotte, Hoedspruit, Tzaneen and Mopani' },
  mbombela: { name: 'Mbombela', kind: 'city', province: 'Mpumalanga', areas: 'Nelspruit, White River, Hazyview, Barberton, Rocky Drift and Kabokweni' },
  emalahleni: { name: 'eMalahleni', kind: 'city', province: 'Mpumalanga', areas: 'Witbank, Klarinet, Tasbet Park, Reyno Ridge, Middelburg and Ogies' },
  middelburg: { name: 'Middelburg', kind: 'city', province: 'Mpumalanga', areas: 'Aerorand, Mhluzi, Mineralia, Groenkol, eMalahleni and Belfast' },
  secunda: { name: 'Secunda', kind: 'city', province: 'Mpumalanga', areas: 'Trichardt, Evander, Kinross, Embalenhle, Bethal and Standerton' },
  ermelo: { name: 'Ermelo', kind: 'city', province: 'Mpumalanga', areas: 'Wesselton, Breyten, Chrissiesmeer, Carolina, Standerton and Bethal' },
  'white-river': { name: 'White River', kind: 'city', province: 'Mpumalanga', areas: 'Mbombela, Nelspruit, Hazyview, Sabie, Rocky Drift and Kabokweni' },
  hazyview: { name: 'Hazyview', kind: 'city', province: 'Mpumalanga', areas: 'White River, Sabie, Graskop, Bushbuckridge, Kiepersol and Mbombela' },
  klerksdorp: { name: 'Klerksdorp', kind: 'city', province: 'North West', areas: 'Orkney, Stilfontein, Jouberton, Wilkoppies, Potchefstroom and Wolmaransstad' },
  rustenburg: { name: 'Rustenburg', kind: 'city', province: 'North West', areas: 'Boitekong, Tlhabane, Phokeng, Waterfall East, Brits and Sun City' },
  potchefstroom: { name: 'Potchefstroom', kind: 'city', province: 'North West', areas: 'Ikageng, Baillie Park, Miederpark, Klerksdorp, Fochville and Ventersdorp' },
  mahikeng: { name: 'Mahikeng', kind: 'city', province: 'North West', areas: 'Mmabatho, Montshiwa, Golf View, Lichtenburg, Zeerust and Stella' },
  brits: { name: 'Brits', kind: 'city', province: 'North West', areas: 'Letlhabile, Oukasie, Hartbeespoort, Mooinooi, Rustenburg and Ga-Rankuwa' },
  'hartbeespoort': { name: 'Hartbeespoort', kind: 'city', province: 'North West', areas: 'Schoemansville, Meerhof, Ifafi, Kosmos, Broederstroom and Brits' },
  upington: { name: 'Upington', kind: 'city', province: 'Northern Cape', areas: 'Keimoes, Kakamas, Louisvale, Paballelo, Groblershoop and Kenhardt' },
  kimberley: { name: 'Kimberley', kind: 'city', province: 'Northern Cape', areas: 'Galeshewe, Belgravia, Roodepan, Hadison Park, Cassandra and Barkly West' },
  kuruman: { name: 'Kuruman', kind: 'city', province: 'Northern Cape', areas: 'Mothibistad, Kathu, Hotazel, Danielskuil, Postmasburg and Olifantshoek' },
  springbok: { name: 'Springbok', kind: 'city', province: 'Northern Cape', areas: 'Okiep, Nababeep, Steinkopf, Port Nolloth, Kleinzee and Namaqualand' },
  kathu: { name: 'Kathu', kind: 'city', province: 'Northern Cape', areas: 'Sishen, Kuruman, Olifantshoek, Postmasburg, Hotazel and Deben' },
  welkom: { name: 'Welkom', kind: 'city', province: 'Free State', areas: 'Riebeeckstad, Thabong, Virginia, Odendaalsrus, Hennenman and Allanridge' },
  bethlehem: { name: 'Bethlehem', kind: 'city', province: 'Free State', areas: 'Bohlokong, Clarens, Fouriesburg, Reitz, Harrismith and Kestell' },
  sasolburg: { name: 'Sasolburg', kind: 'city', province: 'Free State', areas: 'Zamdela, Vaalpark, Parys, Heilbron, Vanderbijlpark and Vereeniging' },
  kroonstad: { name: 'Kroonstad', kind: 'city', province: 'Free State', areas: 'Maokeng, Viljoenskroon, Steynsrus, Bothaville, Welkom and Parys' },
  parys: { name: 'Parys', kind: 'city', province: 'Free State', areas: 'Vredefort, Tumahole, Sasolburg, Potchefstroom, Vanderbijlpark and the Vaal' },
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

const ITEM_KEYWORDS = {
  'cars-for-sale': { title: 'Cars for Sale', query: 'car', cat: 'cars', terms: 'used cars, second-hand cars, bakkies, SUVs and vehicle deals' },
  'bakkies-for-sale': { title: 'Bakkies for Sale', query: 'bakkie', cat: 'cars', terms: 'used bakkies, work bakkies, double cabs and single cabs' },
  'toyota-for-sale': { title: 'Toyota for Sale', query: 'toyota', cat: 'cars', terms: 'Toyota cars, Toyota bakkies, Corolla, Hilux and Fortuner listings' },
  'vw-polo-for-sale': { title: 'VW Polo for Sale', query: 'vw polo', cat: 'cars', terms: 'VW Polo, Volkswagen cars and affordable used vehicles' },
  'ford-ranger-for-sale': { title: 'Ford Ranger for Sale', query: 'ford ranger', cat: 'cars', terms: 'Ford Ranger bakkies, double cabs and work vehicles' },
  'motorcycles-for-sale': { title: 'Motorcycles for Sale', query: 'motorcycle', cat: 'bike', terms: 'motorbikes, scooters, delivery bikes and riding gear' },
  'trailers-for-sale': { title: 'Trailers for Sale', query: 'trailer', cat: 'cars', terms: 'trailers, car trailers, utility trailers and transport gear' },
  'property-for-sale': { title: 'Property for Sale', query: 'property for sale', cat: 'prop', terms: 'houses, flats, land, plots and commercial property' },
  'houses-to-rent': { title: 'Houses to Rent', query: 'house to rent', cat: 'prop', terms: 'houses, rooms, garden cottages and rental homes' },
  'flats-to-rent': { title: 'Flats to Rent', query: 'flat to rent', cat: 'prop', terms: 'flats, apartments, rooms and rental accommodation' },
  'rooms-to-rent': { title: 'Rooms to Rent', query: 'room to rent', cat: 'prop', terms: 'rooms, shared accommodation, student rooms and rentals' },
  'land-for-sale': { title: 'Land for Sale', query: 'land for sale', cat: 'prop', terms: 'plots, stands, farms, smallholdings and vacant land' },
  'iphones-for-sale': { title: 'iPhones for Sale', query: 'iphone', cat: 'elec', terms: 'iPhones, Apple phones, iPads and Apple accessories' },
  'samsung-phones-for-sale': { title: 'Samsung Phones for Sale', query: 'samsung phone', cat: 'elec', terms: 'Samsung phones, Android phones and mobile accessories' },
  'phones-for-sale': { title: 'Phones for Sale', query: 'phone', cat: 'elec', terms: 'cellphones, smartphones, Android phones, iPhones and accessories' },
  'laptops-for-sale': { title: 'Laptops for Sale', query: 'laptop', cat: 'elec', terms: 'laptops, notebooks, MacBooks, desktops and computer gear' },
  'tvs-for-sale': { title: 'TVs for Sale', query: 'tv', cat: 'elec', terms: 'TVs, smart TVs, monitors, soundbars and home entertainment' },
  'gaming-consoles-for-sale': { title: 'Gaming Consoles for Sale', query: 'playstation xbox', cat: 'game', terms: 'PS5, PS4, Xbox, Nintendo, games and controllers' },
  'fridges-for-sale': { title: 'Fridges for Sale', query: 'fridge', cat: 'furn', terms: 'fridges, freezers, bar fridges and kitchen appliances' },
  'washing-machines-for-sale': { title: 'Washing Machines for Sale', query: 'washing machine', cat: 'furn', terms: 'washing machines, tumble dryers and laundry appliances' },
  'couches-for-sale': { title: 'Couches for Sale', query: 'couch', cat: 'furn', terms: 'couches, lounge suites, sofas and living-room furniture' },
  'beds-for-sale': { title: 'Beds for Sale', query: 'bed', cat: 'furn', terms: 'beds, mattresses, bunk beds and bedroom furniture' },
  'furniture-for-sale': { title: 'Furniture for Sale', query: 'furniture', cat: 'furn', terms: 'used furniture, tables, chairs, beds, couches and cupboards' },
  'appliances-for-sale': { title: 'Appliances for Sale', query: 'appliance', cat: 'furn', terms: 'fridges, stoves, microwaves, washing machines and home appliances' },
  'jobs-near-me': { title: 'Jobs', query: 'job', cat: 'jobs', terms: 'jobs, vacancies, part-time work, full-time work and local employment' },
  'driver-jobs': { title: 'Driver Jobs', query: 'driver job', cat: 'jobs', terms: 'driver jobs, delivery jobs, courier work and transport vacancies' },
  'domestic-worker-jobs': { title: 'Domestic Worker Jobs', query: 'domestic worker', cat: 'jobs', terms: 'domestic work, cleaning jobs, nanny jobs and housekeeper roles' },
  'cleaning-services': { title: 'Cleaning Services', query: 'cleaning', cat: 'serv', terms: 'cleaners, domestic cleaning, office cleaning and home services' },
  'plumbers-near-me': { title: 'Plumbers', query: 'plumber', cat: 'serv', terms: 'plumbers, geyser repairs, pipe repairs and bathroom services' },
  'electricians-near-me': { title: 'Electricians', query: 'electrician', cat: 'serv', terms: 'electricians, wiring, plugs, lights, DB boards and repairs' },
  'mechanics-near-me': { title: 'Mechanics', query: 'mechanic', cat: 'serv', terms: 'mechanics, car repairs, vehicle servicing and diagnostics' },
  'builders-near-me': { title: 'Builders', query: 'builder', cat: 'serv', terms: 'builders, renovations, paving, roofing and construction services' },
  'garden-services': { title: 'Garden Services', query: 'garden service', cat: 'serv', terms: 'garden services, lawn care, tree felling and landscaping' },
  'solar-panels-for-sale': { title: 'Solar Panels for Sale', query: 'solar', cat: 'elec', terms: 'solar panels, inverters, batteries and backup power systems' },
  'generators-for-sale': { title: 'Generators for Sale', query: 'generator', cat: 'tool', terms: 'generators, inverters, backup power and load-shedding equipment' },
  'tools-for-sale': { title: 'Tools for Sale', query: 'tools', cat: 'tool', terms: 'power tools, hand tools, hardware and workshop equipment' },
  'building-materials': { title: 'Building Materials', query: 'building materials', cat: 'tool', terms: 'bricks, doors, windows, timber, roofing and building supplies' },
  'clothes-for-sale': { title: 'Clothes for Sale', query: 'clothes', cat: 'fash', terms: 'clothing, dresses, jackets, shirts and second-hand fashion' },
  'sneakers-for-sale': { title: 'Sneakers for Sale', query: 'sneakers', cat: 'fash', terms: 'sneakers, shoes, trainers and fashion footwear' },
  'baby-items-for-sale': { title: 'Baby Items for Sale', query: 'baby', cat: 'kids', terms: 'baby clothes, prams, cots, toys and kids items' },
  'pets-for-sale': { title: 'Pets for Sale', query: 'pet', cat: 'pets', terms: 'pets, puppies, kittens, pet supplies and animal listings' },
  'puppies-for-sale': { title: 'Puppies for Sale', query: 'puppy', cat: 'pets', terms: 'puppies, dogs, pet supplies and animal listings' },
  'bicycles-for-sale': { title: 'Bicycles for Sale', query: 'bicycle', cat: 'sport', terms: 'bicycles, mountain bikes, road bikes and cycling gear' },
  'gym-equipment-for-sale': { title: 'Gym Equipment for Sale', query: 'gym', cat: 'sport', terms: 'weights, treadmills, benches, exercise bikes and fitness equipment' },
  'musical-instruments-for-sale': { title: 'Musical Instruments for Sale', query: 'guitar keyboard piano', cat: 'music', terms: 'guitars, keyboards, pianos, drums and music gear' },
  'textbooks-for-sale': { title: 'Textbooks for Sale', query: 'textbook', cat: 'book', terms: 'textbooks, study guides, school books and university books' },
};

const SELL_KEYWORDS = {
  car: { title: 'Sell My Car', item: 'car', query: 'car', terms: 'cars, bakkies, SUVs and used vehicles' },
  bakkie: { title: 'Sell My Bakkie', item: 'bakkie', query: 'bakkie', terms: 'single cabs, double cabs, work bakkies and used bakkies' },
  motorcycle: { title: 'Sell My Motorcycle', item: 'motorcycle', query: 'motorcycle', terms: 'motorcycles, scooters, delivery bikes and riding gear' },
  trailer: { title: 'Sell My Trailer', item: 'trailer', query: 'trailer', terms: 'trailers, utility trailers, car trailers and transport equipment' },
  house: { title: 'Sell My House', item: 'house', query: 'house for sale', terms: 'houses, flats, rooms, land and property listings' },
  property: { title: 'Sell My Property', item: 'property', query: 'property for sale', terms: 'houses, flats, plots, stands, farms and commercial property' },
  land: { title: 'Sell My Land', item: 'land', query: 'land for sale', terms: 'land, plots, stands, farms and smallholdings' },
  phone: { title: 'Sell My Phone', item: 'phone', query: 'phone', terms: 'phones, iPhones, Samsung phones, Android phones and accessories' },
  iphone: { title: 'Sell My iPhone', item: 'iPhone', query: 'iphone', terms: 'iPhones, Apple phones, iPads and Apple accessories' },
  laptop: { title: 'Sell My Laptop', item: 'laptop', query: 'laptop', terms: 'laptops, MacBooks, desktops and computer accessories' },
  tv: { title: 'Sell My TV', item: 'TV', query: 'tv', terms: 'TVs, smart TVs, monitors, soundbars and entertainment devices' },
  playstation: { title: 'Sell My PlayStation', item: 'PlayStation', query: 'playstation', terms: 'PS5, PS4, games, controllers and gaming consoles' },
  xbox: { title: 'Sell My Xbox', item: 'Xbox', query: 'xbox', terms: 'Xbox consoles, games, controllers and gaming accessories' },
  fridge: { title: 'Sell My Fridge', item: 'fridge', query: 'fridge', terms: 'fridges, freezers, bar fridges and kitchen appliances' },
  'washing-machine': { title: 'Sell My Washing Machine', item: 'washing machine', query: 'washing machine', terms: 'washing machines, tumble dryers and laundry appliances' },
  couch: { title: 'Sell My Couch', item: 'couch', query: 'couch', terms: 'couches, sofas, lounge suites and living-room furniture' },
  bed: { title: 'Sell My Bed', item: 'bed', query: 'bed', terms: 'beds, mattresses, bunk beds and bedroom furniture' },
  furniture: { title: 'Sell My Furniture', item: 'furniture', query: 'furniture', terms: 'furniture, couches, beds, tables, chairs and cupboards' },
  appliance: { title: 'Sell My Appliance', item: 'appliance', query: 'appliance', terms: 'appliances, fridges, stoves, microwaves and washing machines' },
  clothes: { title: 'Sell My Clothes', item: 'clothes', query: 'clothes', terms: 'clothing, shoes, dresses, jackets and second-hand fashion' },
  sneakers: { title: 'Sell My Sneakers', item: 'sneakers', query: 'sneakers', terms: 'sneakers, shoes, trainers and fashion footwear' },
  'baby-items': { title: 'Sell Baby Items', item: 'baby items', query: 'baby', terms: 'baby clothes, prams, cots, toys and kids items' },
  tools: { title: 'Sell My Tools', item: 'tools', query: 'tools', terms: 'power tools, hand tools, hardware and workshop equipment' },
  generator: { title: 'Sell My Generator', item: 'generator', query: 'generator', terms: 'generators, inverters and backup power equipment' },
  solar: { title: 'Sell Solar Equipment', item: 'solar equipment', query: 'solar', terms: 'solar panels, inverters, batteries and backup power systems' },
  'building-materials': { title: 'Sell Building Materials', item: 'building materials', query: 'building materials', terms: 'bricks, doors, windows, timber, roofing and building supplies' },
  bike: { title: 'Sell My Bicycle', item: 'bicycle', query: 'bicycle', terms: 'bicycles, mountain bikes, road bikes and cycling gear' },
  'gym-equipment': { title: 'Sell Gym Equipment', item: 'gym equipment', query: 'gym', terms: 'weights, treadmills, benches and home gym equipment' },
  'musical-instrument': { title: 'Sell My Musical Instrument', item: 'musical instrument', query: 'guitar keyboard piano', terms: 'guitars, keyboards, pianos, drums and music gear' },
  textbooks: { title: 'Sell My Textbooks', item: 'textbooks', query: 'textbook', terms: 'textbooks, study guides, school books and university books' },
  pets: { title: 'Advertise Pets', item: 'pet listing', query: 'pet', terms: 'pet listings, puppies, kittens, pet supplies and animal listings' },
  service: { title: 'Advertise My Service', item: 'service', query: 'service', terms: 'local services, trades, repairs, cleaning, plumbing and business services' },
  business: { title: 'Advertise My Business', item: 'business', query: 'service', terms: 'small businesses, local services, shops, contractors and side hustles' },
  job: { title: 'Post a Job', item: 'job', query: 'job', terms: 'jobs, vacancies, hiring posts, part-time work and employment listings' },
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
  'privacy-policy': {
    title: 'Privacy Policy',
    h1: 'Privacy Policy',
    description: 'Privacy Policy for Everything Market, South Africa\'s free online classifieds marketplace.',
    intro: 'Everything Market collects and uses account, listing, message, verification, analytics and support information to operate the marketplace, improve safety, prevent abuse and help buyers and sellers connect. We do not sell personal information.',
    ctaHref: '/',
  },
  'terms-and-conditions': {
    title: 'Terms and Conditions',
    h1: 'Terms and Conditions',
    description: 'Terms and Conditions for using Everything Market to buy, sell, message, verify and promote listings in South Africa.',
    intro: 'By using Everything Market, users agree to post lawful and accurate listings, trade responsibly, avoid scams and prohibited items, and understand that private transactions are arranged between buyers and sellers.',
    ctaHref: '/',
  },
  'paia-manual': {
    title: 'PAIA Manual',
    h1: 'PAIA Manual',
    description: 'PAIA Manual for Everything Market, including access-to-information and POPIA request guidance.',
    intro: 'This PAIA manual explains how people may request access to records held by Everything Market in line with South African access-to-information and privacy laws.',
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
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48">
  <link rel="icon" href="/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/favicon-192.png">
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
  } else if (type === 'near-me' && ITEM_KEYWORDS[slug]) {
    const item = ITEM_KEYWORDS[slug];
    page = {
      title: `${item.title} Near Me`,
      description: `${item.title} near me: find ${item.terms} from local South African sellers on Everything Market.`,
      canonical: `${SITE_URL}/near-me/${slug}`,
      h1: `${item.title} Near Me`,
      intro: `Looking for ${item.title.toLowerCase()} near you? Everything Market helps buyers find ${item.terms} from local sellers across South Africa. Browse live listings or post your own free ad today.`,
      ctaHref: `/?q=${encodeURIComponent(item.query)}`,
      links: [
        { href: '/marketplace-gauteng', title: `${item.title} in Gauteng`, text: 'Find local listings around Johannesburg, Pretoria and nearby areas.' },
        { href: '/marketplace-cape-town', title: `${item.title} in Cape Town`, text: 'Browse local Western Cape listings and nearby sellers.' },
        { href: '/marketplace-ethekwini', title: `${item.title} in Durban`, text: 'Find listings around Durban and eThekwini.' },
        { href: '/marketplace-johannesburg', title: 'Marketplace Johannesburg', text: 'Browse popular local marketplace listings.' },
        { href: '/post-free-ad-south-africa', title: `Sell ${item.title.toLowerCase()} online`, text: 'Post a free ad and reach buyers near you.' },
        { href: '/safety', title: 'Safe buying tips', text: 'Meet safely, inspect first and avoid scams.' },
      ],
    };
  } else if (type === 'sell-my' && SELL_KEYWORDS[slug]) {
    const item = SELL_KEYWORDS[slug];
    page = {
      title: `${item.title} Near Me`,
      description: `${item.title} near me: post a free ad on Everything Market and reach South African buyers looking for ${item.terms}.`,
      canonical: `${SITE_URL}/sell-my/${slug}`,
      h1: `${item.title} Near Me`,
      intro: `Want to ${item.title.toLowerCase()}? Post a free ad on Everything Market, add clear photos and details, and reach buyers near you looking for ${item.terms}.`,
      ctaHref: `/?post=ad&sell=${encodeURIComponent(item.query)}`,
      links: [
        { href: '/post-free-ad-south-africa', title: 'Post a free ad', text: 'Create your listing and start reaching buyers.' },
        { href: '/seller-growth-kit', title: 'Seller Growth Kit', text: 'Tips to write stronger ads and get more messages.' },
        { href: `/near-me/${Object.keys(ITEM_KEYWORDS).find(key => ITEM_KEYWORDS[key].query === item.query) || 'cars-for-sale'}`, title: `${item.item} buyers near me`, text: 'See related buyer search pages.' },
        { href: '/marketplace-gauteng', title: 'Sell in Gauteng', text: 'Reach buyers in Johannesburg, Pretoria and nearby areas.' },
        { href: '/marketplace-cape-town', title: 'Sell in Cape Town', text: 'Reach Western Cape buyers.' },
        { href: '/safety', title: 'Sell safely', text: 'Use safe meetups, honest photos and clear pricing.' },
      ],
    };
  } else if (type === 'marketplace-location-item') {
    const locationSlug = String(req.query.location || '').toLowerCase();
    const itemSlug = String(req.query.item || '').toLowerCase();
    const location = MARKETPLACE_LOCATIONS[locationSlug];
    const item = ITEM_KEYWORDS[itemSlug];
    if (location && item) {
      page = {
        title: `${item.title} in ${location.name}`,
        description: `${item.title} in ${location.name}: browse ${item.terms} on Everything Market, South Africa's free local marketplace.`,
        canonical: `${SITE_URL}/marketplace-${locationSlug}/${itemSlug}`,
        h1: `${item.title} in ${location.name}`,
        intro: `Find ${item.terms} in ${location.name} and nearby areas like ${location.areas}. Everything Market helps local buyers and sellers connect for free in ${location.province}.`,
        ctaHref: `/?q=${encodeURIComponent(item.query)}&province=${encodeURIComponent(location.province)}`,
        links: [
          { href: `/marketplace-${locationSlug}`, title: `Marketplace ${location.name}`, text: `Browse all categories in ${location.name}.` },
          { href: `/near-me/${itemSlug}`, title: `${item.title} near me`, text: 'Find this item across South Africa.' },
          { href: '/buy-sell/cars-bakkies', title: 'Cars & Bakkies', text: 'Vehicle listings from local sellers.' },
          { href: '/buy-sell/electronics', title: 'Electronics', text: 'Phones, laptops, TVs and gaming.' },
          { href: '/buy-sell/furniture', title: 'Furniture', text: 'Couches, beds, fridges and appliances.' },
          { href: '/post-free-ad-south-africa', title: `Sell in ${location.name}`, text: 'Post a free ad and reach local buyers.' },
        ],
      };
    }
  } else if (type === 'sell-location') {
    const locationSlug = String(req.query.location || '').toLowerCase();
    const itemSlug = String(req.query.item || '').toLowerCase();
    const location = MARKETPLACE_LOCATIONS[locationSlug];
    const item = SELL_KEYWORDS[itemSlug];
    if (location && item) {
      page = {
        title: `${item.title} in ${location.name}`,
        description: `${item.title} in ${location.name}: post a free ad and reach buyers looking for ${item.terms} on Everything Market.`,
        canonical: `${SITE_URL}/sell/${locationSlug}/${itemSlug}`,
        h1: `${item.title} in ${location.name}`,
        intro: `If you want to ${item.title.toLowerCase()} in ${location.name}, Everything Market gives you a free listing page for buyers around ${location.areas}. Add photos, price, condition and location, then share your ad link anywhere.`,
        ctaHref: `/?post=ad&sell=${encodeURIComponent(item.query)}&province=${encodeURIComponent(location.province)}`,
        links: [
          { href: '/post-free-ad-south-africa', title: 'Post your ad free', text: 'Create a listing for your item in minutes.' },
          { href: `/marketplace-${locationSlug}`, title: `Marketplace ${location.name}`, text: `Browse all local marketplace categories in ${location.name}.` },
          { href: `/sell-my/${itemSlug}`, title: `${item.title} near me`, text: 'View the national seller page for this item.' },
          { href: '/seller-growth-kit', title: 'Seller tips', text: 'Improve your photos, pricing and description.' },
          { href: '/verified-sellers', title: 'Verified sellers', text: 'Build buyer trust with verification.' },
          { href: '/safety', title: 'Safe selling', text: 'Meet safely and avoid suspicious payment requests.' },
        ],
      };
    }
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
  } else if (type === 'marketplace-location' && MARKETPLACE_LOCATIONS[slug]) {
    const location = MARKETPLACE_LOCATIONS[slug];
    const scope = location.kind === 'metro' ? `${location.name} metro` : location.name;
    page = {
      title: `Marketplace ${location.name}`,
      description: `Marketplace ${location.name}: buy and sell cars, property, electronics, furniture, jobs, services and second-hand goods locally on Everything Market.`,
      canonical: `${SITE_URL}/marketplace-${slug}`,
      h1: `Marketplace ${location.name}`,
      intro: `Everything Market is a free online marketplace for ${scope}. Browse local ads around ${location.areas}, or post your own listing for free and reach buyers in ${location.province}.`,
      ctaHref: `/?province=${encodeURIComponent(location.province)}`,
      links: [
        { href: `/province/${Object.entries(PROVINCES).find(([, name]) => name === location.province)?.[0] || 'gauteng'}`, title: `Buy & Sell in ${location.province}`, text: `Browse all live listings in ${location.province}.` },
        { href: '/buy-sell/cars-bakkies', title: `Cars on Marketplace ${location.name}`, text: 'Used cars, bakkies, motorcycles and transport deals.' },
        { href: '/buy-sell/electronics', title: `Electronics on Marketplace ${location.name}`, text: 'Phones, laptops, gaming, appliances and more.' },
        { href: '/buy-sell/property', title: `Property on Marketplace ${location.name}`, text: 'Houses, flats, rooms and property listings.' },
        { href: '/buy-sell/furniture', title: `Furniture on Marketplace ${location.name}`, text: 'Couches, beds, fridges and household goods.' },
        { href: '/post-free-ad-south-africa', title: `Sell on Marketplace ${location.name}`, text: 'Post a free ad and get discovered by local buyers.' },
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
