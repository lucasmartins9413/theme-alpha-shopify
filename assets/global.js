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

/* ---- Fly-to-cart animation ---- */
function flyToCart(triggerBtn) {
  const img = triggerBtn.closest('.pcard')?.querySelector('img');
  const cartIcon = document.querySelector('[data-open-cart]');
  if (!img || !cartIcon) return;

  const from = img.getBoundingClientRect();
  const to   = cartIcon.getBoundingClientRect();

  const clone = document.createElement('img');
  clone.src = img.currentSrc || img.src;
  Object.assign(clone.style, {
    position: 'fixed', zIndex: '9999', pointerEvents: 'none',
    objectFit: 'cover', borderRadius: '8px', margin: '0',
    width:  from.width  + 'px',
    height: from.height + 'px',
    top:    from.top    + 'px',
    left:   from.left   + 'px',
  });
  document.body.appendChild(clone);

  clone.getBoundingClientRect(); // force reflow

  Object.assign(clone.style, {
    transition: [
      'top .7s cubic-bezier(.3,0,.7,1)',
      'left .7s cubic-bezier(.3,0,.7,1)',
      'width .7s ease-in',
      'height .7s ease-in',
      'opacity .6s .1s ease-in',
      'border-radius .7s ease',
    ].join(','),
    top:          (to.top  + to.height / 2) + 'px',
    left:         (to.left + to.width  / 2) + 'px',
    width:        '0px',
    height:       '0px',
    opacity:      '0',
    borderRadius: '50%',
  });

  clone.addEventListener('transitionend', () => clone.remove(), { once: true });
}

/* ---- Add to cart buttons (product cards) ---- */
document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-add-to-cart]');
  if (!btn) return;
  e.preventDefault();
  const variantId = btn.dataset.variantId;
  if (!variantId) return;

  flyToCart(btn);

  btn.disabled = true;
  try {
    await AlphaCart.add(variantId, 1);
    await AlphaCartDrawer.refresh();
    AlphaCartDrawer.open();
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
  if (document.getElementById('ProductMainImage')) return; // PDP handles its own gallery
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

/* ---- Cart Drawer ---- */
const AlphaCartDrawer = {
  get drawer() { return document.getElementById('cart-drawer'); },
  get overlay() { return document.getElementById('cart-drawer-overlay'); },

  open() {
    this.drawer?.classList.add('is-open');
    this.overlay?.classList.add('is-open');
    document.body.classList.add('no-scroll');
  },

  close() {
    this.drawer?.classList.remove('is-open');
    this.overlay?.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  },

  async refresh() {
    const isOpen = this.drawer?.classList.contains('is-open');
    try {
      const res = await fetch('/?sections=cart-drawer');
      const data = await res.json();
      const wrapper = document.getElementById('shopify-section-cart-drawer');
      if (wrapper && data['cart-drawer']) {
        wrapper.outerHTML = data['cart-drawer'];
      }
    } catch (e) {}
    if (isOpen) this.open();
    this._bindDrawer();
    await refreshCartCount();
  },

  async _changeQty(key, delta) {
    const span = this.drawer?.querySelector(`.cdrawer-item[data-key="${key}"] .cdrawer-qty span`);
    const current = parseInt(span?.textContent) || 1;
    await AlphaCart.change(key, Math.max(0, current + delta));
    await this.refresh();
  },

  async _remove(key) {
    await AlphaCart.change(key, 0);
    await this.refresh();
  },

  _bindDrawer() {
    this.drawer?.querySelector('.cdrawer-close')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());
    this.drawer?.addEventListener('click', e => {
      const qBtn = e.target.closest('.cdrawer-qty-btn');
      const rmBtn = e.target.closest('.cdrawer-rm');
      if (qBtn) this._changeQty(qBtn.dataset.key, +qBtn.dataset.delta);
      if (rmBtn) this._remove(rmBtn.dataset.key);
    });
  },

  init() {
    this._bindDrawer();
    document.addEventListener('click', e => {
      if (e.target.closest('[data-open-cart]')) this.open();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.close();
    });
  }
};

/* ---- Search Overlay ---- */
(function () {
  const panel = document.getElementById('searchPanel');
  const input = document.getElementById('searchQ');
  const sugsEl = document.getElementById('searchSuggestions');
  if (!panel) return;

  function open() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    setTimeout(() => input?.focus(), 50);
  }
  function close() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    if (sugsEl) sugsEl.innerHTML = '';
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-search]')) open();
    else if (!e.target.closest('#searchPanel')) close();
  });
  document.getElementById('searchClose')?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  let timer;
  input?.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!sugsEl) return;
    if (!q || q.length < 2) { sugsEl.innerHTML = ''; return; }
    timer = setTimeout(() => fetchSuggestions(q), 280);
  });

  async function fetchSuggestions(q) {
    try {
      const url = `/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=5`;
      const res = await fetch(url);
      const data = await res.json();
      renderSuggestions(data.resources?.results?.products ?? [], q);
    } catch (e) {}
  }

  function money(cents) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function renderSuggestions(products, q) {
    if (!products.length) {
      sugsEl.innerHTML = `<div class="sug-no-results">Nenhum resultado para "<b>${q}</b>"</div>`;
      return;
    }
    sugsEl.innerHTML = products.map(p => {
      const imgSrc = p.featured_image?.url
        ? p.featured_image.url + '&width=84'
        : '';
      const img = imgSrc ? `<img src="${imgSrc}" loading="lazy" alt="${p.title}">` : '';
      const price = p.price ? money(p.price) : '';
      const compare = p.compare_at_price && p.compare_at_price > p.price
        ? `<span class="sug-old">${money(p.compare_at_price)}</span>` : '';
      return `<a class="sug-item" href="/products/${p.handle}">
        <div class="sug-item-img">${img}</div>
        <span class="sug-item-name">${p.title}</span>
        <span class="sug-item-price">${price}${compare}</span>
      </a>`;
    }).join('');
  }
})();

/* ---- Init ---- */
AlphaCartDrawer.init();
refreshCartCount();
