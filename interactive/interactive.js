// thumb SVG icons per theme
const thumbIcons = {
  navy: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e8854a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  purple: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  teal: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
};
const checkSVG  = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const cartSVG   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>';
const arrowSVG  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 8 12 12 16"/><line x1="16" y1="12" x2="8" y2="12"/></svg>';
const boltSVG   = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
const stepsSVG  = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

// ===== PRODUCTS =====
function renderProducts(products) {
  const grid = document.getElementById('shop-grid');

  grid.innerHTML = products.map((p, i) => {
    const isActive = p.status === 'active';
    const delay = (i * 0.07) + 's';
    const thumbClass = 'thumb-' + (p.thumb || 'navy');
    const iconStyle = isActive ? '' : 'border-color:rgba(255,255,255,0.1);';
    const labelHTML = isActive && p.label
      ? `<div class="prod-label label-new">${boltSVG} ${p.label}</div>`
      : `<div class="prod-label" style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.38);border:1px solid rgba(255,255,255,0.1);">בקרוב</div>`;
    const stepsHTML = isActive && p.steps
      ? `<div class="steps-pill">${stepsSVG} ${p.steps} שלבים</div>` : '';
    const includesHTML = isActive && p.includes?.length
      ? `<div class="prod-includes">${p.includes.map(inc =>
          `<div class="prod-include-item"><div class="include-check">${checkSVG}</div>${inc}</div>`
        ).join('')}</div>` : '';
    const footerHTML = isActive
      ? `<div class="prod-footer">
          <div class="prod-price">${p.price} &#8362;<span>תשלום חד פעמי</span></div>
          <div class="prod-actions">
            <button class="btn-add-cart" onclick="addToCart(this, '${p.title.substring(0,20)}', ${p.price})">${cartSVG} הוספה לסל</button>
            <a href="${p.checkout_url}" class="btn-quick-buy">קנייה מהירה ${arrowSVG}</a>
          </div>
        </div>`
      : `<div class="prod-footer" style="justify-content:center;"><div style="font-size:0.8rem;color:rgba(255,255,255,0.3);font-weight:600;">בקרוב</div></div>`;
    const cardStyle = isActive
      ? `style="transition-delay:${delay};"` : `style="opacity:0.38;pointer-events:none;transition-delay:${delay};"`;

    return `<div class="prod-card visible" ${cardStyle}>
      <div class="prod-thumb ${thumbClass} grid-lines">
        ${labelHTML}${stepsHTML}
        <div class="thumb-icon"${iconStyle ? ' style="'+iconStyle+'"' : ''}>${thumbIcons[p.thumb] || thumbIcons.navy}</div>
      </div>
      <div class="prod-body">
        <div class="prod-category"${isActive ? '' : ' style="color:rgba(255,255,255,0.3);"'}>${p.category}</div>
        <div class="prod-title">${p.title}</div>
        <div class="prod-desc">${p.desc}</div>
        ${includesHTML}${footerHTML}
      </div>
    </div>`;
  }).join('');
  window._productMap = {};
  products.forEach(p => { window._productMap[p.title.substring(0,20)] = p.key; });
}

// ===== FADE OBSERVER =====
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.08 });

// ===== FAQ =====
function toggleFaq(el) { el.parentElement.classList.toggle('open'); }

// ===== CART =====
let cart = [];

function addToCart(btn, name, price) {
  const exists = cart.find(i => i.name === name);
  if (exists) {
    btn.innerHTML = cartSVG + ' כבר בסל'; btn.classList.add('added');
    setTimeout(() => { btn.innerHTML = cartSVG + ' הוספה לסל'; btn.classList.remove('added'); }, 1500);
    return;
  }
  cart.push({ name, price });
  btn.innerHTML = checkSVG + ' נוסף לסל'; btn.classList.add('added');
  setTimeout(() => { btn.innerHTML = cartSVG + ' הוספה לסל'; btn.classList.remove('added'); }, 1500);
  updateCart();
}

function updateCart() {
  const total = cart.reduce((s, i) => s + i.price, 0);
  const count = cart.length;
  document.getElementById('cart-count').textContent = count;
  document.getElementById('cart-summary').innerHTML = count === 1
    ? `<strong>${total} ₪</strong> · הדרכה אחת בסל`
    : `<strong>${total} ₪</strong> · ${count} הדרכות בסל`;
  document.getElementById('cart-bar').classList.toggle('visible', count > 0);
}

function clearCart() {
  cart = [];
  updateCart();
  document.getElementById('cart-bar').classList.remove('visible');
}

function goToCheckout(e) {
  e.preventDefault();
  if (!cart.length) return;
  const productMap = window._productMap || {};
  if (cart.length === 1) {
    window.location.href = '/pages/checkout/?product=' + (productMap[cart[0].name] || 'vibe');
  } else {
    window.location.href = '/pages/checkout/';
  }
}

// ===== INIT =====
fetch('/interactive/interactive.json')
  .then(r => r.json())
  .then(products => {
    products.forEach(p => { if (!p.checkout_url) p.checkout_url = '/pages/checkout/?product=' + p.key; });
    renderProducts(products.filter(p => p.status !== 'hidden'));
  })
  .catch(() => {});
