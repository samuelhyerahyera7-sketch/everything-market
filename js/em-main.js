/* ── Wishlist ── */
let wl = new Set(JSON.parse(localStorage.getItem('em_wl2') || '[]'));
function toggleWL(id, btn) {
  if (!_getSession()) {
    openSignInModal('Sign in to save ads to your wishlist.');
    return;
  }
  wl.has(id) ? wl.delete(id) : wl.add(id);
  localStorage.setItem('em_wl2', JSON.stringify([...wl]));
  btn.classList.toggle('on', wl.has(id));
}

/* ── Location display: auto-append province for legacy bare-city entries ── */
const _SA_CITY_PROV = {
  /* Gauteng */
  'johannesburg':'Gauteng','joburg':'Gauteng','jo\'burg':'Gauteng','jozi':'Gauteng',
  'soweto':'Gauteng','sandton':'Gauteng','randburg':'Gauteng','roodepoort':'Gauteng',
  'boksburg':'Gauteng','benoni':'Gauteng','germiston':'Gauteng','alberton':'Gauteng',
  'springs':'Gauteng','krugersdorp':'Gauteng','tembisa':'Gauteng','midrand':'Gauteng',
  'centurion':'Gauteng','pretoria':'Gauteng','tshwane':'Gauteng','mamelodi':'Gauteng',
  'soshanguve':'Gauteng','mabopane':'Gauteng','atteridgeville':'Gauteng',
  'vanderbijlpark':'Gauteng','vereeniging':'Gauteng','evaton':'Gauteng',
  'edenvale':'Gauteng','kempton park':'Gauteng','brakpan':'Gauteng',
  'fourways':'Gauteng','rivonia':'Gauteng','bryanston':'Gauteng',
  'rosebank':'Gauteng','melville':'Gauteng','alexandra':'Gauteng',
  'diepsloot':'Gauteng','orange farm':'Gauteng','lenasia':'Gauteng',
  /* Western Cape */
  'cape town':'Western Cape','kaapstad':'Western Cape','bellville':'Western Cape',
  'mitchells plain':'Western Cape','khayelitsha':'Western Cape','gugulethu':'Western Cape',
  'stellenbosch':'Western Cape','paarl':'Western Cape','worcester':'Western Cape',
  'george':'Western Cape','knysna':'Western Cape','mossel bay':'Western Cape',
  'oudtshoorn':'Western Cape','strand':'Western Cape','somerset west':'Western Cape',
  'durbanville':'Western Cape','brackenfell':'Western Cape','milnerton':'Western Cape',
  'tableview':'Western Cape','bloubergstrand':'Western Cape','retreat':'Western Cape',
  'plettenberg bay':'Western Cape','hermanus':'Western Cape','swellendam':'Western Cape',
  /* KwaZulu-Natal */
  'durban':'KwaZulu-Natal','ethekwini':'KwaZulu-Natal','pietermaritzburg':'KwaZulu-Natal',
  'msunduzi':'KwaZulu-Natal','newcastle':'KwaZulu-Natal','richardsbaai':'KwaZulu-Natal',
  'richards bay':'KwaZulu-Natal','empangeni':'KwaZulu-Natal','ladysmith':'KwaZulu-Natal',
  'pinetown':'KwaZulu-Natal','chatsworth':'KwaZulu-Natal','umlazi':'KwaZulu-Natal',
  'tongaat':'KwaZulu-Natal','ballito':'KwaZulu-Natal','umhlanga':'KwaZulu-Natal',
  'berea':'KwaZulu-Natal','westville':'KwaZulu-Natal','kloof':'KwaZulu-Natal',
  'amanzimtoti':'KwaZulu-Natal','port shepstone':'KwaZulu-Natal',
  /* Eastern Cape */
  'port elizabeth':'Eastern Cape','gqeberha':'Eastern Cape','buffalo city':'Eastern Cape',
  'east london':'Eastern Cape','mthatha':'Eastern Cape','king william\'s town':'Eastern Cape',
  'bhisho':'Eastern Cape','grahamstown':'Eastern Cape','makhanda':'Eastern Cape',
  'uitenhage':'Eastern Cape','queenstown':'Eastern Cape','komani':'Eastern Cape',
  'butterworth':'Eastern Cape','jeffreys bay':'Eastern Cape','humansdorp':'Eastern Cape',
  'port alfred':'Eastern Cape',
  /* Limpopo */
  'polokwane':'Limpopo','pietersburg':'Limpopo','tzaneen':'Limpopo',
  'thohoyandou':'Limpopo','makhado':'Limpopo','musina':'Limpopo',
  'lephalale':'Limpopo','bela-bela':'Limpopo','mokopane':'Limpopo',
  'groblersdal':'Limpopo','burgersfort':'Limpopo','phalaborwa':'Limpopo',
  /* Mpumalanga */
  'nelspruit':'Mpumalanga','mbombela':'Mpumalanga','witbank':'Mpumalanga',
  'emalahleni':'Mpumalanga','secunda':'Mpumalanga','middelburg':'Mpumalanga',
  'standerton':'Mpumalanga','ermelo':'Mpumalanga','carolina':'Mpumalanga',
  'barberton':'Mpumalanga','hazyview':'Mpumalanga','white river':'Mpumalanga',
  'lydenburg':'Mpumalanga','mashishing':'Mpumalanga',
  /* Free State */
  'bloemfontein':'Free State','mangaung':'Free State','welkom':'Free State',
  'botshabelo':'Free State','thaba nchu':'Free State','kroonstad':'Free State',
  'sasolburg':'Free State','phuthaditjhaba':'Free State','bethlehem':'Free State',
  'parys':'Free State',
  /* North West */
  'mahikeng':'North West','mafikeng':'North West','klerksdorp':'North West',
  'matlosana':'North West','rustenburg':'North West','potchefstroom':'North West',
  'brits':'North West','orkney':'North West','stilfontein':'North West',
  'lichtenburg':'North West','vryburg':'North West','wolmaransstad':'North West',
  /* Northern Cape */
  'kimberley':'Northern Cape','sol plaatje':'Northern Cape','upington':'Northern Cape',
  'springbok':'Northern Cape','de aar':'Northern Cape','kuruman':'Northern Cape',
  'kathu':'Northern Cape','postmasburg':'Northern Cape','colesberg':'Northern Cape',
  /* Gauteng extra */
  'ekurhuleni':'Gauteng','ivory park':'Gauteng','katlehong':'Gauteng',
  'thokoza':'Gauteng','vosloorus':'Gauteng','daveyton':'Gauteng',
};
function _fmtLoc(loc) {
  if (!loc) return '';
  if (loc.includes(',')) return loc;
  const prov = _SA_CITY_PROV[loc.trim().toLowerCase()];
  return prov ? loc.trim() + ', ' + prov : loc;
}

/* ── Price formatting ── */
function fmtPrice(l, large) {
  if (l.price === 0) return large
    ? '<span class="bb-price-free">Contact for Price</span>'
    : '<span class="gt-price-free">Contact for Price</span>';
  const r = 'R ' + l.price.toLocaleString('en-ZA');
  const neg = l.neg ? (large ? '<span class="bb-neg">neg.</span>' : '<span class="gt-neg">neg.</span>') : '';
  return large
    ? `<span class="bb-price-val">${r}</span>${neg}`
    : `<span class="gt-price-val">${r}</span>${neg}`;
}

/* ── User ads: load from localStorage (backup cache while Supabase syncs) ── */
function _loadUserAds() {
  try {
    const saved = JSON.parse(localStorage.getItem('em_user_ads') || '[]');
    if (!Array.isArray(saved) || !saved.length) return;
    /* Only load ads that have a userId (not corrupted data from older bug) */
    const valid = saved.filter(ad => ad.userId);
    const existingIds = new Set(LISTINGS.map(l => String(l.id)));
    valid.forEach(ad => {
      if (!existingIds.has(String(ad.id))) LISTINGS.unshift(ad);
    });
  } catch(e) {}
}

function _saveUserAds() {
  try {
    const sess = _getSession();
    if (!sess) return;
    /* Save ads that belong to this user — by userId, or by seller name as fallback */
    const userAds = LISTINGS.filter(l =>
      (l.userId && String(l.userId) === String(sess.userId)) ||
      (!l.userId && l.seller && l.seller.trim().toLowerCase() === (sess.name || '').trim().toLowerCase())
    );
    localStorage.setItem('em_user_ads', JSON.stringify(userAds));
  } catch(e) {}
}

/* ── Load ads from Supabase and rebuild LISTINGS ── */
function _adKey(ad) {
  /* Dedup by title+seller — price/loc can vary due to formatting differences */
  return [
    (ad.title  || '').trim().toLowerCase(),
    (ad.seller || '').trim().toLowerCase()
  ].join('||');
}

async function _loadSupabaseAds() {
  if (!window.emLoadAds) { window._adsLoaded = true; renderAll('all'); return; }
  try {
    const raw = await window.emLoadAds();

    /* Supabase returned real data — replace LISTINGS (deduped), then re-add any
       local user ads that didn't make it to Supabase yet so they never flash away. */
    if (Array.isArray(raw)) {
      const seen = new Map();
      raw.forEach(ad => {
        const k = _adKey(ad);
        const prev = seen.get(k);
        if (!prev || ad.postedAt > prev.postedAt) seen.set(k, ad);
      });
      LISTINGS.length = 0;
      seen.forEach(a => LISTINGS.push(a));

      /* Re-inject any locally saved user ads not yet in Supabase.
         Don't depend on session state here — auth may not be ready yet.
         em_user_ads only contains ads with a real userId (enforced by _saveUserAds). */
      try {
        const local = JSON.parse(localStorage.getItem('em_user_ads') || '[]');
        local.forEach(la => {
          if (!la.userId) return;
          if (!seen.has(_adKey(la))) LISTINGS.unshift(la);
        });
      } catch (_) {}
    }
  } catch(_) {}
  window._adsLoaded = true;
  renderAll('all');
  renderSponsoredStrip();
}

_loadUserAds();

/* ── Image helper ── */
const _ART_ICON = {
  phone:    { emoji:'📱', color:'#E3F0FF', icon:'M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 18h.01' },
  truck:    { emoji:'🚙', color:'#E8F5E9', icon:'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
  house:    { emoji:'🏠', color:'#FFF8E1', icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10' },
  tv:       { emoji:'📺', color:'#F3E5F5', icon:'M33 3H-9v16h42zM8 19v4M16 19v4M9 23h6' },
  dog:      { emoji:'🐕', color:'#FFF3E0', icon:'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2 .324-3.5 1.858-3.5 3.5 0 .796.479 1.54 1.179 1.98-.287.18-.529.41-.679.72C3.135 9.77 3 10.09 3 10.5c0 .83.67 1.5 1.5 1.5 1 0 2.5-1 3.5-1 2.5 0 4 1.5 7 1.5 2.55 0 4-1.5 4-3.5C19 6.996 14 4 10 5.172z' },
  tools:    { emoji:'🔧', color:'#E8EAF6', icon:'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  moto:     { emoji:'🏍', color:'#FCE4EC', icon:'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9h-2M14 17H9M9 17a3 3 0 11-6 0 3 3 0 016 0zM22 17a3 3 0 11-6 0 3 3 0 016 0z' },
  table:    { emoji:'🪑', color:'#F1F8E9', icon:'M4 6h16v2H4zM4 12h16v2H4zM4 3h16v2H4zM6 6v16M18 6v16' },
  sneakers: { emoji:'👟', color:'#E0F2F1', icon:'M2 12l2-8h14l2 8M2 12h20M6 12v8M18 12v8M6 20h12' },
  ps5:      { emoji:'🎮', color:'#EDE7F6', icon:'M6 11h4M8 9v4M15 12h.01M18 10h.01M17.32 5H6.68a4 4 0 00-3.978 3.59l-1 9A4 4 0 005.68 22h12.64a4 4 0 003.978-4.41l-1-9A4 4 0 0017.32 5z' },
  design:   { emoji:'🎨', color:'#FFF9C4', icon:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-.5c0-.55-.22-1.05-.59-1.41a.75.75 0 01.53-1.29H16c3.31 0 6-2.69 6-6 0-4.96-4.48-9-10-9z' },
  apt:      { emoji:'🏢', color:'#E3F2FD', icon:'M3 21V7l9-4 9 4v14H3zM3 21h18M9 21V9M15 21V9M9 9h6M9 13h6M9 17h6' },
};

function _renderImg(el, l, tappable) {
  if (l.photos && l.photos.length > 0) {
    const img = document.createElement('img');
    img.src = l.photos[0];
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.alt = l.title;
    if (tappable) {
      img.style.cursor = 'zoom-in';
      img.onclick = () => emLightboxOpen(l.photos[0], l.photos, 0);
    }
    img.onerror = () => { img.remove(); _renderArtIcon(el, l.art); };
    el.appendChild(img);
  } else {
    _renderArtIcon(el, l.art);
  }
}

function _renderArtIcon(el, artKey) {
  const a = _ART_ICON[artKey];
  el.style.background = a ? a.color : 'var(--surf2)';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.flexDirection = 'column';
  el.style.gap = '6px';
  const span = document.createElement('span');
  span.style.cssText = 'font-size:48px;line-height:1;';
  span.textContent = a ? a.emoji : '📦';
  el.appendChild(span);
}

/* ── Sponsored Ads strip — populated from real LISTINGS after load ── */
function renderSponsoredStrip() {
  const grid = document.getElementById('spons-grid');
  if (!grid) return;
  const now = Date.now();
  const paid = LISTINGS.filter(l => l.sponsored && (!l.sponsoredUntil || l.sponsoredUntil > now));
  /* Fall back to all ads so the strip is never empty */
  const sponsored = paid.length ? paid : [...LISTINGS];
  const section = grid.closest('.sponsored-strip') || grid.closest('section') || grid.parentElement;
  if (!sponsored.length) { if (section) section.style.display = 'none'; return; }
  if (section) section.style.display = '';
  grid.innerHTML = '';
  const repeatTimes = 1;
  const items = [...sponsored];
  items.forEach((l, idx) => {
    const card = document.createElement('div');
    card.className = 'spons-card';
    card.innerHTML = `
      <div style="position:relative;">
        <div class="spons-img" id="spons-img-${l.id}-s${idx}"></div>
        <span class="spons-ad-badge">Sponsored</span>
      </div>
      <div class="spons-body">
        <div class="spons-tag">${l.cat.charAt(0).toUpperCase()+l.cat.slice(1)}</div>
        <div class="spons-title">${l.title}</div>
        <div class="spons-price">${fmtPrice(l, false)}</div>
        <div class="spons-loc">${_fmtLoc(l.loc)}</div>
        <span class="vfy-badge ${l.verified?'vfy-yes':'vfy-no'}" style="margin-top:4px;">${l.verified?ICO.check+'Verified':'Unverified'}</span>
      </div>`;
    grid.appendChild(card);
    _renderImg(card.querySelector(`#spons-img-${l.id}-s${idx}`), l);
  });

  /* JS-driven scroll so mouse/touch drag and auto-scroll share the same offset */
  const wrap = grid.parentElement;
  let offsetX = 0, raf = null, dragging = false, startX = 0, startOffset = 0, didDrag = false;
  const SPEED = 0.5;

  function maxScroll() { return Math.max(0, grid.scrollWidth - grid.parentElement.clientWidth); }

  function tick() {
    if (!dragging) {
      offsetX += SPEED;
      if (offsetX >= maxScroll()) offsetX = 0;
    }
    grid.style.transform = 'translateX(' + (-offsetX) + 'px)';
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function onMove(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = startX - x;
    if (Math.abs(delta) > 4) didDrag = true;
    offsetX = Math.max(0, Math.min(startOffset + delta, maxScroll()));
  }
  function onUp() {
    dragging = false;
    wrap.classList.remove('dragging');
    /* remove listeners immediately so they never touch anything else on the page */
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup',   onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend',  onUp);
  }

  wrap.addEventListener('mousedown', e => {
    dragging = true; didDrag = false;
    startX = e.clientX; startOffset = offsetX;
    wrap.classList.add('dragging');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  });
  wrap.addEventListener('touchstart', e => {
    dragging = true; didDrag = false;
    startX = e.touches[0].clientX; startOffset = offsetX;
    wrap.classList.add('dragging');
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend',  onUp);
  }, { passive: true });

  /* Open card only when it was a tap, not a drag */
  grid.querySelectorAll('.spons-card').forEach((card, i) => {
    card.addEventListener('click', () => {
      if (didDrag) { didDrag = false; return; }
      openBuyNow(sponsored[i % sponsored.length]);
    });
  });
}

/* ── Shop by Category ── */
function toggleShopcat() {
  const panel = document.getElementById('shopcat-panel');
  const arrow = document.getElementById('shopcat-arrow');
  if (!panel) return;
  const open = panel.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open', open);
}

(function() {
  const scatGrid = document.getElementById('shopcat-grid');
  if (!scatGrid) return;
  CATS.filter(c => c.id !== 'all').forEach(cat => {
    const card = document.createElement('a');
    card.href = '#';
    card.className = 'scat-card';
    card.onclick = e => { e.preventDefault(); openCategoryPage(cat.id, cat.name); };
    card.innerHTML = `
      <div class="scat-img-wrap"><img src="${cat.img}" alt="${cat.name}" class="scat-img" loading="lazy" onerror="this.parentElement.style.background='#e8f5e9'"></div>
      <div class="scat-name">${cat.name}</div>`;
    scatGrid.appendChild(card);
  });
})();

/* ── Category Page ── */
let _catId = 'all', _catName = 'All Ads', _searchQuery = '', _resultCatFilter = '';

const _SEARCH_ALIASES = {
  car: ['cars', 'bakkie', 'bakkies', 'vehicle', 'vehicles', 'auto', 'autos', 'transport', 'toyota', 'ford', 'vw', 'volkswagen', 'bmw', 'mercedes'],
  cars: ['car', 'bakkie', 'bakkies', 'vehicle', 'vehicles', 'auto', 'autos', 'transport', 'toyota', 'ford', 'vw', 'volkswagen', 'bmw', 'mercedes'],
  bakkie: ['car', 'cars', 'bakkies', 'vehicle', 'vehicles', 'transport'],
  bakkies: ['car', 'cars', 'bakkie', 'vehicle', 'vehicles', 'transport'],
  bike: ['motorcycle', 'motorcycles', 'moto', 'scooter'],
  phones: ['phone', 'iphone', 'samsung', 'cellphone', 'mobile'],
  phone: ['phones', 'iphone', 'samsung', 'cellphone', 'mobile'],
  property: ['house', 'houses', 'flat', 'flats', 'apartment', 'apartments', 'rent', 'rental'],
  house: ['property', 'houses', 'flat', 'apartment', 'rent', 'rental'],
  job: ['jobs', 'work', 'vacancy', 'vacancies'],
  jobs: ['job', 'work', 'vacancy', 'vacancies'],
};

const _SEARCH_INTENT_CATS = {
  car: 'cars',
  cars: 'cars',
  bakkie: 'cars',
  bakkies: 'cars',
  vehicle: 'cars',
  vehicles: 'cars',
  auto: 'cars',
  transport: 'cars',
  phone: 'elec',
  phones: 'elec',
  electronics: 'elec',
  laptop: 'elec',
  property: 'prop',
  house: 'prop',
  houses: 'prop',
  flat: 'prop',
  rent: 'prop',
  job: 'jobs',
  jobs: 'jobs',
  work: 'jobs',
  furniture: 'furn',
  couch: 'furn',
  sofa: 'furn',
  bed: 'furn',
};

function _normSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _searchTerms(query) {
  const base = _normSearchText(query).split(' ').filter(Boolean);
  const terms = new Set(base);
  base.forEach(term => {
    if (term.endsWith('s') && term.length > 3) terms.add(term.slice(0, -1));
    if (_SEARCH_ALIASES[term]) _SEARCH_ALIASES[term].forEach(alias => terms.add(alias));
  });
  return [...terms];
}

function _inferSearchCategory(query) {
  const terms = _normSearchText(query).split(' ').filter(Boolean);
  for (const term of terms) {
    if (_SEARCH_INTENT_CATS[term]) return _SEARCH_INTENT_CATS[term];
    if (term.endsWith('s') && _SEARCH_INTENT_CATS[term.slice(0, -1)]) return _SEARCH_INTENT_CATS[term.slice(0, -1)];
  }
  return '';
}

function _listingSearchText(l) {
  const cat = CATS.find(c => c.id === l.cat);
  return _normSearchText([
    l.title,
    l.desc,
    l.description,
    l.cat,
    cat?.name,
    l.seller,
    l.sellerType,
    l.cond,
    l.loc,
    l.make,
    l.model,
    l.year,
  ].filter(Boolean).join(' '));
}

function _getCatListings() {
  let data = _catId === 'all' ? LISTINGS : LISTINGS.filter(l => l.cat === _catId);
  if (_searchQuery) {
    const terms = _searchTerms(_searchQuery);
    data = data.filter(l => {
      const hay = _listingSearchText(l);
      return terms.some(term => hay.includes(term));
    });
  }
  if (_resultCatFilter) {
    data = data.filter(l => l.cat === _resultCatFilter);
  }
  return data;
}

function _openResultsPage(title) {
  const page = document.getElementById('cat-page');
  const alreadyOpen = page && page.style.display !== 'none';
  document.getElementById('cat-page-title').textContent = title;
  if (page) page.style.display = 'flex';
  const scrollEl = document.getElementById('cat-page-scroll');
  if (scrollEl) scrollEl.scrollTop = 0;
  document.getElementById('cf-min').value = '';
  document.getElementById('cf-max').value = '';
  document.querySelectorAll('.cf-cond').forEach(el => { el.checked = false; });
  document.getElementById('cf-sort').value = 'newest';
  if (!alreadyOpen) {
    _lockScroll();
    _navPush('results');
  }
}

function openCategoryPage(catId, catName) {
  _catId = catId;
  _catName = catName;
  _searchQuery = '';
  _resultCatFilter = '';
  _openResultsPage(catName);
  const locEl = document.getElementById('cf-loc');
  if (locEl) locEl.value = '';
  applyCatFilters();
  if (window.emTrack) emTrack('category_view', { cat: catId });
}

function openProvincePage(province) {
  _catId = 'all';
  _catName = province;
  _searchQuery = '';
  _resultCatFilter = '';
  _openResultsPage('Ads in ' + province);
  const locEl = document.getElementById('cf-loc');
  if (locEl) locEl.value = province;
  applyCatFilters();
  if (window.emTrack) emTrack('province_view', { province });
}

function runSearch() {
  const mobVal = (document.getElementById('mob-search-input')?.value || '').trim();
  const dskVal = (document.getElementById('main-search')?.value || '').trim();
  const q    = mobVal || dskVal;
  if (mobVal) { const d = document.getElementById('main-search'); if (d) d.value = mobVal; }
  const prov = (document.getElementById('srch-loc')?.value || '');
  if (!q && !prov) { toast('Enter something to search for.'); return; }
  if (q && window._acSaveRecent) _acSaveRecent(q);

  _catId = 'all';
  _searchQuery = q.toLowerCase();
  _resultCatFilter = _inferSearchCategory(q);

  const title = q && prov ? `"${q}" in ${prov}` : q ? `Results for "${q}"` : `Ads in ${prov}`;
  _openResultsPage(title);

  const locEl = document.getElementById('cf-loc');
  if (locEl) locEl.value = prov;

  applyCatFilters();
  document.getElementById('ac-drop')?.classList.remove('open');
  document.getElementById('mob-ac-drop')?.classList.remove('open');
  document.getElementById('srch-mob')?.classList.remove('open');

  if (window.emTrack && q) emTrack('search', { q: q.slice(0, 60) });
}

/* ── In-app navigation stack (pushState per layer so back gesture stays in the app) ── */
let _navSuppressNext = false;
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (_) {}

function _navPush(layer, extraState, url) {
  history.pushState({ emNav: layer, ...(extraState || {}) }, '', url || (window.location.pathname + window.location.search));
}

function _navBack() {
  /* Called when the user explicitly closes a layer (X button, cancel, etc.)
     Undoes the pushState that was pushed when the layer opened. */
  if (history.state && history.state.emNav) {
    _navSuppressNext = true;
    history.back();
    setTimeout(() => { _navSuppressNext = false; }, 200);
  }
}

function _closeCatPageUI() {
  document.getElementById('cat-page').style.display = 'none';
  _searchQuery = '';
  _resultCatFilter = '';
  _unlockScroll();
  _ensureScrollUnlockedIfNoOverlay();
}

function closeCategoryPage() {
  _closeCatPageUI();
  _navBack();
}

/* Single popstate listener — handles all layers in order (topmost first) */
window.addEventListener('popstate', function() {
  if (_navSuppressNext) { _navSuppressNext = false; return; }

  /* Lightbox */
  const lb = document.getElementById('em-lightbox');
  if (lb && lb.classList.contains('open')) {
    lb.classList.remove('open');
    document.removeEventListener('keydown', _lbKey);
    return;
  }

  /* Modal */
  if (modal && modal.classList.contains('open')) {
    modal.classList.remove('open');
    setTimeout(() => { modalBox.innerHTML = ''; }, 250);
    _unlockScroll();
    return;
  }

  /* Store dashboard */
  const storeDash = document.getElementById('store-dashboard');
  if (storeDash && storeDash.style.display !== 'none') {
    storeDash.style.display = 'none';
    _unlockScroll();
    return;
  }

  /* Shop page */
  const shopPage = document.getElementById('shop-page');
  if (shopPage && shopPage.style.display !== 'none') {
    shopPage.style.display = 'none';
    _unlockScroll();
    return;
  }

  /* Results / category page */
  const catPage = document.getElementById('cat-page');
  if (catPage && catPage.style.display !== 'none') {
    _closeCatPageUI();
  }
});

/* ── Shops ── */
function toggleShopsBar() {
  const panel = document.getElementById('shops-panel');
  const arrow = document.getElementById('shops-arrow');
  if (!panel) return;
  panel.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open');
}

/* Approved stores loaded from /api/load-stores */
let _approvedStores = [];

async function _loadApprovedStores() {
  try {
    const r = await fetch('/api/load-stores');
    if (r.ok) _approvedStores = await r.json();
  } catch (_) {}
  _buildShopsGrid();
}

function _buildShopsGrid() {
  const grid = document.getElementById('shops-grid');
  const bar  = document.getElementById('shops-bar');
  if (!grid || !bar) return;

  if (!_approvedStores.length) {
    grid.innerHTML = '<div style="padding:12px 4px;color:var(--muted);font-size:13px;">No stores available yet.</div>';
    return;
  }

  grid.innerHTML = '';

  /* "Add Your Store" card — always first */
  const addCard = document.createElement('div');
  addCard.className = 'shop-card shop-card-add';
  addCard.onclick = openApplyStoreModal;
  addCard.innerHTML = `
    <div class="shop-card-add-icon">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
    <div class="shop-card-name" style="font-size:13px;">Add Your Store</div>`;
  grid.appendChild(addCard);

  _approvedStores.forEach(s => {
    const initials = s.storeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarHtml = s.logoUrl
      ? `<img src="${s.logoUrl}" class="shop-card-logo" alt="${s.storeName}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        + `<div class="shop-card-avatar" style="display:none">${initials}</div>`
      : `<div class="shop-card-avatar">${initials}</div>`;
    const isOwner = _sbUser?.user_metadata?.store_id === s.storeId;
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.onclick = () => openShopPage(s.storeName, s.userId, s.storeId, true, s.storeType, s.logoUrl || null);
    card.innerHTML = `
      ${avatarHtml}
      <div class="shop-card-name">${s.storeName} <span class="shop-vfy-text">Verified</span></div>
      <div class="shop-card-count">${s.count} product${s.count !== 1 ? 's' : ''}</div>
      ${s.loc ? `<div class="shop-card-loc">${_fmtLoc(s.loc)}</div>` : ''}
      ${isOwner ? `<button class="shop-card-manage-btn" onclick="event.stopPropagation();openStoreDashboard()">Manage Store</button>` : ''}`;
    grid.appendChild(card);
  });
}

let _shopAllAds = [];

async function openShopPage(sellerName, userId, storeId, verified, sellerType, logoUrl) {
  const page = document.getElementById('shop-page');
  if (!page) return;

  /* Show page immediately with a loading state */
  document.getElementById('shop-page-title').textContent = sellerName;
  document.getElementById('shop-page-content').innerHTML =
    '<div style="text-align:center;padding:60px 20px;color:var(--muted);">Loading store…</div>';
  page.style.display = 'flex';
  document.getElementById('shop-page-scroll').scrollTop = 0;
  _lockScroll();
  _navPush('shop');

  /* Load products from store API if storeId provided, else fall back to LISTINGS */
  if (storeId) {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/store-products?store_id=' + storeId),
        fetch('/api/store-categories?store_id=' + storeId)
      ]);
      _shopAllAds = prodRes.ok ? (await prodRes.json()).map(p => ({
        id: p.id, title: p.title, desc: p.description, price: p.price,
        neg: p.neg, cat: p.category_name || 'General', catId: p.category_id,
        cond: p.condition, photos: p.photos || [], loc: p.loc,
        seller: sellerName, userId, storeId, postedAt: new Date(p.created_at).getTime(),
        stockQty: p.stock_qty
      })) : [];
      const cats = catRes.ok ? await catRes.json() : [];
      _renderShopPageContent(sellerName, userId, storeId, verified, sellerType, _shopAllAds, cats, logoUrl);
      return;
    } catch (_) {}
  }

  /* Fallback: filter from LISTINGS */
  _shopAllAds = LISTINGS.filter(l =>
    (userId && l.userId === userId) || (!userId && l.seller === sellerName)
  ).sort((a, b) => b.postedAt - a.postedAt);
  _renderShopPageContent(sellerName, userId, storeId, verified, sellerType, _shopAllAds, [], logoUrl);
}

function _renderShopPageContent(sellerName, userId, storeId, verified, sellerType, ads, customCats, logoUrl) {
  const initials = sellerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const oldest   = ads.length ? Math.min(...ads.map(l => l.postedAt || Date.now())) : Date.now();
  const since    = new Date(oldest).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  /* Build category tabs — prefer custom categories from API, fall back to auto-detect */
  let tabs = [];
  if (customCats.length) {
    const catCounts = {};
    ads.forEach(l => { if (l.catId) catCounts[l.catId] = (catCounts[l.catId] || 0) + 1; });
    tabs = customCats.map(c => ({ id: c.id, name: c.name, count: catCounts[c.id] || 0 }))
      .filter(t => t.count > 0);
  } else {
    const catCounts = {};
    ads.forEach(l => { catCounts[l.cat] = (catCounts[l.cat] || 0) + 1; });
    const catLabel = id => { const f = CATS.find(c => c.id === id); return f ? f.name : id.charAt(0).toUpperCase() + id.slice(1); };
    tabs = Object.keys(catCounts).sort().map(c => ({ id: c, name: catLabel(c), count: catCounts[c] }));
  }

  const typeLabel = sellerType === 'dealership' ? 'Dealership'
    : sellerType === 'services' ? 'Services'
    : sellerType === 'wholesale' ? 'Wholesale'
    : sellerType === 'retail' ? 'Retail Store'
    : sellerType === 'dealer' ? 'Dealership'
    : 'Store';

  document.getElementById('shop-page-title').textContent = sellerName;
  const content = document.getElementById('shop-page-content');
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" class="shop-hdr-logo" alt="${sellerName}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="shop-hdr-avatar" style="display:none">${initials}</div>`
    : `<div class="shop-hdr-avatar">${initials}</div>`;
  content.innerHTML = `
    <div class="shop-hdr-banner">
      ${logoHtml}
      <div class="shop-hdr-info">
        <div class="shop-hdr-name">${sellerName}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center;">
          <span class="vfy-badge vfy-yes" style="background:rgba(26,122,66,.35);color:#7EF0A8;border:1px solid rgba(126,240,168,.4);font-weight:700;">${ICO.check}Verified</span>
          <span style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">${typeLabel}</span>
          <button id="shop-cart-btn" class="shop-cart-btn" onclick="openStoreCart('${storeId}','${sellerName.replace(/'/g,"\\'")}')" style="margin-left:auto;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/></svg>
            <span id="shop-cart-badge" class="shop-cart-badge" style="display:none;">0</span>
          </button>
        </div>
        <div class="shop-hdr-stats">
          <span>${ads.length} product${ads.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>${tabs.length} categor${tabs.length !== 1 ? 'ies' : 'y'}</span>
          <span>·</span>
          <span>Since ${since}</span>
        </div>
      </div>
    </div>
    <div class="shop-cat-tabs" id="shop-cat-tabs">
      <button class="shop-tab active" data-cat="all" onclick="filterShopCat('all',this)">All <span class="shop-tab-count">${ads.length}</span></button>
      ${tabs.map(t => `<button class="shop-tab" data-cat="${t.id}" onclick="filterShopCat('${t.id}',this)">${t.name} <span class="shop-tab-count">${t.count}</span></button>`).join('')}
    </div>
    <div class="shop-main wrap">
      <div class="shop-ec-grid" id="shop-ec-grid"></div>
    </div>`;

  _renderShopGrid(ads);
}

function filterShopCat(cat, btn) {
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const filtered = cat === 'all' ? _shopAllAds : _shopAllAds.filter(l => l.catId === cat || l.cat === cat);
  _renderShopGrid(filtered);
  document.getElementById('shop-page-scroll').scrollTop = 0;
}

/* ── Store Cart ── */
const _cart = {};  // storeId → [{id, title, price, qty, photo}]
let _cartStoreId = null, _cartStoreName = null;

function _cartKey(storeId) { return 'em_cart_' + storeId; }

function _loadCart(storeId) {
  try { return JSON.parse(localStorage.getItem(_cartKey(storeId)) || '[]'); } catch { return []; }
}

function _saveCart(storeId, items) {
  localStorage.setItem(_cartKey(storeId), JSON.stringify(items));
}

function _cartCount(storeId) {
  return _loadCart(storeId).reduce((s, i) => s + i.qty, 0);
}

function _updateCartBadge(storeId) {
  const badge = document.getElementById('shop-cart-badge');
  const btn   = document.getElementById('shop-cart-btn');
  if (!badge || !btn) return;
  const n = _cartCount(storeId);
  badge.textContent = n;
  badge.style.display = n > 0 ? 'flex' : 'none';
  btn.style.display = 'flex';
}

function addToCart(listing) {
  const storeId = listing.storeId;
  const items = _loadCart(storeId);
  const existing = items.find(i => String(i.id) === String(listing.id));
  if (existing) {
    existing.qty += 1;
  } else {
    items.push({ id: listing.id, title: listing.title, price: listing.price, qty: 1, photo: (listing.photos||[])[0]||'' });
  }
  _saveCart(storeId, items);
  _updateCartBadge(storeId);
  toast(`${listing.title} added to cart`);
  openStoreCart(storeId, listing.seller || _cartStoreName);
}

function openStoreCart(storeId, storeName) {
  _cartStoreId = storeId;
  _cartStoreName = storeName;
  const items = _loadCart(storeId);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const waMsg = encodeURIComponent(
    `Hi! I'd like to order from ${storeName}:\n` +
    items.map(i => `• ${i.title} x${i.qty} — R${(i.price*i.qty).toLocaleString('en-ZA')}`).join('\n') +
    `\n\nTotal: R${total.toLocaleString('en-ZA')}`
  );

  const html = `
    <div style="padding:4px 0 8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">${storeName}</div>
          <div style="font-size:18px;font-weight:900;color:var(--ink);">Your Cart</div>
        </div>
        ${items.length > 0 ? `<div style="font-size:13px;font-weight:600;color:var(--muted);">${items.reduce((s,i)=>s+i.qty,0)} item${items.reduce((s,i)=>s+i.qty,0)!==1?'s':''}</div>` : ''}
      </div>
      ${items.length === 0
        ? `<div style="text-align:center;padding:32px 0 24px;">
             <div style="font-size:36px;margin-bottom:12px;">🛒</div>
             <div style="font-size:14px;font-weight:600;color:var(--ink);">Your cart is empty</div>
             <div style="font-size:12px;color:var(--muted);margin-top:4px;">Add items from the store to get started</div>
           </div>`
        : `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
             ${items.map(i => `
               <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surf2);border-radius:12px;border:1px solid var(--border-lt);">
                 ${i.photo ? `<img src="${i.photo}" style="width:56px;height:56px;object-fit:cover;border-radius:9px;flex-shrink:0;" onerror="this.style.display='none'">` : `<div style="width:56px;height:56px;border-radius:9px;background:var(--surf3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;">🛒</div>`}
                 <div style="flex:1;min-width:0;">
                   <div style="font-size:13px;font-weight:700;color:var(--ink);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i.title}</div>
                   <div style="font-size:12px;color:var(--muted);margin-top:1px;">R${i.price.toLocaleString('en-ZA')} each</div>
                   <div style="font-size:13px;font-weight:800;color:var(--forest);margin-top:3px;">R${(i.price*i.qty).toLocaleString('en-ZA')}</div>
                 </div>
                 <div style="display:flex;align-items:center;gap:0;flex-shrink:0;background:var(--surf3);border-radius:20px;padding:2px;">
                   <button onclick="_cartQty('${i.id}',-1)" style="width:30px;height:30px;border-radius:50%;background:none;border:none;font-size:18px;font-weight:300;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink2);">−</button>
                   <span style="font-size:14px;font-weight:800;min-width:22px;text-align:center;color:var(--ink);">${i.qty}</span>
                   <button onclick="_cartQty('${i.id}',1)" style="width:30px;height:30px;border-radius:50%;background:var(--forest);border:none;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;">+</button>
                 </div>
               </div>`).join('')}
           </div>
           <div style="background:var(--surf2);border-radius:12px;padding:14px 16px;margin-bottom:14px;">
             <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
               <span style="font-size:12px;color:var(--muted);">Subtotal (${items.reduce((s,i)=>s+i.qty,0)} items)</span>
               <span style="font-size:13px;font-weight:700;">R${total.toLocaleString('en-ZA')}</span>
             </div>
             <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-lt);padding-top:8px;margin-top:4px;">
               <span style="font-size:14px;font-weight:800;color:var(--ink);">Total</span>
               <span style="font-size:20px;font-weight:900;color:var(--forest);">R${total.toLocaleString('en-ZA')}</span>
             </div>
           </div>
           <button onclick="_clearCart()" style="width:100%;padding:10px;background:none;border:1px solid var(--border);color:var(--muted);border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;">Clear Cart</button>`
      }
    </div>`;
  modalBox.innerHTML = html;
  _openModal();
}

function _cartQty(itemId, delta) {
  const items = _loadCart(_cartStoreId);
  const idx = items.findIndex(i => String(i.id) === String(itemId));
  if (idx === -1) return;
  items[idx].qty = Math.max(0, items[idx].qty + delta);
  if (items[idx].qty === 0) items.splice(idx, 1);
  _saveCart(_cartStoreId, items);
  _updateCartBadge(_cartStoreId);
  openStoreCart(_cartStoreId, _cartStoreName);
}

function _clearCart() {
  _saveCart(_cartStoreId, []);
  _updateCartBadge(_cartStoreId);
  closeModal();
}

function _renderShopGrid(ads) {
  const grid = document.getElementById('shop-ec-grid');
  if (!grid) return;
  if (!ads.length) {
    grid.innerHTML = '<div class="shop-empty">No products in this category yet.</div>';
    return;
  }
  grid.innerHTML = '';
  ads.forEach(l => {
    const card = document.createElement('div');
    card.className = 'shop-ec-card';
    const catName = CATS.find(c => c.id === l.cat)?.name || l.cat;
    card.innerHTML = `
      <div class="shop-ec-img" id="shpec-${l.id}"></div>
      <button class="bb-save${wl.has(l.id) ? ' on' : ''}" onclick="event.stopPropagation();toggleWL('${l.id}',this)" aria-label="Save">${ICO.heart}</button>
      <div class="shop-ec-body">
        <div class="shop-ec-cat">${catName}</div>
        <div class="shop-ec-title">${l.title}</div>
        ${l.cond !== 'N/A' ? `<div class="shop-ec-cond">${l.cond}</div>` : ''}
        <div class="shop-ec-price">${fmtPrice(l, true)}</div>
        <div class="shop-ec-loc">${ICO.pin} ${_fmtLoc(l.loc)}</div>
        <div class="shop-ec-actions">
          <button class="shop-ec-btn-primary" onclick="event.stopPropagation();addToCart(_shopAllAds.find(x=>String(x.id)==='${l.id}'))">Buy Item</button>
          ${l.neg ? `<button class="shop-ec-btn-secondary" onclick="event.stopPropagation();openMakeOffer(_shopAllAds.find(x=>String(x.id)==='${l.id}'))">Make Offer</button>` : ''}
        </div>
      </div>`;
    grid.appendChild(card);
    setTimeout(() => {
      const el = document.getElementById('shpec-' + l.id);
      if (el) _renderImg(el, l);
    }, 0);
  });
}

function closeShopPage() {
  document.getElementById('shop-page').style.display = 'none';
  _unlockScroll();
  _navBack();
}

function toggleCatFilters() {
  const aside = document.querySelector('.cat-filters');
  const btn = document.getElementById('cat-filter-toggle');
  if (!aside) return;
  const open = aside.classList.toggle('mob-open');
  if (btn) btn.classList.toggle('active', open);
}

function applyCatFilters() {
  const minV  = Number(document.getElementById('cf-min').value) || 0;
  const maxV  = Number(document.getElementById('cf-max').value) || Infinity;
  const conds = [...document.querySelectorAll('.cf-cond:checked')].map(el => el.value);
  const sort  = document.getElementById('cf-sort').value;
  const loc   = (document.getElementById('cf-loc').value || '').trim().toLowerCase();
  /* Expand province name to also match all known cities in that province */
  const locTerms = loc ? [loc, ...(PROVINCE_CITIES[loc] || [])] : [];

  let data = _getCatListings().filter(l => {
    if (l.price !== 0 && l.price < minV) return false;
    if (maxV !== Infinity && l.price > maxV) return false;
    if (conds.length && !conds.includes(l.cond)) return false;
    if (locTerms.length) {
      const adLoc = (l.loc || '').toLowerCase();
      if (!locTerms.some(t => adLoc.includes(t))) return false;
    }
    return true;
  });

  if (sort === 'price-asc') data.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') data.sort((a, b) => b.price - a.price);

  renderCatResults(data);
}

function clearCatFilters() {
  const ids = ['cf-min', 'cf-max', 'cf-loc'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('.cf-cond').forEach(el => { el.checked = false; });
  const sortEl = document.getElementById('cf-sort');
  if (sortEl) sortEl.value = 'newest';
  renderCatResults(_getCatListings());
}

function _searchBaseResults() {
  let data = _catId === 'all' ? LISTINGS : LISTINGS.filter(l => l.cat === _catId);
  if (_searchQuery) {
    const terms = _searchTerms(_searchQuery);
    data = data.filter(l => {
      const hay = _listingSearchText(l);
      return terms.some(term => hay.includes(term));
    });
  }
  return data;
}

function _catLabel(catId) {
  const cat = CATS.find(c => c.id === catId);
  return cat ? cat.name : catId;
}

function setResultCategoryFilter(catId) {
  _resultCatFilter = catId || '';
  applyCatFilters();
  const scrollEl = document.getElementById('cat-page-scroll');
  if (scrollEl) scrollEl.scrollTop = 0;
}

function _renderRefineStrip(activeData) {
  const base = _searchBaseResults();
  const counts = {};
  base.forEach(l => { counts[l.cat] = (counts[l.cat] || 0) + 1; });
  const cats = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return `
    <div class="cat-refine">
      <div class="cat-refine-top">
        <div>
          <div class="cat-refine-kicker">Refine results</div>
          <div class="cat-refine-title">${activeData.length} result${activeData.length !== 1 ? 's' : ''}${_resultCatFilter ? ' in ' + _catLabel(_resultCatFilter) : ''}</div>
        </div>
        <button class="cat-refine-filter-btn" onclick="toggleCatFilters()">Filters</button>
      </div>
      <div class="cat-refine-chips">
        <button class="cat-refine-chip ${!_resultCatFilter ? 'active' : ''}" onclick="setResultCategoryFilter('')">All <span>${base.length}</span></button>
        ${cats.map(([catId, count]) => `
          <button class="cat-refine-chip ${_resultCatFilter === catId ? 'active' : ''}" onclick="setResultCategoryFilter('${catId}')">${_catLabel(catId)} <span>${count}</span></button>
        `).join('')}
      </div>
    </div>`;
}

/* ── Sidebar (homepage) filters ── */
function sbApplyFilters() {
  const prov = document.getElementById('sb-prov')?.value || '';
  const catEl = document.querySelector('[name="sb-cat"]:checked');
  const cat = catEl?.value || '';
  const catLabel = catEl?.closest('label')?.textContent.trim() || 'All Ads';
  const minV = document.getElementById('sb-min')?.value || '';
  const maxV = document.getElementById('sb-max')?.value || '';

  if (!prov && !cat && !minV && !maxV) { toast('Choose at least one filter.'); return; }

  if (cat) {
    openCategoryPage(cat, catLabel);
  } else if (prov) {
    openProvincePage(prov);
  } else {
    openCategoryPage('all', 'All Ads');
  }

  /* _openResultsPage (called inside above) clears cf-* — set them back after */
  if (prov && cat) { const el = document.getElementById('cf-loc'); if (el) el.value = prov; }
  if (minV) { const el = document.getElementById('cf-min'); if (el) el.value = minV; }
  if (maxV) { const el = document.getElementById('cf-max'); if (el) el.value = maxV; }
  if ((prov && cat) || minV || maxV) applyCatFilters();
}

function sbClearFilters() {
  const provEl = document.getElementById('sb-prov');
  if (provEl) provEl.value = '';
  const allRadio = document.querySelector('[name="sb-cat"][value=""]');
  if (allRadio) allRadio.checked = true;
  const minEl = document.getElementById('sb-min');
  const maxEl = document.getElementById('sb-max');
  if (minEl) minEl.value = '';
  if (maxEl) maxEl.value = '';
}

function renderCatResults(data) {
  const container = document.getElementById('cat-results');
  const refine = _renderRefineStrip(data);
  if (!data.length) {
    container.innerHTML = refine + '<div class="cat-empty">No ads found. Try another category, location or price range.</div>';
    return;
  }
  container.innerHTML = refine;
  data.forEach(l => {
    const card = document.createElement('div');
    card.className = 'bb-card';
    card.onclick = () => openBuyNow(l);
    const timeStr = fmtTime(l.postedAt);
    card.innerHTML = `
      <div class="bb-img" id="cr-img-${l.id}"></div>
      <div class="bb-body">
        <div class="bb-eyebrow">${l.cat}</div>
        <div class="bb-price-tag">${fmtPrice(l, true)}</div>
        <div class="bb-title">${l.title}</div>
        <div class="bb-meta" style="margin-top:4px">
          <span>${ICO.pin} ${_fmtLoc(l.loc)}</span>
          ${timeStr ? `<span>${ICO.time} ${timeStr}</span>` : ''}
        </div>
        <div class="bb-actions">
          <button class="btn-view" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>String(x.id)==='${l.id}'))">Contact Seller</button>
        </div>
      </div>`;
    container.appendChild(card);
    _renderImg(card.querySelector(`#cr-img-${l.id}`), l);
  });
}

/* ── Autocomplete ── */
(function() {
  const CAT_LABELS = Object.fromEntries(CATS.filter(c => c.id !== 'all').map(c => [c.id, c.name]));

  const POPULAR = [
    { text:'iPhone', cat:'elec' }, { text:'Samsung Galaxy', cat:'elec' },
    { text:'Laptop', cat:'elec' }, { text:'Smart TV', cat:'elec' },
    { text:'Fridge', cat:'home' }, { text:'Washing Machine', cat:'home' },
    { text:'Microwave', cat:'home' }, { text:'Air conditioner', cat:'home' },
    { text:'Toyota Hilux', cat:'cars' }, { text:'Ford Ranger', cat:'cars' },
    { text:'Toyota Corolla', cat:'cars' }, { text:'Volkswagen Polo', cat:'cars' },
    { text:'BMW', cat:'cars' }, { text:'Bakkie for sale', cat:'cars' },
    { text:'Used car', cat:'cars' }, { text:'Car under R100 000', cat:'cars' },
    { text:'Honda CBR', cat:'moto' }, { text:'Yamaha motorcycle', cat:'moto' },
    { text:'House for sale', cat:'prop' }, { text:'Flat to rent', cat:'prop' },
    { text:'Apartment Johannesburg', cat:'prop' }, { text:'3 bedroom house', cat:'prop' },
    { text:'Plot for sale', cat:'prop' }, { text:'Sectional title', cat:'prop' },
    { text:'Sofa & couch', cat:'furn' }, { text:'Dining table', cat:'furn' },
    { text:'Bed & mattress', cat:'furn' }, { text:'Office chair', cat:'furn' },
    { text:'Puppy for sale', cat:'pets' }, { text:'Kitten', cat:'pets' },
    { text:'Dog food', cat:'pets' }, { text:'Parrot', cat:'pets' },
    { text:'Baby clothes', cat:'baby' }, { text:'Pram & stroller', cat:'baby' },
    { text:'Cot & crib', cat:'baby' },
    { text:'Nike sneakers', cat:'fash' }, { text:'Adidas', cat:'fash' },
    { text:'Dress', cat:'fash' }, { text:'Jeans', cat:'fash' },
    { text:'Running shoes', cat:'sport' }, { text:'Gym equipment', cat:'sport' },
    { text:'Bicycle', cat:'sport' }, { text:'Treadmill', cat:'sport' },
    { text:'Golf clubs', cat:'sport' }, { text:'Surfboard', cat:'sport' },
    { text:'Guitar', cat:'music' }, { text:'Piano & keyboard', cat:'music' },
    { text:'Drums', cat:'music' }, { text:'Violin', cat:'music' },
    { text:'PlayStation 5', cat:'game' }, { text:'Xbox Series X', cat:'game' },
    { text:'Nintendo Switch', cat:'game' }, { text:'Gaming PC', cat:'game' },
    { text:'Power drill', cat:'tools' }, { text:'Lawnmower', cat:'tools' },
    { text:'Generator', cat:'tools' }, { text:'Angle grinder', cat:'tools' },
    { text:'Caravan', cat:'camp' }, { text:'Camping tent', cat:'camp' },
    { text:'Off-road trailer', cat:'camp' },
    { text:'Skincare', cat:'beauty' }, { text:'Makeup', cat:'beauty' },
    { text:'Hair extensions', cat:'beauty' },
    { text:'Plumber', cat:'serv' }, { text:'Electrician', cat:'serv' },
    { text:'Painter', cat:'serv' }, { text:'Domestic worker', cat:'serv' },
    { text:'Driver', cat:'jobs' }, { text:'Engineer', cat:'jobs' },
    { text:'Accountant', cat:'jobs' }, { text:'Nurse', cat:'jobs' },
    { text:'Tractor', cat:'agri' }, { text:'Irrigation equipment', cat:'agri' },
    { text:'Livestock', cat:'agri' }, { text:'Farm implements', cat:'agri' },
    { text:'Textbook', cat:'books' }, { text:'Novel', cat:'books' },
    ...CATS.filter(c => c.id !== 'all').map(c => ({ text: c.name, cat: c.id, isCat: true })),
  ];

  function getRecent() {
    try { return JSON.parse(localStorage.getItem('em_recent_searches') || '[]').slice(0, 6); } catch(e) { return []; }
  }
  window._acSaveRecent = function(q) {
    try {
      let r = getRecent().filter(x => x.toLowerCase() !== q.toLowerCase());
      r.unshift(q);
      localStorage.setItem('em_recent_searches', JSON.stringify(r.slice(0, 8)));
    } catch(e) {}
  };

  const ICO_SEARCH = `<svg class="ac-item-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>`;
  const ICO_CLOCK  = `<svg class="ac-item-ico ac-item-ico--recent" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg>`;

  function highlight(text, q) {
    const i = text.toLowerCase().indexOf(q);
    if (i === -1) return text;
    return text.slice(0, i) + '<strong>' + text.slice(i, i + q.length) + '</strong>' + text.slice(i + q.length);
  }

  function buildDropHTML(hits, lq) {
    const rows = hits.map((s, i) => {
      const label = s.text.replace(/'/g, "\\'");
      const catImg = CATS.find(c => c.id === s.cat)?.img || '';
      const thumb = s.isCat && catImg
        ? `<img class="ac-item-img" src="${catImg}" alt="">`
        : ICO_SEARCH;
      return `<div class="ac-item" data-idx="${i}" onclick="document.getElementById('main-search').value='${label}';_acSaveRecent('${label}');document.getElementById('ac-drop').classList.remove('open');runSearch()">
        ${thumb}
        <span class="ac-item-text">${lq ? highlight(s.text, lq) : s.text}</span>
        ${s.cat ? `<span class="ac-item-cat">${CAT_LABELS[s.cat] || s.cat}</span>` : ''}
      </div>`;
    });
    if (lq) {
      const safe = lq.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,"\\'");
      rows.push(`<div class="ac-see-all" onclick="document.getElementById('main-search').value='${safe}';document.getElementById('ac-drop').classList.remove('open');runSearch()">Search for &ldquo;<strong>${lq.replace(/</g,'&lt;')}</strong>&rdquo; &rarr;</div>`);
    }
    return rows.join('');
  }

  function initFor(inputEl, dropEl) {
    if (!inputEl || !dropEl) return;
    let focusIdx = -1;

    function show(q) {
      const lq = q.toLowerCase().trim();
      if (!lq) {
        const recent = getRecent();
        if (!recent.length) { dropEl.classList.remove('open'); return; }
        dropEl.innerHTML =
          `<div class="ac-section-label">Recent searches</div>` +
          recent.map(r => {
            const safe = r.replace(/'/g,"\\'");
            return `<div class="ac-item" onclick="inputEl.value='${safe}';_acSaveRecent('${safe}');dropEl.classList.remove('open');runSearch()">
              ${ICO_CLOCK}
              <span class="ac-item-text">${r}</span>
              <span class="ac-item-recent-tag">Recent</span>
            </div>`;
          }).join('') +
          `<div class="ac-see-all" onclick="dropEl.classList.remove('open');openCategoryPage('all','All Ads')">Browse all categories &rarr;</div>`;
        dropEl.classList.add('open');
        return;
      }
      const seen = new Set();
      const hits = [
        ...LISTINGS.map(l => ({ text: l.title, cat: l.cat })),
        ...POPULAR,
      ].filter(s => {
        if (!s.text.toLowerCase().includes(lq)) return false;
        const k = s.text.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 8);
      if (!hits.length) { dropEl.classList.remove('open'); return; }
      focusIdx = -1;
      dropEl.innerHTML = buildDropHTML(hits, lq);
      dropEl.classList.add('open');
    }

    inputEl.addEventListener('input', () => show(inputEl.value));
    inputEl.addEventListener('focus', () => show(inputEl.value));
    inputEl.addEventListener('keydown', e => {
      const items = dropEl.querySelectorAll('.ac-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); focusIdx = Math.min(focusIdx + 1, items.length - 1); items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); focusIdx = Math.max(focusIdx - 1, 0); items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx)); }
      else if (e.key === 'Enter' && focusIdx >= 0) { items[focusIdx]?.click(); }
      else if (e.key === 'Escape') { dropEl.classList.remove('open'); }
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.srch-wrap') && !e.target.closest('.srch-mob')) dropEl.classList.remove('open');
    });
  }

  initFor(document.getElementById('main-search'), document.getElementById('ac-drop'));
  initFor(document.getElementById('mob-search-input'), document.getElementById('mob-ac-drop'));
})();

/* ── BidorBuy grid render ── */
function renderBB(data) {
  const grid = document.getElementById('bb-grid');
  const now = Date.now();
  /* Dedup at render time by both id and title+seller so no ad ever appears twice */
  const _seenId = new Set();
  const _seenKey = new Set();
  const deduped = data.filter(l => {
    const id = String(l.id);
    if (_seenId.has(id)) return false;
    _seenId.add(id);
    const k = _adKey(l);
    if (_seenKey.has(k)) return false;
    _seenKey.add(k);
    return true;
  });
  const paid    = deduped.filter(l => l.sponsored && (!l.sponsoredUntil || l.sponsoredUntil > now));
  const regular = deduped.filter(l => !l.sponsored || (l.sponsoredUntil && l.sponsoredUntil <= now));
  /* Paid sponsors first, then all regular ads */
  const items = paid.length ? [...paid, ...regular] : deduped;
  if (!items.length) {
    grid.innerHTML = window._adsLoaded
      ? '<p class="em-empty-state">No ads yet — be the first to post one!</p>'
      : '<div class="em-loading-state"><div class="em-spinner"></div><p>Loading ads…</p></div>';
    return;
  }
  grid.innerHTML = '';
  items.forEach(l => {
    const card = document.createElement('div');
    card.className = 'bb-card';
    card.onclick = () => openBuyNow(l);
    const ribClass = l.sponsored ? 'r-feat' : l.badge === 'Hot' ? 'r-hot' : 'r-new';
    const ribLabel = l.sponsored ? 'Sponsored' : l.badge;
    const sd = BB_SELLER_DATA[l.id] || { delivery: false };
    const timeStr = fmtTime(l.postedAt);
    card.innerHTML = `
      <div class="bb-img" id="bb-img-${l.id}"></div>
      ${(l.sponsored || l.badge) ? `<div class="bb-ribbon ${ribClass}">${ribLabel}</div>` : ''}
      <button class="bb-save${wl.has(l.id) ? ' on' : ''}" onclick="event.stopPropagation();toggleWL('${l.id}',this)" aria-label="Save ad">${ICO.heart}</button>
      <div class="bb-body">
        <div class="bb-eyebrow">${l.cat}</div>
        <div class="bb-price-tag">${fmtPrice(l, true)}</div>
        <div class="bb-title">${l.title}</div>
        <div class="bb-seller-row">
          <span class="bb-seller-name">${l.seller}</span>
          <span class="stype-badge ${l.sellerType==='dealer'?'stype-dealer':'stype-private'}">${l.sellerType==='dealer'?'Dealership':'Private'}</span>
          <span class="vfy-badge ${l.verified?'vfy-yes':'vfy-no'}">${l.verified?ICO.check+'Verified':'Unverified'}</span>
        </div>
        ${sd.delivery ? `<div class="bb-delivery"><span class="bb-delivery-dot"></span>Delivery available</div>` : ''}
        ${l.cond !== 'N/A' ? `<div class="bb-cond" style="margin-top:3px">${l.cond}</div>` : ''}
        <div class="bb-meta" style="margin-top:4px">
          <span>${ICO.pin} ${_fmtLoc(l.loc)}</span>
          ${timeStr ? `<span>${ICO.time} ${timeStr}</span>` : ''}
        </div>
        <div class="bb-actions">
          <button class="btn-view" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>String(x.id)==='${l.id}'))">Contact Seller</button>
          ${l.neg ? `<button class="btn-offer" onclick="event.stopPropagation();openMakeOffer(LISTINGS.find(x=>String(x.id)==='${l.id}'))">Make Offer</button>` : ''}
        </div>
      </div>`;
    grid.appendChild(card);
    _renderImg(card.querySelector(`#bb-img-${l.id}`), l);
  });
}

/* ── Gumtree list render ── */
function renderGT(data) {
  const list = document.getElementById('gt-list');
  /* Dedup at render time by both id and title+seller */
  const _seenId = new Set();
  const _seenKey = new Set();
  const items = data.filter(l => {
    const id = String(l.id);
    if (_seenId.has(id)) return false;
    _seenId.add(id);
    const k = _adKey(l);
    if (_seenKey.has(k)) return false;
    _seenKey.add(k);
    return true;
  });
  list.innerHTML = '';
  if (!items.length) return;
  items.forEach(l => {
    const card = document.createElement('div');
    card.className = 'bb-card';
    card.onclick = () => openBuyNow(l);
    const ribClass = l.sponsored ? 'r-feat' : l.badge === 'Hot' ? 'r-hot' : 'r-new';
    const ribLabel = l.sponsored ? 'Sponsored' : l.badge;
    const sd = BB_SELLER_DATA[l.id] || { delivery: false };
    const timeStr = fmtTime(l.postedAt);
    card.innerHTML = `
      <div class="bb-img" id="gt-img-${l.id}"></div>
      ${(l.sponsored || l.badge) ? `<div class="bb-ribbon ${ribClass}">${ribLabel}</div>` : ''}
      <button class="bb-save${wl.has(l.id) ? ' on' : ''}" onclick="event.stopPropagation();toggleWL('${l.id}',this)" aria-label="Save ad">${ICO.heart}</button>
      <div class="bb-body">
        <div class="bb-eyebrow">${l.cat}</div>
        <div class="bb-price-tag">${fmtPrice(l, true)}</div>
        <div class="bb-title">${l.title}</div>
        <div class="bb-seller-row">
          <span class="bb-seller-name">${l.seller}</span>
          <span class="stype-badge ${l.sellerType==='dealer'?'stype-dealer':'stype-private'}">${l.sellerType==='dealer'?'Dealership':'Private'}</span>
          <span class="vfy-badge ${l.verified?'vfy-yes':'vfy-no'}">${l.verified?ICO.check+'Verified':'Unverified'}</span>
        </div>
        ${sd.delivery ? `<div class="bb-delivery"><span class="bb-delivery-dot"></span>Delivery available</div>` : ''}
        ${l.cond !== 'N/A' ? `<div class="bb-cond" style="margin-top:3px">${l.cond}</div>` : ''}
        <div class="bb-meta" style="margin-top:4px">
          <span>${ICO.pin} ${_fmtLoc(l.loc)}</span>
          ${timeStr ? `<span>${ICO.time} ${timeStr}</span>` : ''}
        </div>
        <div class="bb-actions">
          <button class="btn-view" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>String(x.id)==='${l.id}'))">Contact Seller</button>
          ${l.neg ? `<button class="btn-offer" onclick="event.stopPropagation();openMakeOffer(LISTINGS.find(x=>String(x.id)==='${l.id}'))">Make Offer</button>` : ''}
        </div>
      </div>`;
    list.appendChild(card);
    _renderImg(card.querySelector(`#gt-img-${l.id}`), l);
  });
}

function renderAll(cat = 'all') {
  const data = cat === 'all' ? LISTINGS : LISTINGS.filter(l => l.cat === cat || l.cat.startsWith(cat.slice(0,3)));
  renderBB(data);
  renderGT(data);
  /* Stores are loaded once from API; only rebuild grid on first call */
  if (_approvedStores.length) _buildShopsGrid();
}

renderAll('all');
_loadSupabaseAds();
_loadApprovedStores();

/* ── Province grid ── */
const pg = document.getElementById('prov-grid');
PROVINCES.forEach(p => {
  pg.innerHTML += `<button class="prov-btn" onclick="openProvincePage('${p}')">${p} <span class="prov-arr">›</span></button>`;
});

/* ── Scroll lock (prevents background scroll behind overlays on iOS/Android) ── */
let _scrollLockY = 0;
let _scrollLockDepth = 0;
function _instantScrollTo(y) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, y || 0);
  requestAnimationFrame(() => { html.style.scrollBehavior = prev; });
}
function _lockScroll() {
  if (_scrollLockDepth === 0) {
    _scrollLockY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _scrollLockY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }
  _scrollLockDepth++;
}
function _unlockScroll() {
  _scrollLockDepth = Math.max(0, _scrollLockDepth - 1);
  if (_scrollLockDepth === 0) {
    const restoreY = _scrollLockY || 0;
    document.documentElement.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    _instantScrollTo(restoreY);
  }
}

function _forceUnlockScroll() {
  _scrollLockDepth = 1;
  _unlockScroll();
}

function _ensureScrollUnlockedIfNoOverlay() {
  const modalOpen = modal && modal.classList.contains('open');
  const catOpen = document.getElementById('cat-page')?.style.display !== 'none';
  const shopOpen = document.getElementById('shop-page')?.style.display !== 'none';
  const dashOpen = document.getElementById('store-dashboard')?.style.display !== 'none';
  if (!modalOpen && !catOpen && !shopOpen && !dashOpen && _scrollLockDepth > 0) {
    _forceUnlockScroll();
  }
}

/* ── Toast ── */
let _toastTimer;
function toast(msg) {
  const el = document.getElementById('toast-el');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  return false;
}


function toggleMobileSearch() {
  const bar = document.getElementById('srch-mob');
  const input = document.getElementById('mob-search-input');
  bar.classList.toggle('open');
  if (bar.classList.contains('open') && input) input.focus();
}

/* ── Toast notification ── */
function _showToast(msg, duration) {
  let t = document.getElementById('em-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'em-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;z-index:9999;max-width:90vw;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, duration || 4000);
}

/* ── Modal system ── */
const modal = document.getElementById('em-modal');
const modalBox = modal.querySelector('.em-modal-box');

function closeModal() {
  const state = history.state || {};
  modal.classList.remove('open');
  setTimeout(() => { modalBox.innerHTML = ''; }, 250);
  _unlockScroll();
  if (state.emNav === 'ad') {
    history.replaceState(null, '', state.returnUrl || '/');
    if (Number.isFinite(state.returnScrollY)) _instantScrollTo(state.returnScrollY);
    document.title = 'Marketplace South Africa – Buy & Sell Anything Free | Everything Market';
    return;
  }
  _navBack();
}
function _openModal(options) {
  const alreadyOpen = modal.classList.contains('open');
  if (!alreadyOpen) {
    _lockScroll();
    if (options?.layer) _navPush(options.layer, options.state, options.url);
    else _navPush('modal');
  } else if (options?.layer) {
    history.replaceState({ emNav: options.layer, ...(options.state || {}) }, '', options.url || (window.location.pathname + window.location.search));
  }
  modal.classList.add('open');
}
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

/* ── Swipe-down to close modal ── */
(function() {
  let startY = 0, startScrollTop = 0, dragging = false;
  modalBox.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
    startScrollTop = modalBox.scrollTop;
    dragging = true;
  }, { passive: true });
  modalBox.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;
    const dy = e.changedTouches[0].clientY - startY;
    /* Only close if user swiped down ≥80px while already at the top of the modal */
    if (dy > 80 && startScrollTop === 0) closeModal();
    modalBox.style.transform = '';
    modalBox.style.transition = '';
  }, { passive: true });
  modalBox.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY;
    /* Only apply pull-down effect when at top of scroll */
    if (dy > 0 && startScrollTop === 0) {
      const pull = Math.min(dy * 0.4, 120);
      modalBox.style.transform = `translateY(${pull}px)`;
      modalBox.style.transition = 'none';
    }
  }, { passive: true });
})();

/* ── Post Ad modal ── */
window._paPhotos = [];

function openPostAdModal() {
  if (!_getSession()) {
    openSignInModal('Sign in to post a free ad.');
    return;
  }
  window._paPhotos = [];
  const catOpts = CATS.filter(c => c.id !== 'all')
    .map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Post a Free Ad</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <form class="em-post-form" id="post-form" onsubmit="submitPostAd(event)" novalidate>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-title">Ad Title <span>(required)</span></label>
        <input class="em-post-input" id="pa-title" type="text" placeholder="e.g. iPhone 14 Pro 256GB – Space Black" maxlength="120">
      </div>

      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-cat">Category <span>(required)</span></label>
          <select class="em-post-select" id="pa-cat" onchange="window._paCatChange()">
            <option value="">— Select a category —</option>
            ${catOpts}
          </select>
        </div>
        <div class="em-post-field" id="pa-cond-wrap">
          <label class="em-post-label" for="pa-cond">Condition</label>
          <select class="em-post-select" id="pa-cond">
            <option value="New">New</option>
            <option value="Used – Like New">Used – Like New</option>
            <option value="Used – Good" selected>Used – Good</option>
            <option value="Used – Fair">Used – Fair</option>
            <option value="N/A">N/A (Service / Property)</option>
          </select>
        </div>
      </div>

      <div id="pa-cat-extra" style="display:none;"></div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-price">Price (R) <span>— enter 0 for Contact for Price</span></label>
        <div style="display:flex;align-items:center;gap:14px;">
          <input class="em-post-input" id="pa-price" type="number" placeholder="0" min="0" style="flex:1;max-width:180px;">
          <label class="em-post-check"><input type="checkbox" id="pa-neg"> Negotiable</label>
        </div>
      </div>

      <div class="em-post-field">
        <label class="em-post-label">Seller Type</label>
        <div class="em-post-toggle" id="pa-stype">
          <button type="button" class="em-post-toggle-btn active" data-val="private" onclick="_paSetStype(this)">Private Seller</button>
          <button type="button" class="em-post-toggle-btn" data-val="dealer" onclick="_paSetStype(this)">Dealership</button>
        </div>
      </div>

      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-name">Your Name <span>(required)</span></label>
          <input class="em-post-input" id="pa-name" type="text" placeholder="e.g. Sipho M." maxlength="50" value="${(_getSession()||{}).name||''}">
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-phone">Phone Number <span>(required)</span></label>
          <input class="em-post-input" id="pa-phone" type="tel" placeholder="e.g. 082 123 4567" maxlength="20">
        </div>
      </div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-email">Contact Email <span>(required)</span></label>
        <input class="em-post-input" id="pa-email" type="email" placeholder="your@email.com" maxlength="120" value="${(_getSession()||{}).email||''}">
      </div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-city">Location <span>(required)</span></label>
        <div class="em-post-row" style="gap:8px;">
          <input class="em-post-input" id="pa-city" type="text" placeholder="City / Town (e.g. Soweto)" maxlength="60" style="flex:1;">
          <select class="em-post-select" id="pa-prov" style="flex:1;min-width:0;">
            <option value="">— Province —</option>
            <option value="Gauteng">Gauteng</option>
            <option value="Western Cape">Western Cape</option>
            <option value="KwaZulu-Natal">KwaZulu-Natal</option>
            <option value="Eastern Cape">Eastern Cape</option>
            <option value="Limpopo">Limpopo</option>
            <option value="Mpumalanga">Mpumalanga</option>
            <option value="North West">North West</option>
            <option value="Northern Cape">Northern Cape</option>
            <option value="Free State">Free State</option>
          </select>
        </div>
        <input type="hidden" id="pa-loc">
      </div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-desc">Description <span>(required)</span></label>
        <textarea class="em-post-input" id="pa-desc" rows="4" placeholder="Describe your item — condition, what's included, any defects…" maxlength="600" style="resize:vertical;height:90px;"></textarea>
      </div>

      <div class="em-post-field">
        <label class="em-post-label">Photos <span id="pa-photo-count-lbl">(0 / 5 added — first photo is the main image)</span></label>
        <div class="em-photo-zone" id="pa-dropzone" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="_paDrop(event)">
          <input type="file" accept="image/*" multiple id="pa-photos" onchange="_paAddPhotos(this.files);this.value=''">
          <div class="em-photo-zone-txt">
            <strong>📷 Tap to add photos</strong><br>
            <span style="font-size:11px;color:var(--muted)">Select multiple from gallery, or add one at a time</span>
          </div>
        </div>
        <div class="em-photo-previews" id="pa-previews"></div>
        <button type="button" class="em-add-more-photos-btn" id="pa-add-more-btn" onclick="document.getElementById('pa-photos').click()" style="display:none">+ Add More Photos</button>
      </div>

      <div id="pa-error" class="em-post-error" style="display:none;"></div>

      <button type="submit" class="em-post-submit">Post Ad Now</button>
      <button type="button" class="em-post-cancel-btn" onclick="_paDiscardDraft()">Discard &amp; Cancel</button>
    </form>`;

  _openModal();
  _paRestoreDraft();
  _paStartAutosave();
}

const _PA_DRAFT_KEY = 'em_ad_draft';

function _paSaveDraft() {
  const get = id => document.getElementById(id);
  const stypeBtn = document.querySelector('#pa-stype .em-post-toggle-btn.active');
  const draft = {
    title:      get('pa-title')?.value || '',
    cat:        get('pa-cat')?.value   || '',
    cond:       get('pa-cond')?.value  || '',
    price:      get('pa-price')?.value || '',
    neg:        get('pa-neg')?.checked || false,
    sellerType: stypeBtn?.dataset.val  || 'private',
    name:       get('pa-name')?.value  || '',
    phone:      get('pa-phone')?.value || '',
    email:      get('pa-email')?.value || '',
    city:       get('pa-city')?.value  || '',
    prov:       get('pa-prov')?.value  || '',
    desc:       get('pa-desc')?.value  || '',
    carMake:    get('pa-car-make')?.value || '',
    carModel:   get('pa-car-model')?.value || '',
    carBody:    get('pa-car-body')?.value || '',
    carYear:    get('pa-car-year')?.value || '',
    carKm:      get('pa-car-km')?.value || '',
    carDrive:   get('pa-car-drive')?.value || '',
    carTrans:   get('pa-car-trans')?.value || '',
    carFuel:    get('pa-car-fuel')?.value || '',
    carColour:  get('pa-car-colour')?.value || '',
    carVariant: get('pa-car-variant')?.value || '',
    photos:     [],
    ts:         Date.now(),
  };
  /* Save photos only if total size is under 3 MB */
  const photos = window._paPhotos || [];
  const totalBytes = photos.reduce((s, p) => s + p.length, 0);
  if (totalBytes < 3 * 1024 * 1024) draft.photos = photos;
  try { localStorage.setItem(_PA_DRAFT_KEY, JSON.stringify(draft)); } catch(_) {}
}

function _paRestoreDraft() {
  let draft;
  try { draft = JSON.parse(localStorage.getItem(_PA_DRAFT_KEY) || 'null'); } catch(_) {}
  if (!draft) return;

  /* Only restore drafts less than 7 days old with at least something typed */
  if (!draft.title && !draft.desc && !draft.phone) return;
  if (Date.now() - (draft.ts || 0) > 7 * 24 * 60 * 60 * 1000) {
    localStorage.removeItem(_PA_DRAFT_KEY); return;
  }

  const get = id => document.getElementById(id);
  if (draft.title)  { const el = get('pa-title');  if (el) el.value = draft.title; }
  if (draft.cat)    { const el = get('pa-cat');     if (el) { el.value = draft.cat; window._paCatChange(); } }
  if (draft.cond)   { const el = get('pa-cond');    if (el) el.value = draft.cond; }
  if (draft.price)  { const el = get('pa-price');   if (el) el.value = draft.price; }
  if (draft.neg)    { const el = get('pa-neg');      if (el) el.checked = true; }
  if (draft.name)   { const el = get('pa-name');    if (el) el.value = draft.name; }
  if (draft.phone)  { const el = get('pa-phone');   if (el) el.value = draft.phone; }
  if (draft.email)  { const el = get('pa-email');   if (el) el.value = draft.email; }
  if (draft.city)   { const el = get('pa-city');    if (el) el.value = draft.city; }
  if (draft.prov)   { const el = get('pa-prov');    if (el) el.value = draft.prov; }
  if (draft.desc)   { const el = get('pa-desc');    if (el) el.value = draft.desc; }
  [
    ['pa-car-make', 'carMake'],
    ['pa-car-model', 'carModel'],
    ['pa-car-body', 'carBody'],
    ['pa-car-year', 'carYear'],
    ['pa-car-km', 'carKm'],
    ['pa-car-drive', 'carDrive'],
    ['pa-car-trans', 'carTrans'],
    ['pa-car-fuel', 'carFuel'],
    ['pa-car-colour', 'carColour'],
    ['pa-car-variant', 'carVariant']
  ].forEach(([id, key]) => {
    if (draft[key]) { const el = get(id); if (el) el.value = draft[key]; }
  });
  if (draft.sellerType) {
    document.querySelectorAll('#pa-stype .em-post-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.val === draft.sellerType);
    });
  }
  if (Array.isArray(draft.photos) && draft.photos.length) {
    window._paPhotos = draft.photos;
    _paRenderPreviews();
  }

  /* Show a non-intrusive banner */
  const form = document.getElementById('post-form');
  if (form && !document.getElementById('pa-draft-banner')) {
    const banner = document.createElement('div');
    banner.id = 'pa-draft-banner';
    banner.className = 'pa-draft-banner';
    banner.innerHTML = `📝 <strong>Draft restored</strong> — continue where you left off. <button type="button" onclick="_paDiscardDraft()">Start fresh</button>`;
    form.prepend(banner);
  }
}

function _paStartAutosave() {
  const form = document.getElementById('post-form');
  if (!form) return;
  form.addEventListener('input', _paSaveDraft);
  form.addEventListener('change', _paSaveDraft);
}

function _paDiscardDraft() {
  try { localStorage.removeItem(_PA_DRAFT_KEY); } catch(_) {}
  window._paPhotos = [];
  closeModal();
}

window._paCatChange = function() {
  const cat = document.getElementById('pa-cat').value;
  const extra = document.getElementById('pa-cat-extra');
  const condWrap = document.getElementById('pa-cond-wrap');
  const cond = document.getElementById('pa-cond');

  const SERVICE_TYPES = [
    'Cleaning & Domestic','Plumbing','Electrical','Building & Construction',
    'Painting & Waterproofing','Garden & Landscaping','Security & CCTV',
    'Transport & Delivery','IT & Tech Support','Tutoring & Education',
    'Beauty & Wellness','Photography & Videography','Event Planning & Catering',
    'Automotive Repairs','Tailoring & Alterations','Legal & Financial',
    'Pest Control','Air Conditioning & Appliances','Other'
  ];
  const JOB_TYPES = ['Full-time','Part-time','Contract','Freelance / Gig','Internship','Learnership'];
  const PROP_TYPES = ['House','Apartment / Flat','Room','Townhouse','Commercial / Office','Land / Plot','Farm'];
  const CAR_BODY_TYPES = ['Hatchback','Sedan','SUV','Bakkie','Single Cab','Double Cab','Coupe','Convertible','Minibus','Panel Van','Truck','Motorcycle','Other'];
  const CAR_DRIVE_TYPES = ['4x2','4x4','AWD','FWD','RWD','Other'];
  const CAR_TRANSMISSIONS = ['Manual','Automatic','Semi-Automatic','CVT'];
  const CAR_FUEL_TYPES = ['Petrol','Diesel','Hybrid','Electric','LPG','Other'];

  extra.style.display = 'none';
  extra.innerHTML = '';
  condWrap.style.display = '';

  if (cat === 'serv') {
    condWrap.style.display = 'none';
    cond.value = 'N/A';
    extra.style.display = '';
    extra.innerHTML = `
      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-serv-type">Service Type <span>(required)</span></label>
          <select class="em-post-select" id="pa-serv-type">
            <option value="">— What service do you offer? —</option>
            ${SERVICE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-serv-avail">Availability</label>
          <select class="em-post-select" id="pa-serv-avail">
            <option value="Weekdays">Weekdays</option>
            <option value="Weekends">Weekends</option>
            <option value="Mon–Sat">Mon–Sat</option>
            <option value="7 Days a Week" selected>7 Days a Week</option>
            <option value="By Appointment">By Appointment</option>
          </select>
        </div>
      </div>`;
    document.getElementById('pa-title').placeholder = 'e.g. Professional Plumbing – Fast & Reliable';
  } else if (cat === 'jobs') {
    condWrap.style.display = 'none';
    cond.value = 'N/A';
    extra.style.display = '';
    extra.innerHTML = `
      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-job-type">Job Type <span>(required)</span></label>
          <select class="em-post-select" id="pa-job-type">
            <option value="">— Select type —</option>
            ${JOB_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-job-exp">Experience Required</label>
          <select class="em-post-select" id="pa-job-exp">
            <option value="No experience">No experience needed</option>
            <option value="1–2 years" selected>1–2 years</option>
            <option value="3–5 years">3–5 years</option>
            <option value="5+ years">5+ years</option>
          </select>
        </div>
      </div>`;
    document.getElementById('pa-title').placeholder = 'e.g. Seeking Experienced Electrician – Pretoria';
  } else if (cat === 'prop') {
    condWrap.style.display = 'none';
    cond.value = 'N/A';
    extra.style.display = '';
    extra.innerHTML = `
      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-prop-type">Property Type <span>(required)</span></label>
          <select class="em-post-select" id="pa-prop-type">
            <option value="">— Select type —</option>
            ${PROP_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-prop-listing">Listing Type</label>
          <select class="em-post-select" id="pa-prop-listing">
            <option value="For Sale">For Sale</option>
            <option value="To Rent">To Rent</option>
          </select>
        </div>
      </div>`;
    document.getElementById('pa-title').placeholder = 'e.g. 3-Bedroom House For Sale – Sandton';
  } else if (cat === 'cars') {
    extra.style.display = '';
    extra.innerHTML = `
      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-make">Make / Brand <span>(required)</span></label>
          <input class="em-post-input" id="pa-car-make" type="text" placeholder="e.g. Toyota" maxlength="40">
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-model">Model <span>(required)</span></label>
          <input class="em-post-input" id="pa-car-model" type="text" placeholder="e.g. Hilux" maxlength="50">
        </div>
      </div>
      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-body">Body Type</label>
          <select class="em-post-select" id="pa-car-body">
            <option value="">— Select body type —</option>
            ${CAR_BODY_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-year">Year</label>
          <input class="em-post-input" id="pa-car-year" type="number" placeholder="e.g. 2019" min="1970" max="2026">
        </div>
      </div>
      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-km">Kilometres</label>
          <input class="em-post-input" id="pa-car-km" type="number" placeholder="e.g. 123000" min="0" max="2000000">
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-drive">Drive Type</label>
          <select class="em-post-select" id="pa-car-drive">
            <option value="">— Select drive type —</option>
            ${CAR_DRIVE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-trans">Transmission</label>
          <select class="em-post-select" id="pa-car-trans">
            <option value="">— Select transmission —</option>
            ${CAR_TRANSMISSIONS.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-fuel">Fuel Type</label>
          <select class="em-post-select" id="pa-car-fuel">
            <option value="">— Select fuel type —</option>
            ${CAR_FUEL_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="em-post-row">
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-colour">Colour</label>
          <input class="em-post-input" id="pa-car-colour" type="text" placeholder="e.g. Silver" maxlength="30">
        </div>
        <div class="em-post-field">
          <label class="em-post-label" for="pa-car-variant">Variant / Engine</label>
          <input class="em-post-input" id="pa-car-variant" type="text" placeholder="e.g. 2.8 GD-6" maxlength="50">
        </div>
      </div>`;
    document.getElementById('pa-title').placeholder = 'e.g. Toyota Hilux 2.8 GD-6 4×4 – Manual';
  } else {
    document.getElementById('pa-title').placeholder = 'e.g. iPhone 14 Pro 256GB – Space Black';
  }
};

window._paSetStype = function(btn) {
  document.querySelectorAll('#pa-stype .em-post-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window._paAddPhotos = function(files) {
  const remaining = 5 - window._paPhotos.length;
  Array.from(files).slice(0, remaining).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      /* Compress to max 1200px and JPEG 82% — keeps mobile photos under 300 KB */
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        window._paPhotos.push(canvas.toDataURL('image/jpeg', 0.82));
        _paRenderPreviews();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

window._paDrop = function(e) {
  e.preventDefault();
  document.getElementById('pa-dropzone').classList.remove('drag');
  _paAddPhotos(e.dataTransfer.files);
};

window._paRemovePhoto = function(idx) {
  window._paPhotos.splice(idx, 1);
  _paRenderPreviews();
};

function _paRenderPreviews() {
  const container = document.getElementById('pa-previews');
  if (!container) return;
  const count = window._paPhotos.length;
  container.innerHTML = window._paPhotos.map((url, i) =>
    `<div class="em-photo-thumb-wrap">
      <img class="em-photo-thumb" src="${url}" alt="Photo ${i+1}">
      ${i === 0 ? '<span class="em-photo-main-lbl">Main</span>' : ''}
      <button type="button" class="em-photo-rm" onclick="_paRemovePhoto(${i})" title="Remove">&#x2715;</button>
    </div>`
  ).join('');
  const zone = document.getElementById('pa-dropzone');
  const addMoreBtn = document.getElementById('pa-add-more-btn');
  const countLbl = document.getElementById('pa-photo-count-lbl');
  const full = count >= 5;
  if (zone) zone.style.display = full ? 'none' : '';
  if (addMoreBtn) addMoreBtn.style.display = (count > 0 && !full) ? '' : 'none';
  if (countLbl) countLbl.textContent = `(${count} / 5 added — first photo is the main image)`;
}

function submitPostAd(e) {
  e.preventDefault();
  /* Prevent double-submission even across page reloads */
  const lastSubmit = Number(sessionStorage.getItem('em_last_submit') || 0);
  if (Date.now() - lastSubmit < 15000) return;
  sessionStorage.setItem('em_last_submit', Date.now());

  const title = (document.getElementById('pa-title').value || '').trim();
  const desc  = (document.getElementById('pa-desc').value  || '').trim();
  const name  = (document.getElementById('pa-name').value  || '').trim();
  const phone = (document.getElementById('pa-phone').value || '').trim();
  const email = (document.getElementById('pa-email').value || '').trim();
  const city  = (document.getElementById('pa-city')?.value || '').trim();
  const prov  = (document.getElementById('pa-prov')?.value || '').trim();
  const loc   = city && prov ? city + ', ' + prov : city || prov || (document.getElementById('pa-loc')?.value || '').trim();
  const cat   = document.getElementById('pa-cat').value;
  const price = Math.max(0, Number(document.getElementById('pa-price').value) || 0);
  const neg   = document.getElementById('pa-neg').checked;
  const stypeBtn = document.querySelector('#pa-stype .em-post-toggle-btn.active');
  const sellerType = stypeBtn ? stypeBtn.dataset.val : 'private';

  /* Category-specific extra fields */
  const servType  = document.getElementById('pa-serv-type')  ? document.getElementById('pa-serv-type').value  : '';
  const servAvail = document.getElementById('pa-serv-avail') ? document.getElementById('pa-serv-avail').value : '';
  const jobType   = document.getElementById('pa-job-type')   ? document.getElementById('pa-job-type').value   : '';
  const jobExp    = document.getElementById('pa-job-exp')    ? document.getElementById('pa-job-exp').value    : '';
  const propType  = document.getElementById('pa-prop-type')  ? document.getElementById('pa-prop-type').value  : '';
  const propList  = document.getElementById('pa-prop-listing')? document.getElementById('pa-prop-listing').value: '';
  const carMake   = document.getElementById('pa-car-make')   ? document.getElementById('pa-car-make').value.trim() : '';
  const carModel  = document.getElementById('pa-car-model')  ? document.getElementById('pa-car-model').value.trim() : '';
  const carBody   = document.getElementById('pa-car-body')   ? document.getElementById('pa-car-body').value : '';
  const carYear   = document.getElementById('pa-car-year')   ? document.getElementById('pa-car-year').value   : '';
  const carKm     = document.getElementById('pa-car-km')     ? document.getElementById('pa-car-km').value     : '';
  const carDrive  = document.getElementById('pa-car-drive')  ? document.getElementById('pa-car-drive').value  : '';
  const carTrans  = document.getElementById('pa-car-trans')  ? document.getElementById('pa-car-trans').value  : '';
  const carFuel   = document.getElementById('pa-car-fuel')   ? document.getElementById('pa-car-fuel').value   : '';
  const carColour = document.getElementById('pa-car-colour') ? document.getElementById('pa-car-colour').value.trim() : '';
  const carVariant= document.getElementById('pa-car-variant')? document.getElementById('pa-car-variant').value.trim() : '';

  /* Build the cond chip from the extra field when applicable */
  let cond = document.getElementById('pa-cond').value;
  if (cat === 'serv' && servType)  cond = servType;
  if (cat === 'jobs' && jobType)   cond = jobType;
  if (cat === 'prop' && propType)  cond = propList ? propType + ' – ' + propList : propType;

  /* Enrich description with extra structured info */
  let enrichedDesc = desc;
  if (cat === 'serv' && servAvail)  enrichedDesc = 'Availability: ' + servAvail + '\n\n' + desc;
  if (cat === 'jobs' && jobExp)     enrichedDesc = 'Experience required: ' + jobExp + '\n\n' + desc;
  const vehicleDetails = cat === 'cars' ? {
    make: carMake,
    model: carModel,
    bodyType: carBody,
    year: carYear,
    kilometres: carKm,
    driveType: carDrive,
    transmission: carTrans,
    fuelType: carFuel,
    colour: carColour,
    variant: carVariant
  } : null;
  const vehicleLines = vehicleDetails ? [
    ['Make', vehicleDetails.make],
    ['Model', vehicleDetails.model],
    ['Body Type', vehicleDetails.bodyType],
    ['Year', vehicleDetails.year],
    ['Kilometres', vehicleDetails.kilometres],
    ['Drive Type', vehicleDetails.driveType],
    ['Transmission', vehicleDetails.transmission],
    ['Fuel Type', vehicleDetails.fuelType],
    ['Colour', vehicleDetails.colour],
    ['Variant', vehicleDetails.variant]
  ].filter(([, value]) => value).map(([label, value]) => label + ': ' + value) : [];
  if (cat === 'cars' && vehicleLines.length) enrichedDesc = 'Vehicle Details:\n' + vehicleLines.join('\n') + '\n\n' + desc;

  const errEl = document.getElementById('pa-error');
  const errors = [];
  if (!title)              errors.push('Ad title is required.');
  if (!cat)                errors.push('Please select a category.');
  if (cat === 'serv' && !servType) errors.push('Please select a service type.');
  if (cat === 'jobs' && !jobType)  errors.push('Please select a job type.');
  if (cat === 'prop' && !propType) errors.push('Please select a property type.');
  if (cat === 'cars' && !carMake)  errors.push('Please enter the vehicle make.');
  if (cat === 'cars' && !carModel) errors.push('Please enter the vehicle model.');
  if (!name)               errors.push('Your name is required.');
  if (!phone)              errors.push('Phone number is required.');
  if (!email || !email.includes('@')) errors.push('A valid contact email is required.');
  if (!city)               errors.push('Please enter your city or town.');
  if (!prov)               errors.push('Please select a province.');
  if (!loc)                errors.push('Location is required.');
  if (!desc)               errors.push('Description is required.');

  if (errors.length) {
    errEl.textContent = errors[0];
    errEl.style.display = '';
    return;
  }
  errEl.style.display = 'none';

  const sess = _getSession();

  /* Prevent duplicate: if this user already has an active ad with the same title, block it */
  const titleLow = title.trim().toLowerCase();
  const existingDup = LISTINGS.find(l =>
    l.userId && sess && String(l.userId) === String(sess.userId) &&
    (l.title || '').trim().toLowerCase() === titleLow
  );
  if (existingDup) {
    errEl.textContent = 'You already have an active ad with this title. Edit or delete it first.';
    errEl.style.display = '';
    return;
  }

  const listing = {
    id: Date.now(),
    title,
    price,
    neg,
    loc,
    art: null,
    badge: null,
    cond,
    cat,
    postedAt: Date.now(),
    desc: enrichedDesc,
    seller: name,
    sellerType,
    verified: !!_sbUser?.user_metadata?.verified,
    photos: [...(window._paPhotos || [])],
    vehicleDetails,
    isUserAd: true,
    userId: sess ? sess.userId : null,
    phone,
    contactEmail: email,
  };

  LISTINGS.unshift(listing);
  _saveUserAds();
  renderAll('all');
  if (window.emTrack) emTrack('ad_post', { cat: listing.cat });

  /* Clear saved draft on successful post */
  try { localStorage.removeItem(_PA_DRAFT_KEY); } catch(_) {}

  /* Show confirmation immediately; upload to Supabase in background */
  const photoCopy = [...(window._paPhotos || [])];
  window._paPhotos = [];
  showAdPostedConfirm(listing);
  if (window.emStoreAd) {
    emStoreAd({ ...listing, photos: photoCopy }).then(result => {
      if (result && result.ok) {
        _saveUserAds();
      } else {
        const errMsg = result?.error?.message || result?.error?.status || 'Upload failed — check console';
        console.error('[EM] Ad upload failed:', errMsg);
        /* Always show toast (visible even after modal is closed) */
        _showToast('⚠️ Ad saved on device only — server upload failed. Check console for details.', 12000);
        /* Also update modal if it's still open */
        if (modal.classList.contains('open') && modalBox) {
          modalBox.innerHTML = `
            <div class="em-confirm">
              <div style="font-size:48px;margin-bottom:8px">⚠️</div>
              <div class="em-confirm-title" style="color:#e53935">Upload Failed</div>
              <div class="em-confirm-sub">Your ad <strong>"${listing.title}"</strong> saved on this device but could NOT be uploaded to the server — other people cannot see it yet.</div>
              <div style="margin:12px 0;padding:10px;background:#fff3f3;border-radius:8px;font-size:13px;font-family:monospace;color:#c62828;text-align:left;word-break:break-all">${errMsg}</div>
              <div class="em-confirm-sub" style="font-size:13px">Check your internet connection and try posting again. If this keeps happening, screenshot this error and contact support.</div>
              <button class="em-confirm-close" onclick="closeModal()">OK</button>
            </div>`;
        }
      }
    }).catch(err => {
      console.error('[EM] storeAd threw:', err);
      _showToast('⚠️ Ad saved on device only — server upload error. Check console.', 12000);
      if (modal.classList.contains('open') && modalBox) {
        modalBox.innerHTML = `
          <div class="em-confirm">
            <div style="font-size:48px;margin-bottom:8px">⚠️</div>
            <div class="em-confirm-title" style="color:#e53935">Upload Error</div>
            <div class="em-confirm-sub">Your ad was saved on this device but could not reach the server.</div>
            <div style="margin:12px 0;padding:10px;background:#fff3f3;border-radius:8px;font-size:13px;font-family:monospace;color:#c62828;word-break:break-all">${String(err)}</div>
            <button class="em-confirm-close" onclick="closeModal()">OK</button>
          </div>`;
      }
    });
  }
}

function _showToast(msg, durationMs) {
  const t = document.getElementById('em-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), durationMs || 8000);
}

function showAdPostedConfirm(listing) {
  const title = typeof listing === 'string' ? listing : (listing?.title || 'Your ad');
  const safeTitle = String(title).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const id = typeof listing === 'object' && listing ? listing.id : '';
  const adUrl = id ? 'https://www.everythingmarket.co.za/ad/' + id : 'https://www.everythingmarket.co.za/';
  const shareText = encodeURIComponent('I just posted this on Everything Market:\n\n' + title + '\n\n' + adUrl);
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--leaf)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <div class="em-confirm-title">Ad Posted!</div>
      <div class="em-confirm-sub">Your ad <strong>"${safeTitle}"</strong> is now live and visible to buyers on Everything Market.</div>
      ${id ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0 6px;width:100%;">
        <a href="https://wa.me/?text=${shareText}" target="_blank" onclick="if(window.emTrack)emTrack('listing_share',{channel:'whatsapp',ad_id:'${id}'})" style="background:#25D366;color:#fff;text-decoration:none;border-radius:10px;padding:12px 10px;font-size:13px;font-weight:800;text-align:center;">Share on WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adUrl)}" target="_blank" onclick="if(window.emTrack)emTrack('listing_share',{channel:'facebook',ad_id:'${id}'})" style="background:#1877F2;color:#fff;text-decoration:none;border-radius:10px;padding:12px 10px;font-size:13px;font-weight:800;text-align:center;">Share on Facebook</a>
        <button onclick="navigator.clipboard.writeText('${adUrl}').then(()=>{toast('Listing link copied!');if(window.emTrack)emTrack('listing_share',{channel:'copy',ad_id:'${id}'});})" style="grid-column:1/-1;background:var(--surf3);border:none;border-radius:10px;padding:12px 10px;cursor:pointer;font-size:13px;font-weight:800;color:var(--ink);">Copy Listing Link</button>
      </div>
      <div class="em-confirm-sub" style="font-size:12.5px;">Sharing this listing link helps Google and real buyers discover it faster.</div>` : ''}
      <button class="em-confirm-close" onclick="closeModal()">Done</button>
    </div>`;
}

/* ── Contact / Buy Now modal ── */
function openSponsoredAd(s) {
  const tagCatMap = { 'Electronics':'electronics','Cars & Bakkies':'cars','Property':'property','Furniture':'furniture','Jobs':'jobs','Fashion':'fashion','Pets':'pets','Garden':'garden','Sport':'sport' };
  openBuyNow({
    id: 'spons_' + s.title.replace(/\W/g,''),
    title: s.title,
    price: 0,
    _priceStr: s.price,
    cat: tagCatMap[s.tag] || 'all',
    loc: s.loc,
    cond: 'N/A',
    seller: 'Sponsored Seller',
    sellerType: 'dealer',
    verified: true,
    desc: 'Contact the seller for more details about this item.',
    postedAt: Date.now(),
    art: 'tools',
    neg: false,
    photos: [s.img],
    badge: 'SPONSORED',
    phone: '',
  });
}

function emGalleryGo(idx) {
  const track = document.getElementById('em-gallery-track');
  const dots  = document.querySelectorAll('.em-gallery-dot');
  if (!track) return;
  const count = track.children.length;
  window._emGalleryIdx = (idx + count) % count;
  track.style.transform = `translateX(-${window._emGalleryIdx * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === window._emGalleryIdx));
}
function emGalleryMove(dir) { emGalleryGo((window._emGalleryIdx || 0) + dir); }

let _lbPhotos = [];
let _lbIdx = 0;

function emLightboxOpen(src, allPhotos, startIdx) {
  const lb  = document.getElementById('em-lightbox');
  const img = document.getElementById('em-lightbox-img');
  if (!lb || !img || !src) return;
  _lbPhotos = Array.isArray(allPhotos) && allPhotos.length > 1 ? allPhotos : [src];
  _lbIdx    = (startIdx != null) ? startIdx : _lbPhotos.indexOf(src);
  if (_lbIdx < 0) _lbIdx = 0;
  img.src = _lbPhotos[_lbIdx];
  lb.classList.add('open');
  _lbUpdateNav();
  _navPush('lightbox');
  document.addEventListener('keydown', _lbKey);
}
function emLightboxClose() {
  const lb = document.getElementById('em-lightbox');
  if (lb) lb.classList.remove('open');
  document.removeEventListener('keydown', _lbKey);
  if (window._lbResetZoom) window._lbResetZoom();
  _navBack();
}
function _lbHandleClose() {
  if (window._lbZoomed) { window._lbResetZoom(); }
  else { emLightboxClose(); }
}
function _lbGo(idx) {
  _lbIdx = (idx + _lbPhotos.length) % _lbPhotos.length;
  const img = document.getElementById('em-lightbox-img');
  if (img) img.src = _lbPhotos[_lbIdx];
  if (window._lbResetZoom) window._lbResetZoom();
  _lbUpdateNav();
}
function _lbUpdateNav() {
  const counter = document.getElementById('em-lightbox-counter');
  const prevBtn = document.getElementById('em-lightbox-prev');
  const nextBtn = document.getElementById('em-lightbox-next');
  const multi = _lbPhotos.length > 1;
  if (counter) { counter.textContent = multi ? (_lbIdx + 1) + ' / ' + _lbPhotos.length : ''; counter.style.display = multi ? '' : 'none'; }
  if (prevBtn) prevBtn.style.display = multi ? '' : 'none';
  if (nextBtn) nextBtn.style.display = multi ? '' : 'none';
}
function _lbKey(e) {
  if (e.key === 'Escape') emLightboxClose();
  if (e.key === 'ArrowRight') _lbGo(_lbIdx + 1);
  if (e.key === 'ArrowLeft')  _lbGo(_lbIdx - 1);
}

/* Swipe gestures and double-tap zoom inside lightbox */
(function() {
  let lbTouchX = 0, lbTouchY = 0;
  let _lbZoomed = false;
  let _lbTransX = 0, _lbTransY = 0;
  let _lbLastTap = 0;
  let _lbDragStartX = 0, _lbDragStartY = 0;
  let _lbDragging = false;

  function _lbResetZoom() {
    const img = document.getElementById('em-lightbox-img');
    if (img) { img.style.transform = ''; img.style.transition = ''; }
    _lbZoomed = false; _lbTransX = 0; _lbTransY = 0;
  }
  window._lbResetZoom = _lbResetZoom;
  Object.defineProperty(window, '_lbZoomed', { get: () => _lbZoomed });

  document.addEventListener('DOMContentLoaded', () => {
    const lb = document.getElementById('em-lightbox');
    const img = document.getElementById('em-lightbox-img');
    if (!lb) return;

    lb.addEventListener('touchstart', e => {
      lbTouchX = e.touches[0].clientX;
      lbTouchY = e.touches[0].clientY;
      if (_lbZoomed && e.touches.length === 1) {
        _lbDragging = true;
        _lbDragStartX = e.touches[0].clientX - _lbTransX;
        _lbDragStartY = e.touches[0].clientY - _lbTransY;
      }
    }, { passive: true });

    lb.addEventListener('touchmove', e => {
      if (!_lbZoomed || !_lbDragging || e.touches.length !== 1) return;
      e.preventDefault();
      _lbTransX = e.touches[0].clientX - _lbDragStartX;
      _lbTransY = e.touches[0].clientY - _lbDragStartY;
      if (img) img.style.transform = `scale(2.5) translate(${_lbTransX / 2.5}px, ${_lbTransY / 2.5}px)`;
    }, { passive: false });

    lb.addEventListener('touchend', e => {
      _lbDragging = false;
      if (!lb.classList.contains('open')) return;
      const dx = e.changedTouches[0].clientX - lbTouchX;
      const dy = e.changedTouches[0].clientY - lbTouchY;

      // Double-tap detection
      const now = Date.now();
      const gap = now - _lbLastTap;
      _lbLastTap = now;
      if (gap < 300 && gap > 0 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
        e.preventDefault();
        if (_lbZoomed) {
          img.style.transition = 'transform 0.2s ease';
          _lbResetZoom();
          setTimeout(() => { if (img) img.style.transition = ''; }, 220);
        } else {
          _lbZoomed = true;
          _lbTransX = 0; _lbTransY = 0;
          if (img) {
            img.style.transition = 'transform 0.2s ease';
            img.style.transform = 'scale(2.5)';
            setTimeout(() => { img.style.transition = ''; }, 220);
          }
        }
        return;
      }

      // Swipe to navigate (only when not zoomed)
      if (_lbZoomed) return;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) _lbGo(_lbIdx + 1);
      else        _lbGo(_lbIdx - 1);
    }, { passive: false });
  });
})();

function _emVehicleInfo(listing) {
  const details = {
    make: '', model: '', bodyType: '', year: '', kilometres: '',
    driveType: '', transmission: '', fuelType: '', colour: '', variant: ''
  };
  const map = {
    'make': 'make',
    'model': 'model',
    'body type': 'bodyType',
    'year': 'year',
    'kilometres': 'kilometres',
    'kilometers': 'kilometres',
    'drive type': 'driveType',
    'transmission': 'transmission',
    'fuel type': 'fuelType',
    'colour': 'colour',
    'color': 'colour',
    'variant': 'variant'
  };
  Object.assign(details, listing.vehicleDetails || {});

  let cleanDesc = String(listing.desc || '');
  const match = cleanDesc.match(/^Vehicle Details:\s*\n([\s\S]*?)(?:\n{2,}([\s\S]*)|$)/i);
  if (match) {
    match[1].split('\n').forEach(line => {
      const parts = line.split(':');
      const label = (parts.shift() || '').trim().toLowerCase();
      const value = parts.join(':').trim();
      const key = map[label];
      if (key && value) details[key] = value;
    });
    cleanDesc = (match[2] || '').trim();
  }
  return { details, cleanDesc };
}

function _emFmtVehicleKm(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return raw;
  return Number(digits).toLocaleString('en-ZA');
}

function openBuyNow(listing) {
  if (!listing) return;
  if (window.emTrack) emTrack('ad_view', { cat: listing.cat, ad_id: String(listing.id), ad_title: listing.title.slice(0,80) });
  const alreadyOpen = modal && modal.classList.contains('open');
  const currentState = history.state || {};
  const returnUrl = alreadyOpen && currentState.returnUrl
    ? currentState.returnUrl
    : (location.pathname.startsWith('/ad/') ? '/' : (location.pathname + location.search + location.hash));
  const returnScrollY = alreadyOpen && Number.isFinite(currentState.returnScrollY)
    ? currentState.returnScrollY
    : window.scrollY;
  document.title = listing.title + ' – Everything Market';
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc  = document.querySelector('meta[property="og:description"]');
  if (ogTitle) ogTitle.content = listing.title + ' | Everything Market';
  if (ogDesc)  ogDesc.content  = (listing.desc || listing.title).slice(0, 160);
  const _sess = _getSession();
  const isOwner = _sess && listing.userId && String(listing.userId) === String(_sess.userId);
  const sd = BB_SELLER_DATA[listing.id] || { delivery: false };
  const price = listing._priceStr || (listing.price === 0 ? 'Contact for Price' : 'R ' + listing.price.toLocaleString('en-ZA'));
  const initials = listing.seller.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rawPhone = (listing.phone || '').replace(/\D/g, '');
  const phone = rawPhone ? (rawPhone.startsWith('27') ? rawPhone : rawPhone.startsWith('0') ? '27' + rawPhone.slice(1) : '27' + rawPhone) : '';
  const adUrl = 'https://www.everythingmarket.co.za/ad/' + listing.id;
  const shareText = 'Check out this listing on Everything Market!\n\n' + listing.title + '\n' + price + '\n' + _fmtLoc(listing.loc) + '\n\n' + adUrl;
  const shareUrl = encodeURIComponent(adUrl);
  const encodedShareText = encodeURIComponent(shareText);
  const vehicleInfo = _emVehicleInfo(listing);
  const detailRows = [
    ['Location', _fmtLoc(listing.loc), true],
    ['For Sale By', listing.sellerType === 'dealer' ? 'Dealership' : 'Owner', false],
    ['Make', vehicleInfo.details.make, true],
    ['Model', vehicleInfo.details.model, true],
    ['Body Type', vehicleInfo.details.bodyType, false],
    ['Year', vehicleInfo.details.year, false],
    ['Kilometres', _emFmtVehicleKm(vehicleInfo.details.kilometres), false],
    ['Drive Type', vehicleInfo.details.driveType, false],
    ['Transmission', vehicleInfo.details.transmission, false],
    ['Fuel Type', vehicleInfo.details.fuelType, false],
    ['Colour', vehicleInfo.details.colour, false],
    ['Variant', vehicleInfo.details.variant, false]
  ].filter(([, value]) => value);
  const vehicleDetailsHTML = listing.cat === 'cars' && detailRows.length ? `
    <div class="em-vehicle-details">
      <div class="em-vehicle-details-title">Vehicle Details</div>
      ${detailRows.map(([label, value, accent]) => `
        <div class="em-vehicle-row">
          <span>${label}:</span>
          <strong class="${accent ? 'accent' : ''}">${_spEsc(value)}</strong>
        </div>`).join('')}
    </div>` : '';

  const related = LISTINGS.filter(l => l.cat === listing.cat && String(l.id) !== String(listing.id)).slice(0, 4);
  const relatedHTML = related.length ? `
    <div class="em-related">
      <div class="em-related-hdr">Similar Ads</div>
      <div class="em-related-list">
        ${related.map(r => `
          <div class="em-related-card" onclick="openBuyNow(LISTINGS.find(x=>String(x.id)==='${r.id}'))">
            <div class="em-related-img" id="rel-img-${r.id}"></div>
            <div class="em-related-body">
              <div class="em-related-title">${r.title}</div>
              <div class="em-related-price">${r.price === 0 ? 'Contact for Price' : 'R ' + r.price.toLocaleString('en-ZA')}</div>
              <div class="em-related-loc">${_fmtLoc(r.loc)}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : '';

  const photos = Array.isArray(listing.photos) ? listing.photos.filter(Boolean) : [];
  window._emCurrentPhotos = photos;
  const galleryHTML = photos.length > 1
    ? `<div class="em-gallery" id="em-gallery">
        <div class="em-gallery-track" id="em-gallery-track">
          ${photos.map((p, i) => `<div class="em-gallery-slide"><img src="${p}" alt="Photo ${i+1}" onclick="emLightboxOpen(window._emCurrentPhotos[${i}],window._emCurrentPhotos,${i})" onerror="this.style.display='none'"></div>`).join('')}
        </div>
        <button class="em-gallery-arrow em-gallery-prev" onclick="emGalleryMove(-1)">&#8249;</button>
        <button class="em-gallery-arrow em-gallery-next" onclick="emGalleryMove(1)">&#8250;</button>
        <div class="em-gallery-dots">
          ${photos.map((_, i) => `<span class="em-gallery-dot${i===0?' active':''}" onclick="emGalleryGo(${i})"></span>`).join('')}
        </div>
      </div>`
    : `<div class="em-ad-photo" id="modal-img"></div>`;

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Ad Details</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    ${galleryHTML}
    <div class="em-ad-detail-body">
      <div class="em-ad-detail-price">${price}</div>
      <div class="em-ad-detail-title">${listing.title}</div>
      <div class="em-ad-detail-meta">
        ${listing.cond !== 'N/A' ? `<span class="gt-chip">${listing.cond}</span>` : ''}
        <span class="gt-chip">${_fmtLoc(listing.loc)}</span>
        <span class="gt-chip">${fmtTime(listing.postedAt)}</span>
        <span class="gt-chip em-view-count" id="modal-view-count"></span>
      </div>
      ${vehicleDetailsHTML}
      ${vehicleInfo.cleanDesc ? `<div class="em-ad-detail-desc">${_spEsc(vehicleInfo.cleanDesc)}</div>` : ''}
      <div class="em-modal-seller" style="margin:0 0 4px;">
        <div class="em-modal-avatar">${initials}</div>
        <div style="flex:1;min-width:0;">
          <div class="em-modal-seller-name">${listing.seller}${listing.verified ? `<span class="em-modal-verified">${ICO.check}Verified</span>` : '<span class="em-modal-unverified">Unverified</span>'}</div>
          <div class="em-modal-seller-meta">${listing.sellerType === 'dealer' ? 'Dealership' : 'Private Seller'} · ${sd.delivery ? 'Delivery available' : 'Collection only'}</div>
        </div>
      </div>
      <button class="em-seller-profile-btn" onclick="openSellerProfile('${listing.seller.replace(/'/g,"\\'")}','${listing.userId||''}','${listing.sellerType}',${!!listing.verified},'${(listing.contactEmail||'').replace(/'/g,"\\'")}')">
        View Seller Profile &amp; All Listings &rarr;
      </button>
    </div>
    <div class="em-modal-divider"></div>
    <div style="padding:0 20px 4px;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Contact Seller</div>
    <div class="em-contact-btns">
      <button class="em-contact-btn chat" onclick="showMessageScreen('${listing.id}','${listing.title.replace(/'/g,"\\'").replace(/"/g,'&quot;')}','${(listing.contactEmail||'').replace(/'/g,"\\'")}','${listing.seller.replace(/'/g,"\\'")}')">
        <div class="em-contact-btn-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
        <div><span>Chat on Everything Market</span><span class="em-contact-btn-sub">Messages stay on-site for safer monitoring</span></div>
      </button>
    </div>
    <div style="padding:10px 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <button onclick="navigator.clipboard.writeText('${adUrl}').then(()=>toast('Link copied!'))" style="background:var(--surf3);border:none;border-radius:10px;padding:11px 14px;cursor:pointer;font-size:13px;font-weight:600;color:var(--ink);">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copy Link
      </button>
      <button onclick="closeModal();setTimeout(openPostAdModal,250)" style="background:var(--forest);color:#fff;border:none;border-radius:10px;padding:11px 14px;cursor:pointer;font-size:13px;font-weight:700;">
        Post Your Free Ad
      </button>
    </div>
    <div style="text-align:center;padding-bottom:12px;">
      <button onclick="openReportModal('${String(listing.id)}','${listing.title.replace(/'/g,"\\'")}')" style="font-size:11px;color:#c62828;background:none;border:none;cursor:pointer;text-decoration:underline;font-family:inherit;font-weight:600;">
        ⚑ Report this ad
      </button>
    </div>
    ${isOwner ? `
    <div style="padding:16px 20px 0;">
      ${listing.sponsored
        ? `<div style="text-align:center;font-size:13px;font-weight:700;color:#1565C0;background:#E3F0FF;padding:10px;border-radius:10px;">&#x26A1; This ad is currently Sponsored</div>`
        : `<button onclick="closeModal();setTimeout(()=>openSponsorModal('${listing.id}'),350)" style="width:100%;padding:13px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:.02em;">&#x26A1; Boost This Ad</button>`}
    </div>` : ''}
    ${relatedHTML}`;

  window._emGalleryIdx = 0;
  modalBox.scrollTop = 0;
  _openModal({
    layer: 'ad',
    url: '/ad/' + listing.id,
    state: { adId: String(listing.id), returnUrl, returnScrollY },
  });
  setTimeout(async () => {
    const imgEl = document.getElementById('modal-img');
    if (imgEl) _renderImg(imgEl, listing, true);
    related.forEach(r => {
      const relEl = document.getElementById(`rel-img-${r.id}`);
      if (relEl) _renderImg(relEl, r);
    });
    if (window.emCountViews && !String(listing.id).startsWith('spons_')) {
      const views = await window.emCountViews(listing.id);
      const vcEl = document.getElementById('modal-view-count');
      if (vcEl) vcEl.textContent = '👁 ' + (views + 1) + ' views';
    }
  }, 10);
}

function openSellerProfile(sellerName, userId, sellerType, verified, contactEmail) {
  const sellerAds = LISTINGS.filter(l =>
    (userId && l.userId === userId) || (!userId && l.seller === sellerName)
  ).sort((a, b) => b.postedAt - a.postedAt);

  const initials = sellerName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const oldestTs  = sellerAds.length ? Math.min(...sellerAds.map(l => l.postedAt)) : Date.now();
  const memberSince = new Date(oldestTs).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  const activeCount = sellerAds.length;
  const otherAds = sellerAds.slice(0, 8);

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Seller Profile</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:0 20px 24px;">
      <div class="em-seller-profile-hdr">
        <div class="em-seller-profile-avatar">${initials}</div>
        <div>
          <div class="em-seller-profile-name">${sellerName}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;">
            <span class="stype-badge ${sellerType === 'dealer' ? 'stype-dealer' : 'stype-private'}">${sellerType === 'dealer' ? 'Dealership' : 'Private Seller'}</span>
            <span class="vfy-badge ${verified ? 'vfy-yes' : 'vfy-no'}">${verified ? '✓ Verified' : 'Unverified'}</span>
          </div>
        </div>
      </div>

      <div class="em-seller-verify-box ${verified ? '' : 'em-seller-verify-warn'}">
        ${verified
          ? `<div class="em-seller-verify-title">✓ Verified Seller</div>
             <div class="em-seller-verify-text">This seller has submitted valid South African ID and has been confirmed by Everything Market. You can trade with confidence.</div>`
          : `<div class="em-seller-verify-title" style="color:#F57F17;">⚠ Unverified Seller</div>
             <div class="em-seller-verify-text">This seller has not yet completed identity verification. Always meet in a public place and inspect before paying.</div>`
        }
      </div>

      <div class="em-seller-stats-row">
        <div class="em-seller-stat"><strong>${activeCount}</strong><span>Active Ads</span></div>
        <div class="em-seller-stat"><strong>${memberSince}</strong><span>Member Since</span></div>
        <div class="em-seller-stat"><strong>${sellerType === 'dealer' ? 'Fast' : 'N/A'}</strong><span>Response</span></div>
      </div>

      ${otherAds.length ? `
      <div class="em-related-hdr" style="margin:16px 0 10px;">Ads by ${sellerName} (${activeCount})</div>
      <div class="em-related-list">
        ${otherAds.map(r => `
          <div class="em-related-card" onclick="openBuyNow(LISTINGS.find(x=>String(x.id)==='${String(r.id)}'))">
            <div class="em-related-img" id="sp-img-${r.id}"></div>
            <div class="em-related-body">
              <div class="em-related-title">${r.title}</div>
              <div class="em-related-price">${r.price === 0 ? 'Contact for Price' : 'R ' + r.price.toLocaleString('en-ZA')}</div>
              <div class="em-related-loc">${_fmtLoc(r.loc)}</div>
            </div>
          </div>`).join('')}
      </div>` : '<div style="padding:24px 0;text-align:center;color:var(--muted);font-size:13px;">No other active listings from this seller.</div>'}
    </div>`;
  _openModal();
  setTimeout(() => {
    otherAds.forEach(r => {
      const el = document.getElementById('sp-img-' + r.id);
      if (el) _renderImg(el, r);
    });
  }, 10);
}

function openReportModal(adId, adTitle) {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Report Ad</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-offer-body" style="padding-top:16px;">
      <p style="font-size:12.5px;color:var(--muted);margin-bottom:14px;line-height:1.6;">Help us keep EverythingMarket safe. Reports are reviewed by our team and sent to <strong style="color:var(--ink);">everythingmarket48@gmail.com</strong>.</p>
      <label class="em-offer-label">Ad</label>
      <div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:14px;padding:10px 12px;background:var(--surf);border-radius:8px;">${adTitle}</div>
      <label class="em-offer-label">Reason for report</label>
      <select id="rpt-reason" class="em-post-select" style="margin-bottom:14px;">
        <option value="">Select a reason…</option>
        <option>Suspected scam or fraud</option>
        <option>Prohibited / illegal item</option>
        <option>Misleading or false information</option>
        <option>Offensive content</option>
        <option>Duplicate listing</option>
        <option>Other</option>
      </select>
      <label class="em-offer-label">Additional details <span style="font-weight:400;color:var(--muted)">(optional)</span></label>
      <textarea id="rpt-detail" class="em-offer-textarea" placeholder="Describe the issue…"></textarea>
      <div id="rpt-err" class="em-post-error" style="display:none;margin-bottom:10px;"></div>
      <button class="em-offer-submit" onclick="submitReport('${String(adId).replace(/'/g,"\\'")}','${adTitle.replace(/'/g,"\\'")}')">Submit Report</button>
    </div>`;
  _openModal();
}

function submitReport(adId, adTitle) {
  const reason = document.getElementById('rpt-reason').value;
  const detail = (document.getElementById('rpt-detail').value || '').trim();
  const errEl  = document.getElementById('rpt-err');
  if (!reason) { errEl.textContent = 'Please select a reason.'; errEl.style.display = ''; return; }
  const full = detail ? reason + ' — ' + detail : reason;
  if (window.emReport) emReport(adId, adTitle, full);
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="em-confirm-title">Report Submitted</div>
      <div class="em-confirm-sub">Thank you for helping keep EverythingMarket safe. Our team will review this listing.</div>
      <button class="em-confirm-close" onclick="closeModal()">Done</button>
    </div>`;
}


function showMessageScreen(listingId, adTitle, recipientEmail, sellerName) {
  const sess = _getSession();
  if (!sess) { closeModal(); openSignInModal('Sign in to send a message.'); return; }
  const safeTitle  = (adTitle    || '').replace(/'/g, "\\'");
  const safeEmail  = (recipientEmail || '').replace(/'/g, "\\'");
  const safeSeller = (sellerName  || '').replace(/'/g, "\\'");
  const safeId     = String(listingId);
  const btns = modalBox.querySelector('.em-contact-btns');
  if (!btns) return;
  btns.innerHTML = `
    <div style="padding:4px 0;">
      <textarea id="msg-body" class="em-offer-textarea" style="margin-bottom:12px;">Hi, I'm interested in "${adTitle || 'this item'}". Is it still available?</textarea>
      <div id="msg-err" class="em-post-error" style="display:none;margin-bottom:8px;"></div>
      <button class="em-offer-submit" onclick="submitMessage('${safeId}','${safeTitle}','${safeEmail}','${safeSeller}')">Send Message</button>
    </div>`;
}

async function submitMessage(adId, adTitle, recipientEmail, sellerName) {
  const sess = _getSession();
  if (!sess) return;
  const msgText = (document.getElementById('msg-body')?.value || '').trim();
  const errEl = document.getElementById('msg-err');
  if (!msgText) { if (errEl) { errEl.textContent = 'Please write a message.'; errEl.style.display = ''; } return; }
  if (window.emStoreMessage) {
    await window.emStoreMessage({
      sender_email: sess.email,
      sender_name: sess.name,
      recipient_email: recipientEmail,
      ad_id: adId,
      ad_title: adTitle,
      seller: sellerName,
      message: msgText.slice(0, 1000)
    });
  }
  showSentConfirm('message');
}

async function openInbox() {
  document.getElementById('hdr-user-drop')?.classList.remove('open');
  modalBox.scrollTop = 0;
  const sess = _getSession();
  if (!sess) { openSignInModal(); return; }
  localStorage.setItem('em_inbox_read_' + sess.email, Date.now().toString());
  _setMsgBadge(0);
  clearTimeout(_msgPollTimer);
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Messages</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-myads-body" id="inbox-body">
      <div class="em-loading-state"><div class="em-spinner"></div><p>Loading messages…</p></div>
    </div>`;
  _openModal();

  const data = window.emLoadMessages ? await window.emLoadMessages(sess.email) : { received: [], sent: [] };
  const inboxEl = document.getElementById('inbox-body');
  if (!inboxEl) return;

  const convMap = {};
  [...(data.received || []), ...(data.sent || [])].forEach(e => {
    const p = e.payload || {};
    const se = (p.sender_email || '').toLowerCase();
    const re = (p.recipient_email || '').toLowerCase();
    const key = [se, re].sort().join('|') + '|' + (p.ad_title || '');
    if (!convMap[key]) {
      const otherEmail = se === sess.email.toLowerCase() ? re : se;
      const otherName  = se === sess.email.toLowerCase() ? (p.seller || re) : (p.sender_name || se);
      convMap[key] = { otherEmail, otherName, adTitle: p.ad_title || 'Ad', messages: [] };
    }
    convMap[key].messages.push({
      ...p,
      dir: (p.sender_email || '').toLowerCase() === sess.email.toLowerCase() ? 'out' : 'in',
      time: e.created_at
    });
  });

  const convs = Object.values(convMap).sort((a, b) => {
    const la = Math.max(...a.messages.map(m => new Date(m.time).getTime()));
    const lb = Math.max(...b.messages.map(m => new Date(m.time).getTime()));
    return lb - la;
  });
  window._inboxConvs = convs;

  if (!convs.length) {
    inboxEl.innerHTML = '<div class="em-myads-empty"><p>No messages yet.<br>When you send or receive messages, they will appear here.</p></div>';
    return;
  }

  /* Conversation list — one row per thread */
  inboxEl.innerHTML = convs.map((conv, ci) => {
    const sorted = [...conv.messages].sort((a, b) => new Date(a.time) - new Date(b.time));
    const last   = sorted[sorted.length - 1];
    const preview = (last.message || '').slice(0, 80);
    const unread = conv.messages.some(m => m.dir === 'in');
    return `
      <button onclick="openThread(${ci})" style="width:100%;text-align:left;background:none;border:none;border-bottom:1px solid var(--border-lt);padding:13px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;">
        <div style="width:42px;height:42px;border-radius:50%;background:var(--forest);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;">${(conv.otherName||'?')[0].toUpperCase()}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <div style="font-weight:700;font-size:13.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">${conv.otherName}</div>
            <div style="font-size:11px;color:var(--muted);flex-shrink:0;margin-left:8px;">${fmtTime(new Date(last.time).getTime())}</div>
          </div>
          <div style="font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Re: ${conv.adTitle}</div>
          <div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">${last.dir === 'out' ? 'You: ' : ''}${preview}</div>
        </div>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" stroke-width="2" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
      </button>`;
  }).join('');
}

function openThread(ci) {
  const conv = window._inboxConvs?.[ci];
  if (!conv) return;
  const sorted = [...conv.messages].sort((a, b) => new Date(a.time) - new Date(b.time));
  const bubbles = sorted.map((m, mi) => {
    const isOffer = m.dir === 'in' && (m.message || '').startsWith('💰 Offer:');
    const offerActions = isOffer ? `
      <div style="display:flex;gap:6px;margin-top:6px;">
        <button onclick="acceptOffer(${ci},${mi})" style="flex:1;background:var(--leaf);color:#fff;border:none;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700;cursor:pointer;">✅ Accept</button>
        <button onclick="counterOffer(${ci},${mi})" style="flex:1;background:var(--surf2);color:var(--ink);border:1px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700;cursor:pointer;">💬 Counter</button>
      </div>` : '';
    return `
    <div style="display:flex;flex-direction:column;align-items:${m.dir === 'out' ? 'flex-end' : 'flex-start'};margin-bottom:10px;">
      <div style="max-width:82%;background:${m.dir === 'out' ? 'var(--leaf)' : 'var(--surf3)'};color:${m.dir === 'out' ? '#fff' : 'var(--ink)'};padding:9px 13px;border-radius:${m.dir === 'out' ? '14px 14px 3px 14px' : '14px 14px 14px 3px'};font-size:13px;line-height:1.5;word-break:break-word;">${m.message || ''}</div>
      ${offerActions}
      <div style="font-size:10.5px;color:var(--muted);margin-top:3px;">${fmtTime(new Date(m.time).getTime())}</div>
    </div>`;
  }).join('');

  modalBox.innerHTML = `
    <div class="em-modal-bar" style="gap:8px;">
      <button onclick="openInbox()" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;color:var(--ink);">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:14px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${conv.otherName}</div>
        <div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Re: ${conv.adTitle}</div>
      </div>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:16px 16px 8px;" id="thread-bubbles">
      ${bubbles}
    </div>
    <div style="padding:10px 16px 16px;border-top:1px solid var(--border-lt);display:flex;gap:8px;">
      <input id="thread-reply" class="em-post-input" type="text" placeholder="Type a reply…" style="flex:1;padding:10px 14px;font-size:13px;border-radius:20px;" onkeydown="if(event.key==='Enter'){event.preventDefault();submitReply(${ci});}">
      <button onclick="submitReply(${ci})" style="background:var(--leaf);color:#fff;border:none;border-radius:50%;width:42px;height:42px;font-size:18px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">&#10148;</button>
    </div>`;
  /* Scroll to bottom */
  setTimeout(() => {
    const el = document.getElementById('thread-bubbles');
    if (el) el.scrollTop = el.scrollHeight;
    document.getElementById('thread-reply')?.focus();
  }, 50);
}

async function submitReply(ci) {
  const sess = _getSession();
  if (!sess) return;
  const conv = window._inboxConvs?.[ci];
  if (!conv) return;
  const input = document.getElementById('thread-reply');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.disabled = true;
  if (window.emStoreMessage) {
    await window.emStoreMessage({
      sender_email: sess.email,
      sender_name: sess.name,
      recipient_email: conv.otherEmail,
      ad_title: conv.adTitle,
      message: text
    });
  }
  /* Add bubble immediately without reloading */
  conv.messages.push({ dir: 'out', message: text, time: new Date().toISOString() });
  input.disabled = false;
  input.value = '';
  openThread(ci);
}

async function acceptOffer(ci, mi) {
  const sess = _getSession();
  if (!sess) return;
  const conv = window._inboxConvs?.[ci];
  if (!conv) return;
  const offerMsg = conv.messages[mi]?.message || '';
  const offerLine = offerMsg.split('\n')[0]; // "💰 Offer: R X"
  const replyText = `✅ Offer accepted! Your ${offerLine.replace('💰 Offer: ','offer of ')} has been accepted. Let's arrange payment and delivery — reply here to confirm next steps.`;
  if (window.emStoreMessage) {
    await window.emStoreMessage({
      sender_email: sess.email,
      sender_name: sess.name,
      recipient_email: conv.otherEmail,
      ad_title: conv.adTitle,
      message: replyText
    });
  }
  conv.messages.push({ dir: 'out', message: replyText, time: new Date().toISOString() });
  openThread(ci);
}

function counterOffer(ci, mi) {
  const conv = window._inboxConvs?.[ci];
  if (!conv) return;
  const threadBubbles = document.getElementById('thread-bubbles');
  if (!threadBubbles) return;
  /* Replace bottom reply area with a counter form */
  const replyRow = document.querySelector('#thread-bubbles + div');
  if (replyRow) {
    replyRow.innerHTML = `
      <div style="padding:12px 16px;background:var(--surf2);border-top:1px solid var(--border-lt);">
        <div style="font-size:12px;font-weight:700;color:var(--ink);margin-bottom:6px;">Your counter offer (R)</div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <input id="counter-amt" class="em-post-input" type="number" placeholder="Enter amount" style="flex:1;padding:9px 12px;font-size:13px;">
          <button onclick="submitCounterOffer(${ci})" style="background:var(--leaf);color:#fff;border:none;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">Send</button>
        </div>
        <button onclick="openThread(${ci})" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:0;">Cancel</button>
      </div>`;
    document.getElementById('counter-amt')?.focus();
  }
}

async function submitCounterOffer(ci) {
  const sess = _getSession();
  if (!sess) return;
  const conv = window._inboxConvs?.[ci];
  if (!conv) return;
  const amt = document.getElementById('counter-amt')?.value;
  if (!amt || Number(amt) < 1) { toast('Enter a valid amount.'); return; }
  const replyText = `💬 Counter offer: R ${Number(amt).toLocaleString('en-ZA')} — is this price acceptable?`;
  if (window.emStoreMessage) {
    await window.emStoreMessage({
      sender_email: sess.email,
      sender_name: sess.name,
      recipient_email: conv.otherEmail,
      ad_title: conv.adTitle,
      message: replyText
    });
  }
  conv.messages.push({ dir: 'out', message: replyText, time: new Date().toISOString() });
  openThread(ci);
}

function openMobileUserMenu() {
  const sess = _getSession();
  if (!sess) { openSignInModal(); return; }
  const initials = sess.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>My Account</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:0 20px 12px;">
      <div style="display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:4px;">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--forest);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;flex-shrink:0;">${initials}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:800;font-size:15px;color:var(--ink);">${sess.name}</div>
          <div style="font-size:12px;color:var(--muted);">${sess.email}</div>
          ${_sbUser?.user_metadata?.verified
            ? `<div style="display:inline-flex;align-items:center;gap:4px;background:#E8F5E9;color:#2E7D32;border-radius:20px;padding:2px 9px;font-size:11.5px;font-weight:700;margin-top:4px;">✅ Verified</div>`
            : `<button onclick="openGetVerifiedModal()" style="display:inline-flex;align-items:center;gap:4px;background:#FFF3E0;color:#E65100;border:none;border-radius:20px;padding:3px 9px;font-size:11.5px;font-weight:700;margin-top:4px;cursor:pointer;">⚠️ Unverified · Get Verified</button>`}
        </div>
      </div>
      <button class="em-menu-item" onclick="closeModal();setTimeout(openMyAds,250)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg>
        My Ads
      </button>
      <button class="em-menu-item" onclick="closeModal();setTimeout(openSavedAds,250)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Saved Ads
      </button>
      <button class="em-menu-item" onclick="closeModal();setTimeout(openInbox,250)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Messages <span id="menu-msg-badge" style="display:none;background:#e53e3e;color:#fff;border-radius:9px;font-size:11px;padding:1px 6px;margin-left:4px;vertical-align:middle">New</span>
      </button>
      ${_sbUser?.user_metadata?.store_approved ? `
      <button class="em-menu-item" onclick="closeModal();setTimeout(openStoreDashboard,250)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Store Dashboard
      </button>
      <button class="em-menu-item" onclick="closeModal();setTimeout(openMyStore,250)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        View My Store
      </button>` : `
      <button class="em-menu-item" onclick="closeModal();setTimeout(openApplyStoreModal,250)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Apply to be a Store
      </button>`}
      <button class="em-menu-item" onclick="closeModal();setTimeout(openPostAdModal,250)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Post an Ad
      </button>
      <button class="em-menu-item" style="color:#c62828;" onclick="closeModal();setTimeout(signOut,250)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>`;
  _openModal();
}

function openMyStore() {
  const sess = _getSession();
  if (!sess) return;
  if (!_sbUser?.user_metadata?.store_approved) {
    toast('Your store has not been approved yet.');
    return;
  }
  const storeName = _sbUser.user_metadata.store_name || sess.name || sess.email;
  const storeId   = _sbUser.user_metadata.store_id || null;
  openShopPage(storeName, sess.userId, storeId, true, _sbUser.user_metadata.store_type || 'retail');
}

function openApplyStoreModal() {
  if (!_getSession()) { openSignInModal(); return; }
  const meta = _sbUser?.user_metadata || {};
  if (meta.store_approved) { toast('Your store is already approved!'); return; }
  if (meta.store_applied) {
    toast('Your application is pending review. We\'ll notify you once approved.');
    return;
  }
  const html = `
    <div class="em-modal-bar">
      <h3>Apply to be a Store</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:18px 20px 20px;">
      <div style="background:var(--surf2);border:1px solid var(--border-lt);border-radius:10px;padding:12px 14px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:800;color:var(--ink);margin-bottom:4px;">Everything Market Storefront</div>
        <p style="margin:0;font-size:12.5px;color:var(--muted);line-height:1.5;">Apply for a storefront so buyers can browse your products from one place. We review every application manually.</p>
      </div>
      <div class="em-post-field" style="margin-bottom:12px;">
        <label class="em-post-label" for="apply-store-name">Store Name <span>(required)</span></label>
        <input id="apply-store-name" class="em-post-input" placeholder="e.g. Cape Town Auto Parts" maxlength="60" autocomplete="organization">
      </div>
      <div class="em-post-field" style="margin-bottom:12px;">
        <label class="em-post-label" for="apply-store-desc">What do you sell?</label>
        <textarea id="apply-store-desc" class="em-post-input" placeholder="Short description of your business and products..." style="height:88px;resize:vertical;" maxlength="300"></textarea>
      </div>
      <div class="em-post-field" style="margin-bottom:14px;">
        <label class="em-post-label" for="apply-store-type">Store Type</label>
        <select id="apply-store-type" class="em-post-input">
          <option value="retail">Retail Shop</option>
          <option value="dealership">Vehicle Dealership</option>
          <option value="services">Services / Contractor</option>
          <option value="wholesale">Wholesale / Distributor</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="em-post-field" style="margin-bottom:14px;">
        <label class="em-post-label" for="apply-store-cipc">CIPC Registration Number <span style="font-weight:400;color:var(--muted);">(if a registered company)</span></label>
        <input id="apply-store-cipc" class="em-post-input" placeholder="e.g. 2024/123456/07" maxlength="30">
      </div>
      <div style="background:var(--surf2);border:1px solid var(--border-lt);border-radius:10px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:800;color:var(--ink);margin-bottom:8px;">Store Terms &amp; Conditions</div>
        <ul style="margin:0 0 0 18px;padding:0;color:var(--muted);font-size:12.5px;line-height:1.55;">
          <li>You must provide accurate store and product information.</li>
          <li>You are responsible for the listings, prices, stock, orders, and buyer communication connected to your store.</li>
          <li>Everything Market may review, reject, suspend, or remove stores and listings that are unsafe, misleading, illegal, or against platform rules.</li>
          <li>All buyer and seller communication must stay on Everything Market where required for safety and monitoring.</li>
          <li>Approval does not guarantee sales, ranking, traffic, or permanent store access.</li>
        </ul>
      </div>
      <label style="display:flex;gap:10px;align-items:flex-start;margin:0 0 14px;color:var(--ink);font-size:13px;line-height:1.45;cursor:pointer;">
        <input id="apply-store-terms" type="checkbox" style="margin-top:3px;accent-color:var(--leaf);">
        <span>I agree to the Everything Market Store Terms &amp; Conditions and understand my application will be manually reviewed.</span>
      </label>
      <div id="apply-store-err" class="em-post-error" style="display:none;margin-bottom:10px;"></div>
      <button id="apply-store-submit" class="em-post-submit" onclick="submitStoreApplication(this)">Submit Application</button>
    </div>`;
  modalBox.innerHTML = html;
  _openModal();
  setTimeout(() => document.getElementById('apply-store-name')?.focus(), 80);
}

async function submitStoreApplication(btn) {
  const name = document.getElementById('apply-store-name')?.value.trim();
  const desc = document.getElementById('apply-store-desc')?.value.trim();
  const type = document.getElementById('apply-store-type')?.value;
  const cipc = document.getElementById('apply-store-cipc')?.value.trim();
  const acceptedTerms = !!document.getElementById('apply-store-terms')?.checked;
  const err = document.getElementById('apply-store-err');
  const fail = msg => {
    if (err) { err.textContent = msg; err.style.display = 'block'; }
    else toast(msg);
  };
  if (!name) { fail('Please enter a store name.'); return; }
  if (!acceptedTerms) { fail('Please accept the Store Terms & Conditions before submitting.'); return; }

  const sess = _getSession();
  if (!sess) { openSignInModal('Sign in to apply for a store.'); return; }

  btn = btn || document.getElementById('apply-store-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
  if (err) err.style.display = 'none';

  try {
    const token = (await _sb.auth.getSession()).data.session?.access_token;
    if (!token) throw new Error('Please sign in again before applying.');
    const r = await fetch('/api/apply-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ store_name: name, store_description: desc, store_type: type, cipc_number: cipc, accepted_terms: acceptedTerms })
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      fail(json.error || 'Could not submit application. Please try again.');
      if (btn) { btn.disabled = false; btn.textContent = 'Submit Application'; }
      return;
    }
    /* Flag locally so we don't re-prompt */
    await _sb.auth.updateUser({ data: { store_applied: true } });
    modalBox.innerHTML = `
      <div class="em-confirm">
        <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
        <div class="em-confirm-title">Application Submitted</div>
        <div class="em-confirm-sub">Thanks ${sess.name.split(' ')[0]}. We'll review your store application and update your account once approved.</div>
        <button class="em-confirm-close" onclick="closeModal()">Done</button>
      </div>`;
  } catch (e) {
    fail(e.message || 'Network error. Please try again.');
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Application'; }
  }
}

/* ── Store Dashboard ── */
let _dashStoreId   = null;
let _dashStoreName = null;
let _dashProducts  = [];
let _dashCats      = [];

async function openStoreDashboard() {
  const sess = _getSession();
  if (!sess) { openSignInModal(); return; }
  if (!_sbUser?.user_metadata?.store_approved) {
    toast('Your store has not been approved yet.');
    return;
  }

  _dashStoreId   = _sbUser.user_metadata.store_id || null;
  _dashStoreName = _sbUser.user_metadata.store_name || sess.name || sess.email;

  const el = document.getElementById('store-dashboard');
  const titleEl = document.getElementById('store-dash-title');
  if (!el) return;
  if (titleEl) titleEl.textContent = _dashStoreName;

  /* Reset tabs to Products */
  document.querySelectorAll('.store-dash-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'products');
  });

  el.style.display = 'flex';
  _lockScroll();
  _navPush('store-dash');
  _renderProductsTab();
}

function closeStoreDashboard() {
  const el = document.getElementById('store-dashboard');
  if (el) el.style.display = 'none';
  _unlockScroll();
  _navBack();
}

function switchDashTab(tab, btn) {
  document.querySelectorAll('.store-dash-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('store-dash-scroll').scrollTop = 0;
  if (tab === 'products')      _renderProductsTab();
  else if (tab === 'categories') _renderCategoriesTab();
  else if (tab === 'settings')   _renderSettingsTab();
  else if (tab === 'subscription') _renderSubscriptionTab();
}

async function _renderProductsTab() {
  const content = document.getElementById('store-dash-content');
  content.innerHTML = '<div class="dash-loading">Loading products…</div>';

  try {
    const r = await fetch('/api/store-products?store_id=' + encodeURIComponent(_dashStoreId));
    _dashProducts = r.ok ? await r.json() : [];
  } catch (_) { _dashProducts = []; }

  const catR = await fetch('/api/store-categories?store_id=' + encodeURIComponent(_dashStoreId)).catch(() => null);
  _dashCats = catR?.ok ? await catR.json() : [];

  const catMap = {};
  _dashCats.forEach(c => { catMap[c.id] = c.name; });

  content.innerHTML = `
    <div class="dash-section-hdr">
      <h3 class="dash-section-title">Products <span class="dash-count">${_dashProducts.length}</span></h3>
      <button class="dash-add-btn" onclick="openAddProductModal()">+ Add Product</button>
    </div>
    ${_dashProducts.length === 0 ? `<div class="dash-empty">No products yet. Add your first product above.</div>` : ''}
    <div class="dash-product-list" id="dash-product-list">
      ${_dashProducts.map(p => `
        <div class="dash-product-row" id="dashp-${p.id}">
          <div class="dash-product-thumb" id="dashpt-${p.id}"></div>
          <div class="dash-product-info">
            <div class="dash-product-title">${p.title}</div>
            <div class="dash-product-meta">
              ${p.category_name ? `<span>${p.category_name}</span> · ` : ''}
              <span>R ${Number(p.price).toLocaleString('en-ZA')}</span>
              ${p.stock_qty != null ? ` · <span>Stock: ${p.stock_qty}</span>` : ''}
            </div>
          </div>
          <div class="dash-product-actions">
            <button class="dash-btn-edit" onclick="openEditProductModal('${p.id}')">Edit</button>
            <button class="dash-btn-del" onclick="deleteStoreProduct('${p.id}')">Del</button>
          </div>
        </div>`).join('')}
    </div>`;

  /* Lazy-load thumbnails */
  _dashProducts.forEach(p => {
    const el = document.getElementById('dashpt-' + p.id);
    if (!el) return;
    const photos = Array.isArray(p.photos) ? p.photos : (typeof p.photos === 'string' ? JSON.parse(p.photos || '[]') : []);
    if (photos[0]) {
      el.style.backgroundImage = `url(${photos[0]})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }
  });
}

async function _renderCategoriesTab() {
  const content = document.getElementById('store-dash-content');
  content.innerHTML = '<div class="dash-loading">Loading categories…</div>';

  try {
    const r = await fetch('/api/store-categories?store_id=' + encodeURIComponent(_dashStoreId));
    _dashCats = r.ok ? await r.json() : [];
  } catch (_) { _dashCats = []; }

  content.innerHTML = `
    <div class="dash-section-hdr">
      <h3 class="dash-section-title">Categories <span class="dash-count">${_dashCats.length}</span></h3>
    </div>
    <div class="dash-add-cat-row">
      <input id="new-cat-name" class="em-input" placeholder="New category name…" maxlength="50" style="flex:1;">
      <button class="dash-add-btn" onclick="addStoreCategory()">Add</button>
    </div>
    ${_dashCats.length === 0 ? `<div class="dash-empty">No categories yet. Add one above.</div>` : ''}
    <div id="dash-cat-list">
      ${_dashCats.map((c, i) => `
        <div class="dash-cat-row" id="dashc-${c.id}">
          <span class="dash-cat-order">${i + 1}</span>
          <span class="dash-cat-name">${c.name}</span>
          <button class="dash-btn-del" onclick="deleteStoreCategory('${c.id}','${c.name}')">Remove</button>
        </div>`).join('')}
    </div>`;
}

async function _renderSettingsTab() {
  let meta = _sbUser?.user_metadata || {};
  try {
    const token = (await _sb.auth.getSession()).data.session?.access_token;
    const r = await fetch('/api/store-settings', { headers: { Authorization: 'Bearer ' + token } });
    if (r.ok) {
      const store = await r.json();
      meta = {
        ...meta,
        store_name: store.store_name,
        store_description: store.store_description,
        store_type: store.store_type,
        logo_url: store.logo_url
      };
    }
  } catch (_) {}
  const content = document.getElementById('store-dash-content');
  content.innerHTML = `
    <div class="dash-section-hdr">
      <h3 class="dash-section-title">Store Settings</h3>
    </div>
    <div class="dash-settings-card">
      <div class="dash-field">
        <label class="dash-label">Store Name</label>
        <input id="store-set-name" class="em-post-input" maxlength="80" value="${_spEsc(meta.store_name || _dashStoreName || '')}">
      </div>
      <div class="dash-field">
        <label class="dash-label">Store Description</label>
        <textarea id="store-set-desc" class="em-post-input" rows="4" maxlength="500" style="resize:vertical;" placeholder="Tell buyers what your store sells…">${_spEsc(meta.store_description || '')}</textarea>
      </div>
      <div class="dash-field">
        <label class="dash-label">Logo URL</label>
        <input id="store-set-logo" class="em-post-input" maxlength="1000" placeholder="https://…" value="${_spEsc(meta.logo_url || '')}">
        <div style="font-size:11px;color:var(--muted);margin-top:4px;">Paste a public image URL for now.</div>
      </div>
      <div class="dash-field">
        <label class="dash-label">Store Type</label>
        <select id="store-set-type" class="em-post-input">
          ${['retail','dealership','services','wholesale','other'].map(t => `<option value="${t}" ${(meta.store_type || 'retail') === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="dash-field">
        <label class="dash-label">Store ID</label>
        <div class="dash-value" style="font-family:monospace;font-size:11px;">${_dashStoreId || '—'}</div>
      </div>
      <div class="dash-field">
        <label class="dash-label">Status</label>
        <div class="dash-value"><span style="color:var(--leaf);font-weight:700;">✓ Approved</span></div>
      </div>
    </div>
    <div style="margin-top:20px;">
      <button class="dash-add-btn" onclick="saveStoreSettings()">Save Store Settings</button>
      <button class="dash-add-btn" onclick="openMyStore()">Preview Your Store →</button>
    </div>`;
}

async function saveStoreSettings() {
  const storeName = (document.getElementById('store-set-name')?.value || '').trim();
  const storeDescription = (document.getElementById('store-set-desc')?.value || '').trim();
  const logoUrl = (document.getElementById('store-set-logo')?.value || '').trim();
  const storeType = document.getElementById('store-set-type')?.value || 'retail';
  if (!storeName) { toast('Store name is required.'); return; }
  const token = (await _sb.auth.getSession()).data.session?.access_token;
  try {
    const r = await fetch('/api/store-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ store_name: storeName, store_description: storeDescription, logo_url: logoUrl, store_type: storeType })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Could not save store settings');
    _dashStoreName = data.store_name || storeName;
    if (_sbUser) {
      _sbUser.user_metadata = {
        ...(_sbUser.user_metadata || {}),
        store_name: _dashStoreName,
        store_type: data.store_type || storeType,
        store_description: data.store_description || storeDescription,
        logo_url: data.logo_url || logoUrl
      };
    }
    document.getElementById('store-dash-title').textContent = _dashStoreName;
    toast('Store settings saved.');
  } catch (e) {
    toast(e.message || 'Could not save store settings.');
  }
}

async function _renderSubscriptionTab() {
  const content = document.getElementById('store-dash-content');
  content.innerHTML = '<div class="dash-loading">Loading subscription…</div>';

  let sub = null;
  try {
    const token = (await _sb.auth.getSession()).data.session?.access_token;
    const r = await fetch('/api/store-products?store_id=' + encodeURIComponent(_dashStoreId) + '&meta=subscription', {
      headers: { Authorization: 'Bearer ' + token }
    });
    /* We don't have a dedicated sub endpoint — just show static info for now */
  } catch (_) {}

  const paidUntil = _sbUser?.user_metadata?.store_subscription_until
    ? new Date(_sbUser.user_metadata.store_subscription_until).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  content.innerHTML = `
    <div class="dash-section-hdr">
      <h3 class="dash-section-title">Subscription</h3>
    </div>
    <div class="dash-sub-card">
      <div class="dash-sub-plan">Basic Store Plan</div>
      <div class="dash-sub-price">R 299 <span>/month</span></div>
      <ul class="dash-sub-features">
        <li>✓ Unlimited products</li>
        <li>✓ Custom categories</li>
        <li>✓ Full storefront page</li>
        <li>✓ Listed in Shops section</li>
        <li>✓ Customer messaging</li>
      </ul>
      ${paidUntil ? `<div class="dash-sub-until">Active until <strong>${paidUntil}</strong></div>` : ''}
      <button class="dash-add-btn" style="width:100%;margin-top:16px;" onclick="toast('Payment coming soon — contact us to renew.')">Renew / Pay</button>
    </div>
    <p class="dash-sub-note">To pay or renew your subscription, please contact us at <a href="mailto:stores@everythingmarket.co.za" style="color:var(--leaf);">stores@everythingmarket.co.za</a></p>`;
}

window._spExistingPhotos = [];
window._spNewPhotos = [];

function _spEsc(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function openAddProductModal(editProduct) {
  const isEdit = !!editProduct;
  const p = editProduct || {};
  const catOptions = _dashCats.map(c =>
    `<option value="${c.id}" data-name="${c.name}" ${p.category_id === c.id ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  const existingPhotos = Array.isArray(p.photos) ? p.photos
    : (typeof p.photos === 'string' ? JSON.parse(p.photos || '[]') : []);
  window._spExistingPhotos = existingPhotos.filter(Boolean).slice(0, 10);
  window._spNewPhotos = [];

  const html = `
    <div class="em-modal-bar">
      <h3>${isEdit ? 'Edit Product' : 'Add Product'}</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="info-modal-body">
      <div class="em-post-field">
        <label class="em-post-label">Title *</label>
        <input id="sp-title" class="em-post-input" placeholder="Product name" maxlength="120" value="${_spEsc(p.title || '')}">
      </div>
      <div class="em-post-field">
        <label class="em-post-label">Description</label>
        <textarea id="sp-desc" class="em-post-input" rows="3" style="resize:vertical;" maxlength="1000" placeholder="Describe your product…">${_spEsc(p.description || '')}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="em-post-field">
          <label class="em-post-label">Price (R) *</label>
          <input id="sp-price" class="em-post-input" type="number" min="0" step="0.01" placeholder="0.00" value="${p.price || ''}">
        </div>
        <div class="em-post-field">
          <label class="em-post-label">Stock Qty</label>
          <input id="sp-stock" class="em-post-input" type="number" min="0" placeholder="Leave blank = unlimited" value="${p.stock_qty != null ? p.stock_qty : ''}">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="em-post-field">
          <label class="em-post-label">Category</label>
          <select id="sp-cat" class="em-post-input">
            <option value="">— No category —</option>
            ${catOptions}
          </select>
        </div>
        <div class="em-post-field">
          <label class="em-post-label">Condition</label>
          <select id="sp-cond" class="em-post-input">
            <option value="New" ${(p.condition||'New')==='New'?'selected':''}>New</option>
            <option value="Like New" ${p.condition==='Like New'?'selected':''}>Like New</option>
            <option value="Good" ${p.condition==='Good'?'selected':''}>Good</option>
            <option value="Used" ${p.condition==='Used'?'selected':''}>Used</option>
            <option value="N/A" ${p.condition==='N/A'?'selected':''}>N/A</option>
          </select>
        </div>
      </div>
      <div class="em-post-field">
        <label class="em-post-label">Location</label>
        <input id="sp-loc" class="em-post-input" placeholder="e.g. Cape Town" value="${_spEsc(p.loc || '')}">
      </div>
      <div class="em-post-field">
        <label class="em-post-label">Pictures <span id="sp-photo-count-lbl">(${window._spExistingPhotos.length} / 10)</span></label>
        <div class="em-photo-previews" id="sp-photo-previews"></div>
        <div class="em-photo-zone" id="sp-dropzone" style="margin-top:8px;" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="_spDrop(event)">
          <input type="file" accept="image/*" multiple id="sp-photo-files" onchange="_spAddPhotos(this.files);this.value=''">
          <div class="em-photo-zone-txt"><strong>📷 Add product pictures</strong><br><span style="font-size:11px;color:var(--muted)">Up to 10 pictures. First picture is the cover.</span></div>
        </div>
      </div>
      <div id="sp-err" class="em-post-error" style="display:none;"></div>
      <button class="em-post-submit" onclick="submitStoreProduct(${isEdit ? `'${p.id}'` : 'null'})">${isEdit ? 'Save Changes' : 'Add Product'}</button>
    </div>`;
  modalBox.innerHTML = html;
  _openModal();
  _spRenderPhotos();
}

function openEditProductModal(productId) {
  const p = _dashProducts.find(x => String(x.id) === String(productId));
  if (!p) { toast('Product not found.'); return; }
  openAddProductModal(p);
}

function _spRenderPhotos() {
  const container = document.getElementById('sp-photo-previews');
  const allPhotos = [...window._spExistingPhotos, ...window._spNewPhotos];
  if (container) {
    container.innerHTML = allPhotos.map((url, i) => `
      <div class="em-photo-thumb-wrap">
        <img class="em-photo-thumb" src="${url}" alt="Product photo ${i + 1}">
        ${i === 0 ? '<span class="em-photo-main-lbl">Cover</span>' : ''}
        <button type="button" class="em-photo-rm" onclick="_spRemovePhoto(${i})" title="Remove">&#x2715;</button>
      </div>`).join('');
  }
  const lbl = document.getElementById('sp-photo-count-lbl');
  if (lbl) lbl.textContent = `(${allPhotos.length} / 10)`;
  const zone = document.getElementById('sp-dropzone');
  if (zone) zone.style.display = allPhotos.length >= 10 ? 'none' : '';
}

window._spRemovePhoto = function(idx) {
  if (idx < window._spExistingPhotos.length) window._spExistingPhotos.splice(idx, 1);
  else window._spNewPhotos.splice(idx - window._spExistingPhotos.length, 1);
  _spRenderPhotos();
};

window._spAddPhotos = function(files) {
  const remaining = 10 - window._spExistingPhotos.length - window._spNewPhotos.length;
  Array.from(files).slice(0, remaining).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        window._spNewPhotos.push(canvas.toDataURL('image/jpeg', 0.82));
        _spRenderPhotos();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

window._spDrop = function(e) {
  e.preventDefault();
  document.getElementById('sp-dropzone')?.classList.remove('drag');
  _spAddPhotos(e.dataTransfer.files);
};

async function _spUploadNewPhotos(productKey) {
  const uploaded = [];
  for (let i = 0; i < window._spNewPhotos.length; i++) {
    const r = await fetch('/api/upload-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId: 'store-' + productKey,
        index: Date.now() + '-' + i,
        dataUrl: window._spNewPhotos[i]
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.url) throw new Error(data.error || 'Could not upload product picture');
    uploaded.push(data.url);
  }
  return uploaded;
}

async function submitStoreProduct(editId) {
  const title  = (document.getElementById('sp-title')?.value || '').trim();
  const desc   = (document.getElementById('sp-desc')?.value || '').trim();
  const price  = parseFloat(document.getElementById('sp-price')?.value || '0');
  const stock  = document.getElementById('sp-stock')?.value;
  const catEl  = document.getElementById('sp-cat');
  const catId  = catEl?.value || null;
  const catName = catEl?.options[catEl.selectedIndex]?.dataset.name || catEl?.options[catEl.selectedIndex]?.text || '';
  const cond   = document.getElementById('sp-cond')?.value || 'New';
  const loc    = (document.getElementById('sp-loc')?.value || '').trim();

  const errEl = document.getElementById('sp-err');
  if (!title) { errEl.textContent = 'Please enter a title.'; errEl.style.display = ''; return; }
  if (isNaN(price) || price < 0) { errEl.textContent = 'Please enter a valid price.'; errEl.style.display = ''; return; }

  const token = (await _sb.auth.getSession()).data.session?.access_token;
  const body = {
    store_id: _dashStoreId, title, description: desc, price,
    category_id: catId || undefined, category_name: catName || undefined,
    condition: cond, loc,
    stock_qty: stock !== '' && stock != null ? parseInt(stock) : null
  };

  const btn = document.querySelector('.em-modal-box .em-post-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    const productKey = editId || ('new-' + Date.now());
    const uploadedPhotos = await _spUploadNewPhotos(productKey);
    const photos = [...window._spExistingPhotos, ...uploadedPhotos].slice(0, 10);
    const method = editId ? 'PATCH' : 'POST';
    const payload = editId ? { id: editId, ...body } : body;
    payload.photos = photos;
    const r = await fetch('/api/store-products', {
      method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(payload)
    });
    const json = await r.json();
    if (!r.ok) { errEl.textContent = json.error || 'Failed to save product.'; errEl.style.display = ''; if (btn) { btn.disabled = false; btn.textContent = editId ? 'Save Changes' : 'Add Product'; } return; }
    closeModal();
    toast(editId ? 'Product updated.' : 'Product added!');
    _renderProductsTab();
  } catch (e) {
    errEl.textContent = e.message || 'Network error. Please try again.';
    errEl.style.display = '';
    if (btn) { btn.disabled = false; btn.textContent = editId ? 'Save Changes' : 'Add Product'; }
  }
}

async function deleteStoreProduct(productId) {
  if (!confirm('Delete this product?')) return;
  const token = (await _sb.auth.getSession()).data.session?.access_token;
  try {
    await fetch('/api/store-products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ id: productId })
    });
    toast('Product deleted.');
    _renderProductsTab();
  } catch (e) { toast('Could not delete product.'); }
}

async function addStoreCategory() {
  const name = (document.getElementById('new-cat-name')?.value || '').trim();
  if (!name) { toast('Please enter a category name.'); return; }
  const token = (await _sb.auth.getSession()).data.session?.access_token;
  try {
    const r = await fetch('/api/store-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ store_id: _dashStoreId, name })
    });
    if (!r.ok) { const j = await r.json(); toast(j.error || 'Failed to add category.'); return; }
    toast('Category added!');
    _renderCategoriesTab();
  } catch (e) { toast('Network error.'); }
}

async function deleteStoreCategory(catId, catName) {
  if (!confirm(`Remove category "${catName}"? Products in this category will not be deleted.`)) return;
  const token = (await _sb.auth.getSession()).data.session?.access_token;
  try {
    await fetch('/api/store-categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ id: catId })
    });
    toast('Category removed.');
    _renderCategoriesTab();
  } catch (e) { toast('Could not remove category.'); }
}

/* ── Verification Centre state ── */
let _vfyJwt = null;
let _vfyRtChannel = null;
let _bioStream = null;
let _bioRecorder = null;
let _bioChunks = [];

async function _getVfyAccessToken() {
  const session = (await _sb.auth.getSession()).data?.session || null;
  const token = session?.access_token || null;
  _vfyJwt = token;
  return token;
}

function openGetVerifiedModal() {
  closeModal();
  setTimeout(openVerificationCenter, 250);
}

async function openVerificationCenter() {
  const sess = _getSession();
  if (!sess) { openSignInModal('Sign in to access verification.'); return; }
  await _getVfyAccessToken();

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Verification Centre</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:28px 20px;text-align:center;color:var(--muted);">Loading…</div>`;
  _openModal();

  let status = null;
  try {
    const token = await _getVfyAccessToken();
    const r = await fetch('/api/verify/status', { headers: { 'Authorization': 'Bearer ' + token } });
    if (r.ok) status = await r.json();
  } catch(e) {}

  _renderVeriCenter(status, sess);
}

function _vfyLvlColor(level) {
  if (level === 'Verified Seller') return '#2e7d32';
  if (level === 'Verification Pending') return '#f57c00';
  return '#757575';
}

function _renderVeriCenter(status, sess) {
  const bio   = status?.biometric || { status: 'none' };
  const approved = bio.status === 'approved';
  const pending = bio.status === 'review' || bio.status === 'processing';
  const rejected = bio.status === 'rejected';
  const level = approved ? 'Verified Seller' : pending ? 'Waiting for Admin Review' : 'Not Verified';
  const c = approved ? '#2e7d32' : pending ? '#f57c00' : '#757575';

  const tick  = `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="#2e7d32" stroke-width="2.5"><polyline points="4,10 8,14 16,6"/></svg>`;
  const cross = `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="#c62828" stroke-width="2.5"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>`;
  const clock = `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="#f57c00" stroke-width="2"><circle cx="10" cy="10" r="8"/><polyline points="10,5 10,10 14,13"/></svg>`;
  const bioIcon = approved ? tick : pending ? clock : cross;
  const reviewText = approved ? 'Approved by Everything Market admin' :
    pending ? 'Your ID photo and selfie are waiting for admin review' :
    rejected ? 'Please submit fresh ID and selfie photos for admin review' :
    'Submit your ID photo and selfie for admin review';

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Manual Identity Review</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:20px;">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="display:inline-flex;align-items:center;gap:6px;background:${c}18;border:1.5px solid ${c}44;border-radius:20px;padding:6px 16px;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="${c}"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z"/></svg>
          <span style="font-size:13px;font-weight:600;color:${c};">${level}</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:10px;background:var(--surf2);border-radius:10px;padding:12px 14px;">
          <span style="display:flex;">${bioIcon}</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;color:var(--ink);">ID + Selfie</div>
            <div style="font-size:11.5px;color:var(--muted);">${reviewText}</div>
          </div>
          ${approved
            ? `<span style="font-size:11px;color:#2e7d32;font-weight:600;">Verified</span>`
            : pending
            ? `<span style="font-size:11px;color:#f57c00;font-weight:600;">Pending</span>`
            : `<button class="em-offer-submit" onclick="openBiometricVerification()" style="width:auto;flex-shrink:0;padding:6px 12px;font-size:12px;margin:0;min-width:0;">Submit</button>`}
        </div>
      </div>
      <p style="font-size:11.5px;color:var(--muted);text-align:center;line-height:1.5;">Submit a live photo of your ID and a live selfie. Everything Market admin reviews both photos manually before approval.</p>
    </div>`;
}

/* ── WhatsApp Phone Verification ── */
async function startPhoneVerification() {
  if (!_vfyJwt) return;
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <button onclick="openVerificationCenter()" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;color:var(--ink);"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
      <h3>Phone Verification</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:20px;text-align:center;color:var(--muted);">Generating your code…</div>`;

  let data;
  try {
    const r = await fetch('/api/verify/phone-start', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + _vfyJwt, 'Content-Type': 'application/json' }
    });
    data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Failed');
  } catch(e) {
    toast(e.message.includes('not configured')
      ? 'Mobile verification is not configured yet. Please contact Everything Market support.'
      : 'Could not start verification: ' + e.message);
    return openVerificationCenter();
  }

  const { sessionId, displayToken, waLink, expiresAt } = data;
  const expStr = expiresAt ? new Date(expiresAt).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}) : '';

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <button onclick="openVerificationCenter()" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;color:var(--ink);"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
      <h3>Phone Verification</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:20px;">
      <p style="font-size:13px;color:var(--muted);text-align:center;margin-bottom:16px;">Scan the QR code or tap the button to send a WhatsApp message and verify your number.</p>
      <div id="wa-qr-box" style="margin:0 auto 16px;width:180px;height:180px;display:flex;align-items:center;justify-content:center;"></div>
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${waLink}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#25d366;color:#fff;border-radius:10px;padding:10px 20px;text-decoration:none;font-size:14px;font-weight:600;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1s-.8 1-.9 1.1c-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3-.3-.4.3-.4.8-1.4.1-.2 0-.4-.1-.5-.1-.1-.7-1.7-1-2.4-.3-.6-.5-.6-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.1.1 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.5-.1 1.6-.6 1.9-1.3.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.4C8.8 21.5 10.4 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
          Open WhatsApp
        </a>
      </div>
      <div style="text-align:center;margin-bottom:16px;">
        <span style="font-size:11.5px;color:var(--muted);">Or send: <strong>VERIFY ${displayToken}</strong>${expStr ? ' (expires ' + expStr + ')' : ''}</span>
      </div>
      <div id="wa-status-box" style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px;font-size:12.5px;color:var(--muted);">
        <div style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f57c00;margin-right:6px;"></div>Waiting for WhatsApp message…
      </div>
    </div>`;

  try {
    if (typeof QRCode !== 'undefined') {
      new QRCode(document.getElementById('wa-qr-box'), {
        text: waLink, width: 160, height: 160,
        colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M
      });
    }
  } catch(e) {}

  if (_vfyRtChannel) { _sb.removeChannel(_vfyRtChannel); _vfyRtChannel = null; }
  _vfyRtChannel = _sb.channel('wa-verify-' + sessionId)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'phone_verifications',
      filter: 'id=eq.' + sessionId
    }, payload => {
      if (payload.new?.status === 'verified') {
        const box = document.getElementById('wa-status-box');
        if (box) box.innerHTML = '<div style="color:#2e7d32;font-weight:600;">✅ Phone verified! Refreshing…</div>';
        if (_vfyRtChannel) { _sb.removeChannel(_vfyRtChannel); _vfyRtChannel = null; }
        setTimeout(() => openVerificationCenter(), 1500);
      } else if (payload.new?.status === 'failed') {
        const box = document.getElementById('wa-status-box');
        if (box) box.innerHTML = '<div style="color:#c62828;">❌ Verification failed. Please try again.</div>';
      }
    })
    .subscribe();
}

/* ── Biometric Verification ── */
async function openBiometricVerification() {
  if (!_vfyJwt) return;
  _bioChunks = [];
  _bioStream = null;
  _bioRecorder = null;

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <button onclick="openVerificationCenter()" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;color:var(--ink);"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
      <h3>Manual Identity Review</h3>
      <button class="em-modal-close" onclick="_stopBioStream();closeModal()">&#x2715;</button>
    </div>
    <div style="padding:20px;">
      <div style="text-align:center;font-size:36px;margin-bottom:10px;">🪪</div>
      <h3 style="text-align:center;color:var(--ink);margin-bottom:8px;">Submit Your ID + Selfie</h3>
      <p style="font-size:12.5px;color:var(--muted);text-align:center;line-height:1.6;margin-bottom:18px;">Take a clear photo of your ID, then a clear selfie. Admin will manually approve it.</p>
      <button class="em-offer-submit" onclick="_bioStep1_ID()">Continue</button>
    </div>`;
}

function _stopBioStream() {
  if (_bioStream) { _bioStream.getTracks().forEach(t => t.stop()); _bioStream = null; }
  if (_bioRecorder && _bioRecorder.state !== 'inactive') { try { _bioRecorder.stop(); } catch(e) {} }
  _bioRecorder = null;
  _bioChunks = [];
}

async function _bioStep1_ID() {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <button onclick="openBiometricVerification()" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;color:var(--ink);"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
      <h3>Step 1 of 2 — Live ID Photo</h3>
      <button class="em-modal-close" onclick="_stopBioStream();closeModal()">&#x2715;</button>
    </div>
    <div style="padding:20px;">
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.5;">Use your camera to take a clear live photo of your SA ID card, ID book, or passport. Ensure it is well-lit and all text is readable.</p>
      <div style="border:2px dashed var(--border);border-radius:12px;padding:28px 16px;text-align:center;margin-bottom:14px;cursor:pointer;" onclick="document.getElementById('bio-id-input').click()">
        <div id="bio-id-preview" style="font-size:40px;margin-bottom:8px;">🪪</div>
        <div style="font-size:13px;color:var(--muted);">Tap to take ID photo</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px;">Camera photo preferred · max 8 MB</div>
      </div>
      <input type="file" id="bio-id-input" accept="image/*" capture="environment" style="display:none;" onchange="_bioPreviewID(this)">
      <div id="bio-id-err" class="em-post-error" style="display:none;margin-bottom:8px;"></div>
      <button class="em-offer-submit" id="bio-id-next" onclick="_bioStep2_Selfie()" disabled style="opacity:0.4;">Next →</button>
    </div>`;
}

function _bioPreviewID(input) {
  const file = input.files[0];
  if (!file) return;
  const err = document.getElementById('bio-id-err');
  if (file.size > 8 * 1024 * 1024) { err.textContent = 'Image too large (max 8 MB).'; err.style.display = 'block'; return; }
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { err.textContent = 'Use a JPEG, PNG, or WebP image.'; err.style.display = 'block'; return; }
  err.style.display = 'none';
  const reader = new FileReader();
  reader.onload = e => {
    const p = document.getElementById('bio-id-preview');
    if (p) p.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:140px;border-radius:8px;object-fit:contain;">`;
    const btn = document.getElementById('bio-id-next');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  };
  reader.readAsDataURL(file);
}

async function _bioStep2_Selfie() {
  const idInput = document.getElementById('bio-id-input');
  if (!idInput?.files?.[0]) {
    const err = document.getElementById('bio-id-err');
    if (err) { err.textContent = 'Please select your ID photo first.'; err.style.display = 'block'; }
    return;
  }
  window._bioIdFile = idInput.files[0];

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <button onclick="_bioStep1_ID()" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;color:var(--ink);"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
      <h3>Step 2 of 2 — Live Selfie</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:20px;">
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.5;">Use your camera to take a clear live selfie. Use good lighting, no sunglasses, and keep your face inside the frame.</p>
      <div style="border:2px dashed var(--border);border-radius:12px;padding:28px 16px;text-align:center;margin-bottom:14px;cursor:pointer;" onclick="document.getElementById('bio-selfie-input').click()">
        <div id="bio-selfie-preview" style="font-size:40px;margin-bottom:8px;">📷</div>
        <div style="font-size:13px;color:var(--muted);">Tap to take live selfie</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px;">Camera selfie preferred · max 8 MB</div>
      </div>
      <input type="file" id="bio-selfie-input" accept="image/*" capture="user" style="display:none;" onchange="_bioPreviewSelfie(this)">
      <div id="bio-selfie-err" class="em-post-error" style="display:none;margin-bottom:8px;"></div>
      <button class="em-offer-submit" id="bio-submit-btn" onclick="_bioSubmitVerification()" disabled style="opacity:0.4;">Submit for Manual Review</button>
    </div>`;
}

function _bioPreviewSelfie(input) {
  const file = input.files[0];
  if (!file) return;
  const err = document.getElementById('bio-selfie-err');
  if (file.size > 8 * 1024 * 1024) { err.textContent = 'Image too large (max 8 MB).'; err.style.display = 'block'; return; }
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { err.textContent = 'Use a JPEG, PNG, or WebP image.'; err.style.display = 'block'; return; }
  err.style.display = 'none';
  window._bioSelfieFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    const p = document.getElementById('bio-selfie-preview');
    if (p) p.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:160px;border-radius:8px;object-fit:contain;">`;
    const btn = document.getElementById('bio-submit-btn');
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  };
  reader.readAsDataURL(file);
}

function _bioFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1800;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => reject(new Error('Could not prepare photo. Please try another image.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Could not read photo. Please try again.'));
    reader.readAsDataURL(file);
  });
}

async function _bioSubmitVerification() {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Submitting…</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:28px 20px;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">⏳</div>
      <p style="color:var(--muted);font-size:13px;">Uploading your ID photo and selfie for admin review…</p>
    </div>`;

  const sess = _getSession();
  if (!sess) { openSignInModal('Sign in to submit identity verification.'); return; }
  let idDataUrl, selfieDataUrl;

  try {
    if (!window._bioIdFile || !window._bioSelfieFile) throw new Error('Please take both photos first.');
    [idDataUrl, selfieDataUrl] = await Promise.all([
      _bioFileToDataUrl(window._bioIdFile),
      _bioFileToDataUrl(window._bioSelfieFile)
    ]);
  } catch(e) {
    toast(e.message || 'Could not read photos. Please try again.');
    return openVerificationCenter();
  }

  try {
    const token = await _getVfyAccessToken();
    if (!token) throw new Error('Please sign in again before submitting identity verification.');
    const r = await fetch('/api/verify/biometric-submit', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idPhoto: {
          dataUrl: idDataUrl,
          name: window._bioIdFile.name || 'id-photo'
        },
        selfiePhoto: {
          dataUrl: selfieDataUrl,
          name: window._bioSelfieFile.name || 'selfie-photo'
        }
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Submission failed');
  } catch(e) {
    toast('Submission failed: ' + e.message);
    return openVerificationCenter();
  }

  window._bioIdFile = null;
  window._bioSelfieFile = null;
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Under Manual Review</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:28px 20px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🔍</div>
      <h3 style="color:#1565c0;margin-bottom:8px;">Submitted for Review</h3>
      <p style="font-size:13px;color:var(--muted);line-height:1.6;">Your ID photo and selfie have been submitted. Everything Market admin will review them and update your seller verification.</p>
      <button class="em-offer-submit" onclick="openVerificationCenter()" style="margin-top:16px;">Go to Verification Centre</button>
    </div>`;
}

async function _bioPollResult(jobId, attempt) {
  if (attempt > 30) {
    modalBox.innerHTML = `
      <div class="em-modal-bar">
        <h3>Verification Submitted</h3>
        <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
      </div>
      <div style="padding:28px 20px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">⏳</div>
        <h3 style="color:var(--ink);margin-bottom:8px;">Under Review</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">Your ID photo and selfie are waiting for Everything Market admin review. Check your Verification Centre for updates.</p>
        <button class="em-offer-submit" onclick="openVerificationCenter()" style="margin-top:16px;">Go to Verification Centre</button>
      </div>`;
    return;
  }

  let result;
  try {
    const token = await _getVfyAccessToken();
    if (!token) throw new Error('No active verification session');
    const r = await fetch('/api/verify/biometric-poll?jobId=' + encodeURIComponent(jobId), {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    result = r.ok ? await r.json() : null;
  } catch(e) { result = null; }

  if (!result || result.status === 'processing') {
    const pEl = modalBox.querySelector('p');
    if (pEl) pEl.textContent = 'Waiting for manual admin review' + '.'.repeat((attempt % 3) + 1);
    setTimeout(() => _bioPollResult(jobId, attempt + 1), 4000);
    return;
  }

  if (result.status === 'approved') {
    modalBox.innerHTML = `
      <div class="em-modal-bar">
        <h3>Verification Complete</h3>
        <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
      </div>
      <div style="padding:28px 20px;text-align:center;">
        <div style="font-size:56px;margin-bottom:12px;">✅</div>
        <h3 style="color:#2e7d32;margin-bottom:8px;">Identity Review Approved</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">Your ID/selfie review is approved. Finish any remaining account checks to receive the Verified Seller badge.</p>
        <button class="em-offer-submit" onclick="openVerificationCenter()" style="margin-top:16px;">Done</button>
      </div>`;
  } else if (result.status === 'review') {
    modalBox.innerHTML = `
      <div class="em-modal-bar">
        <h3>Under Manual Review</h3>
        <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
      </div>
      <div style="padding:28px 20px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🔍</div>
        <h3 style="color:#1565c0;margin-bottom:8px;">Manual Review Required</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">Our team will review your submission within 24 hours. Check your Verification Centre for updates.</p>
        <button class="em-offer-submit" onclick="openVerificationCenter()" style="margin-top:16px;">OK</button>
      </div>`;
  } else {
    const reason = _bioPublicFailureReason(result.reason);
    modalBox.innerHTML = `
      <div class="em-modal-bar">
        <h3>Verification Failed</h3>
        <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
      </div>
      <div style="padding:28px 20px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">❌</div>
        <h3 style="color:#c62828;margin-bottom:8px;">Verification Failed</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">${reason}</p>
        <button class="em-offer-submit" onclick="openBiometricVerification()" style="margin-top:16px;">Try Again</button>
      </div>`;
  }
}

function _bioPublicFailureReason(reason) {
  const fallback = 'Please try again in better lighting and ensure your face and ID photo are clearly visible.';
  const raw = String(reason || '').trim();
  if (!raw) return fallback;
  const technical = /opencv|traceback|detectmultiscale|cascade|assertion|\/io\/|\.py\b|exception|error:/i;
  if (technical.test(raw)) return fallback;
  if (/no[_\s-]?face|face.*not.*detect|id quality unacceptable/i.test(raw)) {
    return 'We could not detect your face clearly. Please retake the ID photo and selfie in good lighting.';
  }
  return raw.length > 180 ? fallback : raw;
}

/* ── Make Offer modal ── */
let _offerListing = null;

function openMakeOffer(listing) {
  if (!listing) return;
  _offerListing = listing;
  const price = listing.price === 0 ? 0 : listing.price;

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Make an Offer</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-modal-listing">
      <div class="em-modal-listing-img" id="modal-img2"></div>
      <div class="em-modal-listing-info">
        <div class="em-modal-listing-title">${listing.title}</div>
        <div class="em-offer-ref">Listed at <strong>R ${price.toLocaleString('en-ZA')}</strong></div>
      </div>
    </div>
    <div class="em-offer-body">
      <label class="em-offer-label">Your offer (R)</label>
      <input id="offer-amt" class="em-offer-input" type="number" placeholder="${Math.round(price * 0.9).toLocaleString('en-ZA')}" min="1">
      <label class="em-offer-label">Message to seller <span style="font-weight:400;color:var(--muted)">(optional)</span></label>
      <textarea id="offer-msg" class="em-offer-textarea" placeholder="Explain your offer or ask a question…"></textarea>
      <div id="offer-err" class="em-post-error" style="display:none;margin-bottom:8px;"></div>
      <button class="em-offer-submit" onclick="submitOffer(this)">Send Offer</button>
    </div>`;

  _openModal();
  setTimeout(() => {
    const imgEl = document.getElementById('modal-img2');
    if (imgEl) _renderImg(imgEl, listing);
  }, 10);
}

async function submitOffer(btn) {
  const sess = _getSession();
  if (!sess) { closeModal(); openSignInModal('Sign in to make an offer.'); return; }
  const listing = _offerListing;
  if (!listing) return;
  const amt  = document.getElementById('offer-amt').value;
  const msg  = (document.getElementById('offer-msg')?.value || '').trim();
  const errEl = document.getElementById('offer-err');
  if (!amt || isNaN(amt) || Number(amt) <= 0) {
    document.getElementById('offer-amt').style.borderColor = 'var(--red)';
    document.getElementById('offer-amt').focus();
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  const offerText = `💰 Offer: R ${Number(amt).toLocaleString('en-ZA')}${msg ? '\n\n' + msg : ''}`;
  if (window.emStoreMessage) {
    await window.emStoreMessage({
      sender_email: sess.email,
      sender_name: sess.name,
      recipient_email: listing.contactEmail || listing.contact_email || '',
      ad_id: String(listing.id),
      ad_title: listing.title,
      seller: listing.seller,
      message: offerText.slice(0, 1000)
    });
  }
  showSentConfirm('offer', 'R ' + Number(amt).toLocaleString('en-ZA'));
}

function showSentConfirm(type, detail) {
  const isOffer = type === 'offer';
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="em-confirm-title">${isOffer ? 'Offer Sent!' : 'Message Sent!'}</div>
      <div class="em-confirm-sub">${isOffer
        ? `Your offer of <strong>${detail}</strong> has been sent to the seller. They'll respond within 24 hours.`
        : `Your message has been sent. The seller will reply to your Everything Market inbox.`
      }</div>
      <button class="em-confirm-close" onclick="closeModal()">Done</button>
    </div>`;
}

/* ── Supabase Auth ── */
const _sb = supabase.createClient(
  'https://jucphfbaueowzlbjhxmm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw'
);
window._sb = _sb;

let _sbUser = null;

function _getSession() {
  if (!_sbUser) return null;
  return {
    userId: _sbUser.id,
    name: _sbUser.user_metadata?.name || _sbUser.email.split('@')[0],
    email: _sbUser.email
  };
}

function _updateAuthUI() {
  const sess = _getSession();
  const hdrSignIn  = document.getElementById('hdr-signin');
  const hdrRegister = document.getElementById('hdr-register');
  const hdrUser    = document.getElementById('hdr-user');
  const hdrName    = document.getElementById('hdr-user-name');
  const hdrAvatar  = document.getElementById('hdr-user-avatar');
  const sbAuth     = document.getElementById('sb-auth');
  const sbAuthIn   = document.getElementById('sb-auth-in');
  const sbWelcome  = document.getElementById('sb-welcome');
  const mobAuthBtn = document.getElementById('mob-auth-btn');

  if (sess) {
    const first = sess.name.split(' ')[0];
    const initials = sess.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    if (hdrSignIn)   hdrSignIn.style.display = 'none';
    if (hdrRegister) hdrRegister.style.display = 'none';
    if (hdrUser)     hdrUser.style.display = '';
    if (hdrName)     hdrName.textContent = first;
    if (hdrAvatar)   hdrAvatar.textContent = initials;
    if (sbAuth)      sbAuth.style.display = 'none';
    if (sbAuthIn)    sbAuthIn.style.display = '';
    if (sbWelcome)   sbWelcome.textContent = 'Hi ' + first + '! Manage your listings below.';
    if (mobAuthBtn)  { mobAuthBtn.title = first; mobAuthBtn.onclick = openMobileUserMenu; }
    const vfyBadge = document.getElementById('hdr-vfy-badge');
    if (vfyBadge) {
      vfyBadge.innerHTML = _sbUser?.user_metadata?.verified
        ? '<span style="color:#2E7D32;">✅ Verified</span>'
        : '<button onclick="document.getElementById(\'hdr-user-drop\').classList.remove(\'open\');openGetVerifiedModal();" style="background:none;border:none;color:#E65100;cursor:pointer;font-size:11.5px;font-weight:700;padding:0;font-family:inherit;">⚠️ Unverified · Get Verified →</button>';
    }
    _checkUnreadMessages(sess.email);
  } else {
    if (hdrSignIn)   hdrSignIn.style.display = '';
    if (hdrRegister) hdrRegister.style.display = '';
    if (hdrUser)     hdrUser.style.display = 'none';
    if (sbAuth)      sbAuth.style.display = '';
    if (sbAuthIn)    sbAuthIn.style.display = 'none';
    if (mobAuthBtn)  { mobAuthBtn.title = 'Sign In'; mobAuthBtn.onclick = () => openSignInModal(); }
    _setMsgBadge(0);
  }
}

function _setMsgBadge(count) {
  const mob  = document.getElementById('mob-msg-badge');
  const desk = document.getElementById('desk-msg-badge');
  const menu = document.getElementById('menu-msg-badge');
  const label = count > 9 ? '9+' : String(count);
  const show = count > 0;
  if (mob)  { mob.style.display  = show ? '' : 'none'; mob.textContent  = ''; }
  if (desk) { desk.style.display = show ? '' : 'none'; desk.textContent = label; }
  if (menu) { menu.style.display = show ? '' : 'none'; menu.textContent = label; }
}

let _msgPollTimer = null;
async function _checkUnreadMessages(email) {
  if (!email || !window.emLoadMessages) return;
  try {
    const lastRead = Number(localStorage.getItem('em_inbox_read_' + email) || 0);
    const { received } = await window.emLoadMessages(email);
    const unreadCount = received.filter(m => {
      const ts = m.created_at ? new Date(m.created_at).getTime() : 0;
      return ts > lastRead;
    }).length;
    _setMsgBadge(unreadCount);
  } catch(_) {}
  /* Poll every 60s while the tab is open */
  clearTimeout(_msgPollTimer);
  _msgPollTimer = setTimeout(() => _checkUnreadMessages(email), 60000);
}

async function _initAuth() {
  /* Handle email verification link — Supabase puts token_hash in the URL */
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (tokenHash && type) {
    const { error } = await _sb.auth.verifyOtp({ token_hash: tokenHash, type });
    history.replaceState(null, '', window.location.pathname);
    if (!error && type === 'recovery') {
      setTimeout(openResetPasswordModal, 250);
    } else if (!error) {
      toast('Email verified! You are now signed in.');
    }
  }

  const boostResult = params.get('boost');
  if (boostResult) {
    history.replaceState(null, '', window.location.pathname);
    if (boostResult === 'success') {
      _showToast('&#x26A1; Payment received! Your ad will be boosted shortly.', 6000);
    } else if (boostResult === 'cancel') {
      _showToast('Payment cancelled — your ad was not boosted.', 4000);
    }
  }

  const { data: { session } } = await _sb.auth.getSession();
  _sbUser = session?.user || null;
  _updateAuthUI();
  if ((hashParams.get('type') === 'recovery' || params.get('type') === 'recovery') && _sbUser) {
    setTimeout(openResetPasswordModal, 250);
    history.replaceState(null, '', window.location.pathname);
  }
  if (params.get('signin') === '1' && !_sbUser) {
    setTimeout(() => openSignInModal('Sign in to continue on Everything Market.'), 250);
    const clean = new URL(window.location.href);
    clean.searchParams.delete('signin');
    history.replaceState(null, '', clean.pathname + clean.search + clean.hash);
  }
  _sb.auth.onAuthStateChange((_event, session) => {
    _sbUser = session?.user || null;
    _updateAuthUI();
  });
}
_initAuth();

/* ── Open ad from shared link (/ad/:id or ?ad=ID) ── */
(function() {
  const pathMatch = location.pathname.match(/^\/ad\/([^/]+)$/);
  const adId = pathMatch ? pathMatch[1] : new URLSearchParams(location.search).get('ad');
  if (!adId) return;
  function _tryOpenAd(attempts) {
    const listing = LISTINGS.find(l => String(l.id) === String(adId));
    if (listing) { openBuyNow(listing); return; }
    if (attempts < 10) setTimeout(() => _tryOpenAd(attempts + 1), 600);
  }
  setTimeout(() => _tryOpenAd(0), 800);
})();

function toggleUserMenu(e) {
  e && e.stopPropagation();
  const drop = document.getElementById('hdr-user-drop');
  if (drop) drop.classList.toggle('open');
}
document.addEventListener('click', () => {
  document.getElementById('hdr-user-drop')?.classList.remove('open');
});

async function signOut() {
  await _sb.auth.signOut();
  _sbUser = null;
  _updateAuthUI();
  closeModal();
  toast('You have been signed out.');
}

/* ── Auth — email + password only ── */

function openSignInModal(hint) {
  if (_sbUser) { closeModal(); return; }
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Sign In</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <form class="em-post-form" onsubmit="submitSignIn(event)" novalidate>
      ${hint ? `<p class="em-signin-hint">${hint}</p>` : ''}
      <div class="em-post-field">
        <label class="em-post-label" for="si-email">Email address</label>
        <input class="em-post-input" id="si-email" type="email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="em-post-field">
        <label class="em-post-label" for="si-pass">Password</label>
        <div style="position:relative;">
          <input class="em-post-input" id="si-pass" type="password" placeholder="Your password" autocomplete="current-password" style="padding-right:44px;">
          <button type="button" onclick="const f=document.getElementById('si-pass');f.type=f.type==='password'?'text':'password';this.textContent=f.type==='password'?'👁':'🙈';" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:0;line-height:1;">👁</button>
        </div>
      </div>
      <div id="auth-error" class="em-post-error" style="display:none;"></div>
      <button type="submit" class="em-post-submit">Sign In</button>
      <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px;">
        <button type="button" onclick="openForgotPasswordModal()" style="border:1px solid var(--border-lt);background:var(--surf2);color:var(--forest);border-radius:8px;padding:10px 12px;font-size:13px;font-weight:800;cursor:pointer;">Forgot password?</button>
        <button type="button" onclick="submitMagicSignInLink()" style="border:1px solid var(--border-lt);background:#fff;color:var(--ink);border-radius:8px;padding:10px 12px;font-size:13px;font-weight:800;cursor:pointer;">Email me a sign-in link</button>
        <button type="button" onclick="openResendVerificationModal()" style="border:1px solid var(--border-lt);background:#fff;color:var(--ink);border-radius:8px;padding:10px 12px;font-size:13px;font-weight:800;cursor:pointer;">Resend verification email</button>
      </div>
      <p class="em-auth-switch">No account yet? <button type="button" onclick="openRegisterModal()">Create one free</button></p>
    </form>`;
  _openModal();
  setTimeout(() => document.getElementById('si-email')?.focus(), 80);
}

async function submitSignIn(e) {
  e.preventDefault();
  const email = (document.getElementById('si-email')?.value || '').trim().toLowerCase();
  const pass  = (document.getElementById('si-pass')?.value || '');
  const errEl = document.getElementById('auth-error');
  const btn   = e.target.querySelector('[type=submit]');
  const showErr = msg => {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = '';
  };
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  if (!pass) { errEl.textContent = 'Please enter your password.'; errEl.style.display = ''; return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  let data, error;
  try {
    const result = await _sb.auth.signInWithPassword({ email, password: pass });
    data = result.data;
    error = result.error;
  } catch (e2) {
    error = e2;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
  if (error || !data?.user) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('email not confirmed')) {
      showErr('Please confirm your email address first. Use Resend verification email below if you cannot find it.');
    } else if (msg.includes('network') || msg.includes('fetch')) {
      showErr('Could not reach the sign-in service. Please check your connection and try again.');
    } else {
      showErr('Incorrect email or password. Use Forgot password or Email me a sign-in link below to get back in.');
    }
    return;
  }
  _sbUser = data.user;
  _updateAuthUI();
  closeModal();
  const name = data.user.user_metadata?.name || email.split('@')[0];
  if (window.emTrack) emTrack('login');
  toast('Welcome back, ' + name.split(' ')[0] + '!');
}

async function submitMagicSignInLink() {
  const email = (document.getElementById('si-email')?.value || '').trim().toLowerCase();
  const errEl = document.getElementById('auth-error');
  if (!email.includes('@')) {
    if (errEl) { errEl.textContent = 'Enter your email address first, then tap Email me a sign-in link.'; errEl.style.display = ''; }
    return;
  }
  const buttons = [...document.querySelectorAll('.em-post-form button')];
  buttons.forEach(b => b.disabled = true);
  let error = null;
  try {
    const result = await _sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/?signin=1' }
    });
    error = result.error;
  } catch (e2) {
    error = e2;
  } finally {
    buttons.forEach(b => b.disabled = false);
  }
  if (error) {
    if (errEl) { errEl.textContent = error.message || 'Could not send sign-in link. Try Forgot password instead.'; errEl.style.display = ''; }
    return;
  }
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="em-confirm-title">Sign-In Link Sent</div>
      <div class="em-confirm-sub">Check ${email}. Open the link in the email and you will be signed in automatically.</div>
      <button class="em-confirm-close" onclick="openSignInModal()">Back to Sign In</button>
    </div>`;
}

function openResendVerificationModal(emailValue) {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Verify Email</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <form class="em-post-form" onsubmit="submitResendVerification(event)" novalidate>
      <p class="em-signin-hint">Enter your email and we will send another account verification link.</p>
      <div class="em-post-field">
        <label class="em-post-label" for="rv-email">Email address</label>
        <input class="em-post-input" id="rv-email" type="email" placeholder="you@example.com" autocomplete="email" value="${emailValue ? String(emailValue).replace(/"/g, '&quot;') : ''}">
      </div>
      <div id="auth-error" class="em-post-error" style="display:none;"></div>
      <button type="submit" class="em-post-submit">Send Verification Email</button>
      <p class="em-auth-switch">Already verified? <button type="button" onclick="openSignInModal()">Sign in</button></p>
    </form>`;
  _openModal();
  setTimeout(() => document.getElementById('rv-email')?.focus(), 80);
}

async function submitResendVerification(e) {
  e.preventDefault();
  const email = (document.getElementById('rv-email')?.value || '').trim().toLowerCase();
  const errEl = document.getElementById('auth-error');
  const btn = e.target.querySelector('[type=submit]');
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  btn.disabled = true; btn.textContent = 'Sending…';
  let error = null;
  try {
    const result = await _sb.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin + '/?signin=1' }
    });
    error = result.error;
  } catch (e2) {
    error = e2;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Verification Email';
  }
  if (error) {
    errEl.textContent = error.message || 'Could not resend verification email. Please try again.';
    errEl.style.display = '';
    return;
  }
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="em-confirm-title">Verification Email Sent</div>
      <div class="em-confirm-sub">Check ${email}. Open the link to verify your account, then sign in.</div>
      <button class="em-confirm-close" onclick="openSignInModal()">Back to Sign In</button>
    </div>`;
}

function openForgotPasswordModal() {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Reset Password</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <form class="em-post-form" onsubmit="submitForgotPassword(event)" novalidate>
      <p class="em-signin-hint">Enter your account email and we will send you a secure password reset link.</p>
      <div class="em-post-field">
        <label class="em-post-label" for="fp-email">Email address</label>
        <input class="em-post-input" id="fp-email" type="email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div id="auth-error" class="em-post-error" style="display:none;"></div>
      <button type="submit" class="em-post-submit">Send Reset Link</button>
      <p class="em-auth-switch">Remembered it? <button type="button" onclick="openSignInModal()">Sign in</button></p>
    </form>`;
  _openModal();
  setTimeout(() => document.getElementById('fp-email')?.focus(), 80);
}

async function submitForgotPassword(e) {
  e.preventDefault();
  const email = (document.getElementById('fp-email')?.value || '').trim().toLowerCase();
  const errEl = document.getElementById('auth-error');
  const btn = e.target.querySelector('[type=submit]');
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  btn.disabled = true; btn.textContent = 'Sending…';
  let error = null;
  try {
    const result = await _sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/?type=recovery'
    });
    error = result.error;
  } catch (e2) {
    error = e2;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Reset Link';
  }
  if (error) {
    errEl.textContent = error.message || 'Could not send reset link. Please try again.';
    errEl.style.display = '';
    return;
  }
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="em-confirm-title">Reset Link Sent</div>
      <div class="em-confirm-sub">Check ${email}. Open the link in the email, then choose a new password.</div>
      <button class="em-confirm-close" onclick="openSignInModal()">Back to Sign In</button>
    </div>`;
}

function openResetPasswordModal() {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Choose New Password</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <form class="em-post-form" onsubmit="submitNewPassword(event)" novalidate>
      <p class="em-signin-hint">Create a new password for your Everything Market account.</p>
      <div class="em-post-field">
        <label class="em-post-label" for="new-pass">New password</label>
        <div style="position:relative;">
          <input class="em-post-input" id="new-pass" type="password" placeholder="At least 6 characters" autocomplete="new-password" style="padding-right:44px;">
          <button type="button" onclick="const f=document.getElementById('new-pass');f.type=f.type==='password'?'text':'password';this.textContent=f.type==='password'?'👁':'🙈';" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:0;line-height:1;">👁</button>
        </div>
      </div>
      <div id="auth-error" class="em-post-error" style="display:none;"></div>
      <button type="submit" class="em-post-submit">Update Password</button>
    </form>`;
  _openModal();
  setTimeout(() => document.getElementById('new-pass')?.focus(), 80);
}

async function submitNewPassword(e) {
  e.preventDefault();
  const pass = document.getElementById('new-pass')?.value || '';
  const errEl = document.getElementById('auth-error');
  const btn = e.target.querySelector('[type=submit]');
  if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = ''; return; }
  btn.disabled = true; btn.textContent = 'Updating…';
  let data, error;
  try {
    const result = await _sb.auth.updateUser({ password: pass });
    data = result.data;
    error = result.error;
  } catch (e2) {
    error = e2;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
  if (error) {
    errEl.textContent = error.message || 'Could not update password. Please request a new reset link.';
    errEl.style.display = '';
    return;
  }
  _sbUser = data.user || _sbUser;
  _updateAuthUI();
  closeModal();
  toast('Password updated. You are signed in.');
}

function openRegisterModal() {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Create Account</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <form class="em-post-form" onsubmit="submitRegister(event)" novalidate>
      <div class="em-post-field">
        <label class="em-post-label" for="reg-name">Your name <span>(shown on your listings)</span></label>
        <input class="em-post-input" id="reg-name" type="text" placeholder="e.g. Sipho Dlamini" maxlength="60" autocomplete="name">
      </div>
      <div class="em-post-field">
        <label class="em-post-label" for="reg-email">Email address</label>
        <input class="em-post-input" id="reg-email" type="email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="em-post-field">
        <label class="em-post-label" for="reg-pass">Password</label>
        <div style="position:relative;">
          <input class="em-post-input" id="reg-pass" type="password" placeholder="At least 6 characters" autocomplete="new-password" style="padding-right:44px;">
          <button type="button" onclick="const f=document.getElementById('reg-pass');f.type=f.type==='password'?'text':'password';this.textContent=f.type==='password'?'👁':'🙈';" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:0;line-height:1;">👁</button>
        </div>
      </div>
      <div id="auth-error" class="em-post-error" style="display:none;"></div>
      <button type="submit" class="em-post-submit">Create Account</button>
      <p class="em-auth-switch">Already have an account? <button type="button" onclick="openSignInModal()">Sign in</button></p>
    </form>`;
  _openModal();
  setTimeout(() => document.getElementById('reg-name')?.focus(), 80);
}

async function submitRegister(e) {
  e.preventDefault();
  const name  = (document.getElementById('reg-name')?.value || '').trim();
  const email = (document.getElementById('reg-email')?.value || '').trim().toLowerCase();
  const pass  = (document.getElementById('reg-pass')?.value || '');
  const errEl = document.getElementById('auth-error');
  const btn   = e.target.querySelector('[type=submit]');
  if (!name)               { errEl.textContent = 'Please enter your name.'; errEl.style.display = ''; return; }
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  if (pass.length < 6)     { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = ''; return; }
  btn.disabled = true; btn.textContent = 'Creating account…';
  let data, error;
  try {
    const result = await _sb.auth.signUp({
      email,
      password: pass,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin + '/?signin=1'
      }
    });
    data = result.data;
    error = result.error;
  } catch (e2) {
    error = e2;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
  if (error) {
    errEl.textContent = error.message || 'Could not create account. Please try again.';
    errEl.style.display = '';
    return;
  }
  if (window.emTrack) emTrack('register');
  if (data?.session?.user) {
    _sbUser = data.session.user;
    _updateAuthUI();
    closeModal();
    toast('Welcome to Everything Market, ' + name.split(' ')[0] + '!');
    return;
  }
  _sbUser = null;
  _updateAuthUI();
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="em-confirm-title">Verify Your Email</div>
      <div class="em-confirm-sub">We created your account. Check ${email} and open the verification link before signing in.</div>
      <button class="em-confirm-close" onclick="openSignInModal()">Go to Sign In</button>
      <button class="em-confirm-close" onclick="openResendVerificationModal('${email.replace(/'/g, "\\'")}')" style="margin-top:8px;background:var(--surf2);color:var(--forest);">Resend Verification Email</button>
    </div>`;
}

/* ── My Ads ── */
function openMyAds() {
  const sess = _getSession();
  if (!sess) { openSignInModal(); return; }
  document.getElementById('hdr-user-drop')?.classList.remove('open');

  /* Pull user's ads: match by userId, or by seller name when userId wasn't stored */
  const myAds = LISTINGS.filter(l =>
    (l.userId && String(l.userId) === String(sess.userId)) ||
    (!l.userId && l.seller && l.seller.trim().toLowerCase() === (sess.name || '').trim().toLowerCase())
  );
  try {
    const local = JSON.parse(localStorage.getItem('em_user_ads') || '[]');
    const seenIds = new Set(myAds.map(l => String(l.id)));
    /* Only add local ads that actually belong to this user */
    local.forEach(la => {
      if (!seenIds.has(String(la.id)) && la.userId && String(la.userId) === String(sess.userId))
        myAds.push(la);
    });
  } catch(_) {}

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>My Ads</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-myads-body">
      ${!myAds.length
        ? `<div class="em-myads-empty">
             <p>You haven't posted any ads yet.</p>
             <button class="em-post-submit" style="margin-top:14px;" onclick="openPostAdModal()">Post Your First Ad</button>
           </div>`
        : myAds.map(l => `
          <div class="em-myad-row">
            <div class="em-myad-img" id="myad-img-${l.id}"></div>
            <div class="em-myad-info">
              <div class="em-myad-title">${l.title}</div>
              <div class="em-myad-meta">${l.price === 0 ? 'Contact for Price' : 'R ' + l.price.toLocaleString('en-ZA')} &middot; ${_fmtLoc(l.loc)} &middot; ${fmtTime(l.postedAt)}</div>
              ${l.sponsored ? `<span style="font-size:11px;font-weight:700;color:#1565C0;background:#E3F0FF;padding:2px 7px;border-radius:20px;">&#x26A1; Sponsored</span>` : `<button class="em-boost-btn" onclick="event.stopPropagation();openSponsorModal('${l.id}')">&#x26A1; Boost this ad</button>`}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
              <button class="em-myad-edit" onclick="event.stopPropagation();openEditAdModal('${l.id}')" title="Edit ad">&#x270E; Edit</button>
              <button class="em-myad-del"  onclick="event.stopPropagation();_deleteMyAd('${l.id}')"  title="Delete ad">&#x2715;</button>
            </div>
          </div>`).join('')
      }
    </div>`;
  _openModal();
  myAds.forEach(l => {
    const el = document.getElementById('myad-img-' + l.id);
    if (el) _renderImg(el, l);
  });
}

function openSavedAds() {
  document.getElementById('hdr-user-drop')?.classList.remove('open');
  const saved = LISTINGS.filter(l => wl.has(l.id));
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Saved Ads</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-myads-body">
      ${!saved.length
        ? `<div class="em-myads-empty"><p>You haven't saved any ads yet.<br>Tap the heart on any listing to save it.</p></div>`
        : saved.map(l => `
          <div class="em-myad-row" onclick="closeModal();setTimeout(()=>openBuyNow(LISTINGS.find(x=>String(x.id)==='${l.id}')),200)" style="cursor:pointer;">
            <div class="em-myad-img" id="svad-img-${l.id}"></div>
            <div class="em-myad-info">
              <div class="em-myad-title">${l.title}</div>
              <div class="em-myad-meta">${l.price === 0 ? 'Contact for Price' : 'R ' + l.price.toLocaleString('en-ZA')} &middot; ${_fmtLoc(l.loc)}</div>
            </div>
          </div>`).join('')
      }
    </div>`;
  _openModal();
  saved.forEach(l => {
    const el = document.getElementById('svad-img-' + l.id);
    if (el) _renderImg(el, l);
  });
}

function openSponsorModal(listingId) {
  const l = LISTINGS.find(x => String(x.id) === String(listingId));
  if (!l) return;

  const plans = [
    { amount: '35', days: 7,  label: '7 Days',  note: 'Best for quick sales' },
    { amount: '65', days: 14, label: '14 Days', note: 'Most popular', pop: true },
    { amount: '95', days: 30, label: '30 Days', note: 'Best value' },
  ];

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>&#x26A1; Boost Your Ad</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div style="padding:20px;">
      <div style="font-size:14px;color:var(--muted);margin-bottom:16px;">
        Sponsored ads appear in the <strong>top 10 spots</strong> on the homepage — getting up to 5&times; more views.
      </div>
      <div style="font-weight:700;font-size:13px;color:var(--ink);margin-bottom:14px;">Your ad: ${l.title}</div>

      <div class="em-sponsor-plans" id="sponsor-plans">
        ${plans.map(p => `
          <div class="em-sponsor-plan${p.pop ? ' em-sponsor-plan-pop' : ''}" id="splan-${p.amount}"
               onclick="_selectSponsorPlan('${p.amount}')"
               style="cursor:pointer;">
            ${p.pop ? '<div class="em-sponsor-popular-badge">Most Popular</div>' : ''}
            <div class="em-sponsor-plan-dur">${p.label}</div>
            <div class="em-sponsor-plan-price">R ${p.amount}</div>
            <div class="em-sponsor-plan-note">${p.note}</div>
          </div>`).join('')}
      </div>

      <button class="em-offer-submit" id="sponsor-pay-btn" style="margin-top:20px;opacity:.5;pointer-events:none;"
              onclick="_startSponsorPayment('${String(l.id)}', '${l.title.replace(/'/g,"\\'")}')">
        Pay with PayFast &rarr;
      </button>
      <div id="sponsor-pay-msg" style="font-size:12px;color:var(--muted);text-align:center;margin-top:8px;"></div>

      <div style="margin-top:14px;font-size:11px;color:var(--muted);text-align:center;">
        Secured by <strong>PayFast</strong> &middot; Card, EFT, Instant EFT &amp; more accepted
      </div>
    </div>`;
  _openModal();
}

let _selectedSponsorAmount = null;
function _selectSponsorPlan(amount) {
  _selectedSponsorAmount = amount;
  document.querySelectorAll('.em-sponsor-plan').forEach(el => {
    el.style.outline = el.id === 'splan-' + amount ? '2px solid var(--accent)' : '';
  });
  const btn = document.getElementById('sponsor-pay-btn');
  if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = ''; btn.textContent = 'Pay R ' + amount + ' with PayFast →'; }
}

async function _startSponsorPayment(adId, adTitle) {
  const amount = _selectedSponsorAmount;
  if (!amount) return;
  const btn = document.getElementById('sponsor-pay-btn');
  const msg = document.getElementById('sponsor-pay-msg');
  if (btn) { btn.style.opacity = '.6'; btn.style.pointerEvents = 'none'; btn.textContent = 'Preparing…'; }
  if (msg) msg.textContent = '';

  try {
    const origin = window.location.origin;
    const r = await fetch(`/api/payfast-init?adId=${encodeURIComponent(adId)}&amount=${amount}&adTitle=${encodeURIComponent(adTitle)}&origin=${encodeURIComponent(origin)}`);
    if (!r.ok) throw new Error('init failed');
    const { pfUrl, fields } = await r.json();

    /* Build a hidden form and POST to PayFast */
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = pfUrl;
    Object.entries(fields).forEach(([k, v]) => {
      const inp = document.createElement('input');
      inp.type = 'hidden'; inp.name = k; inp.value = v;
      form.appendChild(inp);
    });
    document.body.appendChild(form);
    form.submit();
  } catch(e) {
    if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = ''; btn.textContent = 'Pay R ' + amount + ' with PayFast →'; }
    if (msg) msg.textContent = 'Something went wrong. Please try again.';
  }
}
window._selectSponsorPlan  = _selectSponsorPlan;
window._startSponsorPayment = _startSponsorPayment;
window.openSponsorModal = openSponsorModal;

window._deleteMyAd = async function(id) {
  if (!confirm('Delete this listing? This cannot be undone.')) return;

  /* Remove from local state immediately for instant feedback */
  const idx = LISTINGS.findIndex(l => String(l.id) === String(id));
  if (idx !== -1) LISTINGS.splice(idx, 1);
  _saveUserAds();
  renderAll('all');
  openMyAds();

  /* Delete from Supabase — pass user's auth token so the server can verify ownership */
  try {
    const token = (await _sb.auth.getSession()).data.session?.access_token;
    await fetch('/api/delete-ad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      body: JSON.stringify({ id })
    });
  } catch (_) {}
};

/* ── Edit Ad ── */
window._editPhotos = [];  // new photos added during editing

window.openEditAdModal = function(id) {
  const listing = LISTINGS.find(l => String(l.id) === String(id));
  if (!listing) return;
  const sess = _getSession();
  if (!sess) return;

  const ageMs        = Date.now() - new Date(listing.postedAt || listing.created_at || 0).getTime();
  const withinWindow = ageMs <= 24 * 60 * 60 * 1000;
  window._editPhotos = [];
  window._editExistingPhotos = Array.isArray(listing.photos) ? [...listing.photos] : [];

  const conditions = ['New','Like New','Good','Fair','For Parts'];
  const condOpts   = conditions.map(c => `<option value="${c}"${listing.cond===c?' selected':''}>${c}</option>`).join('');

  const restrictedNote = withinWindow ? '' : `
    <div style="background:#FFF8E1;border:1px solid #FFE082;border-radius:8px;padding:10px 14px;font-size:12.5px;color:#7B5200;margin-bottom:16px;">
      ⏱ <strong>24-hour edit window has passed.</strong> You can still reduce the price or add more photos.
    </div>`;

  const fullFields = withinWindow ? `
    <div class="em-post-field">
      <label class="em-post-label">Title</label>
      <input class="em-post-input" id="ea-title" value="${(listing.title||'').replace(/"/g,'&quot;')}" maxlength="200">
    </div>
    <div class="em-post-field">
      <label class="em-post-label">Description</label>
      <textarea class="em-post-input" id="ea-desc" rows="4" style="resize:vertical">${listing.description||''}</textarea>
    </div>
    <div class="em-post-field">
      <label class="em-post-label">Condition</label>
      <select class="em-post-input" id="ea-cond">${condOpts}</select>
    </div>` : '';

  const existingPhotosHtml = window._editExistingPhotos.length
    ? `<div style="margin-bottom:8px;font-size:12px;color:var(--muted);">${withinWindow ? 'Current photos (tap ✕ to remove):' : 'Existing photos (locked — cannot remove after 24h):'}</div>
       <div class="em-photo-previews" id="ea-existing-previews">
         ${window._editExistingPhotos.map((url, i) => `
           <div class="em-photo-thumb-wrap">
             <img class="em-photo-thumb" src="${url}" alt="Photo ${i+1}">
             ${i === 0 ? '<span class="em-photo-main-lbl">Main</span>' : ''}
             ${withinWindow ? `<button type="button" class="em-photo-rm" onclick="_editRemoveExisting(${i})" title="Remove">&#x2715;</button>` : ''}
           </div>`).join('')}
       </div>`
    : '';

  const maxNewPhotos = 10 - window._editExistingPhotos.length;

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Edit Ad</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-myads-body" style="padding:16px 20px 24px;">
      ${restrictedNote}
      ${fullFields}
      <div class="em-post-field">
        <label class="em-post-label">Price (R) ${!withinWindow ? '<span style="color:#E37400;font-size:11px;">— can only reduce</span>' : ''}</label>
        <input class="em-post-input" id="ea-price" type="number" min="0" value="${listing.price||0}">
        <label style="margin-top:6px;display:flex;align-items:center;gap:6px;font-size:13px;">
          <input type="checkbox" id="ea-neg" ${listing.neg?' checked':''}> Price negotiable
        </label>
      </div>
      <div class="em-post-field">
        <label class="em-post-label">Photos ${maxNewPhotos > 0 ? `<span id="ea-photo-count-lbl" style="font-weight:400;color:var(--muted);"> (${window._editExistingPhotos.length} existing${window._editExistingPhotos.length < 10 ? ' — can add more' : ''})</span>` : ''}</label>
        ${existingPhotosHtml}
        ${maxNewPhotos > 0 ? `
        <div class="em-photo-zone" id="ea-dropzone" style="margin-top:8px;" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="_editDrop(event)">
          <input type="file" accept="image/*" multiple id="ea-photos" onchange="_editAddPhotos(this.files);this.value=''">
          <div class="em-photo-zone-txt"><strong>📷 Add more photos</strong><br><span style="font-size:11px;color:var(--muted)">Up to ${maxNewPhotos} more</span></div>
        </div>
        <div class="em-photo-previews" id="ea-new-previews"></div>` : ''}
      </div>
      <div id="ea-msg" style="font-size:13px;margin-bottom:10px;display:none;"></div>
      <button class="em-post-submit" id="ea-save-btn" onclick="submitEditAd('${id}')">Save Changes</button>
    </div>`;
  _openModal();
};

window._editRemoveExisting = function(idx) {
  window._editExistingPhotos.splice(idx, 1);
  const wrap = document.getElementById('ea-existing-previews');
  if (wrap) wrap.innerHTML = window._editExistingPhotos.map((url, i) => `
    <div class="em-photo-thumb-wrap">
      <img class="em-photo-thumb" src="${url}" alt="Photo ${i+1}">
      ${i === 0 ? '<span class="em-photo-main-lbl">Main</span>' : ''}
      <button type="button" class="em-photo-rm" onclick="_editRemoveExisting(${i})" title="Remove">&#x2715;</button>
    </div>`).join('');
};

window._editAddPhotos = function(files) {
  const max = 10 - window._editExistingPhotos.length;
  const remaining = max - window._editPhotos.length;
  Array.from(files).slice(0, remaining).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        window._editPhotos.push(canvas.toDataURL('image/jpeg', 0.82));
        _editRenderNewPreviews();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

window._editDrop = function(e) {
  e.preventDefault();
  document.getElementById('ea-dropzone')?.classList.remove('drag');
  _editAddPhotos(e.dataTransfer.files);
};

window._editRemoveNew = function(idx) {
  window._editPhotos.splice(idx, 1);
  _editRenderNewPreviews();
};

function _editRenderNewPreviews() {
  const container = document.getElementById('ea-new-previews');
  if (!container) return;
  const offset = window._editExistingPhotos.length;
  container.innerHTML = window._editPhotos.map((url, i) => `
    <div class="em-photo-thumb-wrap">
      <img class="em-photo-thumb" src="${url}" alt="New photo ${i+1}">
      ${offset === 0 && i === 0 ? '<span class="em-photo-main-lbl">Main</span>' : ''}
      <button type="button" class="em-photo-rm" onclick="_editRemoveNew(${i})" title="Remove">&#x2715;</button>
    </div>`).join('');
  const zone = document.getElementById('ea-dropzone');
  const max  = 10 - window._editExistingPhotos.length;
  if (zone) zone.style.display = window._editPhotos.length >= max ? 'none' : '';
}

window.submitEditAd = async function(id) {
  const sess = _getSession();
  if (!sess) return;
  const btn = document.getElementById('ea-save-btn');
  const msg = document.getElementById('ea-msg');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  if (msg) { msg.style.display = 'none'; }

  const body = { id };

  const titleEl = document.getElementById('ea-title');
  const descEl  = document.getElementById('ea-desc');
  const condEl  = document.getElementById('ea-cond');
  const priceEl = document.getElementById('ea-price');
  const negEl   = document.getElementById('ea-neg');

  if (titleEl) body.title       = titleEl.value.trim();
  if (descEl)  body.description = descEl.value.trim();
  if (condEl)  body.cond        = condEl.value;
  if (priceEl) body.price       = Math.max(0, Number(priceEl.value) || 0);
  if (negEl)   body.neg         = negEl.checked;

  body.photos = [...window._editExistingPhotos, ...window._editPhotos];

  try {
    const token = (await _sb.auth.getSession()).data.session?.access_token || '';
    const r = await fetch('/api/edit-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!j.ok) {
      if (msg) { msg.textContent = j.error || 'Save failed.'; msg.style.color = '#c0392b'; msg.style.display = 'block'; }
      if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
      return;
    }
    /* Update local LISTINGS so UI reflects change immediately */
    const listing = LISTINGS.find(l => String(l.id) === String(id));
    if (listing) {
      if (body.title)       listing.title       = body.title;
      if (body.description) listing.description = body.description;
      if (body.cond)        listing.cond        = body.cond;
      if (body.price !== undefined) listing.price = body.price;
      if (body.neg  !== undefined)  listing.neg   = body.neg;
      if (body.photos)      listing.photos      = body.photos;
    }
    renderAll('all');
    if (msg) { msg.textContent = 'Changes saved!'; msg.style.color = '#1A7A42'; msg.style.display = 'block'; }
    if (btn) { btn.textContent = 'Saved ✓'; }
    setTimeout(() => { closeModal(); openMyAds(); }, 1200);
  } catch(e) {
    if (msg) { msg.textContent = 'Error: ' + e.message; msg.style.color = '#c0392b'; msg.style.display = 'block'; }
    if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
  }
};

/* ── Info modals (footer links) ── */
function openInfoModal(key) {
  const builders = {
    'buy-safe': _infoStaticPage.bind(null, 'How to Buy Safely', `
      <div class="info-section"><div class="info-step-num">1</div><h4>Meet in a safe public place</h4><p>Always meet the seller in a busy, well-lit public area — a shopping centre, petrol station, or police station. Never at a private home for a first meeting.</p></div>
      <div class="info-section"><div class="info-step-num">2</div><h4>Inspect before you pay</h4><p>Test electronics, check vehicle papers, and try on clothing. Never pay a deposit without seeing the item in person first.</p></div>
      <div class="info-section"><div class="info-step-num">3</div><h4>Use secure payment</h4><p>Pay via EFT to a verified account or use cash. Avoid sending money via crypto, gift cards, or third-party apps to strangers.</p></div>
      <div class="info-section"><div class="info-step-num">4</div><h4>Verify the seller</h4><p>Ask for a SA ID. Look for the <strong>Verified</strong> badge on listings — those sellers have completed our identity check.</p></div>
      <div class="info-section"><div class="info-step-num">5</div><h4>Trust your instincts</h4><p>If a deal feels too good to be true, it probably is. Walk away from pressure tactics or any request for upfront fees before delivery.</p></div>`),

    'safety-tips': _infoStaticPage.bind(null, 'Safety Tips', `
      <div class="info-section"><h4>🔒 Protect your accounts</h4><p>Never share your banking PIN, OTP, or password with anyone. Everything Market will never ask for your password via message or call.</p></div>
      <div class="info-section"><h4>🚗 Vehicle scams</h4><p>Be wary of vehicles priced far below market value. Always check the VIN number, get an AA inspection, and confirm ownership papers match the seller's ID.</p></div>
      <div class="info-section"><h4>🏠 Property & rentals</h4><p>Visit the property in person before paying anything. Ask for a signed lease agreement and confirm the landlord owns the property via the deeds office.</p></div>
      <div class="info-section"><h4>📦 Delivery scams</h4><p>Avoid sellers who insist on upfront payment for delivery before you've seen the item. Legitimate sellers will meet you or use a trackable courier.</p></div>
      <div class="info-section"><h4>⚑ Report suspicious ads</h4><p>Tap <strong>Report this ad</strong> on any listing. Our team reviews and removes fraudulent ads within 24 hours.</p></div>`),

    'buyer-protection': _infoStaticPage.bind(null, 'Buyer Protection', `
      <div class="info-section"><h4>Our commitment</h4><p>Everything Market is free for buyers and sellers. We actively monitor listings and remove fraudulent ads quickly.</p></div>
      <div class="info-section"><h4>✅ Verified sellers</h4><p>The <strong>Verified</strong> badge means the seller has submitted valid South African ID. Always prefer verified sellers for high-value purchases.</p></div>
      <div class="info-section"><h4>⚑ Report & remove</h4><p>Fraudulent or misleading ads are removed within 24 hours of being reported. Use the <strong>Report this ad</strong> button inside any listing.</p></div>
      <div class="info-section"><h4>🛡️ Safe trading checklist</h4><ul class="info-list"><li>Inspect items before paying</li><li>Meet in public, never alone</li><li>Pay via EFT or cash only</li><li>Never pay a deposit before seeing the item</li><li>Check seller's ID for high-value items</li></ul></div>`),

    'privacy': _infoStaticPage.bind(null, 'Privacy Policy', `
      <div class="info-section"><h4>Who we are</h4><p>Everything Market is a South African online classifieds marketplace that helps buyers, sellers and approved stores connect across South Africa.</p></div>
      <div class="info-section"><h4>Information we collect</h4><p>We may collect account details, listing information, photos, contact details, messages, device/browser data, analytics events, verification information, store application details and payment/boosting references where relevant.</p></div>
      <div class="info-section"><h4>How we use information</h4><ul class="info-list"><li>To publish and manage listings</li><li>To help buyers contact sellers</li><li>To prevent spam, scams and abuse</li><li>To verify users, sellers and stores</li><li>To improve search, safety, analytics and support</li><li>To send service messages about accounts, listings or enquiries</li></ul></div>
      <div class="info-section"><h4>Sharing and storage</h4><p>We share information only where needed to operate the marketplace, provide hosting, analytics, email, verification, payment or safety services, comply with law, or protect users. We do not sell personal information.</p></div>
      <div class="info-section"><h4>Your rights</h4><p>Under POPIA you may ask to access, correct or delete your personal information, subject to legal and safety retention requirements. Contact us through the Contact Us page for privacy requests.</p></div>
      <div class="info-section"><h4>Security</h4><p>We use reasonable technical and organisational measures to protect information, but users should avoid sharing passwords, OTPs, banking PINs or sensitive documents in listing chats.</p></div>
      <div class="info-section"><h4>Last updated</h4><p>23 August 2026.</p></div>`),

    'terms': _infoStaticPage.bind(null, 'Terms & Conditions', `
      <div class="info-section"><h4>Using Everything Market</h4><p>By using Everything Market, you agree to use the service lawfully, honestly and respectfully. You are responsible for your account, listings, messages and transactions.</p></div>
      <div class="info-section"><h4>Listings</h4><ul class="info-list"><li>Listings must be accurate and must not be misleading</li><li>You may not post illegal, stolen, counterfeit, unsafe or prohibited items</li><li>Photos and descriptions must belong to you or be used with permission</li><li>We may remove, edit, reject or demote listings that break these terms or create risk</li></ul></div>
      <div class="info-section"><h4>Transactions</h4><p>Everything Market connects buyers and sellers but is not a party to private transactions unless a specific paid service says otherwise. Buyers and sellers must inspect goods, agree payment and comply with applicable law.</p></div>
      <div class="info-section"><h4>Safety and verification</h4><p>Verification badges are trust signals, not guarantees. Always meet safely, inspect before paying and report suspicious conduct.</p></div>
      <div class="info-section"><h4>Paid promotions</h4><p>Boosted or sponsored listings may receive extra visibility. Payment does not guarantee a sale and does not permit misleading or unsafe listings.</p></div>
      <div class="info-section"><h4>Limitation</h4><p>To the extent allowed by South African law, Everything Market is not liable for user conduct, failed deals, losses, inaccurate listings, third-party services or indirect damages.</p></div>
      <div class="info-section"><h4>Last updated</h4><p>23 August 2026.</p></div>`),

    'paia': _infoStaticPage.bind(null, 'PAIA Manual', `
      <div class="info-section"><h4>Purpose</h4><p>This PAIA manual explains how people may request access to records held by Everything Market in line with the Promotion of Access to Information Act, 2000 and related South African privacy laws.</p></div>
      <div class="info-section"><h4>Business details</h4><p><strong>Entity:</strong> Everything Market (Pty) Ltd<br><strong>Website:</strong> www.everythingmarket.co.za<br><strong>Country:</strong> South Africa</p></div>
      <div class="info-section"><h4>Information officer</h4><p>Requests may be sent through the Contact Us page. Use the subject "PAIA request" and include your full name, contact details, the record requested, your right or reason for access, and preferred format.</p></div>
      <div class="info-section"><h4>Records we may hold</h4><ul class="info-list"><li>Company administration records</li><li>User account and listing records</li><li>Store application and verification records</li><li>Support, safety and scam-report records</li><li>Technical, analytics and security logs</li><li>Supplier, hosting, payment and operational records</li></ul></div>
      <div class="info-section"><h4>Access process</h4><p>We may ask for identity confirmation, charge prescribed fees where allowed, refuse requests permitted by law, or redact third-party personal information. We aim to respond within the time periods required by PAIA.</p></div>
      <div class="info-section"><h4>POPIA requests</h4><p>Data subjects may request access to, correction of, or deletion of personal information where legally permitted.</p></div>
      <div class="info-section"><h4>Last updated</h4><p>23 August 2026.</p></div>`),

    'report-scam': () => {
      modalBox.innerHTML = `
        <div class="em-modal-bar"><h3>Report a Scam</h3><button class="em-modal-close" onclick="closeModal()">&#x2715;</button></div>
        <div class="info-modal-body">
          <div class="info-section"><p>Tell us what happened and we'll investigate immediately. All reports are reviewed by our safety team.</p></div>
          <div class="em-post-field" style="margin-top:4px">
            <label class="em-post-label" for="sc-name">Your name <span>(required)</span></label>
            <input class="em-post-input" id="sc-name" type="text" placeholder="e.g. Sipho Dlamini">
          </div>
          <div class="em-post-field">
            <label class="em-post-label" for="sc-email">Your email <span>(so we can follow up)</span></label>
            <input class="em-post-input" id="sc-email" type="email" placeholder="you@example.com">
          </div>
          <div class="em-post-field">
            <label class="em-post-label" for="sc-type">Type of scam</label>
            <select class="em-post-select" id="sc-type">
              <option value="">Select a type…</option>
              <option>Fake listing / item never delivered</option>
              <option>Upfront payment scam</option>
              <option>Vehicle / property fraud</option>
              <option>Impersonation of a seller</option>
              <option>Phishing / fake website link</option>
              <option>Other</option>
            </select>
          </div>
          <div class="em-post-field">
            <label class="em-post-label" for="sc-desc">Describe what happened <span>(required)</span></label>
            <textarea class="em-post-input" id="sc-desc" rows="4" placeholder="Include the ad title, seller name, amount lost (if any), and how the scam happened…" style="resize:vertical;height:90px;"></textarea>
          </div>
          <div id="sc-err" class="em-post-error" style="display:none;"></div>
          <button class="em-post-submit" onclick="_submitScamReport()">Submit Report</button>
        </div>`;
      _openModal();
    },

    'seller-tips': _infoStaticPage.bind(null, 'Seller Tips', `
      <div class="info-section"><h4>📸 Take great photos</h4><p>Listings with clear, well-lit photos get up to 5× more views. Use natural light, a plain background, and shoot from multiple angles. The first photo is your cover image.</p></div>
      <div class="info-section"><h4>✍️ Write an honest description</h4><p>Include brand, model, size, age, and any defects. Buyers trust honest sellers — you'll get fewer time-wasters and better offers.</p></div>
      <div class="info-section"><h4>💰 Price it right</h4><p>Search Everything Market for similar items in your area. A fair price sells faster than holding out for top rand.</p></div>
      <div class="info-section"><h4>⚡ Respond fast</h4><p>Buyers move on quickly. Aim to reply within an hour. Check your Everything Market inbox regularly so you never miss an enquiry.</p></div>
      <div class="info-section"><h4>🔄 Refresh your ad</h4><p>Delete and repost your ad if it's been up for more than 2 weeks without a sale — fresh listings appear higher in results.</p></div>
      <div class="info-section"><h4>🛡️ Stay safe</h4><p>Meet buyers in public places. Bring a friend for high-value items. Only share your phone number with serious buyers.</p></div>
      <div style="padding:16px 0 4px;"><button class="em-post-submit" onclick="closeModal();openPostAdModal()">Post a Free Ad Now</button></div>`),

    'pricing-guide': _infoStaticPage.bind(null, 'Pricing Guide', `
      <div class="info-section"><h4>Research before you list</h4><p>Browse the same category on Everything Market to see what similar items are selling for right now in your area.</p></div>
      <div class="info-section"><h4>Condition affects value</h4>
        <div class="info-price-table">
          <div class="info-price-row"><span class="info-cond-badge" style="background:#E8F5E9;color:#2E7D32">New / sealed</span><span class="info-price-pct">80–95% of retail</span></div>
          <div class="info-price-row"><span class="info-cond-badge" style="background:#E3F0FF;color:#1565C0">Used – Like New</span><span class="info-price-pct">60–80% of retail</span></div>
          <div class="info-price-row"><span class="info-cond-badge" style="background:#FFF8E1;color:#F57F17">Used – Good</span><span class="info-price-pct">40–60% of retail</span></div>
          <div class="info-price-row"><span class="info-cond-badge" style="background:#FBE9E7;color:#BF360C">Used – Fair</span><span class="info-price-pct">20–40% of retail</span></div>
        </div>
      </div>
      <div class="info-section"><h4>Mark as Negotiable</h4><p>Ticking <strong>Negotiable</strong> on your listing attracts more enquiries and lets buyers feel confident making an offer.</p></div>
      <div class="info-section"><h4>High-value items</h4><p>For cars, property, and electronics over R5 000, include a detailed description and multiple photos — buyers will pay more for well-presented listings.</p></div>
      <div class="info-section"><h4>Free to list</h4><p>All ads on Everything Market are completely free. No commission, no listing fees, no catches — ever.</p></div>`),

    'advertise': () => {
      modalBox.innerHTML = `
        <div class="em-modal-bar"><h3>Advertise with Us</h3><button class="em-modal-close" onclick="closeModal()">&#x2715;</button></div>
        <div class="info-modal-body">
          <div class="info-section">
            <div class="info-adv-options">
              <div class="info-adv-card"><div class="info-adv-icon">📌</div><strong>Sponsored Listings</strong><p>Your ad appears at the top of search results and category pages across South Africa.</p></div>
              <div class="info-adv-card"><div class="info-adv-icon">🏷️</div><strong>Featured Badge</strong><p>Stand out with a Featured badge that makes your listing impossible to miss.</p></div>
              <div class="info-adv-card"><div class="info-adv-icon">📢</div><strong>Banner Ads</strong><p>Reach thousands of South African buyers with banner placements on the homepage.</p></div>
            </div>
          </div>
          <div class="info-section"><p style="font-weight:700;font-size:13px;color:var(--ink);margin-bottom:12px">Send us your enquiry and we'll get back to you within 24 hours.</p>
            <div class="em-post-field">
              <label class="em-post-label" for="adv-biz">Business / brand name <span>(required)</span></label>
              <input class="em-post-input" id="adv-biz" type="text" placeholder="e.g. Motus Ford Johannesburg">
            </div>
            <div class="em-post-field">
              <label class="em-post-label" for="adv-email">Your email <span>(required)</span></label>
              <input class="em-post-input" id="adv-email" type="email" placeholder="you@yourbusiness.co.za">
            </div>
            <div class="em-post-field">
              <label class="em-post-label" for="adv-phone">Phone number</label>
              <input class="em-post-input" id="adv-phone" type="tel" placeholder="082 123 4567">
            </div>
            <div class="em-post-field">
              <label class="em-post-label" for="adv-msg">What would you like to advertise?</label>
              <textarea class="em-post-input" id="adv-msg" rows="3" placeholder="Describe your product, service, or campaign…" style="resize:vertical;height:72px;"></textarea>
            </div>
            <div id="adv-err" class="em-post-error" style="display:none;"></div>
            <button class="em-post-submit" onclick="_submitAdvertiseEnquiry()">Send Enquiry</button>
          </div>
        </div>`;
      _openModal();
    },

    'about': _infoStaticPage.bind(null, 'About Everything Market', `
      <div class="info-section" style="text-align:center;padding:20px 0 10px;">
        <div style="font-size:28px;font-weight:900;color:var(--forest);letter-spacing:-.03em;">Everything <span style="color:var(--leaf)">Market</span></div>
        <p style="margin-top:8px;font-size:13px;color:var(--muted);">South Africa's free online classifieds marketplace</p>
      </div>
      <div class="info-section"><p>Everything Market connects South Africans to buy and sell anything — from cars and property to electronics, fashion, jobs, and services — safely and completely free.</p></div>
      <div class="info-section"><h4>🇿🇦 Proudly South African</h4><p>We are built for local communities across all nine provinces. Whether you're in Johannesburg, Cape Town, Durban, or a small town in the Karoo — Everything Market is for you.</p></div>
      <div class="info-section"><h4>Our mission</h4><p>To make buying and selling simple, safe, and accessible to every South African, no matter where they live or what device they use.</p></div>
      <div class="info-section"><h4>Why free?</h4><p>We believe everyone deserves the chance to sell their goods and find great deals without paying listing fees or commissions. Everything Market will always be free to use.</p></div>
      <div class="info-section">
        <div class="info-stats">
          <div class="info-stat"><strong>9</strong><span>Provinces</span></div>
          <div class="info-stat"><strong>Free</strong><span>Always</span></div>
          <div class="info-stat"><strong>24h</strong><span>Support</span></div>
        </div>
      </div>`),

    'contact': () => {
      modalBox.innerHTML = `
        <div class="em-modal-bar"><h3>Contact Us</h3><button class="em-modal-close" onclick="closeModal()">&#x2715;</button></div>
        <div class="info-modal-body">
          <div class="info-section"><p>Fill in the form below and our team will get back to you within 24 hours.</p></div>
          <div class="em-post-field">
            <label class="em-post-label" for="ct-name">Your name <span>(required)</span></label>
            <input class="em-post-input" id="ct-name" type="text" placeholder="e.g. Thabo Nkosi">
          </div>
          <div class="em-post-field">
            <label class="em-post-label" for="ct-email">Email address <span>(required)</span></label>
            <input class="em-post-input" id="ct-email" type="email" placeholder="you@example.com">
          </div>
          <div class="em-post-field">
            <label class="em-post-label" for="ct-subject">Subject</label>
            <select class="em-post-select" id="ct-subject">
              <option value="General">General enquiry</option>
              <option value="Safety">Safety concern</option>
              <option value="Account">Account help</option>
              <option value="Ad">Problem with an ad</option>
              <option value="Business">Business / partnership</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="em-post-field">
            <label class="em-post-label" for="ct-msg">Message <span>(required)</span></label>
            <textarea class="em-post-input" id="ct-msg" rows="4" placeholder="How can we help you?" style="resize:vertical;height:90px;"></textarea>
          </div>
          <div id="ct-err" class="em-post-error" style="display:none;"></div>
          <button class="em-post-submit" onclick="_submitContactForm()">Send Message</button>
        </div>`;
      _openModal();
    },

    'careers': () => {
      modalBox.innerHTML = `
        <div class="em-modal-bar"><h3>Careers</h3><button class="em-modal-close" onclick="closeModal()">&#x2715;</button></div>
        <div class="info-modal-body">
          <div class="info-section"><p>We're a fast-growing South African startup. Join us and help build the country's best marketplace.</p></div>
          <div class="info-section">
            <h4>Open positions</h4>
            <div class="info-job-list">
              <div class="info-job-card">
                <div class="info-job-title">Customer Support Agent</div>
                <div class="info-job-meta">Remote · Full-time · Cape Town / Johannesburg</div>
                <p>Help our buyers and sellers resolve issues quickly. Must be fluent in English and at least one other SA language.</p>
                <button class="info-job-apply" onclick="_openCareerApply('Customer Support Agent')">Apply Now</button>
              </div>
              <div class="info-job-card">
                <div class="info-job-title">Social Media & Marketing</div>
                <div class="info-job-meta">Remote · Part-time or Full-time</div>
                <p>Grow our presence on Instagram, TikTok, and Facebook. Creative, data-driven, and knows the South African market.</p>
                <button class="info-job-apply" onclick="_openCareerApply('Social Media & Marketing')">Apply Now</button>
              </div>
              <div class="info-job-card">
                <div class="info-job-title">Sales Representative</div>
                <div class="info-job-meta">Field-based · Gauteng / Western Cape</div>
                <p>Sign up dealerships and businesses as verified sellers on Everything Market. Commission-based with strong earning potential.</p>
                <button class="info-job-apply" onclick="_openCareerApply('Sales Representative')">Apply Now</button>
              </div>
            </div>
          </div>
        </div>`;
      _openModal();
    },

    'press': _infoStaticPage.bind(null, 'Press & Media', `
      <div class="info-section"><h4>About Everything Market</h4><p>Everything Market is South Africa's free online classifieds platform, connecting buyers and sellers across all nine provinces for free.</p></div>
      <div class="info-section"><h4>Key facts</h4><ul class="info-list"><li>Founded: 2025</li><li>Headquarters: South Africa</li><li>Coverage: All 9 provinces</li><li>Listing fee: Free (always)</li><li>Categories: Cars, Property, Electronics, Fashion, Jobs, Pets, Home, Baby & Kids, and more</li></ul></div>
      <div class="info-section"><h4>Brand assets</h4><p>Our brand name is <strong>Everything Market</strong>. Our primary colour is forest green <span style="display:inline-block;width:14px;height:14px;background:#2D6A4F;border-radius:3px;vertical-align:middle;margin-left:4px;"></span>. Please do not alter our logo or name in press coverage.</p></div>
      <div class="info-section"><h4>Media enquiries</h4><p>For interviews, quotes, or media partnerships, tap the <strong>Contact Us</strong> button below and select <em>Business / partnership</em> as the subject.</p>
        <button class="em-post-submit" style="margin-top:14px;" onclick="openInfoModal('contact')">Contact Us</button>
      </div>`),

    'blog': _infoStaticPage.bind(null, 'Blog', `
      <div class="info-blog-post">
        <div class="info-blog-tag">Selling Tips</div>
        <h4>5 Photos That Sell Your Item Faster</h4>
        <p>The single biggest difference between a listing that sells in 24 hours and one that sits for weeks? Photos. Buyers decide in seconds whether to click. Here's how to nail it every time: shoot in natural daylight near a window, use a plain white or neutral background, photograph every angle, show any damage honestly, and make the first photo your best one.</p>
      </div>
      <div class="info-blog-post">
        <div class="info-blog-tag">Buying Guide</div>
        <h4>How to Spot a Fake Listing Before You Lose Money</h4>
        <p>Red flags to watch for: prices that are 40%+ below market value, sellers who only communicate via WhatsApp and refuse calls, requests for upfront EFT before you've seen the item, and stock photos instead of real images. Always reverse-image-search the photos and meet in person before paying a cent.</p>
      </div>
      <div class="info-blog-post">
        <div class="info-blog-tag">Market Trends</div>
        <h4>What's Selling Fast in South Africa Right Now</h4>
        <p>Based on our listings data, the fastest-moving categories this month are: smartphones (especially Samsung and iPhone), small appliances, baby gear, and second-hand school uniforms. If you have any of these, list them now — buyers are actively looking.</p>
      </div>
      <div style="padding:10px 0 4px;text-align:center;">
        <button class="em-post-submit" onclick="closeModal();openPostAdModal()">Post a Free Ad</button>
      </div>`),
  };

  const builder = builders[key];
  if (!builder) return;
  builder();
}

function _infoStaticPage(title, html) {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>${title}</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="info-modal-body">${html}</div>`;
  _openModal();
}

function _infoConfirm(title, msg) {
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="em-confirm-title">${title}</div>
      <div class="em-confirm-sub">${msg}</div>
      <button class="em-confirm-close" onclick="closeModal()">Done</button>
    </div>`;
}

function _submitContactForm() {
  const name    = (document.getElementById('ct-name').value || '').trim();
  const email   = (document.getElementById('ct-email').value || '').trim();
  const subject = document.getElementById('ct-subject').value;
  const msg     = (document.getElementById('ct-msg').value || '').trim();
  const errEl   = document.getElementById('ct-err');
  if (!name || !email || !msg) { errEl.textContent = 'Please fill in all required fields.'; errEl.style.display = ''; return; }
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  if (window.emTrack) emTrack('contact_form', { name, email, subject, msg: msg.slice(0, 400) });
  _infoConfirm('Message Sent!', 'Thanks ' + name.split(' ')[0] + '! We\'ve received your message and will get back to you within 24 hours.');
}

function _submitScamReport() {
  const name  = (document.getElementById('sc-name').value || '').trim();
  const email = (document.getElementById('sc-email').value || '').trim();
  const type  = document.getElementById('sc-type').value;
  const desc  = (document.getElementById('sc-desc').value || '').trim();
  const errEl = document.getElementById('sc-err');
  if (!name || !desc) { errEl.textContent = 'Please fill in your name and describe what happened.'; errEl.style.display = ''; return; }
  if (window.emReport) emReport('SCAM', 'General scam report', (type || 'Other') + ' — ' + desc.slice(0, 300));
  if (window.emTrack) emTrack('scam_report', { name, email, type, desc: desc.slice(0, 300) });
  _infoConfirm('Report Submitted', 'Thank you ' + name.split(' ')[0] + '. Our safety team will investigate and take action within 24 hours.');
}

function _submitAdvertiseEnquiry() {
  const biz   = (document.getElementById('adv-biz').value || '').trim();
  const email = (document.getElementById('adv-email').value || '').trim();
  const phone = (document.getElementById('adv-phone').value || '').trim();
  const msg   = (document.getElementById('adv-msg').value || '').trim();
  const errEl = document.getElementById('adv-err');
  if (!biz || !email) { errEl.textContent = 'Business name and email are required.'; errEl.style.display = ''; return; }
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  if (window.emTrack) emTrack('advertise_enquiry', { biz, email, phone, msg: msg.slice(0, 300) });
  _infoConfirm('Enquiry Received!', 'Thanks ' + biz + '! Our team will be in touch within 24 hours to discuss advertising options.');
}

window._openCareerApply = function(role) {
  modalBox.innerHTML = `
    <div class="em-modal-bar"><h3>Apply: ${role}</h3><button class="em-modal-close" onclick="closeModal()">&#x2715;</button></div>
    <div class="info-modal-body">
      <div class="em-post-field">
        <label class="em-post-label" for="cv-name">Full name <span>(required)</span></label>
        <input class="em-post-input" id="cv-name" type="text" placeholder="e.g. Nompumelelo Dlamini">
      </div>
      <div class="em-post-field">
        <label class="em-post-label" for="cv-email">Email address <span>(required)</span></label>
        <input class="em-post-input" id="cv-email" type="email" placeholder="you@example.com">
      </div>
      <div class="em-post-field">
        <label class="em-post-label" for="cv-phone">Phone number</label>
        <input class="em-post-input" id="cv-phone" type="tel" placeholder="082 123 4567">
      </div>
      <div class="em-post-field">
        <label class="em-post-label" for="cv-why">Why do you want this role? <span>(required)</span></label>
        <textarea class="em-post-input" id="cv-why" rows="4" placeholder="Tell us about yourself and why you'd be great for this role…" style="resize:vertical;height:90px;"></textarea>
      </div>
      <div id="cv-err" class="em-post-error" style="display:none;"></div>
      <button class="em-post-submit" onclick="_submitCareerForm('${role.replace(/'/g,"\\'")}')">Submit Application</button>
    </div>`;
};

function _submitCareerForm(role) {
  const name  = (document.getElementById('cv-name').value || '').trim();
  const email = (document.getElementById('cv-email').value || '').trim();
  const phone = (document.getElementById('cv-phone').value || '').trim();
  const why   = (document.getElementById('cv-why').value || '').trim();
  const errEl = document.getElementById('cv-err');
  if (!name || !email || !why) { errEl.textContent = 'Please fill in all required fields.'; errEl.style.display = ''; return; }
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  if (window.emTrack) emTrack('career_application', { role, name, email, phone, why: why.slice(0, 400) });
  _infoConfirm('Application Received!', 'Thanks ' + name.split(' ')[0] + '! We\'ll review your application and get back to you within 5 business days.');
}
