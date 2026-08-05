/* ── Icon SVGs ── */
const ICO = {
  wa:   `<svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8c0 1.41.37 2.73 1.01 3.89L0 16l4.25-1.11A7.96 7.96 0 008 16c4.42 0 8-3.58 8-8s-3.58-8-8-8zm0 14.4a6.39 6.39 0 01-3.26-.9l-.23-.14-2.52.66.67-2.46-.16-.25A6.4 6.4 0 118 14.4zm3.5-4.77c-.19-.1-1.13-.56-1.31-.62-.17-.06-.3-.1-.42.1-.12.19-.48.62-.59.75-.11.13-.21.14-.4.05-.19-.1-.8-.3-1.52-.95-.56-.5-.94-1.12-1.05-1.31-.11-.19-.01-.3.08-.39.09-.09.19-.22.29-.33.1-.11.13-.19.19-.32.06-.13.03-.25-.01-.35-.05-.1-.42-1.01-.58-1.38-.15-.37-.3-.32-.42-.33H5.4c-.12 0-.32.05-.49.24S4.4 6.2 4.4 7.15c0 .95.7 1.87.79 2 .1.13 1.37 2.09 3.31 2.93.46.2.82.32 1.1.41.46.15.88.13 1.22.08.37-.06 1.13-.46 1.29-.91.16-.45.16-.83.11-.91-.05-.08-.17-.13-.36-.22z"/></svg>`,
  pin:  `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M6 1a3 3 0 013 3c0 2.5-3 7-3 7S3 6.5 3 4a3 3 0 013-3z"/><circle cx="6" cy="4" r="1.2"/></svg>`,
  time: `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.5 1.2"/></svg>`,
  heart:`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M6 10.5S1 7 1 3.8A2.8 2.8 0 016 2.6a2.8 2.8 0 015 1.2C11 7 6 10.5 6 10.5z"/></svg>`,
};

/* ── Category definitions ── */
const CATS = [
  { id:'all',  name:'All Ads',        img:'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop&auto=format' },
  { id:'cars', name:'Cars & Bakkies', img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&h=200&fit=crop&auto=format' },
  { id:'prop', name:'Property',       img:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop&auto=format' },
  { id:'elec', name:'Electronics',    img:'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&h=200&fit=crop&auto=format' },
  { id:'home', name:'Home & Garden',  img:'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200&h=200&fit=crop&auto=format' },
  { id:'fash', name:'Fashion',        img:'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=200&fit=crop&auto=format' },
  { id:'jobs', name:'Jobs',           img:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=200&fit=crop&auto=format' },
  { id:'baby', name:'Baby & Kids',    img:'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop&auto=format' },
  { id:'pets', name:'Pets',           img:'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=200&h=200&fit=crop&auto=format' },
];

/* ── Canvas artwork ── */
function drawSVG(key) {
  const arts = {
    phone:  (c,w,h) => { c.fillStyle='#141830'; c.fillRect(0,0,w,h); const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#3B5FD4'); g.addColorStop(1,'#1A3498'); c.fillStyle='#22273C'; roundRect(c,(w*.34),(h*.09),(w*.32),(h*.82),w*.06); c.fillStyle=g; c.fillRect(w*.37,h*.17,w*.27,h*.66); c.fillStyle='rgba(255,255,255,.22)'; c.fillRect(w*.39,h*.25,w*.22,h*.05); c.fillStyle='rgba(255,255,255,.1)'; c.fillRect(w*.39,h*.34,w*.16,h*.03); c.fillStyle='rgba(80,180,100,.3)'; roundRect(c,w*.39,h*.61,w*.22,h*.09,w*.025); },
    truck:  (c,w,h) => { c.fillStyle='#0E1C2C'; c.fillRect(0,0,w,h); const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2A4C6E'); g.addColorStop(1,'#1A3050'); c.fillStyle=g; roundRect(c,w*.08,h*.38,w*.84,h*.44,w*.025); c.fillStyle='#1E3C58'; c.beginPath(); c.moveTo(w*.47,h*.38); c.lineTo(w*.61,h*.18); c.lineTo(w*.9,h*.18); c.lineTo(w*.9,h*.38); c.closePath(); c.fill(); c.fillStyle='rgba(120,200,255,.3)'; roundRect(c,w*.63,h*.21,w*.22,h*.16,w*.02); c.fillStyle='rgba(255,220,80,.7)'; roundRect(c,w*.87,h*.42,w*.04,h*.05,w*.015); wheel(c,w*.2,h*.83,w*.12); wheel(c,w*.75,h*.83,w*.12); },
    house:  (c,w,h) => { c.fillStyle='#0A1E14'; c.fillRect(0,0,w,h); c.fillStyle='#091710'; c.fillRect(0,h*.75,w,h*.25); const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1A5C38'); g.addColorStop(1,'#0E3A22'); c.fillStyle=g; c.fillRect(w*.19,h*.47,w*.62,h*.53); c.fillStyle='#15803D'; c.beginPath(); c.moveTo(w*.12,h*.48); c.lineTo(w*.5,h*.14); c.lineTo(w*.88,h*.48); c.closePath(); c.fill(); c.fillStyle='rgba(120,200,255,.22)'; c.fillRect(w*.23,h*.53,w*.14,h*.16); c.fillRect(w*.63,h*.53,w*.14,h*.16); c.fillStyle='#0A2A18'; c.fillRect(w*.41,h*.63,w*.18,h*.37); c.fillStyle='rgba(255,200,80,.6)'; c.beginPath(); c.arc(w*.57,h*.75,w*.015,0,Math.PI*2); c.fill(); },
    tv:     (c,w,h) => { c.fillStyle='#0C0E16'; c.fillRect(0,0,w,h); const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,'#1A2860'); g.addColorStop(1,'#0A0E28'); c.fillStyle='#1A1E30'; roundRect(c,w*.1,h*.14,w*.8,h*.66,w*.04); c.fillStyle=g; roundRect(c,w*.13,h*.18,w*.74,h*.58,w*.03); c.fillStyle='rgba(80,120,255,.18)'; roundRect(c,w*.16,h*.22,w*.32,h*.5,w*.02); c.fillStyle='rgba(255,255,255,.22)'; c.fillRect(w*.18,h*.25,w*.18,h*.06); c.fillStyle='rgba(255,255,255,.1)'; for(let i=0;i<5;i++) c.fillRect(w*.18,h*.34+i*h*.07,w*.14+Math.random()*w*.08,h*.04); c.fillStyle='rgba(100,160,255,.1)'; roundRect(c,w*.52,h*.22,w*.33,h*.5,w*.02); c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(w*.54,h*.25,w*.28,h*.06); },
    dog:    (c,w,h) => { c.fillStyle='#1A0E06'; c.fillRect(0,0,w,h); const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#9A6418'); g.addColorStop(1,'#5A3208'); c.fillStyle=g; ellipse(c,w*.5,h*.67,w*.26,h*.3); ellipse(c,w*.42,h*.49,w*.16,h*.18); c.fillStyle='rgba(0,0,0,.2)'; ellipse(c,w*.5,h*.88,w*.36,h*.06); c.fillStyle='#fff'; c.beginPath(); c.arc(w*.38,h*.46,w*.065,0,Math.PI*2); c.arc(w*.48,h*.46,w*.065,0,Math.PI*2); c.fill(); c.fillStyle='#2A1A0A'; c.beginPath(); c.arc(w*.39,h*.468,w*.04,0,Math.PI*2); c.arc(w*.49,h*.468,w*.04,0,Math.PI*2); c.fill(); c.fillStyle='#C47A1E'; ellipse(c,w*.43,h*.56,w*.045,h*.03); c.fillStyle='#7A2A14'; ellipse(c,w*.43,h*.58,w*.03,h*.025); },
    tools:  (c,w,h) => { c.fillStyle='#091828'; c.fillRect(0,0,w,h); const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,'#2A4A6A'); g.addColorStop(1,'#1A3050'); c.fillStyle=g; roundRect(c,w*.35,h*.29,w*.3,h*.56,w*.03); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(w*.38,h*.33,w*.24,h*.2); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(w*.4,h*.36,w*.09,h*.04); c.fillStyle='rgba(255,255,255,.08)'; for(let i=0;i<4;i++) c.fillRect(w*.4,h*.43+i*h*.06,w*.13+i*.02,h*.03); c.fillStyle='#6A8AAA'; c.save(); c.translate(w*.22,h*.25); c.rotate(-Math.PI/4); roundRect(c,-3,-20,6,28,3); c.restore(); c.beginPath(); c.arc(w*.22,h*.24,w*.045,0,Math.PI*2); c.strokeStyle='#6A8AAA'; c.lineWidth=3; c.stroke(); c.fillStyle='#8A9AAB'; c.save(); c.translate(w*.78,h*.25); c.rotate(Math.PI/4); roundRect(c,-3,-20,6,28,3); c.restore(); },
    moto:   (c,w,h) => { c.fillStyle='#100808'; c.fillRect(0,0,w,h); const g=c.createLinearGradient(0,0,w,0); g.addColorStop(0,'#C0392B'); g.addColorStop(1,'#8B1A10'); c.fillStyle=g; c.beginPath(); c.moveTo(w*.2,h*.57); c.lineTo(w*.38,h*.41); c.lineTo(w*.58,h*.36); c.lineTo(w*.77,h*.41); c.lineTo(w*.85,h*.53); c.lineTo(w*.82,h*.6); c.lineTo(w*.62,h*.54); c.lineTo(w*.42,h*.54); c.lineTo(w*.23,h*.64); c.closePath(); c.fill(); c.fillStyle='rgba(255,220,80,.6)'; roundRect(c,w*.74,h*.42,w*.09,h*.07,w*.015); c.fillStyle='rgba(220,60,60,.7)'; roundRect(c,w*.14,h*.44,w*.055,h*.06,w*.01); wheel(c,w*.25,h*.7,w*.15); wheel(c,w*.75,h*.7,w*.15); },
    table:  (c,w,h) => { c.fillStyle='#120C04'; c.fillRect(0,0,w,h); const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#8B5A18'); g.addColorStop(1,'#5A3A08'); c.fillStyle=g; c.fillRect(w*.11,h*.46,w*.78,h*.09); c.fillStyle='rgba(255,255,255,.07)'; c.fillRect(w*.13,h*.48,w*.74,h*.04); for(let i=0;i<5;i++) { c.fillStyle='rgba(255,255,255,.04)'; c.fillRect(w*.12+i*w*.165,h*.46,1,h*.09); } c.fillStyle='#6B3E0A'; c.fillRect(w*.19,h*.55,w*.055,h*.32); c.fillRect(w*.75,h*.55,w*.055,h*.32); c.fillStyle='rgba(255,255,255,.06)'; roundRect(c,w*.16,h*.33,w*.68,h*.14,w*.025); c.fillStyle='rgba(200,150,80,.18)'; roundRect(c,w*.19,h*.36,w*.23,h*.07,w*.02); roundRect(c,w*.46,h*.36,w*.15,h*.07,w*.02); },
    sneakers:(c,w,h) => { c.fillStyle='#0E0E1E'; c.fillRect(0,0,w,h); c.fillStyle='rgba(0,0,0,.25)'; ellipse(c,w*.53,h*.81,w*.4,h*.05); const g=c.createLinearGradient(0,0,w,0); g.addColorStop(0,'#E8E8F8'); g.addColorStop(1,'#B0B0CC'); c.fillStyle=g; c.beginPath(); c.moveTo(w*.14,h*.67); c.quadraticCurveTo(w*.19,h*.6,w*.31,h*.57); c.lineTo(w*.5,h*.54); c.quadraticCurveTo(w*.65,h*.51,w*.77,h*.54); c.lineTo(w*.85,h*.58); c.lineTo(w*.85,h*.67); c.quadraticCurveTo(w*.69,h*.72,w*.46,h*.74); c.lineTo(w*.19,h*.74); c.closePath(); c.fill(); c.fillStyle='#D8D8EC'; c.beginPath(); c.moveTo(w*.29,h*.57); c.lineTo(w*.38,h*.37); c.lineTo(w*.48,h*.35); c.lineTo(w*.5,h*.54); c.quadraticCurveTo(w*.41,h*.57,w*.29,h*.57); c.closePath(); c.fill(); c.strokeStyle='rgba(80,80,180,.4)'; c.lineWidth=1.5; for(let i=0;i<4;i++) { c.beginPath(); c.moveTo(w*.33+i*w*.037,h*.66); c.lineTo(w*.37+i*w*.037,h*.56); c.stroke(); } c.fillStyle='#A8A8C4'; c.fillRect(w*.14,h*.67,w*.71,h*.07); },
    ps5:    (c,w,h) => { c.fillStyle='#080810'; c.fillRect(0,0,w,h); c.fillStyle='rgba(60,60,180,.06)'; c.beginPath(); c.arc(w*.5,h*.5,w*.35,0,Math.PI*2); c.fill(); const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2E2E4E'); g.addColorStop(1,'#18182E'); c.fillStyle=g; c.beginPath(); c.moveTo(w*.42,h*.26); c.quadraticCurveTo(w*.5,h*.16,w*.58,h*.26); c.lineTo(w*.63,h*.67); c.quadraticCurveTo(w*.5,h*.76,w*.37,h*.67); c.closePath(); c.fill(); c.beginPath(); c.arc(w*.47,h*.32,w*.025,0,Math.PI*2); c.fillStyle='rgba(80,160,255,.5)'; c.fill(); c.beginPath(); c.arc(w*.53,h*.32,w*.025,0,Math.PI*2); c.fillStyle='rgba(255,80,80,.5)'; c.fill(); },
    design: (c,w,h) => { c.fillStyle='#0E0A1A'; c.fillRect(0,0,w,h); const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,'#4A1A8A'); g.addColorStop(1,'#2A0A5A'); c.fillStyle=g; roundRect(c,w*.19,h*.19,w*.62,h*.62,w*.03); c.fillStyle='rgba(180,100,255,.2)'; roundRect(c,w*.24,h*.25,w*.23,h*.22,w*.02); c.fillStyle='rgba(255,200,80,.45)'; c.beginPath(); c.arc(w*.3,h*.31,w*.04,0,Math.PI*2); c.fill(); c.fillStyle='rgba(180,100,255,.5)'; c.beginPath(); c.moveTo(w*.26,h*.44); c.lineTo(w*.3,h*.31); c.lineTo(w*.35,h*.39); c.lineTo(w*.38,h*.33); c.lineTo(w*.44,h*.44); c.fill(); c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(w*.49,h*.26,w*.27,h*.06); for(let i=0;i<4;i++) { c.fillStyle=`rgba(255,255,255,${.08-i*.015})`; c.fillRect(w*.49,h*.35+i*h*.06,w*.2-i*w*.02,h*.04); } c.fillStyle='rgba(180,100,255,.4)'; roundRect(c,w*.24,h*.7,w*.14,h*.07,w*.02); },
    apt:    (c,w,h) => { c.fillStyle='#091818'; c.fillRect(0,0,w,h); c.fillStyle='#060E10'; c.fillRect(0,h*.8,w,h*.2); const gb=c.createLinearGradient(0,0,0,h); gb.addColorStop(0,'#1A4C5C'); gb.addColorStop(1,'#0A2C3C'); c.fillStyle=gb; c.fillRect(w*.11,h*.25,w*.3,h*.6); c.fillStyle='#13384A'; c.fillRect(w*.6,h*.35,w*.3,h*.5); c.fillStyle='#1A4C5C'; c.fillRect(w*.42,h*.16,w*.18,h*.65); const wins=[[w*.13,h*.29],[w*.25,h*.29],[w*.13,h*.44],[w*.25,h*.44],[w*.13,h*.59],[w*.25,h*.59]]; wins.forEach(([x,y])=>{ c.fillStyle=`rgba(120,220,255,${.12+Math.random()*.15})`; c.fillRect(x,y,w*.09,h*.09); }); const wins2=[[w*.44,h*.2],[w*.54,h*.2],[w*.44,h*.35],[w*.54,h*.35],[w*.44,h*.5],[w*.54,h*.5]]; wins2.forEach(([x,y])=>{ c.fillStyle=`rgba(120,220,255,${.12+Math.random()*.18})`; c.fillRect(x,y,w*.07,h*.09); }); c.fillStyle='rgba(255,200,80,.35)'; c.beginPath(); c.arc(w*.8,h*.2,w*.07,0,Math.PI*2); c.fill(); },
  };

  const cvs = document.createElement('canvas');
  cvs.width = 320; cvs.height = 240;
  const ctx = cvs.getContext('2d');

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); ctx.fill(); }
  function ellipse(ctx,cx,cy,rx,ry){ ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.fill(); }
  function wheel(ctx,cx,cy,r){ ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#1A1A1A'; ctx.beginPath(); ctx.arc(cx,cy,r*.7,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#2A2A2A'; ctx.beginPath(); ctx.arc(cx,cy,r*.28,0,Math.PI*2); ctx.fill(); }

  if (!arts[key]) return document.createElement('canvas');
  arts[key](ctx, 320, 240);
  return cvs;
}

/* ── Time helpers ── */
const H = 3600000, D = 86400000;

function fmtTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

const LISTINGS = [];

const PROVINCES = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Northern Cape','Free State'];

const BB_SELLER_DATA = {};
