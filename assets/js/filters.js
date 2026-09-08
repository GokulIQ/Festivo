/* ============================================================
   FESTIVO — filters.js
   Product filtering, sorting, search, pagination
   ============================================================ */

'use strict';

/* ============================================================
   PRODUCT DATA (Demo)
   ============================================================ */
const PRODUCTS = [
  { id: 'p1',  name: 'Pastel Birthday Balloon Garland Kit',  category: 'balloons',  price: 649,  oldPrice: 899,  rating: 4.8, reviews: 234, badge: 'bestseller', img: '' },
  { id: 'p2',  name: 'Unicorn Dreams Birthday Set',          category: 'birthday',  price: 1299, oldPrice: 1799, rating: 4.9, reviews: 189, badge: 'new',        img: '' },
  { id: 'p3',  name: 'Royal Wedding Backdrop Panel',         category: 'wedding',   price: 2499, oldPrice: 3299, rating: 4.7, reviews: 95,  badge: 'sale',       img: '' },
  { id: 'p4',  name: 'Baby Shower Blue Theme Kit',           category: 'baby',      price: 999,  oldPrice: 1299, rating: 4.6, reviews: 142, badge: '',           img: '' },
  { id: 'p5',  name: 'Jungle Safari Party Decorations',      category: 'birthday',  price: 1149, oldPrice: 1499, rating: 4.5, reviews: 167, badge: 'hot',        img: '' },
  { id: 'p6',  name: 'Boho Celebration Table Decor Set',     category: 'wedding',   price: 1799, oldPrice: 2299, rating: 4.8, reviews: 73,  badge: '',           img: '' },
  { id: 'p7',  name: 'Giant Number Foil Balloons (Set)',     category: 'balloons',  price: 399,  oldPrice: 549,  rating: 4.4, reviews: 298, badge: 'sale',       img: '' },
  { id: 'p8',  name: 'Diwali Festival Lights Kit',           category: 'festival',  price: 849,  oldPrice: 1099, rating: 4.7, reviews: 311, badge: 'bestseller', img: '' },
  { id: 'p9',  name: 'Fairy Light Backdrop 2x2m',            category: 'backdrops', price: 1599, oldPrice: 1999, rating: 4.6, reviews: 124, badge: '',           img: '' },
  { id: 'p10', name: 'Princess Birthday DIY Kit',            category: 'diy',       price: 799,  oldPrice: 999,  rating: 4.5, reviews: 88,  badge: 'new',        img: '' },
  { id: 'p11', name: 'Christmas Wreath & Decor Set',         category: 'festival',  price: 1299, oldPrice: 1699, rating: 4.8, reviews: 256, badge: '',           img: '' },
  { id: 'p12', name: 'Confetti Balloon Arch Kit',            category: 'balloons',  price: 899,  oldPrice: 1199, rating: 4.7, reviews: 201, badge: 'bestseller', img: '' },
  { id: 'p13', name: 'Bohemian Floral Backdrop',             category: 'backdrops', price: 2199, oldPrice: 2799, rating: 4.9, reviews: 67,  badge: 'new',        img: '' },
  { id: 'p14', name: 'Baby Shower Pink Theme Complete Kit',  category: 'baby',      price: 1199, oldPrice: 1599, rating: 4.7, reviews: 112, badge: '',           img: '' },
  { id: 'p15', name: 'Wedding Table Centrepiece Set (10pc)', category: 'wedding',   price: 3299, oldPrice: 4299, rating: 4.8, reviews: 44,  badge: 'premium',    img: '' },
  { id: 'p16', name: 'Happy Birthday Bunting Banner',        category: 'birthday',  price: 299,  oldPrice: 399,  rating: 4.3, reviews: 445, badge: '',           img: '' },
];

const ITEMS_PER_PAGE = 9;
let currentPage     = 1;
let filteredProducts = [...PRODUCTS];

/* ============================================================
   FILTER STATE
   ============================================================ */
const filterState = {
  category:     '',
  minPrice:     0,
  maxPrice:     10000,
  minRating:    0,
  availability: '',
  search:       '',
  sort:         'default',
};

/* ============================================================
   APPLY FILTERS
   ============================================================ */
function applyFilters() {
  filteredProducts = PRODUCTS.filter(p => {
    if (filterState.category && p.category !== filterState.category) return false;
    if (p.price < filterState.minPrice || p.price > filterState.maxPrice) return false;
    if (filterState.minRating && p.rating < filterState.minRating) return false;
    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Sort
  switch (filterState.sort) {
    case 'price-asc':  filteredProducts.sort((a,b) => a.price - b.price); break;
    case 'price-desc': filteredProducts.sort((a,b) => b.price - a.price); break;
    case 'rating':     filteredProducts.sort((a,b) => b.rating - a.rating); break;
    case 'newest':     filteredProducts.sort((a,b) => (b.id > a.id ? 1 : -1)); break;
  }

  currentPage = 1;
  renderProducts();
  renderPagination();
  updateResultCount();
}

/* ============================================================
   RENDER PRODUCTS
   ============================================================ */
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const start    = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredProducts.slice(start, start + ITEMS_PER_PAGE);

  if (paginated.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 1rem;">
        <i class="bi bi-search" style="font-size:3rem;color:var(--muted);display:block;margin-bottom:1rem;"></i>
        <h3 style="font-size:1.25rem;margin-bottom:0.5rem;">No products found</h3>
        <p style="color:var(--muted);">Try adjusting your filters or search query.</p>
        <button onclick="resetFilters()" class="btn btn-outline" style="margin-top:1rem;">Reset Filters</button>
      </div>`;
    return;
  }

  const isListView = document.getElementById('listViewBtn')?.classList.contains('active');

  grid.innerHTML = paginated.map(p => renderProductCard(p, isListView)).join('');

  // Bind wishlist state
  const wishlist = JSON.parse(localStorage.getItem('festivo_wishlist') || '[]');
  grid.querySelectorAll('.btn-wishlist').forEach(btn => {
    if (wishlist.includes(btn.dataset.id)) btn.classList.add('active');
  });

  // Trigger scroll-reveal for freshly injected cards.
  // initScrollReveal() only queries existing elements on DOMContentLoaded,
  // so dynamically rendered cards would stay at opacity:0 without this.
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  } else {
    grid.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

function renderProductCard(p, isList = false) {
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const stars    = renderStars(p.rating);
  const bgColors = { birthday:'#fde8eb', balloons:'#ede9fe', wedding:'#fef3c7', baby:'#dbeafe', festival:'#d1fae5', backdrops:'#e0f2fe', diy:'#fce7f3', default:'#f1f3f5' };
  const bgColor  = bgColors[p.category] || bgColors.default;
  const icons    = { birthday:'🎂', balloons:'🎈', wedding:'💍', baby:'👶', festival:'🪔', backdrops:'🌸', diy:'✂️' };
  const icon     = icons[p.category] || '🎁';
  const imgSrc   = window.PRODUCTS_DETAIL?.[p.id]?.images?.[0] || '';

  return `
    <div class="product-card reveal">
      <div class="product-img" style="background:${bgColor};">
        ${imgSrc ? `<img src="${imgSrc}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;display:block;"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
        <div class="img-placeholder" style="background:${bgColor};font-size:3rem;${imgSrc ? 'display:none;' : ''}">${icon}</div>
        <div class="product-badges">
          ${discount > 0 ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
          ${p.badge === 'new'        ? `<span class="badge badge-new">New</span>` : ''}
          ${p.badge === 'bestseller' ? `<span class="badge badge-hot">Best Seller</span>` : ''}
          ${p.badge === 'hot'        ? `<span class="badge" style="background:#ff6b00;color:#fff;">Hot</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="product-action-btn btn-wishlist" data-id="${p.id}" title="Add to Wishlist"><i class="bi bi-heart"></i></button>
          <a href="product-details.html?id=${p.id}" class="product-action-btn" title="Quick View"><i class="bi bi-eye"></i></a>
          <button class="product-action-btn" title="Compare"><i class="bi bi-arrow-left-right"></i></button>
        </div>
      </div>
      <div class="product-body">
        <div class="product-category">${p.category}</div>
        <h3 class="product-title"><a href="product-details.html?id=${p.id}">${p.name}</a></h3>
        <div class="product-rating">
          <div class="stars">${stars}</div>
          <span class="rating-count">${p.rating} (${p.reviews})</span>
        </div>
        <div class="product-price">
          <span class="price-current">₹${p.price.toLocaleString('en-IN')}</span>
          ${p.oldPrice ? `<span class="price-old">₹${p.oldPrice.toLocaleString('en-IN')}</span>` : ''}
        </div>
      </div>
      <div class="product-footer">
        <button class="btn-add-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
          <i class="bi bi-bag-plus"></i> Add to Cart
        </button>
      </div>
    </div>`;
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) html += '<i class="bi bi-star-fill"></i>';
    else if (rating >= i - 0.5) html += '<i class="bi bi-star-half"></i>';
    else html += '<i class="bi bi-star"></i>';
  }
  return html;
}

/* ============================================================
   PAGINATION
   ============================================================ */
function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  let html = `<button class="page-btn" onclick="goToPage(${currentPage-1})" ${currentPage===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7) {
      if (i !== 1 && i !== totalPages && Math.abs(i - currentPage) > 2) {
        if (i === 2 || i === totalPages - 1) { html += `<span class="page-btn" style="pointer-events:none;">…</span>`; }
        continue;
      }
    }
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goToPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
  renderPagination();
  document.getElementById('productsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.goToPage = goToPage;

/* ============================================================
   RESULT COUNT
   ============================================================ */
function updateResultCount() {
  const el = document.getElementById('resultCount');
  if (el) el.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`;
}

/* ============================================================
   RESET FILTERS
   ============================================================ */
function resetFilters() {
  filterState.category = ''; filterState.minPrice = 0; filterState.maxPrice = 10000;
  filterState.minRating = 0; filterState.search = ''; filterState.sort = 'default';
  document.querySelectorAll('.filter-category').forEach(el => el.classList.remove('active'));
  const priceRange = document.getElementById('priceRange');
  if (priceRange) priceRange.value = 10000;
  const searchInput = document.getElementById('productSearch');
  if (searchInput) searchInput.value = '';
  applyFilters();
}
window.resetFilters = resetFilters;

/* ============================================================
   INIT FILTER UI
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('productsGrid')) return;

  applyFilters();

  // Category filters
  document.querySelectorAll('[data-filter-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterState.category = btn.dataset.filterCat === 'all' ? '' : btn.dataset.filterCat;
      applyFilters();
    });
  });

  // Price range
  const priceRange    = document.getElementById('priceRange');
  const priceDisplay  = document.getElementById('priceDisplay');
  priceRange?.addEventListener('input', () => {
    filterState.maxPrice = parseInt(priceRange.value);
    if (priceDisplay) priceDisplay.textContent = '₹' + parseInt(priceRange.value).toLocaleString('en-IN');
    applyFilters();
  });

  // Rating filter
  document.querySelectorAll('[data-filter-rating]').forEach(el => {
    el.addEventListener('change', () => {
      filterState.minRating = parseFloat(el.value);
      applyFilters();
    });
  });

  // Search
  const searchInput = document.getElementById('productSearch');
  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { filterState.search = searchInput.value; applyFilters(); }, 300);
  });

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  sortSelect?.addEventListener('change', () => { filterState.sort = sortSelect.value; applyFilters(); });

  // View toggle
  document.getElementById('gridViewBtn')?.addEventListener('click', () => {
    document.getElementById('productsGrid').className = 'grid grid-3 gap-6';
    document.getElementById('gridViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    renderProducts();
  });
  document.getElementById('listViewBtn')?.addEventListener('click', () => {
    document.getElementById('productsGrid').style.gridTemplateColumns = '1fr';
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('gridViewBtn').classList.remove('active');
    renderProducts();
  });

  // Mobile filter toggle
  document.getElementById('filterToggleBtn')?.addEventListener('click', () => {
    document.querySelector('.products-sidebar')?.classList.toggle('mobile-open');
    document.querySelector('.sidebar-filters')?.classList.toggle('mobile-open');
  });

  // Pre-fill search from ?search= URL param
  const urlSearch = new URLSearchParams(location.search).get('search');
  if (urlSearch) {
    filterState.search = urlSearch;
    const searchInput = document.getElementById('productSearch');
    if (searchInput) searchInput.value = urlSearch;
    applyFilters();
  }
});
