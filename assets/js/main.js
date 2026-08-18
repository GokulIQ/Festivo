/* ============================================================
   FESTIVO — main.js
   Core interactions, navigation, UI components
   ============================================================ */

'use strict';

/* ============================================================
   DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initAnnouncement();
  initStickyHeader();
  initMobileMenu();
  initSearch();
  initRTL();
  initScrollReveal();
  initCounters();
  initAccordions();
  initTabs();
  initTooltips();
  initProductCards();
  initImageGallery();
  initQuantityInputs();
  updateCartCount();
  updateWishlistCount();
  initDropdownMenus();
  initHeaderAuth();
});

window.addEventListener('load', () => {
  updateHeaderOffset();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(updateHeaderOffset, 100);
}, { passive: true });

/* ============================================================
   ANNOUNCEMENT BAR
   ============================================================ */
function initAnnouncement() {
  const bar = document.querySelector('.announcement-bar');
  const closeBtn = bar?.querySelector('.close-bar');
  const hidden = sessionStorage.getItem('announcement-hidden');

  if (hidden && bar) {
    bar.style.display = 'none';
  }
  updateHeaderOffset();

  if (!closeBtn || !bar) return;
  closeBtn.addEventListener('click', () => {
    bar.style.height = bar.offsetHeight + 'px';
    bar.style.overflow = 'hidden';
    bar.style.transition = 'height 0.3s ease, opacity 0.3s ease';
    requestAnimationFrame(() => { bar.style.height = '0'; bar.style.opacity = '0'; });
    setTimeout(() => {
      bar.style.display = 'none';
      updateHeaderOffset();
    }, 320);
    sessionStorage.setItem('announcement-hidden', '1');
  });
}

function updateHeaderOffset() {
  const bar = document.querySelector('.announcement-bar');
  const header = document.querySelector('.site-header');
  if (!header) return;
  let offset = 0;
  if (bar && bar.style.display !== 'none') {
    offset = bar.getBoundingClientRect().height;
  }
  document.documentElement.style.setProperty('--header-top-offset', offset + 'px');
}

/* ============================================================
   STICKY HEADER
   ============================================================ */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  updateHeaderOffset();

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   MOBILE MENU
   ============================================================ */
function initMobileMenu() {
  const toggle   = document.querySelector('.menu-toggle');
  const menu     = document.querySelector('.mobile-menu');
  const overlay  = document.querySelector('.mobile-menu-overlay');
  const closeBtn = document.querySelector('.mobile-menu-close');

  if (!toggle || !menu) return;

  const openMenu  = () => { menu.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeMenu = () => { menu.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow = ''; };

  toggle.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);

  // Sub-menu toggles
  document.querySelectorAll('.mobile-nav-link[data-toggle="sub"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sub = link.nextElementSibling;
      if (sub?.classList.contains('mobile-submenu')) {
        sub.classList.toggle('open');
        link.querySelector('.chevron')?.classList.toggle('open');
      }
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ============================================================
   SEARCH OVERLAY
   ============================================================ */
function initSearch() {
  const searchBtns    = document.querySelectorAll('[data-action="open-search"]');
  const overlay       = document.getElementById('searchOverlay');
  const closeBtn      = document.getElementById('searchClose');
  const input         = overlay?.querySelector('.search-input-wrap input');
  // inline clear-input button (the × inside the search box, separate from closeBtn)
  const clearBtn      = overlay?.querySelector('.search-clear');

  if (!overlay) return;

  const openSearch  = () => { overlay.classList.add('open'); setTimeout(() => input?.focus(), 100); };
  const closeSearch = () => overlay.classList.remove('open');

  /* Navigate to products page with the query pre-applied */
  const goToSearch = (query) => {
    const q = query.trim();
    if (!q) return;
    window.location.href = 'products.html?search=' + encodeURIComponent(q);
  };

  searchBtns.forEach(btn => btn.addEventListener('click', openSearch));
  closeBtn?.addEventListener('click', closeSearch);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });

  /* Submit on Enter key */
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); goToSearch(input.value); }
  });

  /* Clear button clears the input (stays on overlay) */
  clearBtn?.addEventListener('click', () => { if (input) { input.value = ''; input.focus(); } });

  /* Search tags — click navigates directly to results */
  overlay?.querySelectorAll('.search-tag').forEach(tag => {
    tag.addEventListener('click', () => goToSearch(tag.textContent.trim()));
  });
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => observer.observe(el));
  } else {
    targets.forEach(el => el.classList.add('visible'));
  }
}

/* ============================================================
   COUNTER ANIMATION
   ============================================================ */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target   = parseFloat(el.dataset.count);
    const suffix   = el.dataset.suffix || '';
    const duration = parseInt(el.dataset.duration || '2000');
    const step     = target / (duration / 16);
    let current    = 0;
    const timer    = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = (Number.isInteger(target) ? Math.round(current) : current.toFixed(1)) + suffix;
    }, 16);
  };

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => obs.observe(el));
  } else {
    counters.forEach(animateCounter);
  }
}

/* ============================================================
   ACCORDIONS
   ============================================================ */
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item   = header.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close all in same group
      const group = item.closest('[data-accordion-group]');
      if (group) {
        group.querySelectorAll('.accordion-item.open').forEach(i => i.classList.remove('open'));
      }

      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ============================================================
   TABS
   ============================================================ */
function initTabs() {
  document.querySelectorAll('.tabs-nav').forEach(nav => {
    nav.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        if (!target) return;

        // Deactivate all
        nav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show target panel
        const container = btn.closest('.tabs') || document;
        container.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.toggle('active', panel.id === target);
        });
      });
    });
  });
}

/* ============================================================
   TOOLTIPS (simple title-based)
   ============================================================ */
function initTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.setAttribute('title', el.dataset.tooltip);
  });
}

/* ============================================================
   PRODUCT CARDS — Wishlist + Quick View
   ============================================================ */
function initProductCards() {
  // Wishlist buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-wishlist');
    if (!btn) return;
    e.preventDefault();
    const productId = btn.dataset.id;
    if (!productId) return;
    toggleWishlist(productId, btn);
  });

  // Add to cart buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-cart, [data-action="add-cart"], [data-action="add-to-cart"]');
    if (!btn) return;
    e.preventDefault();
    const productId = btn.dataset.id || 'unknown';
    const name      = btn.dataset.name || btn.closest('[data-product-name]')?.dataset.productName || 'Product';
    const price     = parseFloat(btn.dataset.price || '0');
    addToCart({ id: productId, name, price, qty: 1, img: btn.dataset.img || '' });
    showToast('success', 'Added to Cart', `"${name}" added to your cart.`);
    updateCartCount();
    animateCartIcon();
  });

  // Quick view
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="quick-view"]');
    if (!btn) return;
    e.preventDefault();
    openQuickView(btn.dataset);
  });
}

/* ============================================================
   PRODUCT IMAGE GALLERY (product-details page)
   ============================================================ */
function initImageGallery() {
  const mainImg  = document.getElementById('mainProductImg');
  const thumbs   = document.querySelectorAll('.product-thumb');
  if (!mainImg || !thumbs.length) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src || thumb.querySelector('img')?.src;
      if (src) {
        mainImg.style.opacity = '0';
        setTimeout(() => { mainImg.src = src; mainImg.style.opacity = '1'; }, 150);
      }
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

/* ============================================================
   QUANTITY INPUTS
   ============================================================ */
function initQuantityInputs() {
  document.querySelectorAll('.qty-wrap').forEach(wrap => {
    const minus = wrap.querySelector('.qty-minus');
    const plus  = wrap.querySelector('.qty-plus');
    const input = wrap.querySelector('.qty-input');
    if (!input) return;

    minus?.addEventListener('click', () => {
      const min = parseInt(input.min || '1');
      const val = parseInt(input.value) - 1;
      input.value = Math.max(min, val);
      input.dispatchEvent(new Event('change'));
    });
    plus?.addEventListener('click', () => {
      const max = parseInt(input.max || '999');
      const val = parseInt(input.value) + 1;
      input.value = Math.min(max, val);
      input.dispatchEvent(new Event('change'));
    });
    input.addEventListener('change', () => {
      const min = parseInt(input.min || '1');
      const max = parseInt(input.max || '999');
      input.value = Math.max(min, Math.min(max, parseInt(input.value) || 1));
    });
  });
}

/* ============================================================
   QUICK VIEW MODAL
   ============================================================ */
function openQuickView(data) {
  const modal = document.getElementById('quickViewModal');
  if (!modal) return;
  // Populate modal with data attributes
  const title = modal.querySelector('.qv-title');
  const price = modal.querySelector('.qv-price');
  if (title) title.textContent = data.name || '';
  if (price) price.textContent = '₹' + (data.price || '');
  modal.closest('.modal-overlay')?.classList.add('open');
}

/* ============================================================
   DROPDOWN MENUS — keyboard accessible
   ============================================================ */
function initDropdownMenus() {
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('.nav-link');
    link?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const menu = item.querySelector('.dropdown-menu, .mega-menu');
        if (menu) { menu.style.opacity === '1' ? closeAllDropdowns() : openDropdown(item); }
      }
    });
  });
}

function openDropdown(item) {
  closeAllDropdowns();
  const menu = item.querySelector('.dropdown-menu, .mega-menu');
  if (menu) { menu.style.opacity = '1'; menu.style.visibility = 'visible'; menu.style.transform = 'translateY(0)'; }
}
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu, .mega-menu').forEach(m => {
    m.style.opacity = ''; m.style.visibility = ''; m.style.transform = '';
  });
}

/* ============================================================
   CART ANIMATION
   ============================================================ */
function animateCartIcon() {
  const cartBtn = document.querySelector('[data-action="open-cart"], .hdr-cart');
  if (!cartBtn) return;
  cartBtn.classList.add('bounce');
  setTimeout(() => cartBtn.classList.remove('bounce'), 500);
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
let toastContainer = null;
function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

const TOAST_ICONS = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill' };

function showToast(type = 'info', title = '', message = '', duration = 3500) {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="bi ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i></div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close"><i class="bi bi-x"></i></button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });

  const remove = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  };
  toast.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, duration);
  return toast;
}

// Expose globally
window.showToast = showToast;

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
}
window.openModal  = openModal;
window.closeModal = closeModal;

// Auto-bind modal close buttons
document.addEventListener('click', (e) => {
  // Close on overlay click
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id);
  }
  // Close button
  const closeBtn = e.target.closest('[data-modal-close]');
  if (closeBtn) {
    const overlay = closeBtn.closest('.modal-overlay');
    if (overlay) closeModal(overlay.id);
  }
  // Open button
  const openBtn = e.target.closest('[data-modal-open]');
  if (openBtn) openModal(openBtn.dataset.modalOpen);
});

/* ============================================================
   ADMIN SIDEBAR TOGGLE (mobile)
   ============================================================ */
function initAdminSidebar() {
  const toggle  = document.getElementById('adminSidebarToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (!toggle || !sidebar) return;

  // Ensure overlay exists
  let overlay = document.querySelector('.admin-sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'admin-sidebar-overlay';
    document.body.appendChild(overlay);
  }

  const openSidebar  = () => { sidebar.classList.add('mobile-open');    overlay.classList.add('open');    document.body.style.overflow = 'hidden'; };
  const closeSidebar = () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('open'); document.body.style.overflow = ''; };

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  // Close on ESC
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

  // Handle window resize — close sidebar if expanding past mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) closeSidebar();
  }, { passive: true });
}
document.addEventListener('DOMContentLoaded', initAdminSidebar);

/* ============================================================
   WISHLIST HELPERS
   ============================================================ */
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('festivo_wishlist') || '[]'); } catch { return []; }
}
function saveWishlist(list) {
  localStorage.setItem('festivo_wishlist', JSON.stringify(list));
}
function toggleWishlist(id, btn) {
  let list = getWishlist();
  const idx = list.indexOf(id);
  if (idx === -1) {
    list.push(id);
    btn?.classList.add('active');
    showToast('success', 'Saved!', 'Item added to your wishlist.');
  } else {
    list.splice(idx, 1);
    btn?.classList.remove('active');
    showToast('info', 'Removed', 'Item removed from wishlist.');
  }
  saveWishlist(list);
  updateWishlistCount();
}
function updateWishlistCount() {
  const count = getWishlist().length;
  document.querySelectorAll('.wishlist-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? '' : 'none';
  });
}
function isInWishlist(id) { return getWishlist().includes(id); }
window.toggleWishlist   = toggleWishlist;
window.isInWishlist     = isInWishlist;
window.updateWishlistCount = updateWishlistCount;

/* ============================================================
   SMOOTH SCROLL FOR ANCHOR LINKS
   ============================================================ */
function getStickyHeaderTotalHeight() {
  const bar = document.querySelector('.announcement-bar');
  const header = document.querySelector('.site-header');
  let total = 0;
  if (bar && bar.style.display !== 'none') total += bar.getBoundingClientRect().height;
  if (header) total += header.getBoundingClientRect().height;
  return total + 8;
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      const offset = getStickyHeaderTotalHeight();
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});

/* ============================================================
   LAZY LOAD IMAGES
   ============================================================ */
if ('IntersectionObserver' in window) {
  const imgObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const img = e.target;
        if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
        imgObs.unobserve(img);
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => imgObs.observe(img));
}

/* ============================================================
   HEADER AUTH STATE
   Shows profile avatar + wishlist + cart when logged in.
   Shows Sign In + Register links when logged out.
   ============================================================ */
function initHeaderAuth() {
  const actions = document.querySelector('.header-actions');
  if (!actions) return;

  const session = (typeof FestivoAuth !== 'undefined') ? FestivoAuth.getSession() : null;

  // Elements that only make sense when logged in
  const accountLink  = actions.querySelector('[aria-label="My Account"]');
  const wishlistLink = actions.querySelector('[aria-label*="Wishlist"]');

  if (session) {
    /* ── LOGGED IN ── show avatar, wishlist, cart; remove sign-in/register */
    // Replace the generic person icon with an avatar bubble
    if (accountLink) {
      const initial = (session.avatar || session.name || '?').charAt(0).toUpperCase();
      accountLink.innerHTML = `<span class="hdr-avatar">${initial}</span>`;
      accountLink.setAttribute('aria-label', 'My Account — ' + session.name);
      accountLink.style.display = '';
    }
    if (wishlistLink) wishlistLink.style.display = '';

    // Remove any previously injected auth links
    actions.querySelectorAll('.hdr-auth-link').forEach(el => el.remove());
  } else {
    /* ── LOGGED OUT ── hide avatar & wishlist; show Sign In + Register */
    if (accountLink)  accountLink.style.display  = 'none';
    if (wishlistLink) wishlistLink.style.display = 'none';

    // Inject only once
    if (!actions.querySelector('.hdr-auth-link')) {
      const menuToggle = actions.querySelector('.menu-toggle');
      const signIn = document.createElement('a');
      signIn.href      = 'login.html';
      signIn.className = 'hdr-auth-link hdr-auth-signin';
      signIn.textContent = 'Sign In';

      const register = document.createElement('a');
      register.href      = 'register.html';
      register.className = 'hdr-auth-link hdr-auth-register';
      register.textContent = 'Register';

      if (menuToggle) {
        actions.insertBefore(register, menuToggle);
        actions.insertBefore(signIn, register);
      } else {
        actions.appendChild(signIn);
        actions.appendChild(register);
      }
    }
  }
}
window.initHeaderAuth = initHeaderAuth;

/* ============================================================
   RTL TOGGLE — ⇄ RTL / ⇄ LTR button

   theme.js runs in <head> and sets html[dir] from localStorage
   BEFORE paint (no flash). initRTL() runs at DOMContentLoaded
   to:
     1. Re-confirm the dir attribute is correct
     2. Sync all toggle button labels to current state
     3. Wire click handlers

   Label convention:
     LTR page → shows "RTL"  (clicking will switch TO rtl)
     RTL page → shows "LTR"  (clicking will switch TO ltr)
   ============================================================ */
function initRTL() {
  const html = document.documentElement;

  /* ── Read the source-of-truth from localStorage ── */
  const stored = (typeof window.getStoredDir === 'function')
    ? window.getStoredDir()
    : (localStorage.getItem('festivo_dir') || 'ltr');

  /* ── Re-apply to make absolutely sure html[dir] matches storage ── */
  if (typeof window.applyDir === 'function') {
    window.applyDir(stored);
  } else {
    html.setAttribute('dir', stored);
  }

  /* ── Sync toggle button labels ── */
  const syncLabels = (dir) => {
    const isRTL    = dir === 'rtl';
    const nextText = isRTL ? 'LTR' : 'RTL';
    const nextAria = isRTL ? 'Switch to LTR layout' : 'Switch to RTL layout';
    document.querySelectorAll('.dir-toggle, .rtl-toggle').forEach(btn => {
      const lbl = btn.querySelector('.dir-toggle-label');
      if (lbl) lbl.textContent = nextText;
      btn.setAttribute('aria-label', nextAria);
      btn.setAttribute('title',      nextAria);
    });
  };

  syncLabels(stored);

  /* ── Wire click handlers (guard against double-bind) ── */
  document.querySelectorAll('.dir-toggle, .rtl-toggle').forEach(btn => {
    if (btn.dataset.rtlBound) return;
    btn.dataset.rtlBound = '1';
    btn.addEventListener('click', () => {
      const current = html.getAttribute('dir') || 'ltr';
      const next    = current === 'rtl' ? 'ltr' : 'rtl';
      if (typeof window.applyDir === 'function') {
        window.applyDir(next);
      } else {
        html.setAttribute('dir', next);
        localStorage.setItem('festivo_dir', next);
      }
      syncLabels(next);
    });
  });
}
window.initRTL = initRTL;
