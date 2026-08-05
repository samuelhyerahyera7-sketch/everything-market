/* ── Wishlist ── */
let wl = new Set(JSON.parse(localStorage.getItem('em_wl2') || '[]'));
function toggleWL(id, btn) {
  wl.has(id) ? wl.delete(id) : wl.add(id);
  localStorage.setItem('em_wl2', JSON.stringify([...wl]));
  btn.classList.toggle('on', wl.has(id));
}

/* ── Price formatting ── */
function fmtPrice(l, large) {
  if (l.price === 0) return large
    ? '<span class="bb-price-free">Free / Contact for Price</span>'
    : '<span class="gt-price-free">Free / Contact for Price</span>';
  const r = 'R ' + l.price.toLocaleString('en-ZA');
  const neg = l.neg ? (large ? '<span class="bb-neg">neg.</span>' : '<span class="gt-neg">neg.</span>') : '';
  return large
    ? `<span class="bb-price-val">${r}</span>${neg}`
    : `<span class="gt-price-val">${r}</span>${neg}`;
}

/* ── User ads: load from localStorage and prepend ── */
function _loadUserAds() {
  try {
    const saved = JSON.parse(localStorage.getItem('em_user_ads') || '[]');
    saved.slice().reverse().forEach(ad => {
      if (!LISTINGS.find(l => String(l.id) === String(ad.id))) LISTINGS.unshift(ad);
    });
  } catch(e) {}
}

function _saveUserAds() {
  try {
    const userAds = LISTINGS.filter(l => l.isUserAd);
    localStorage.setItem('em_user_ads', JSON.stringify(userAds));
  } catch(e) {}
}

/* ── Load ads from Supabase and merge into LISTINGS ── */
async function _loadSupabaseAds() {
  if (!window.emLoadAds) return;
  try {
    const remoteAds = await window.emLoadAds();
    let added = 0;
    remoteAds.forEach(ad => {
      if (!LISTINGS.find(l => String(l.id) === String(ad.id))) {
        LISTINGS.push(ad);
        added++;
      }
    });
    if (added > 0) renderAll('all');
  } catch(_) {}
}

_loadUserAds();

/* ── Image helper ── */
function _renderImg(el, l) {
  if (l.photos && l.photos.length > 0) {
    const img = document.createElement('img');
    img.src = l.photos[0];
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.alt = l.title;
    img.onerror = () => { img.remove(); if (l.art) el.appendChild(drawSVG(l.art)); };
    el.appendChild(img);
  } else if (l.art) {
    el.appendChild(drawSVG(l.art));
  }
}

/* ── Sponsored Ads ── */
const SPONSORED = [
  { title:'Samsung Galaxy S24 Ultra', price:'R 18 999', tag:'Electronics', loc:'Sandton, Gauteng', img:'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=260&fit=crop&auto=format' },
  { title:'2022 Toyota Hilux 2.8 GD-6', price:'R 649 900', tag:'Cars & Bakkies', loc:'Pretoria, Gauteng', img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=260&fit=crop&auto=format' },
  { title:'3 Bedroom House – Sandton', price:'R 2 450 000', tag:'Property', loc:'Sandton, Gauteng', img:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=260&fit=crop&auto=format' },
];
(function() {
  const grid = document.getElementById('spons-grid');
  if (!grid) return;
  SPONSORED.forEach(s => {
    const card = document.createElement('div');
    card.className = 'spons-card';
    card.onclick = () => toast('Opening sponsored ad…');
    card.innerHTML = `
      <div style="position:relative;">
        <img src="${s.img}" alt="${s.title}" class="spons-img" loading="lazy">
        <span class="spons-ad-badge">Ad</span>
      </div>
      <div class="spons-body">
        <div class="spons-tag">${s.tag}</div>
        <div class="spons-title">${s.title}</div>
        <div class="spons-price">${s.price}</div>
        <div class="spons-loc">${s.loc}</div>
      </div>`;
    grid.appendChild(card);
  });
})();

/* ── Shop by Category ── */
const scatGrid = document.getElementById('shopcat-grid');
CATS.filter(c => c.id !== 'all').forEach(cat => {
  const card = document.createElement('a');
  card.href = '#';
  card.className = 'scat-card';
  card.onclick = e => { e.preventDefault(); openCategoryPage(cat.id, cat.name); };
  card.innerHTML = `
    <div class="scat-img-wrap"><img src="${cat.img}" alt="${cat.name}" class="scat-img" loading="lazy" onerror="this.parentElement.style.background='#e8e6e0'"></div>
    <div class="scat-name">${cat.name}</div>`;
  scatGrid.appendChild(card);
});

/* ── Category Page ── */
let _catId = 'all', _catName = 'All Ads', _searchQuery = '';

function _getCatListings() {
  let data = _catId === 'all' ? LISTINGS : LISTINGS.filter(l => l.cat === _catId);
  if (_searchQuery) {
    const q = _searchQuery;
    data = data.filter(l => (l.title + ' ' + (l.desc || '')).toLowerCase().includes(q));
  }
  return data;
}

function _openResultsPage(title) {
  document.getElementById('cat-page-title').textContent = title;
  /* Position the overlay right below the actual header (topbar + header combined) */
  const hdrBottom = Math.round(document.querySelector('.hdr').getBoundingClientRect().bottom);
  const catPage = document.getElementById('cat-page');
  catPage.style.top = hdrBottom + 'px';
  catPage.style.height = `calc(100vh - ${hdrBottom}px)`;
  catPage.style.display = 'block';
  catPage.scrollTop = 0;
  document.getElementById('cf-min').value = '';
  document.getElementById('cf-max').value = '';
  document.querySelectorAll('.cf-cond').forEach(el => { el.checked = false; });
  document.getElementById('cf-sort').value = 'newest';
  if (!_catLocked && !_modalLocked) _applyLock();
  _catLocked = true;
}

function openCategoryPage(catId, catName) {
  _catId = catId;
  _catName = catName;
  _searchQuery = '';
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
  _openResultsPage('Ads in ' + province);
  const locEl = document.getElementById('cf-loc');
  if (locEl) locEl.value = '';
  const allListings = _getCatListings();
  const filtered = allListings.filter(l => (l.loc || '').toLowerCase().includes(province.toLowerCase()));
  if (filtered.length > 0) {
    if (locEl) locEl.value = province;
    renderCatResults(filtered);
  } else {
    renderCatResults(allListings);
  }
  if (window.emTrack) emTrack('province_view', { province });
}

function runSearch() {
  const q    = (document.getElementById('main-search').value || '').trim();
  const prov = (document.getElementById('srch-loc')?.value || '');
  if (!q && !prov) { toast('Enter something to search for.'); return; }

  _catId = 'all';
  _searchQuery = q.toLowerCase();

  const title = q && prov ? `"${q}" in ${prov}` : q ? `Results for "${q}"` : `Ads in ${prov}`;
  _openResultsPage(title);

  const locEl = document.getElementById('cf-loc');
  if (locEl) locEl.value = prov;

  applyCatFilters();
  document.getElementById('ac-drop')?.classList.remove('open');

  if (window.emTrack && q) emTrack('search', { q: q.slice(0, 60) });
}

function closeCategoryPage() {
  document.getElementById('cat-page').style.display = 'none';
  _searchQuery = '';
  _catLocked = false;
  if (!_modalLocked) _removeLock();
}

function applyCatFilters() {
  const minV  = Number(document.getElementById('cf-min').value) || 0;
  const maxV  = Number(document.getElementById('cf-max').value) || Infinity;
  const conds = [...document.querySelectorAll('.cf-cond:checked')].map(el => el.value);
  const sort  = document.getElementById('cf-sort').value;
  const loc   = (document.getElementById('cf-loc').value || '').trim().toLowerCase();

  let data = _getCatListings().filter(l => {
    if (l.price !== 0 && l.price < minV) return false;
    if (maxV !== Infinity && l.price > maxV) return false;
    if (conds.length && !conds.includes(l.cond)) return false;
    if (loc && !(l.loc || '').toLowerCase().includes(loc)) return false;
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

function renderCatResults(data) {
  const container = document.getElementById('cat-results');
  if (!data.length) {
    container.innerHTML = '<div class="cat-empty">No ads found in this category yet. Be the first to post one!</div>';
    return;
  }
  container.innerHTML = '';
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
          <span>${ICO.pin} ${l.loc}</span>
          ${timeStr ? `<span>${ICO.time} ${timeStr}</span>` : ''}
        </div>
        <div class="bb-actions">
          <button class="btn-view" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id===${l.id}))">Contact Seller</button>
        </div>
      </div>`;
    container.appendChild(card);
    _renderImg(card.querySelector(`#cr-img-${l.id}`), l);
  });
}

/* ── Autocomplete ── */
(function() {
  const input = document.getElementById('main-search');
  const drop = document.getElementById('ac-drop');
  if (!input || !drop) return;

  const STATIC = [
    { text:'Cars & Bakkies', cat:'cars' },
    { text:'Property for Sale', cat:'prop' },
    { text:'Electronics', cat:'elec' },
    { text:'Home & Garden', cat:'home' },
    { text:'Fashion', cat:'fash' },
    { text:'Jobs', cat:'jobs' },
    { text:'Pets', cat:'pets' },
    { text:'Baby & Kids', cat:'baby' },
  ];
  const CAT_LABELS = { cars:'Vehicles', prop:'Property', elec:'Electronics', home:'Home', fash:'Fashion', jobs:'Jobs', pets:'Pets', baby:'Baby & Kids' };
  let focusIdx = -1;

  function suggestions() {
    return [...LISTINGS.map(l => ({ text: l.title, cat: l.cat })), ...STATIC];
  }

  function show(q) {
    const lq = q.toLowerCase().trim();
    if (!lq) { drop.classList.remove('open'); return; }
    const hits = suggestions().filter(s => s.text.toLowerCase().includes(lq)).slice(0, 7);
    if (!hits.length) { drop.classList.remove('open'); return; }
    focusIdx = -1;
    drop.innerHTML = hits.map((s, i) =>
      `<div class="ac-item" data-idx="${i}" onclick="document.getElementById('main-search').value='${s.text.replace(/'/g,"\\'")}';drop.classList.remove('open');runSearch()">
        <span class="ac-item-text">${highlight(s.text, lq)}</span>
        ${s.cat ? `<span class="ac-item-cat">${CAT_LABELS[s.cat] || s.cat}</span>` : ''}
      </div>`
    ).join('');
    drop.classList.add('open');
  }

  function highlight(text, q) {
    const i = text.toLowerCase().indexOf(q);
    if (i === -1) return text;
    return text.slice(0, i) + '<strong>' + text.slice(i, i + q.length) + '</strong>' + text.slice(i + q.length);
  }

  input.addEventListener('input', () => show(input.value));
  input.addEventListener('focus', () => show(input.value));
  input.addEventListener('keydown', e => {
    const items = drop.querySelectorAll('.ac-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); focusIdx = Math.min(focusIdx + 1, items.length - 1); items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusIdx = Math.max(focusIdx - 1, 0); items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx)); }
    else if (e.key === 'Enter' && focusIdx >= 0) { items[focusIdx]?.click(); }
    else if (e.key === 'Escape') { drop.classList.remove('open'); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.srch-wrap')) drop.classList.remove('open'); });
})();

/* ── BidorBuy grid render ── */
function renderBB(data) {
  const grid = document.getElementById('bb-grid');
  const userAds  = data.filter(l => l.isUserAd);
  const featured = data.filter(l => l.badge && !l.isUserAd);
  const items = [...userAds.slice(0, 3), ...featured].slice(0, 6);
  const finalItems = items.length ? items : data.slice(0, 6);
  if (!finalItems.length) {
    grid.innerHTML = '<p class="em-empty-state">No ads yet. Be the first to post one!</p>';
    return;
  }
  grid.innerHTML = '';
  finalItems.forEach(l => {
    const card = document.createElement('div');
    card.className = 'bb-card';
    const ribClass = l.badge === 'Hot' ? 'r-hot' : l.badge === 'Featured' ? 'r-feat' : 'r-new';
    const sd = BB_SELLER_DATA[l.id] || { delivery: false };
    const timeStr = fmtTime(l.postedAt);
    card.innerHTML = `
      <div class="bb-img" id="bb-img-${l.id}"></div>
      ${l.badge ? `<div class="bb-ribbon ${ribClass}">${l.badge}</div>` : ''}
      <button class="bb-save${wl.has(l.id) ? ' on' : ''}" onclick="event.stopPropagation();toggleWL(${l.id},this)" aria-label="Save ad">${ICO.heart}</button>
      <div class="bb-body">
        <div class="bb-eyebrow">${l.cat}</div>
        <div class="bb-price-tag">${fmtPrice(l, true)}</div>
        <div class="bb-title">${l.title}</div>
        <div class="bb-seller-row">
          <span class="bb-seller-name">${l.seller}</span>
          <span class="stype-badge ${l.sellerType==='dealer'?'stype-dealer':'stype-private'}">${l.sellerType==='dealer'?'Dealership':'Private'}</span>
          <span class="vfy-badge ${l.verified?'vfy-yes':'vfy-no'}">${l.verified?'Verified':'Unverified'}</span>
        </div>
        ${sd.delivery ? `<div class="bb-delivery"><span class="bb-delivery-dot"></span>Delivery available</div>` : ''}
        ${l.cond !== 'N/A' ? `<div class="bb-cond" style="margin-top:3px">${l.cond}</div>` : ''}
        <div class="bb-meta" style="margin-top:4px">
          <span>${ICO.pin} ${l.loc}</span>
          ${timeStr ? `<span>${ICO.time} ${timeStr}</span>` : ''}
        </div>
        <div class="bb-actions">
          <button class="btn-view" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id==${l.id}))">Contact Seller</button>
          ${l.neg ? `<button class="btn-offer" onclick="event.stopPropagation();openMakeOffer(LISTINGS.find(x=>x.id==${l.id}))">Make Offer</button>` : ''}
          <button class="btn-wa" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id==${l.id}))">${ICO.wa}</button>
        </div>
      </div>`;
    card.onclick = () => openBuyNow(l);
    grid.appendChild(card);
    _renderImg(card.querySelector(`#bb-img-${l.id}`), l);
  });
}

/* ── Gumtree list render ── */
function renderGT(data) {
  const list = document.getElementById('gt-list');
  const items = data.slice(0, 8);
  list.innerHTML = '';
  items.forEach(l => {
    const card = document.createElement('div');
    card.className = 'gt-card';
    card.onclick = () => openBuyNow(l);
    const timeStr = fmtTime(l.postedAt);
    card.innerHTML = `
      <div class="gt-img" style="min-height:138px;" id="gt-img-${l.id}">
        <div class="gt-bdgs">
          ${l.badge ? `<span class="gt-bdg ${l.badge === 'Hot' ? 'gb-hot' : 'gb-feat'}">${l.badge}</span>` : ''}
          ${l.verified ? `<span class="gt-bdg gb-veri">Verified</span>` : ''}
        </div>
      </div>
      <div class="gt-body">
        <div class="gt-price-wrap">
          <div class="gt-price-tag">${fmtPrice(l, false)}</div>
          <button class="gt-save-btn${wl.has(l.id) ? ' on' : ''}" onclick="event.stopPropagation();toggleWL(${l.id},this)" aria-label="Save ad">${ICO.heart}</button>
        </div>
        <div class="gt-title">${l.title}</div>
        <div class="gt-desc">${l.desc}</div>
        <div class="gt-meta">
          <span>${ICO.pin} ${l.loc}</span>
          ${timeStr ? `<span>${ICO.time} ${timeStr}</span>` : ''}
        </div>
        <div class="gt-chips">
          ${l.cond !== 'N/A' ? `<span class="gt-chip">${l.cond}</span>` : ''}
          <span class="gt-chip">${l.cat.charAt(0).toUpperCase() + l.cat.slice(1)}</span>
        </div>
        <div class="gt-foot">
          <div class="gt-seller"><strong>${l.seller}</strong> <span class="stype-badge ${l.sellerType==='dealer'?'stype-dealer':'stype-private'}">${l.sellerType==='dealer'?'Dealership':'Private'}</span> <span class="vfy-badge ${l.verified?'vfy-yes':'vfy-no'}">${l.verified?'Verified':'Unverified'}</span></div>
          <button class="gt-wa-sm" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id==${l.id}))">${ICO.wa} WhatsApp</button>
        </div>
      </div>`;
    list.appendChild(card);
    _renderImg(card.querySelector(`#gt-img-${l.id}`), l);
  });
}

function renderAll(cat = 'all') {
  const data = cat === 'all' ? LISTINGS : LISTINGS.filter(l => l.cat === cat || l.cat.startsWith(cat.slice(0,3)));
  renderBB(data.length ? data : LISTINGS);
  renderGT(data.length ? data : LISTINGS);
}

renderAll('all');
_loadSupabaseAds();

/* ── Province grid ── */
const pg = document.getElementById('prov-grid');
PROVINCES.forEach(p => {
  pg.innerHTML += `<button class="prov-btn" onclick="openProvincePage('${p}')">${p} <span class="prov-arr">›</span></button>`;
});

/* ── Scroll lock — one boolean per overlay, never double-counts ── */
let _scrollLockY = 0;
let _catLocked   = false;
let _modalLocked = false;

function _applyLock() {
  _scrollLockY = window.scrollY;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}
function _removeLock() {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  window.scrollTo(0, _scrollLockY);
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

/* ── Modal system ── */
const modal = document.getElementById('em-modal');
const modalBox = modal.querySelector('.em-modal-box');

function closeModal() {
  modal.classList.remove('open');
  setTimeout(() => { modalBox.innerHTML = ''; }, 250);
  _modalLocked = false;
  if (!_catLocked) _removeLock();
}
function _openModal() {
  if (!_modalLocked && !_catLocked) _applyLock();
  _modalLocked = true;
  modal.classList.add('open');
}
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

/* ── Swipe gestures on modal ── */
(function() {
  let t0x = 0, t0y = 0;
  modalBox.addEventListener('touchstart', e => {
    t0x = e.touches[0].clientX;
    t0y = e.touches[0].clientY;
  }, { passive: true });
  modalBox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - t0x;
    const dy = e.changedTouches[0].clientY - t0y;
    const isDown = dy > 80 && dy > Math.abs(dx) * 1.5;
    const isLeft = dx < -80 && Math.abs(dx) > Math.abs(dy) * 1.5;
    if ((isDown && modalBox.scrollTop === 0) || isLeft) closeModal();
  }, { passive: true });
})();

/* ── Post Ad modal ── */
window._paPhotos = [];

function openPostAdModal() {
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
          <select class="em-post-select" id="pa-cat" onchange="_paUpdateCond(this.value)">
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
          </select>
        </div>
      </div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-price">Price (R) <span>— enter 0 for Free / Contact</span></label>
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
          <label class="em-post-label" for="pa-phone">WhatsApp / Phone <span>(required)</span></label>
          <input class="em-post-input" id="pa-phone" type="tel" placeholder="e.g. 082 123 4567" maxlength="20">
        </div>
      </div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-email">Contact Email <span>(required)</span></label>
        <input class="em-post-input" id="pa-email" type="email" placeholder="your@email.com" maxlength="120" value="${(_getSession()||{}).email||''}">
      </div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-loc">Location <span>(required)</span></label>
        <input class="em-post-input" id="pa-loc" type="text" placeholder="e.g. Sandton, Gauteng" maxlength="80">
      </div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-desc">Description <span>(required)</span></label>
        <textarea class="em-post-input" id="pa-desc" rows="4" placeholder="Describe your item — condition, what's included, any defects…" maxlength="600" style="resize:vertical;height:90px;"></textarea>
      </div>

      <div class="em-post-field">
        <label class="em-post-label">Photos <span>(up to 5 — first photo is the main image)</span></label>
        <div class="em-photo-zone" id="pa-dropzone" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="_paDrop(event)">
          <input type="file" accept="image/*" multiple id="pa-photos" onchange="_paAddPhotos(this.files);this.value=''">
          <div class="em-photo-zone-txt">
            <strong>Click to upload photos</strong>
            or drag and drop here
          </div>
        </div>
        <div class="em-photo-previews" id="pa-previews"></div>
      </div>

      <div id="pa-error" class="em-post-error" style="display:none;"></div>

      <button type="submit" class="em-post-submit">Post Ad Now</button>
    </form>`;

  _openModal();
}

window._paSetStype = function(btn) {
  document.querySelectorAll('#pa-stype .em-post-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window._paUpdateCond = function(cat) {
  const wrap = document.getElementById('pa-cond-wrap');
  const sel  = document.getElementById('pa-cond');
  if (!wrap || !sel) return;

  const noCondition  = ['jobs', 'pets'];
  const propLike     = ['prop'];
  const vehicleLike  = ['cars'];
  const fashionLike  = ['fash'];

  if (noCondition.includes(cat)) {
    wrap.style.display = 'none';
    sel.value = 'N/A';
    return;
  }
  wrap.style.display = '';

  let opts;
  if (propLike.includes(cat)) {
    opts = [['N/A', 'N/A']];
  } else if (vehicleLike.includes(cat)) {
    opts = [['New', 'New'], ['Demo', 'Demo / Ex-demo'], ['Pre-owned', 'Pre-owned']];
  } else if (fashionLike.includes(cat)) {
    opts = [['New with tags', 'New – with tags'], ['New without tags', 'New – without tags'], ['Used – Good', 'Used – Good'], ['Used – Fair', 'Used – Fair']];
  } else {
    opts = [['New', 'New'], ['Used – Like New', 'Used – Like New'], ['Used – Good', 'Used – Good'], ['Used – Fair', 'Used – Fair']];
  }

  sel.innerHTML = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  if (opts.length > 1) sel.value = opts[opts.length > 2 ? 2 : 0][0];
};

window._paAddPhotos = function(files) {
  const remaining = 5 - window._paPhotos.length;
  Array.from(files).slice(0, remaining).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      window._paPhotos.push(e.target.result);
      _paRenderPreviews();
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
  container.innerHTML = window._paPhotos.map((url, i) =>
    `<div class="em-photo-thumb-wrap">
      <img class="em-photo-thumb" src="${url}" alt="Photo ${i+1}">
      <button type="button" class="em-photo-rm" onclick="_paRemovePhoto(${i})" title="Remove">&#x2715;</button>
    </div>`
  ).join('');
  const zone = document.getElementById('pa-dropzone');
  if (zone) zone.style.display = window._paPhotos.length >= 5 ? 'none' : '';
}

function submitPostAd(e) {
  e.preventDefault();

  const title = (document.getElementById('pa-title').value || '').trim();
  const desc  = (document.getElementById('pa-desc').value  || '').trim();
  const name  = (document.getElementById('pa-name').value  || '').trim();
  const phone = (document.getElementById('pa-phone').value || '').trim();
  const email = (document.getElementById('pa-email').value || '').trim();
  const loc   = (document.getElementById('pa-loc').value   || '').trim();
  const cat   = document.getElementById('pa-cat').value;
  const cond  = document.getElementById('pa-cond').value;
  const price = Math.max(0, Number(document.getElementById('pa-price').value) || 0);
  const neg   = document.getElementById('pa-neg').checked;
  const stypeBtn = document.querySelector('#pa-stype .em-post-toggle-btn.active');
  const sellerType = stypeBtn ? stypeBtn.dataset.val : 'private';

  const errEl = document.getElementById('pa-error');
  const errors = [];
  if (!title)              errors.push('Ad title is required.');
  if (!cat)                errors.push('Please select a category.');
  if (!name)               errors.push('Your name is required.');
  if (!phone)              errors.push('WhatsApp / phone number is required.');
  if (!email || !email.includes('@')) errors.push('A valid contact email is required.');
  if (!loc)                errors.push('Location is required.');
  if (!desc)               errors.push('Description is required.');

  if (errors.length) {
    errEl.textContent = errors[0];
    errEl.style.display = '';
    return;
  }
  errEl.style.display = 'none';

  const sess = _getSession();
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
    desc,
    seller: name,
    sellerType,
    verified: false,
    photos: [...(window._paPhotos || [])],
    isUserAd: true,
    userId: sess ? sess.userId : null,
    phone,
    contactEmail: email,
  };

  LISTINGS.unshift(listing);
  _saveUserAds();
  renderAll('all');
  if (window.emTrack) emTrack('ad_post', { cat: listing.cat });

  /* Show confirmation immediately; upload to Supabase in background */
  const photoCopy = [...(window._paPhotos || [])];
  window._paPhotos = [];
  showAdPostedConfirm(listing.title);
  if (window.emStoreAd) emStoreAd({ ...listing, photos: photoCopy });
}

function showAdPostedConfirm(title) {
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--leaf)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <div class="em-confirm-title">Ad Posted!</div>
      <div class="em-confirm-sub">Your ad <strong>"${title}"</strong> is now live and visible to buyers on Everything Market.</div>
      <button class="em-confirm-close" onclick="closeModal()">Done</button>
    </div>`;
}

/* ── Ad detail / Contact modal ── */
function openBuyNow(listing) {
  if (!listing) return;
  if (window.emTrack) emTrack('ad_view', { cat: listing.cat });
  const sess     = _getSession();
  const isOwner  = sess && String(listing.userId) === String(sess.userId);
  const sd       = BB_SELLER_DATA[listing.id] || { delivery: false };
  const price    = listing.price === 0 ? 'Free / Contact' : 'R ' + listing.price.toLocaleString('en-ZA');
  const initials = listing.seller.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rawPhone = (listing.phone || '').replace(/\D/g, '');
  const phone    = rawPhone ? (rawPhone.startsWith('27') ? rawPhone : rawPhone.startsWith('0') ? '27' + rawPhone.slice(1) : '27' + rawPhone) : '';
  const waMsg    = encodeURIComponent(`Hi, I'm interested in your listing: "${listing.title}" (${price}). Is it still available?`);
  const timeStr  = fmtTime(listing.postedAt);
  const hasPhotos = listing.photos && listing.photos.length > 0;
  const safeId   = String(listing.id).replace(/'/g, '');
  const safeTitle = listing.title.replace(/'/g, "\\'");

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>${isOwner ? 'My Ad' : 'Ad Details'}</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>

    ${hasPhotos ? `<div class="ad-detail-photo" id="ad-detail-photo"></div>` : ''}

    <div class="ad-detail-body">
      <div class="ad-detail-price">${price}${listing.neg ? ' <span class="ad-detail-neg">neg.</span>' : ''}</div>
      <div class="ad-detail-title">${listing.title}</div>
      <div class="ad-detail-meta">
        ${listing.cond && listing.cond !== 'N/A' ? `<span class="ad-detail-chip">${listing.cond}</span>` : ''}
        <span class="ad-detail-chip">${listing.cat}</span>
        ${listing.loc ? `<span class="ad-detail-chip">${ICO.pin} ${listing.loc}</span>` : ''}
        ${timeStr ? `<span class="ad-detail-chip">${ICO.time} ${timeStr}</span>` : ''}
      </div>

      ${listing.desc ? `<div class="ad-detail-desc">${listing.desc.replace(/\n/g,'<br>')}</div>` : ''}

      <div class="ad-detail-seller">
        <div class="em-modal-avatar" style="flex-shrink:0">${initials}</div>
        <div style="flex:1;min-width:0">
          <div class="em-modal-seller-name">${listing.seller}
            ${listing.verified ? '<span class="em-modal-verified">Verified</span>' : '<span class="em-modal-unverified">Unverified</span>'}
          </div>
          <div class="em-modal-seller-meta">${listing.sellerType === 'dealer' ? 'Dealership' : 'Private Seller'}${sd.delivery ? ' · Delivery available' : ''}</div>
        </div>
      </div>

      <div class="ad-detail-divider"></div>

      ${isOwner ? `
        <div class="em-modal-section-label" style="padding:0 0 10px">Manage your ad</div>
        <div class="em-contact-btns">
          <button class="em-contact-btn em-delete-btn" onclick="_confirmDeleteAd('${safeId}','${safeTitle}')">
            <div class="em-contact-btn-icon" style="background:#FEF0EE"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></div>
            <div><span style="color:var(--red)">Delete this ad</span><span class="em-contact-btn-sub">Permanently remove from Everything Market</span></div>
          </button>
        </div>
      ` : `
        <div class="em-modal-section-label" style="padding:0 0 10px">Contact the seller</div>
        <div class="em-contact-btns">
          ${phone ? `
          <button class="em-contact-btn wa" onclick="window.open('https://wa.me/${phone}?text=${waMsg}','_blank')">
            <div class="em-contact-btn-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></div>
            <div><span>WhatsApp Seller</span><span class="em-contact-btn-sub">Fastest response</span></div>
          </button>
          <button class="em-contact-btn call" onclick="showCallScreen('${listing.seller.replace(/'/g,"\\'")}','${phone}')">
            <div class="em-contact-btn-icon" style="background:#E3F0FF"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1565C0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg></div>
            <div><span>Call Seller</span><span class="em-contact-btn-sub">Tap to reveal number</span></div>
          </button>` : ''}
          <button class="em-contact-btn" onclick="showMessageScreen('${safeId}')">
            <div class="em-contact-btn-icon" style="background:var(--surf2)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--forest)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <div><span>Send a Message</span><span class="em-contact-btn-sub">Reply via Everything Market</span></div>
          </button>
          <div style="text-align:center;padding-top:4px;">
            <button onclick="openReportModal('${safeId}','${safeTitle}')" style="font-size:11px;color:var(--muted);background:none;border:none;cursor:pointer;text-decoration:underline;font-family:inherit;">⚑ Report this ad</button>
          </div>
        </div>
      `}
    </div>`;

  _openModal();
  if (hasPhotos) {
    setTimeout(() => {
      const photoEl = document.getElementById('ad-detail-photo');
      if (photoEl) _renderImg(photoEl, listing);
    }, 10);
  }
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

function showCallScreen(seller, phone) {
  const formatted = '+' + phone.slice(0,2) + ' ' + phone.slice(2,5) + ' ' + phone.slice(5,8) + ' ' + phone.slice(8);
  modalBox.querySelector('.em-contact-btns').innerHTML = `
    <div style="text-align:center;padding:20px 0 8px;">
      <div style="margin-bottom:10px;"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--forest)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg></div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:6px;">${seller}'s number</div>
      <div style="font-size:22px;font-weight:900;color:var(--ink);letter-spacing:.05em;">${formatted}</div>
      <a href="tel:${phone}" style="display:block;margin-top:16px;padding:13px;background:var(--forest);color:#fff;border-radius:10px;font-size:14px;font-weight:800;text-decoration:none;">Call Now</a>
      <button onclick="closeModal()" style="margin-top:8px;width:100%;padding:11px;background:var(--surf);border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;color:var(--ink);">Close</button>
    </div>`;
}

function showMessageScreen(listingId) {
  const l = LISTINGS.find(x => x.id == listingId);
  if (!l) return;
  const sess = _getSession();
  modalBox.querySelector('.em-contact-btns').innerHTML = `
    <div style="padding:4px 0;">
      ${!sess ? `<input id="msg-from-name" class="em-offer-input" placeholder="Your name" style="margin-bottom:8px;width:100%;box-sizing:border-box;">
      <input id="msg-from-email" class="em-offer-input" placeholder="Your email (optional)" type="email" style="margin-bottom:8px;width:100%;box-sizing:border-box;">` : ''}
      <textarea id="msg-body" class="em-offer-textarea" style="margin-bottom:12px;">Hi, I'm interested in "${l.title}". Is it still available?</textarea>
      <button class="em-offer-submit" onclick="_sendMessage('${String(listingId).replace(/'/g,'')}')">Send Message</button>
    </div>`;
}

window._sendMessage = function(listingId) {
  const l = LISTINGS.find(x => x.id == listingId);
  const body = (document.getElementById('msg-body').value || '').trim();
  if (!body) return;
  const sess = _getSession();
  const fromName  = sess ? sess.name  : (document.getElementById('msg-from-name')?.value || 'Anonymous');
  const fromEmail = sess ? sess.email : (document.getElementById('msg-from-email')?.value || null);
  if (l && l.userId) {
    try {
      const key = 'em_inbox_' + l.userId;
      const inbox = JSON.parse(localStorage.getItem(key) || '[]');
      inbox.push({ from: fromName, fromEmail, listingTitle: l.title, listingId: l.id, body, time: Date.now() });
      localStorage.setItem(key, JSON.stringify(inbox));
      _updateInboxBadge();
    } catch(e) {}
  }
  showSentConfirm('message');
};

function _updateInboxBadge() {
  const sess = _getSession();
  const badge = document.getElementById('inbox-badge');
  if (!badge || !sess) return;
  try {
    const msgs = JSON.parse(localStorage.getItem('em_inbox_' + sess.userId) || '[]');
    badge.textContent = msgs.length || '';
    badge.style.display = msgs.length ? '' : 'none';
  } catch(e) {}
}

function openInbox() {
  const sess = _getSession();
  if (!sess) { openSignInModal(); return; }
  document.getElementById('hdr-user-drop')?.classList.remove('open');
  let msgs = [];
  try { msgs = JSON.parse(localStorage.getItem('em_inbox_' + sess.userId) || '[]'); } catch(e) {}
  const sorted = msgs.slice().reverse();
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Inbox</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-myads-body">
      ${!sorted.length
        ? `<div class="em-myads-empty"><p>No messages yet.<br>When buyers contact you about your ads, their messages will appear here.</p></div>`
        : sorted.map(m => `
          <div class="em-msg-row">
            <div class="em-msg-from">${m.from || 'Anonymous'}${m.fromEmail ? ` <span class="em-msg-email">&lt;${m.fromEmail}&gt;</span>` : ''}</div>
            <div class="em-msg-listing">Re: ${m.listingTitle || 'Your listing'}</div>
            <div class="em-msg-body">${m.body}</div>
            <div class="em-msg-time">${fmtTime(m.time)}</div>
          </div>`).join('')
      }
    </div>`;
  modal.classList.add('open');
}

/* ── Make Offer modal ── */
function openMakeOffer(listing) {
  if (!listing) return;
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
      <button class="em-offer-submit" onclick="submitOffer()">Send Offer</button>
    </div>`;

  _openModal();
  setTimeout(() => {
    const imgEl = document.getElementById('modal-img2');
    if (imgEl) _renderImg(imgEl, listing);
  }, 10);
}

function submitOffer() {
  const amt = document.getElementById('offer-amt').value;
  if (!amt || isNaN(amt) || Number(amt) <= 0) {
    document.getElementById('offer-amt').style.borderColor = 'var(--red)';
    document.getElementById('offer-amt').focus();
    return;
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
    if (mobAuthBtn)  { mobAuthBtn.title = first; mobAuthBtn.onclick = () => toggleUserMenu(); }
  } else {
    if (hdrSignIn)   hdrSignIn.style.display = '';
    if (hdrRegister) hdrRegister.style.display = '';
    if (hdrUser)     hdrUser.style.display = 'none';
    if (sbAuth)      sbAuth.style.display = '';
    if (sbAuthIn)    sbAuthIn.style.display = 'none';
    if (mobAuthBtn)  { mobAuthBtn.title = 'Sign In'; mobAuthBtn.onclick = openSignInModal; }
  }
}

async function _initAuth() {
  /* Handle email verification link — Supabase puts token_hash in the URL */
  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (tokenHash && type) {
    const { error } = await _sb.auth.verifyOtp({ token_hash: tokenHash, type });
    /* clean the URL without reloading */
    history.replaceState(null, '', window.location.pathname);
    if (!error) {
      toast('Email verified! You are now signed in.');
    }
  }

  const { data: { session } } = await _sb.auth.getSession();
  _sbUser = session?.user || null;
  _updateAuthUI();
  _updateInboxBadge();
  _sb.auth.onAuthStateChange((_event, session) => {
    _sbUser = session?.user || null;
    _updateAuthUI();
    _updateInboxBadge();
  });
}
_initAuth();

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

function openSignInModal() {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Sign In</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <form class="em-post-form" onsubmit="submitSignIn(event)" novalidate>
      <div class="em-post-field">
        <label class="em-post-label" for="si-email">Email address</label>
        <input class="em-post-input" id="si-email" type="email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="em-post-field">
        <label class="em-post-label" for="si-pass">Password</label>
        <input class="em-post-input" id="si-pass" type="password" placeholder="Your password" autocomplete="current-password">
      </div>
      <div id="auth-error" class="em-post-error" style="display:none;"></div>
      <button type="submit" class="em-post-submit">Sign In</button>
      <p class="em-auth-switch">Don't have an account? <button type="button" onclick="openRegisterModal()">Create one free</button></p>
    </form>`;
  _openModal();
  setTimeout(() => document.getElementById('si-email')?.focus(), 80);
}

async function submitSignIn(e) {
  e.preventDefault();
  const email = (document.getElementById('si-email').value || '').trim().toLowerCase();
  const pass  = document.getElementById('si-pass').value || '';
  const errEl = document.getElementById('auth-error');
  const btn   = e.target.querySelector('[type=submit]');
  if (!email || !pass) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = ''; return; }
  btn.textContent = 'Signing in…'; btn.disabled = true;
  const { data, error } = await _sb.auth.signInWithPassword({ email, password: pass });
  btn.textContent = 'Sign In'; btn.disabled = false;
  if (error) {
    const msg = (error.message || '').toLowerCase();
    const isUnverified = msg.includes('email') && (msg.includes('confirm') || msg.includes('verif'));
    if (isUnverified) {
      errEl.innerHTML = 'Your email isn\'t verified yet. <a href="#" style="color:var(--leaf);font-weight:700;" onclick="event.preventDefault();resendVerification(\'' + email.replace(/'/g, '') + '\')">Resend verification email</a>';
    } else {
      errEl.textContent = 'Incorrect email or password. Please try again.';
    }
    errEl.style.display = '';
    return;
  }
  _sbUser = data.user;
  _updateAuthUI();
  closeModal();
  const name = data.user.user_metadata?.name || email.split('@')[0];
  toast('Welcome back, ' + name.split(' ')[0] + '!');
}

async function resendVerification(email) {
  const errEl = document.getElementById('auth-error');
  if (!email) return;
  const { error } = await _sb.auth.resend({ type: 'signup', email });
  if (error) {
    errEl.textContent = 'Could not resend email. Try again in a minute.';
  } else {
    errEl.style.color = 'var(--leaf)';
    errEl.textContent = 'Verification email sent! Check your inbox.';
  }
  errEl.style.display = '';
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
        <label class="em-post-label" for="reg-pass">Password <span>(at least 6 characters)</span></label>
        <input class="em-post-input" id="reg-pass" type="password" placeholder="Choose a password" autocomplete="new-password">
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
  const name  = (document.getElementById('reg-name').value  || '').trim();
  const email = (document.getElementById('reg-email').value || '').trim().toLowerCase();
  const pass  = document.getElementById('reg-pass').value   || '';
  const errEl = document.getElementById('auth-error');
  const btn   = e.target.querySelector('[type=submit]');

  if (!name)               { errEl.textContent = 'Name is required.'; errEl.style.display = ''; return; }
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  if (pass.length < 6)     { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = ''; return; }

  btn.textContent = 'Creating account…'; btn.disabled = true;
  const { data, error } = await _sb.auth.signUp({
    email, password: pass,
    options: { data: { name }, emailRedirectTo: window.location.origin }
  });
  btn.textContent = 'Create Account'; btn.disabled = false;

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('already in use') || msg.includes('user already')) {
      errEl.textContent = 'An account with this email already exists. ';
      errEl.innerHTML += '<a href="#" style="color:var(--leaf);font-weight:700;" onclick="event.preventDefault();closeModal();openSignInModal()">Sign in instead</a>';
    } else {
      errEl.textContent = error.message;
    }
    errEl.style.display = '';
    return;
  }
  if (window.emTrack) emTrack('register');

  /* Email confirmation disabled — signed in immediately */
  if (data.session) {
    _sbUser = data.user;
    _updateAuthUI();
    closeModal();
    toast('Welcome to EverythingMarket, ' + name.split(' ')[0] + '! 🎉');
    return;
  }

  /* Email confirmation enabled — ask them to check inbox */
  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--leaf)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/>
        </svg>
      </div>
      <div class="em-confirm-title">Check Your Email!</div>
      <div class="em-confirm-sub">We sent a verification link to <strong>${email}</strong>. Click the link to activate your account, then come back to sign in.</div>
      <button class="em-confirm-close" onclick="closeModal();openSignInModal()">Sign In</button>
    </div>`;
}

/* ── My Ads ── */
function openMyAds() {
  const sess = _getSession();
  if (!sess) { openSignInModal(); return; }
  document.getElementById('hdr-user-drop')?.classList.remove('open');

  const myAds = LISTINGS.filter(l => l.userId === sess.userId);

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
              <div class="em-myad-meta">${l.price === 0 ? 'Free / Contact' : 'R ' + l.price.toLocaleString('en-ZA')} &middot; ${l.loc} &middot; ${fmtTime(l.postedAt)}</div>
            </div>
            <button class="em-myad-del" onclick="event.stopPropagation();_deleteMyAd(${l.id})" title="Delete ad">&#x2715;</button>
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
          <div class="em-myad-row" onclick="closeModal();setTimeout(()=>openBuyNow(LISTINGS.find(x=>x.id==${l.id})),200)" style="cursor:pointer;">
            <div class="em-myad-img" id="svad-img-${l.id}"></div>
            <div class="em-myad-info">
              <div class="em-myad-title">${l.title}</div>
              <div class="em-myad-meta">${l.price === 0 ? 'Free / Contact' : 'R ' + l.price.toLocaleString('en-ZA')} &middot; ${l.loc}</div>
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

window._confirmDeleteAd = function(id, title) {
  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Delete Ad</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-confirm">
      <div class="em-confirm-icon">
        <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--red)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </div>
      <div class="em-confirm-title">Delete this ad?</div>
      <div class="em-confirm-sub">Are you sure you want to delete <strong>"${title}"</strong>? This cannot be undone.</div>
      <div style="display:flex;gap:10px;padding:0 20px 8px;">
        <button onclick="closeModal()" style="flex:1;padding:13px;border-radius:10px;border:1.5px solid var(--border);background:var(--white);font-size:14px;font-weight:700;color:var(--ink);cursor:pointer;">Cancel</button>
        <button onclick="_deleteMyAd('${String(id).replace(/'/g,'')}',true)" style="flex:1;padding:13px;border-radius:10px;border:none;background:var(--red);color:#fff;font-size:14px;font-weight:700;cursor:pointer;">Yes, Delete</button>
      </div>
    </div>`;
};

window._deleteMyAd = function(id, fromDetail) {
  const idx = LISTINGS.findIndex(l => String(l.id) === String(id));
  if (idx !== -1) LISTINGS.splice(idx, 1);
  _saveUserAds();
  renderAll('all');
  if (fromDetail) {
    modalBox.innerHTML = `
      <div class="em-confirm">
        <div class="em-confirm-icon"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
        <div class="em-confirm-title">Ad Deleted</div>
        <div class="em-confirm-sub">Your ad has been removed from Everything Market.</div>
        <button class="em-confirm-close" onclick="closeModal()">Done</button>
      </div>`;
  } else {
    openMyAds();
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
      <div class="info-section"><h4>⚡ Respond fast</h4><p>Buyers move on quickly. Aim to reply within an hour. Enable WhatsApp notifications so you never miss an enquiry.</p></div>
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
