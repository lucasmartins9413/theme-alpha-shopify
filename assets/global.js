/* ALPHA — Shopify 2.0 Theme · Global JS */

/* ---- Cart API helpers ---- */
class AlphaCart {
  static async add(variantId, quantity = 1) {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity })
    });
    return res.json();
  }

  static async get() {
    const res = await fetch('/cart.js');
    return res.json();
  }

  static async update(updates) {
    const res = await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    return res.json();
  }

  static async change(id, quantity) {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity })
    });
    return res.json();
  }
}

/* ---- Cart count badge ---- */
async function refreshCartCount() {
  try {
    const cart = await AlphaCart.get();
    const badges = document.querySelectorAll('.cart-count');
    badges.forEach(b => { b.textContent = cart.item_count; });
  } catch (e) { /* silent */ }
}

/* ---- Animate cart badge on add ---- */
function animateCartBadge() {
  document.querySelectorAll('.cart-count').forEach(b => {
    b.animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
  });
}

/* ---- Add to cart buttons (product cards) ---- */
document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-add-to-cart]');
  if (!btn) return;
  e.preventDefault();
  const variantId = btn.dataset.variantId;
  if (!variantId) return;
  btn.disabled = true;
  try {
    await AlphaCart.add(variantId, 1);
    await refreshCartCount();
    animateCartBadge();
  } finally {
    btn.disabled = false;
  }
});

/* ---- Scroller arrow buttons ---- */
document.querySelectorAll('[data-scroll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.scroll);
    if (!el) return;
    const dir = +btn.dataset.dir;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 560), behavior: 'smooth' });
  });
});

/* ---- Tab toggle ---- */
document.querySelectorAll('.tabs button').forEach(b => {
  b.addEventListener('click', () => {
    b.closest('.tabs').querySelectorAll('button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
  });
});

/* ---- Filter block accordion (collection page) ---- */
document.querySelectorAll('.fblock h4').forEach(h => {
  h.addEventListener('click', () => h.parentElement.classList.toggle('closed'));
});

/* ---- Size / color selectors ---- */
document.querySelectorAll('.sizebox').forEach(s => s.addEventListener('click', () => s.classList.toggle('on')));
document.querySelectorAll('.qchip').forEach(c => c.addEventListener('click', () => {
  c.closest('.quickrow').querySelectorAll('.qchip').forEach(x => x.classList.remove('on'));
  c.classList.add('on');
}));
document.querySelectorAll('.achip button').forEach(b => b.addEventListener('click', () => b.closest('.achip').remove()));

/* ---- Product page: variant selector ---- */
const colorSwatches = document.querySelectorAll('.csw');
colorSwatches.forEach(c => c.addEventListener('click', () => {
  colorSwatches.forEach(x => x.classList.remove('on'));
  c.classList.add('on');
  const nameEl = document.getElementById('colorName');
  if (nameEl) nameEl.textContent = c.dataset.name;
}));

const sizeBtns = document.querySelectorAll('.sz:not(.off)');
sizeBtns.forEach(s => s.addEventListener('click', () => {
  document.querySelectorAll('.sz').forEach(x => x.classList.remove('on'));
  s.classList.add('on');
}));

document.querySelectorAll('.thumb').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.thumb').forEach(x => x.classList.remove('on'));
  t.classList.add('on');
  const mainImg = document.querySelector('.stage img');
  const src = t.querySelector('img')?.src;
  if (mainImg && src) mainImg.src = src;
}));

/* ---- Accordion (product page) ---- */
document.querySelectorAll('.acc .head').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('open')));

/* ---- Quantity selector ---- */
let qty = 1;
window.qd = d => {
  qty = Math.max(1, qty + d);
  const el = document.getElementById('qv');
  if (el) el.textContent = qty;
};

/* ---- Cart page: CEP / shipping calc (stub) ---- */
document.querySelector('.cep .go')?.addEventListener('click', () => {
  const input = document.querySelector('.cep input');
  if (!input?.value) return;
  alert('Funcionalidade integrada ao Shopify Shipping Rates');
});

/* ---- Init ---- */
refreshCartCount();
