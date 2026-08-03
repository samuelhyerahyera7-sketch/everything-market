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

/* ── Shop by Category ── */
const scatGrid = document.getElementById('shopcat-grid');
CATS.filter(c => c.id !== 'all').forEach(cat => {
  const card = document.createElement('a');
  card.href = '#';
  card.className = 'scat-card';
  card.onclick = e => { e.preventDefault(); toast('Browsing ' + cat.name + '…'); };
  card.innerHTML = `
    <div class="scat-icon" style="background:${cat.bg};"><svg viewBox="0 0 24 24" style="stroke:${cat.color};">${cat.svg}</svg></div>
    <div>
      <div class="scat-name">${cat.name}</div>
    </div>`;
  scatGrid.appendChild(card);
});

/* ── Autocomplete ── */
(function() {
  const input = document.getElementById('main-search');
  const drop = document.getElementById('ac-drop');
  if (!input || !drop) return;

  const SUGGESTIONS = [
    ...LISTINGS.map(l => ({ text: l.title, cat: l.cat })),
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

  function show(q) {
    const lq = q.toLowerCase().trim();
    if (!lq) { drop.classList.remove('open'); return; }
    const hits = SUGGESTIONS.filter(s => s.text.toLowerCase().includes(lq)).slice(0, 7);
    if (!hits.length) { drop.classList.remove('open'); return; }
    focusIdx = -1;
    drop.innerHTML = hits.map((s, i) =>
      `<div class="ac-item" data-idx="${i}" data-text="${s.text}" onclick="document.getElementById('main-search').value='${s.text.replace(/'/g,"\\'")}';document.getElementById('ac-drop').classList.remove('open');toast('Searching for ${s.text.replace(/'/g,"\\'")}…')">
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
  if (!items.length) { grid.innerHTML = '<p style="color:var(--muted);font-size:12px;grid-column:1/-1">No ads in this category yet.</p>'; return; }
  grid.innerHTML = '';
  items.forEach(l => {
    const card = document.createElement('div');
    card.className = 'bb-card';
    const ribClass = l.badge === 'Hot' ? 'r-hot' : l.badge === 'Featured' ? 'r-feat' : 'r-new';
    const sd = BB_SELLER_DATA[l.id] || { delivery: false };
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
          <span>${ICO.time} ${l.posted}</span>
        </div>
        <div class="bb-actions">
          <button class="btn-view" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id===${l.id}))">Buy Now</button>
          ${l.neg ? `<button class="btn-offer" onclick="event.stopPropagation();openMakeOffer(LISTINGS.find(x=>x.id===${l.id}))">Make Offer</button>` : ''}
          <button class="btn-wa" onclick="event.stopPropagation();openBuyNow(LISTINGS.find(x=>x.id===${l.id}))">${ICO.wa}</button>
        </div>
      </div>`;
    grid.appendChild(card);
    card.querySelector(`#bb-img-${l.id}`).appendChild(drawSVG(l.art));
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
    card.onclick = () => toast('Opening listing…');
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
          <span>${ICO.time} ${l.posted}</span>
        </div>
        <div class="gt-chips">
          ${l.cond !== 'N/A' ? `<span class="gt-chip">${l.cond}</span>` : ''}
          <span class="gt-chip">${l.cat.charAt(0).toUpperCase() + l.cat.slice(1)}</span>
        </div>
        <div class="gt-foot">
          <div class="gt-seller"><strong>${l.seller}</strong> <span class="stype-badge ${l.sellerType==='dealer'?'stype-dealer':'stype-private'}">${l.sellerType==='dealer'?'Dealership':'Private'}</span> <span class="vfy-badge ${l.verified?'vfy-yes':'vfy-no'}">${l.verified?'Verified':'Unverified'}</span></div>
          <button class="gt-wa-sm" onclick="event.stopPropagation();toast('Opening WhatsApp…')">${ICO.wa} WhatsApp</button>
        </div>
      </div>`;
    list.appendChild(card);
    card.querySelector(`#gt-img-${l.id}`).appendChild(drawSVG(l.art));
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
  document.getElementById('tt-btn').textContent = _dark ? 'Light Mode' : 'Dark Mode';
}
document.getElementById('tt-btn').textContent = _dark ? 'Light Mode' : 'Dark Mode';

/* ── Modal system ── */
const modal = document.getElementById('em-modal');
const modalBox = modal.querySelector('.em-modal-box');

function closeModal() {
  modal.classList.remove('open');
  setTimeout(() => { modalBox.innerHTML = ''; }, 250);
}
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

function openBuyNow(listing) {
  const sd = BB_SELLER_DATA[listing.id] || { delivery: false };
  const price = listing.price === 0 ? 'Free / Contact' : 'R ' + listing.price.toLocaleString('en-ZA');
  const initials = listing.seller.split(' ').map(w => w[0]).join('').slice(0, 2);
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
      <button class="em-contact-btn call" onclick="showCallScreen('${listing.seller}', '${phone}')">
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
    if (imgEl) imgEl.appendChild(drawSVG(listing.art));
  }, 10);
}

function showCallScreen(seller, phone) {
  const formatted = '+' + phone.slice(0,2) + ' ' + phone.slice(2,5) + ' ' + phone.slice(5,8) + ' ' + phone.slice(8);
  const btns = modalBox.querySelector('.em-contact-btns');
  btns.innerHTML = `
    <div style="text-align:center;padding:20px 0 8px;">
      <div style="margin-bottom:10px;"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--forest)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg></div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:6px;">${seller}'s number</div>
      <div style="font-size:22px;font-weight:900;color:var(--ink);letter-spacing:.05em;">${formatted}</div>
      <a href="tel:${phone}" style="display:block;margin-top:16px;padding:13px;background:var(--forest);color:#fff;border-radius:10px;font-size:14px;font-weight:800;text-decoration:none;">Call Now</a>
      <button onclick="openBuyNow(LISTINGS.find(l=>l.seller==='${seller}'))" style="margin-top:8px;width:100%;padding:11px;background:var(--surf);border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;color:var(--ink);">Back</button>
    </div>`;
}

function showMessageScreen(listingId) {
  const l = LISTINGS.find(x => x.id === listingId);
  const btns = modalBox.querySelector('.em-contact-btns');
  btns.innerHTML = `
    <div style="padding:4px 0;">
      <textarea id="msg-body" class="em-offer-textarea" placeholder="Hi, I'm interested in this item. Is it still available?"
        style="margin-bottom:12px;">Hi, I'm interested in "${l.title}". Is it still available?</textarea>
      <button class="em-offer-submit" onclick="showSentConfirm('message')">Send Message</button>
    </div>`;
}

function openMakeOffer(listing) {
  const price = listing.price === 0 ? 0 : listing.price;
  const initials = listing.seller.split(' ').map(w => w[0]).join('').slice(0, 2);

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
    if (imgEl) imgEl.appendChild(drawSVG(listing.art));
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
