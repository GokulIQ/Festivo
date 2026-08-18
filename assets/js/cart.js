/* ============================================================
   FESTIVO — cart.js
   Shopping cart with localStorage persistence
   ============================================================ */

'use strict';

const CART_KEY = 'festivo_cart';

/* ============================================================
   CART DATA OPERATIONS
   ============================================================ */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  dispatchCartUpdate(cart);
}
function dispatchCartUpdate(cart) {
  document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
}
function addToCart(item) {
  const cart  = getCart();
  const exist = cart.find(i => i.id === item.id);
  if (exist) { exist.qty = (exist.qty || 1) + (item.qty || 1); }
  else       { cart.push({ id: item.id, name: item.name, price: item.price, qty: item.qty || 1, img: item.img || '' }); }
  saveCart(cart);
}
function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}
function updateCartItem(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    if (qty <= 0) { removeFromCart(id); return; }
    item.qty = qty;
  }
  saveCart(cart);
}
function clearCart() { saveCart([]); }
function getCartTotal() {
  return getCart().reduce((sum, i) => sum + (i.price * i.qty), 0);
}
function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}
function updateCartCount() {
  const count = getCartCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? '' : 'none';
  });
}

/* ============================================================
   CART PAGE RENDERER
   ============================================================ */
function renderCartPage() {
  const tableBody   = document.getElementById('cartItems');
  const subtotalEl  = document.getElementById('cartSubtotal');
  const totalEl     = document.getElementById('cartTotal');
  const discountEl  = document.getElementById('cartDiscount');
  const emptyState  = document.getElementById('cartEmpty');
  const cartContent = document.getElementById('cartContent');
  if (!tableBody) return;

  const cart = getCart();

  if (cart.length === 0) {
    if (emptyState)  emptyState.style.display  = '';
    if (cartContent) cartContent.style.display = 'none';
    // Reset summary when cart empties
    if (subtotalEl) subtotalEl.textContent = '₹0';
    if (discountEl) discountEl.textContent = '—';
    if (totalEl)    totalEl.textContent    = '₹0';
    const shipEl = document.getElementById('cartShipping');
    if (shipEl) shipEl.textContent = '₹79';
    return;
  }
  if (emptyState)  emptyState.style.display  = 'none';
  if (cartContent) cartContent.style.display = '';

  tableBody.innerHTML = cart.map(item => `
    <tr data-id="${item.id}">
      <td>
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:72px;height:72px;border-radius:0.5rem;overflow:hidden;background:var(--light-2);flex-shrink:0;display:flex;align-items:center;justify-content:center;">
            ${item.img
              ? `<img src="${item.img}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">`
              : `<i class="bi bi-gift" style="font-size:1.75rem;color:var(--muted);"></i>`}
          </div>
          <div>
            <div style="font-weight:600;font-size:0.875rem;color:var(--text-dark);">${item.name}</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-top:0.2rem;">Party Supplies</div>
          </div>
        </div>
      </td>
      <td style="font-weight:600;color:var(--text-dark);white-space:nowrap;">₹${item.price.toLocaleString('en-IN')}</td>
      <td>
        <div style="display:flex;align-items:center;border:1.5px solid var(--border-dark);border-radius:var(--radius);overflow:hidden;width:fit-content;">
          <button class="qty-minus" style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:var(--light);color:var(--text);font-size:1.1rem;transition:all 0.15s;flex-shrink:0;" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <input class="qty-input" type="number" min="1" max="99" value="${item.qty}" data-id="${item.id}" style="width:44px;height:34px;text-align:center;border:none;border-left:1.5px solid var(--border-dark);border-right:1.5px solid var(--border-dark);font-size:0.875rem;font-weight:600;color:var(--text-dark);background:var(--white);outline:none;" aria-label="Quantity">
          <button class="qty-plus"  style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:var(--light);color:var(--text);font-size:1.1rem;transition:all 0.15s;flex-shrink:0;" data-id="${item.id}" aria-label="Increase quantity">+</button>
        </div>
      </td>
      <td style="font-weight:700;color:var(--primary);white-space:nowrap;">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
      <td>
        <button class="btn-remove-cart remove-btn" data-id="${item.id}" aria-label="Remove item" title="Remove">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    </tr>
  `).join('');

  // Update totals
  const subtotal = getCartTotal();
  const discount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.pct / 100)) : 0;
  const shipping = subtotal >= 999 ? 0 : 79;
  const total    = subtotal - discount + shipping;

  if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN');
  if (discountEl) discountEl.textContent = discount > 0 ? '−₹' + discount.toLocaleString('en-IN') : '—';
  const shipEl = document.getElementById('cartShipping');
  if (shipEl) {
    shipEl.textContent = shipping === 0 ? 'FREE' : '₹' + shipping;
    shipEl.style.color = shipping === 0 ? 'var(--success)' : 'var(--text-dark)';
  }
  if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');

  // Quantity change handlers
  tableBody.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const item = getCart().find(i => i.id === id);
      if (item) { updateCartItem(id, item.qty - 1); renderCartPage(); }
    });
  });
  tableBody.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const item = getCart().find(i => i.id === id);
      if (item) { updateCartItem(id, item.qty + 1); renderCartPage(); }
    });
  });
  tableBody.querySelectorAll('.qty-input').forEach(inp => {
    inp.addEventListener('change', () => {
      updateCartItem(inp.dataset.id, parseInt(inp.value) || 1);
      renderCartPage();
    });
  });
  tableBody.querySelectorAll('.btn-remove-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.id);
      renderCartPage();
      showToast?.('info', 'Removed', 'Item removed from cart.');
    });
  });
}
window.renderCartPage = renderCartPage;

/* ============================================================
   COUPON SYSTEM
   ============================================================ */
let appliedCoupon = null;
const COUPONS = {
  'PARTY10':   { pct: 10, label: 'PARTY10 — 10% OFF' },
  'FESTIVO20': { pct: 20, label: 'FESTIVO20 — 20% OFF' },
  'SAVE30':    { pct: 30, label: 'SAVE30 — 30% OFF' },
};

function applyCoupon(code) {
  const coupon = COUPONS[code?.trim().toUpperCase()];
  const badgeEl     = document.getElementById('appliedCoupon');
  const badgeTextEl = document.getElementById('appliedCouponText');
  const hintEl      = document.getElementById('couponHint');

  if (coupon) {
    appliedCoupon          = coupon;
    window._appliedCoupon  = coupon;          // expose for page-level remove handler
    showToast?.('success', 'Coupon Applied!', coupon.label);
    if (badgeTextEl) badgeTextEl.textContent = coupon.label + ' applied!';
    if (badgeEl)     { badgeEl.style.display = 'inline-flex'; }
    if (hintEl)      { hintEl.style.display = 'none'; }
    renderCartPage();
  } else {
    if (hintEl) { hintEl.textContent = 'Invalid coupon code. Try PARTY10, FESTIVO20, or SAVE30.'; hintEl.style.display = ''; }
    showToast?.('error', 'Invalid Coupon', 'This coupon code is not valid.');
  }
}

function removeCoupon() {
  appliedCoupon = null;
  window._appliedCoupon = null;
  const badgeEl = document.getElementById('appliedCoupon');
  const discEl  = document.getElementById('cartDiscount');
  const inputEl = document.getElementById('couponInput');
  if (badgeEl) badgeEl.style.display = 'none';
  if (discEl)  discEl.textContent    = '—';
  if (inputEl) inputEl.value         = '';
  renderCartPage();
}
window.removeCoupon = removeCoupon;

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();

  const couponBtn   = document.getElementById('applyCouponBtn');
  const couponInput = document.getElementById('couponInput');
  couponBtn?.addEventListener('click', () => applyCoupon(couponInput?.value));
  couponInput?.addEventListener('keydown', e => { if (e.key === 'Enter') applyCoupon(couponInput.value); });

  document.getElementById('removeCouponBtn')?.addEventListener('click', removeCoupon);

  // Checkout button (tag is an <a>, so only intercept when cart is empty)
  const checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn?.addEventListener('click', e => {
    if (getCartCount() === 0) {
      e.preventDefault();
      showToast?.('warning', 'Empty Cart', 'Please add items to your cart first.');
    }
  });
});

/* ============================================================
   EXPORTS (for other scripts)
   ============================================================ */
window.Cart = { getCart, addToCart, removeFromCart, updateCartItem, clearCart, getCartTotal, getCartCount };
