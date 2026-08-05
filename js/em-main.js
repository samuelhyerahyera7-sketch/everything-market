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
      if (!LISTINGS.find(l => l.id === ad.id)) LISTINGS.unshift(ad);
    });
  } catch(e) {}
}

function _saveUserAds() {
  try {
    const userAds = LISTINGS.filter(l => l.isUserAd);
    localStorage.setItem('em_user_ads', JSON.stringify(userAds));
  } catch(e) {}
}

_loadUserAds();

/* ── Image helper ── */
function _renderImg(el, l) {
  if (l.photos && l.photos.length > 0) {
    const img = document.createElement('img');
    img.src = l.photos[0];
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.alt = l.title;
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
        <div class="spons-loc">${ICO.pin} ${s.loc}</div>
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
let _catId = 'all', _catName = 'All Ads';

function openCategoryPage(catId, catName) {
  _catId = catId;
  _catName = catName;
  document.getElementById('cat-page-title').textContent = catName;
  document.getElementById('cat-page').style.display = 'block';
  clearCatFilters();
}

function closeCategoryPage() {
  document.getElementById('cat-page').style.display = 'none';
}

function _getCatListings() {
  if (_catId === 'all') return LISTINGS;
  return LISTINGS.filter(l => l.cat === _catId);
}

function applyCatFilters() {
  const minV = Number(document.getElementById('cf-min').value) || 0;
  const maxV = Number(document.getElementById('cf-max').value) || Infinity;
  const conds = [...document.querySelectorAll('.cf-cond:checked')].map(el => el.value);
  const sort = document.getElementById('cf-sort').value;

  let data = _getCatListings().filter(l => {
    if (l.price !== 0 && l.price < minV) return false;
    if (maxV !== Infinity && l.price > maxV) return false;
    if (conds.length && !conds.includes(l.cond)) return false;
    return true;
  });

  if (sort === 'price-asc') data.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') data.sort((a, b) => b.price - a.price);

  renderCatResults(data);
}

function clearCatFilters() {
  const minEl = document.getElementById('cf-min');
  const maxEl = document.getElementById('cf-max');
  if (minEl) minEl.value = '';
  if (maxEl) maxEl.value = '';
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
      `<div class="ac-item" data-idx="${i}" onclick="document.getElementById('main-search').value='${s.text.replace(/'/g,"\\'")}';document.getElementById('ac-drop').classList.remove('open');toast('Searching for ${s.text.replace(/'/g,"\\'")}…')">
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
  const featured = data.filter(l => l.badge);
  const items = featured.length ? featured.slice(0, 6) : data.slice(0, 6);
  if (!items.length) {
    grid.innerHTML = '<p class="em-empty-state">No ads yet. Be the first to post one!</p>';
    return;
  }
  grid.innerHTML = '';
  items.forEach(l => {
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
          <button class="btn-view" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id===${l.id}))">Contact Seller</button>
          ${l.neg ? `<button class="btn-offer" onclick="event.stopPropagation();openMakeOffer(LISTINGS.find(x=>x.id===${l.id}))">Make Offer</button>` : ''}
          <button class="btn-wa" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id===${l.id}))">${ICO.wa}</button>
        </div>
      </div>`;
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
          <button class="gt-wa-sm" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id===${l.id}))">${ICO.wa} WhatsApp</button>
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

/* ── Province grid ── */
const pg = document.getElementById('prov-grid');
PROVINCES.forEach(p => {
  pg.innerHTML += `<button class="prov-btn" onclick="toast('Browsing ${p}…')">${p} <span class="prov-arr">›</span></button>`;
});

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

/* ── Theme toggle ── */
let _dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
function toggleTheme() {
  _dark = !_dark;
  document.documentElement.setAttribute('data-theme', _dark ? 'dark' : 'light');
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
}
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

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
          <label class="em-post-label" for="pa-cat">Category</label>
          <select class="em-post-select" id="pa-cat">${catOpts}</select>
        </div>
        <div class="em-post-field">
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

      <div class="em-post-field">
        <label class="em-post-label" for="pa-name">Your Name <span>(shown on the listing)</span></label>
        <input class="em-post-input" id="pa-name" type="text" placeholder="e.g. Sipho M." maxlength="50" value="${(_getSession()||{}).name||''}">
      </div>

      <div class="em-post-field">
        <label class="em-post-label" for="pa-loc">Location</label>
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

  modal.classList.add('open');
}

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
  const loc   = (document.getElementById('pa-loc').value   || '').trim();
  const cat   = document.getElementById('pa-cat').value;
  const cond  = document.getElementById('pa-cond').value;
  const price = Math.max(0, Number(document.getElementById('pa-price').value) || 0);
  const neg   = document.getElementById('pa-neg').checked;
  const stypeBtn = document.querySelector('#pa-stype .em-post-toggle-btn.active');
  const sellerType = stypeBtn ? stypeBtn.dataset.val : 'private';

  const errEl = document.getElementById('pa-error');
  const errors = [];
  if (!title) errors.push('Ad title is required.');
  if (!name)  errors.push('Your name is required.');
  if (!loc)   errors.push('Location is required.');
  if (!desc)  errors.push('Description is required.');

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
  };

  LISTINGS.unshift(listing);
  _saveUserAds();
  renderAll('all');
  window._paPhotos = [];

  showAdPostedConfirm(listing.title);
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

/* ── Contact / Buy Now modal ── */
function openBuyNow(listing) {
  if (!listing) return;
  const sd = BB_SELLER_DATA[listing.id] || { delivery: false };
  const price = listing.price === 0 ? 'Free / Contact' : 'R ' + listing.price.toLocaleString('en-ZA');
  const initials = listing.seller.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const phone = '27' + Math.floor(600000000 + Math.random() * 99999999);
  const waMsg = encodeURIComponent(`Hi, I'm interested in your listing: "${listing.title}" (${price}). Is it still available?`);

  modalBox.innerHTML = `
    <div class="em-modal-bar">
      <h3>Contact Seller</h3>
      <button class="em-modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="em-modal-listing">
      <div class="em-modal-listing-img" id="modal-img"></div>
      <div class="em-modal-listing-info">
        <div class="em-modal-listing-title">${listing.title}</div>
        <div class="em-modal-listing-price">${price}</div>
        ${listing.cond !== 'N/A' ? `<div class="em-modal-listing-cond">${listing.cond}</div>` : ''}
      </div>
    </div>
    <div class="em-modal-seller">
      <div class="em-modal-avatar">${initials}</div>
      <div>
        <div class="em-modal-seller-name">${listing.seller}${listing.verified ? '<span class="em-modal-verified">Verified</span>' : '<span class="em-modal-unverified">Unverified</span>'}</div>
        <div class="em-modal-seller-meta">${listing.sellerType === 'dealer' ? 'Dealership' : 'Private Seller'} · ${sd.delivery ? 'Delivery available' : 'Collection only'}</div>
      </div>
    </div>
    <div class="em-modal-divider"></div>
    <div class="em-modal-section-label">Choose how to connect</div>
    <div class="em-contact-btns">
      <button class="em-contact-btn wa" onclick="window.open('https://wa.me/${phone}?text=${waMsg}','_blank')">
        <div class="em-contact-btn-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></div>
        <div><span>Chat on WhatsApp</span><span class="em-contact-btn-sub">Fastest response — usually within minutes</span></div>
      </button>
      <button class="em-contact-btn call" onclick="showCallScreen('${listing.seller.replace(/'/g,"\\'")}','${phone}')">
        <div class="em-contact-btn-icon" style="background:#E3F0FF;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1565C0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg></div>
        <div><span>Call Seller</span><span class="em-contact-btn-sub">Tap to reveal phone number</span></div>
      </button>
      <button class="em-contact-btn" onclick="showMessageScreen(${listing.id})">
        <div class="em-contact-btn-icon" style="background:var(--surf2);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--forest)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
        <div><span>Send a Message</span><span class="em-contact-btn-sub">Get a reply via Everything Market</span></div>
      </button>
    </div>`;

  modal.classList.add('open');
  setTimeout(() => {
    const imgEl = document.getElementById('modal-img');
    if (imgEl) _renderImg(imgEl, listing);
  }, 10);
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
  const l = LISTINGS.find(x => x.id === listingId);
  if (!l) return;
  modalBox.querySelector('.em-contact-btns').innerHTML = `
    <div style="padding:4px 0;">
      <textarea id="msg-body" class="em-offer-textarea" style="margin-bottom:12px;">Hi, I'm interested in "${l.title}". Is it still available?</textarea>
      <button class="em-offer-submit" onclick="showSentConfirm('message')">Send Message</button>
    </div>`;
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

  modal.classList.add('open');
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

/* ── Account system ── */
function _getAccounts() {
  try { return JSON.parse(localStorage.getItem('em_accounts') || '[]'); } catch(e) { return []; }
}
function _saveAccounts(a) { localStorage.setItem('em_accounts', JSON.stringify(a)); }
function _getSession() {
  try { return JSON.parse(localStorage.getItem('em_session') || 'null'); } catch(e) { return null; }
}
function _setSession(s) {
  s ? localStorage.setItem('em_session', JSON.stringify(s)) : localStorage.removeItem('em_session');
}

function _updateAuthUI() {
  const sess = _getSession();
  const tbSignIn   = document.getElementById('tb-signin');
  const tbRegister = document.getElementById('tb-register');
  const tbUser     = document.getElementById('tb-user');
  const hdrSignIn  = document.getElementById('hdr-signin');
  const hdrRegister= document.getElementById('hdr-register');
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
    if (tbSignIn)   tbSignIn.style.display = 'none';
    if (tbRegister) tbRegister.style.display = 'none';
    if (tbUser)     { tbUser.style.display = ''; tbUser.textContent = first; }
    if (hdrSignIn)  hdrSignIn.style.display = 'none';
    if (hdrRegister)hdrRegister.style.display = 'none';
    if (hdrUser)    hdrUser.style.display = '';
    if (hdrName)    hdrName.textContent = first;
    if (hdrAvatar)  hdrAvatar.textContent = initials;
    if (sbAuth)     sbAuth.style.display = 'none';
    if (sbAuthIn)   sbAuthIn.style.display = '';
    if (sbWelcome)  sbWelcome.textContent = 'Hi ' + first + '! Manage your listings below.';
    if (mobAuthBtn) { mobAuthBtn.title = first; mobAuthBtn.onclick = () => toggleUserMenu(); }
  } else {
    if (tbSignIn)   tbSignIn.style.display = '';
    if (tbRegister) tbRegister.style.display = '';
    if (tbUser)     tbUser.style.display = 'none';
    if (hdrSignIn)  hdrSignIn.style.display = '';
    if (hdrRegister)hdrRegister.style.display = '';
    if (hdrUser)    hdrUser.style.display = 'none';
    if (sbAuth)     sbAuth.style.display = '';
    if (sbAuthIn)   sbAuthIn.style.display = 'none';
    if (mobAuthBtn) { mobAuthBtn.title = 'Sign In'; mobAuthBtn.onclick = openSignInModal; }
  }
}
_updateAuthUI();

function toggleUserMenu(e) {
  e && e.stopPropagation();
  const drop = document.getElementById('hdr-user-drop');
  if (drop) drop.classList.toggle('open');
}
document.addEventListener('click', () => {
  document.getElementById('hdr-user-drop')?.classList.remove('open');
});

function signOut() {
  _setSession(null);
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
  modal.classList.add('open');
  setTimeout(() => document.getElementById('si-email')?.focus(), 80);
}

function submitSignIn(e) {
  e.preventDefault();
  const email = (document.getElementById('si-email').value || '').trim().toLowerCase();
  const pass  = document.getElementById('si-pass').value || '';
  const errEl = document.getElementById('auth-error');
  if (!email || !pass) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = ''; return; }
  const acc = _getAccounts().find(a => a.email === email && a.password === pass);
  if (!acc) { errEl.textContent = 'Incorrect email or password.'; errEl.style.display = ''; return; }
  _setSession({ userId: acc.id, name: acc.name, email: acc.email });
  _updateAuthUI();
  closeModal();
  toast('Welcome back, ' + acc.name.split(' ')[0] + '!');
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
  modal.classList.add('open');
  setTimeout(() => document.getElementById('reg-name')?.focus(), 80);
}

function submitRegister(e) {
  e.preventDefault();
  const name  = (document.getElementById('reg-name').value  || '').trim();
  const email = (document.getElementById('reg-email').value || '').trim().toLowerCase();
  const pass  = document.getElementById('reg-pass').value   || '';
  const errEl = document.getElementById('auth-error');

  if (!name)                  { errEl.textContent = 'Name is required.'; errEl.style.display = ''; return; }
  if (!email.includes('@'))   { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; return; }
  if (pass.length < 6)        { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = ''; return; }

  const accounts = _getAccounts();
  if (accounts.find(a => a.email === email)) {
    errEl.textContent = 'An account with that email already exists.';
    errEl.style.display = '';
    return;
  }

  const acc = { id: Date.now(), name, email, password: pass, createdAt: Date.now() };
  accounts.push(acc);
  _saveAccounts(accounts);
  _setSession({ userId: acc.id, name: acc.name, email: acc.email });
  _updateAuthUI();

  modalBox.innerHTML = `
    <div class="em-confirm">
      <div class="em-confirm-icon">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--leaf)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <div class="em-confirm-title">Welcome, ${name.split(' ')[0]}!</div>
      <div class="em-confirm-sub">Your account has been created. You can now post free ads and save your favourites.</div>
      <button class="em-confirm-close" onclick="closeModal()">Get Started</button>
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
  modal.classList.add('open');
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
          <div class="em-myad-row" onclick="closeModal();setTimeout(()=>openBuyNow(LISTINGS.find(x=>x.id===${l.id})),200)" style="cursor:pointer;">
            <div class="em-myad-img" id="svad-img-${l.id}"></div>
            <div class="em-myad-info">
              <div class="em-myad-title">${l.title}</div>
              <div class="em-myad-meta">${l.price === 0 ? 'Free / Contact' : 'R ' + l.price.toLocaleString('en-ZA')} &middot; ${l.loc}</div>
            </div>
          </div>`).join('')
      }
    </div>`;
  modal.classList.add('open');
  saved.forEach(l => {
    const el = document.getElementById('svad-img-' + l.id);
    if (el) _renderImg(el, l);
  });
}

window._deleteMyAd = function(id) {
  const idx = LISTINGS.findIndex(l => l.id === id);
  if (idx !== -1) LISTINGS.splice(idx, 1);
  _saveUserAds();
  renderAll('all');
  openMyAds();
};
