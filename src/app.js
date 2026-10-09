import { store, CURRENCIES, VENDOR_ACCOUNTS } from './state.js';
import { VENDORS } from './data/vendors.js';
import { REVIEWS } from './data/reviews.js';

// ─── UTILS ───────────────────────────────────────────────────────────────────

function stars(rating) {
  const full = Math.floor(rating || 5);
  const half = (rating || 5) % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    '<i class="fas fa-star text-gold-400"></i>'.repeat(full) +
    (half ? '<i class="fas fa-star-half-stroke text-gold-400"></i>' : '') +
    '<i class="far fa-star text-charcoal-400"></i>'.repeat(empty)
  );
}

function openModal(overlayId, modalId) {
  const overlay = document.getElementById(overlayId);
  const modal = document.getElementById(modalId);
  if (!overlay || !modal) return;
  overlay.classList.remove('opacity-0', 'pointer-events-none');
  requestAnimationFrame(() => {
    modal.classList.remove('scale-95');
    modal.classList.add('scale-100');
  });
  document.body.style.overflow = 'hidden';
}

function closeModal(overlayId, modalId) {
  const overlay = document.getElementById(overlayId);
  const modal = document.getElementById(modalId);
  if (!overlay || !modal) return;
  modal.classList.remove('scale-100');
  modal.classList.add('scale-95');
  overlay.classList.add('opacity-0');
  setTimeout(() => {
    overlay.classList.add('pointer-events-none');
    document.body.style.overflow = '';
  }, 280);
}

// Helper to resize and compress uploaded images to Base64
function processImageFile(file, callback) {
  if (!file || !file.type.startsWith('image/')) {
    store.toast('Please select a valid image file', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ─── PRODUCT CARD RENDERER ────────────────────────────────────────────────────

function renderProductCard(p) {
  const price = store.formatPrice(p.priceKES);
  const origPrice = store.formatPrice(p.originalPriceKES);
  const discount = Math.round((1 - (p.priceKES / (p.originalPriceKES || p.priceKES))) * 100);
  const wishlisted = store.isWishlisted(p.id);
  const accordPills = (p.accords || []).slice(0, 3).map(a =>
    `<span class="px-2 py-0.5 rounded-full bg-cream-200 border border-gold-200 text-charcoal-700 text-[10px] font-medium">${a}</span>`
  ).join('');

  return `
    <article class="group relative flex flex-col bg-white rounded-2xl border border-gold-100 hover:border-gold-300 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gold-200/50 hover:-translate-y-0.5 shadow-sm">

      <!-- Product Image -->
      <div class="relative h-56 overflow-hidden bg-cream-200">
        <img 
          src="${p.image}" 
          alt="${p.name} – ${p.brand}"
          loading="lazy"
          class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent"></div>

        <!-- Badges -->
        <div class="absolute top-3 left-3 flex flex-col gap-1">
          ${p.isBestseller ? `<span class="px-2 py-0.5 rounded-full bg-gold-400 text-charcoal-900 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">Bestseller</span>` : ''}
          ${p.isNew ? `<span class="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">New Arrival</span>` : ''}
          ${discount > 5 ? `<span class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm">-${discount}%</span>` : ''}
          ${!p.inStock ? `<span class="px-2 py-0.5 rounded-full bg-charcoal-900 text-white text-[10px] font-bold uppercase">Out of Stock</span>` : ''}
        </div>

        <!-- Wishlist button -->
        <button 
          class="wishlist-toggle absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/80 backdrop-blur-sm border border-gold-200 hover:border-rose-400 ${wishlisted ? 'text-rose-500' : 'text-charcoal-400 hover:text-rose-500'}"
          data-id="${p.id}"
          title="Save to Wishlist"
        >
          <i class="${wishlisted ? 'fas' : 'far'} fa-heart text-sm"></i>
        </button>

        <!-- Gender Tag -->
        <div class="absolute bottom-3 left-3 text-[10px] px-2 py-0.5 rounded-full bg-white/90 border border-gold-200 text-gold-600 font-semibold backdrop-blur-sm shadow-sm">
          ${p.gender === 'Men' ? '♂ Men' : p.gender === 'Women' ? '♀ Women' : '⚥ Unisex'}
        </div>
      </div>

      <!-- Product Info -->
      <div class="flex flex-col flex-1 p-4 space-y-3">

        <div>
          <span class="text-[10px] uppercase tracking-widest text-gold-500 font-semibold">${p.brand}</span>
          <h3 class="font-serif text-sm font-bold text-charcoal-900 leading-snug line-clamp-2 mt-0.5 group-hover:text-gold-600 transition-colors">${p.name}</h3>
          <p class="text-[11px] text-charcoal-500 mt-0.5">${p.subtitle || ''}</p>
        </div>

        <!-- Rating -->
        <div class="flex items-center gap-1.5 text-xs">
          <div class="flex gap-0.5">${stars(p.rating)}</div>
          <span class="text-gold-500 font-semibold">${p.rating || 5.0}</span>
          <span class="text-charcoal-400">(${p.reviewsCount || 1})</span>
        </div>

        <!-- Scent Accords Preview -->
        <div class="flex flex-wrap gap-1.5">${accordPills}</div>

        <!-- Vendor Badge -->
        <div class="flex items-center gap-1.5 text-[10px] text-charcoal-500">
          <i class="fas fa-check-circle text-emerald-500"></i>
          <span>${p.vendorName || 'Maureh Vault'}</span>
        </div>

        <!-- Price & Actions -->
        <div class="mt-auto pt-3 border-t border-gold-100 flex items-center justify-between gap-2">
          <div>
            <div class="font-cinzel text-lg font-extrabold text-gold-500">${price}</div>
            <div class="text-[10px] text-charcoal-400 line-through">${origPrice}</div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              class="quick-view-btn px-3 py-2 rounded-lg bg-cream-100 border border-gold-200 hover:border-gold-400 text-gold-600 text-xs font-semibold transition-all"
              data-id="${p.id}"
              title="Quick View"
            >
              <i class="fas fa-eye"></i>
            </button>
            <button 
              class="add-to-cart-btn px-3.5 py-2 rounded-lg ${p.inStock ? 'bg-charcoal-900 hover:bg-charcoal-800 text-white' : 'bg-charcoal-300 text-charcoal-500 cursor-not-allowed'} text-xs font-extrabold uppercase tracking-wider transition-all shadow-md"
              data-id="${p.id}"
              ${!p.inStock ? 'disabled' : ''}
              title="${p.inStock ? 'Add to Bag' : 'Out of Stock'}"
            >
              <i class="fas fa-bag-shopping text-gold-300"></i>
            </button>
          </div>
        </div>

      </div>
    </article>
  `;
}

// ─── QUICK VIEW MODAL ─────────────────────────────────────────────────────────

function renderQuickView(p) {
  if (!p) return;
  const defaultSize = (p.sizes || []).find(s => s.isDefault) || (p.sizes || [])[0] || { size: '100ml Bottle', priceKES: p.priceKES };
  const price = store.formatPrice(p.priceKES);
  const origPrice = store.formatPrice(p.originalPriceKES);
  const discount = Math.round((1 - p.priceKES / (p.originalPriceKES || p.priceKES)) * 100);

  const sizePills = (p.sizes || []).map(s => `
    <button 
      class="size-selector-btn px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all ${s.isDefault ? 'bg-charcoal-900 border-charcoal-900 text-white' : 'bg-white border-gold-200 text-charcoal-700 hover:border-gold-400'}"
      data-price="${s.priceKES}"
      data-size="${s.size}"
    >
      ${s.size}<br><span class="text-[10px] font-bold ${s.isDefault ? 'text-gold-300' : 'text-gold-500'}">${store.formatPrice(s.priceKES)}</span>
    </button>
  `).join('');

  const notePyramid = (label, icon, notes, colorBorder) => `
    <div class="pyramid-tier p-3 rounded-xl bg-cream-100 border ${colorBorder} space-y-1.5">
      <div class="flex items-center gap-2 text-xs font-bold text-charcoal-800 uppercase tracking-widest">
        <i class="${icon} text-gold-500"></i> ${label} Notes
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${(notes || []).map(n => `<span class="px-2 py-0.5 text-[10px] rounded-full bg-white border border-gold-200 text-charcoal-700 font-medium">${n}</span>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('quickview-modal').innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
      
      <!-- Image Panel -->
      <div class="relative h-72 md:h-auto min-h-80 overflow-hidden rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none bg-cream-200">
        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover object-center">
        <div class="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent"></div>
        <div class="absolute top-4 left-4 flex flex-col gap-1.5">
          ${p.isBestseller ? `<span class="px-2 py-0.5 rounded-full bg-gold-400 text-charcoal-900 text-[10px] font-extrabold uppercase">Bestseller</span>` : ''}
          ${p.isNew ? `<span class="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase">New Arrival</span>` : ''}
          ${discount > 5 ? `<span class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">-${discount}% OFF</span>` : ''}
        </div>
        <button id="close-quickview-btn" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 text-charcoal-700 hover:text-charcoal-950 flex items-center justify-center border border-gold-200 hover:bg-charcoal-900 hover:text-white transition-colors shadow-md">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <!-- Detail Panel -->
      <div class="p-6 space-y-4 overflow-y-auto max-h-[80vh] md:max-h-[90vh] bg-white">
        
        <div>
          <span class="text-[10px] uppercase tracking-widest text-gold-500 font-bold">${p.brand} • ${p.concentration || 'Eau de Parfum'}</span>
          <h2 class="font-serif text-2xl font-bold text-charcoal-900 mt-1 leading-snug">${p.name}</h2>
          <p class="text-xs text-charcoal-500 mt-0.5">${p.subtitle || ''}</p>
        </div>

        <!-- Rating Row -->
        <div class="flex items-center gap-2 text-xs">
          <div class="flex gap-0.5">${stars(p.rating)}</div>
          <span class="text-gold-500 font-bold">${p.rating || 5.0}</span>
          <span class="text-charcoal-400">(${p.reviewsCount || 1} verified reviews)</span>
        </div>

        <!-- Description -->
        <p class="text-xs text-charcoal-600 leading-relaxed">${p.description || ''}</p>

        <!-- Performance Grid -->
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="p-2.5 rounded-lg bg-cream-100 border border-gold-200">
            <div class="text-charcoal-400 mb-0.5">Sillage</div>
            <div class="font-semibold text-charcoal-800">${p.performance?.sillage || 'Strong'}</div>
          </div>
          <div class="p-2.5 rounded-lg bg-cream-100 border border-gold-200">
            <div class="text-charcoal-400 mb-0.5">Longevity</div>
            <div class="font-semibold text-charcoal-800">${p.performance?.longevity || '10-12 Hours'}</div>
          </div>
          <div class="p-2.5 rounded-lg bg-cream-100 border border-gold-200">
            <div class="text-charcoal-400 mb-0.5">Best Season</div>
            <div class="font-semibold text-charcoal-800">${p.performance?.season || 'All-Season'}</div>
          </div>
          <div class="p-2.5 rounded-lg bg-cream-100 border border-gold-200">
            <div class="text-charcoal-400 mb-0.5">Occasion</div>
            <div class="font-semibold text-charcoal-800">${p.performance?.occasion || 'Signature Wear'}</div>
          </div>
        </div>

        <!-- Olfactory Pyramid -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-2">
            <i class="fas fa-layer-group text-gold-500 text-xs"></i> Olfactory Note Pyramid
          </h4>
          ${notePyramid('Top', 'fas fa-wind', p.notes?.top, 'border-sky-200')}
          ${notePyramid('Heart', 'fas fa-heart', p.notes?.heart, 'border-rose-200')}
          ${notePyramid('Base', 'fas fa-mountain', p.notes?.base, 'border-amber-200')}
        </div>

        <!-- Size Selection -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-charcoal-800 uppercase tracking-wider">Select Size</h4>
          <div id="size-selector" class="flex flex-wrap gap-2">${sizePills}</div>
        </div>

        <!-- Live Price Display -->
        <div class="flex items-end gap-3 py-2">
          <div>
            <div id="qv-price" class="font-cinzel text-2xl font-extrabold text-gold-500">${price}</div>
            <div class="text-xs text-charcoal-400 line-through">${origPrice}</div>
          </div>
          <span class="text-xs ${p.inStock ? 'text-emerald-600' : 'text-rose-600'} flex items-center gap-1 font-semibold">
            <i class="fas ${p.inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${p.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <!-- Vendor Info -->
        <div class="p-3 rounded-xl bg-cream-100 border border-gold-200 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <i class="fas fa-store text-gold-500"></i>
            <div>
              <span class="font-bold text-charcoal-800">${p.vendorName || 'Maureh Vault'}</span>
              <p class="text-charcoal-500">Verified Marketplace Seller</p>
            </div>
          </div>
          <i class="fas fa-certificate text-emerald-500 text-base" title="Verified Seller"></i>
        </div>

        <!-- Add to Cart Actions -->
        <div class="flex gap-3 pt-2">
          <button 
            id="qv-add-to-cart"
            data-id="${p.id}"
            ${!p.inStock ? 'disabled' : ''}
            class="flex-1 py-3.5 rounded-full ${p.inStock ? 'bg-charcoal-900 hover:bg-charcoal-800 text-white' : 'bg-charcoal-300 text-charcoal-500 cursor-not-allowed'} font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <i class="fas fa-bag-shopping text-gold-300"></i> ${p.inStock ? 'Add to Luxury Bag' : 'Out of Stock'}
          </button>
          <button 
            class="wishlist-toggle w-12 h-12 rounded-full border border-gold-300 flex items-center justify-center text-charcoal-600 hover:text-rose-500 hover:border-rose-300 transition-all bg-white"
            data-id="${p.id}"
          >
            <i class="${store.isWishlisted(p.id) ? 'fas text-rose-500' : 'far'} fa-heart"></i>
          </button>
        </div>

        <!-- WhatsApp Order -->
        <a 
          href="https://wa.me/254102796209?text=Hi%20Maureh%20Perfumes!%20I%20would%20like%20to%20order%20${encodeURIComponent(p.name + ' by ' + p.brand)}%20in%20size%20${encodeURIComponent(defaultSize.size)}.%20Price%20listed:%20KES%20${(p.priceKES || 0).toLocaleString()}.%20Please%20confirm%20availability."
          target="_blank"
          class="w-full py-3 rounded-full bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          <i class="fab fa-whatsapp text-emerald-600 text-sm"></i> Order Directly via WhatsApp
        </a>

      </div>
    </div>
  `;

  // Size Selector Interaction
  const sizeModal = document.getElementById('quickview-modal');
  let selectedSize = defaultSize;
  sizeModal.querySelectorAll('.size-selector-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sizeModal.querySelectorAll('.size-selector-btn').forEach(b => {
        b.className = b.className.replace('bg-charcoal-900 border-charcoal-900 text-white', 'bg-white border-gold-200 text-charcoal-700 hover:border-gold-400');
        const span = b.querySelector('span');
        if (span) span.className = 'text-[10px] font-bold text-gold-500';
      });
      btn.className = btn.className.replace('bg-white border-gold-200 text-charcoal-700 hover:border-gold-400', 'bg-charcoal-900 border-charcoal-900 text-white');
      const span = btn.querySelector('span');
      if (span) span.className = 'text-[10px] font-bold text-gold-300';
      selectedSize = { size: btn.dataset.size, priceKES: parseInt(btn.dataset.price) };
      document.getElementById('qv-price').textContent = store.formatPrice(selectedSize.priceKES);
    });
  });

  document.getElementById('close-quickview-btn')?.addEventListener('click', () => {
    closeModal('quickview-modal-overlay', 'quickview-modal');
  });

  document.getElementById('qv-add-to-cart')?.addEventListener('click', () => {
    store.addToCart(p, selectedSize);
    closeModal('quickview-modal-overlay', 'quickview-modal');
    openCartDrawer();
  });

  openModal('quickview-modal-overlay', 'quickview-modal');
}

// ─── CART DRAWER ─────────────────────────────────────────────────────────────

function openCartDrawer() {
  renderCartDrawer();
  const overlay = document.getElementById('cart-drawer-overlay');
  const drawer = document.getElementById('cart-drawer');
  overlay.classList.remove('opacity-0', 'pointer-events-none');
  requestAnimationFrame(() => drawer.classList.remove('translate-x-full'));
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  const drawer = document.getElementById('cart-drawer');
  drawer.classList.add('translate-x-full');
  overlay.classList.add('opacity-0');
  setTimeout(() => {
    overlay.classList.add('pointer-events-none');
    document.body.style.overflow = '';
  }, 300);
}

function renderCartDrawer() {
  const list = document.getElementById('cart-items-list');
  const subtotalEl = document.getElementById('drawer-subtotal');
  const totalEl = document.getElementById('drawer-total');
  const discountRow = document.getElementById('drawer-discount-row');
  const discountEl = document.getElementById('drawer-discount');
  const countEl = document.getElementById('drawer-cart-count');
  const freeShipEl = document.getElementById('free-shipping-container');

  const count = store.getCartCount();
  const subtotal = store.getCartSubtotalKES();
  const total = store.getCartTotalKES();
  const discount = store.getCartDiscountKES();
  const FREE_SHIP_THRESHOLD = 15000;

  if (countEl) countEl.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  if (subtotalEl) subtotalEl.textContent = store.formatPrice(subtotal);
  if (totalEl) totalEl.textContent = store.formatPrice(total);
  if (discountRow) discountRow.classList.toggle('hidden', discount === 0);
  if (discountEl) discountEl.textContent = `-${store.formatPrice(discount)}`;

  if (freeShipEl) {
    if (subtotal >= FREE_SHIP_THRESHOLD) {
      freeShipEl.innerHTML = `<div class="text-emerald-700 font-semibold flex items-center gap-1.5"><i class="fas fa-truck-fast text-emerald-600"></i> You qualify for FREE Nairobi delivery! 🎉</div>`;
    } else {
      const needed = FREE_SHIP_THRESHOLD - subtotal;
      const pct = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);
      freeShipEl.innerHTML = `
        <p class="text-charcoal-600 mb-1.5">Spend <strong class="text-gold-600">${store.formatPrice(needed)}</strong> more for free delivery</p>
        <div class="w-full bg-cream-300 rounded-full h-1.5">
          <div class="h-1.5 rounded-full bg-gold-400 transition-all duration-500" style="width:${pct}%"></div>
        </div>
      `;
    }
  }

  if (!list) return;

  if (store.cart.length === 0) {
    list.innerHTML = `
      <div class="flex flex-col items-center justify-center h-48 text-center space-y-3">
        <i class="fas fa-bag-shopping text-4xl text-charcoal-300"></i>
        <p class="text-sm text-charcoal-500">Your luxury bag is empty</p>
        <button id="continue-shopping-btn" class="px-5 py-2 rounded-full bg-charcoal-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-charcoal-800 transition-all">
          Explore Fragrances
        </button>
      </div>
    `;
    document.getElementById('continue-shopping-btn')?.addEventListener('click', closeCartDrawer);
    return;
  }

  list.innerHTML = store.cart.map(item => `
    <div class="flex gap-3 p-3 rounded-xl bg-white border border-gold-100 shadow-sm" data-key="${item.key}">
      <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gold-200">
      <div class="flex-1 min-w-0 space-y-1">
        <p class="text-xs font-bold text-charcoal-900 line-clamp-1">${item.name}</p>
        <p class="text-[11px] text-charcoal-500">${item.brand || ''} • ${item.size}</p>
        <p class="text-[10px] text-charcoal-400">Sold by: ${item.vendorName || 'Maureh Vault'}</p>
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-2">
            <button class="cart-qty-btn w-6 h-6 rounded-full bg-cream-200 hover:bg-charcoal-900 hover:text-white text-charcoal-700 flex items-center justify-center text-xs transition-colors font-bold" data-key="${item.key}" data-delta="-1">−</button>
            <span class="text-xs font-bold text-charcoal-800 min-w-[20px] text-center">${item.quantity}</span>
            <button class="cart-qty-btn w-6 h-6 rounded-full bg-cream-200 hover:bg-charcoal-900 hover:text-white text-charcoal-700 flex items-center justify-center text-xs transition-colors font-bold" data-key="${item.key}" data-delta="1">+</button>
          </div>
          <div class="text-right">
            <span class="text-sm font-cinzel font-bold text-gold-500">${store.formatPrice(item.priceKES * item.quantity)}</span>
          </div>
        </div>
      </div>
      <button class="cart-remove-btn text-charcoal-400 hover:text-rose-500 transition-colors self-start text-xs p-1" data-key="${item.key}" title="Remove">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');

  list.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.updateCartQty(btn.dataset.key, parseInt(btn.dataset.delta));
      renderCartDrawer();
    });
  });

  list.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.removeFromCart(btn.dataset.key);
      renderCartDrawer();
    });
  });
}

// ─── CHECKOUT & M-PESA DARAJA ENGINE ──────────────────────────────────────────

function renderCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  if (store.cart.length === 0) {
    store.toast("Your bag is empty. Add fragrances first!", "error");
    return;
  }

  const total = store.getCartTotalKES();

  modal.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="font-serif text-xl font-bold text-charcoal-900 flex items-center gap-2">
          <i class="fas fa-lock text-gold-500"></i> Secure Checkout
        </h3>
        <button id="close-checkout-btn" class="w-8 h-8 rounded-full bg-cream-100 border border-gold-200 text-charcoal-500 hover:bg-charcoal-900 hover:text-white flex items-center justify-center transition-colors">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <!-- Order Summary -->
      <div class="p-4 rounded-xl bg-cream-50 border border-gold-200 space-y-2">
        <h4 class="font-bold text-sm text-charcoal-900">Order Summary</h4>
        ${store.cart.map(item => `
          <div class="flex justify-between text-xs text-charcoal-600">
            <span class="line-clamp-1">${item.name} (${item.size}) x${item.quantity}</span>
            <span class="font-bold text-charcoal-900">${store.formatPrice(item.priceKES * item.quantity)}</span>
          </div>
        `).join('')}
        <div class="border-t border-gold-200 pt-2 flex justify-between font-bold text-sm">
          <span class="text-charcoal-900">Total:</span>
          <span class="font-cinzel text-gold-600 text-base">${store.formatPrice(total)}</span>
        </div>
      </div>

      <!-- Delivery Details -->
      <form id="checkout-form-inner" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-charcoal-700 mb-1">First Name</label>
            <input required type="text" id="chk-first-name" placeholder="John" class="w-full bg-cream-100 border border-gold-200 rounded-lg px-3 py-2.5 text-xs text-charcoal-800 focus:border-gold-400">
          </div>
          <div>
            <label class="block text-xs font-semibold text-charcoal-700 mb-1">Last Name</label>
            <input required type="text" id="chk-last-name" placeholder="Kamau" class="w-full bg-cream-100 border border-gold-200 rounded-lg px-3 py-2.5 text-xs text-charcoal-800 focus:border-gold-400">
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-charcoal-700 mb-1">Safaricom / WhatsApp Phone Number *</label>
          <input required type="tel" id="chk-phone" placeholder="e.g. 0102 796 209 or +254 102 796 209" class="w-full bg-cream-100 border border-gold-200 rounded-lg px-3 py-2.5 text-xs text-charcoal-800 focus:border-gold-400 font-mono">
        </div>
        <div>
          <label class="block text-xs font-semibold text-charcoal-700 mb-1">Delivery Address</label>
          <input required type="text" id="chk-address" placeholder="e.g. Westlands, GTC Towers / Karen / Kilimani" class="w-full bg-cream-100 border border-gold-200 rounded-lg px-3 py-2.5 text-xs text-charcoal-800 focus:border-gold-400">
        </div>
        <div>
          <label class="block text-xs font-semibold text-charcoal-700 mb-1">Area / City</label>
          <select required id="chk-area" class="w-full bg-cream-100 border border-gold-200 rounded-lg px-3 py-2.5 text-xs text-charcoal-800 focus:border-gold-400">
            <option value="Nairobi CBD (Same Day Delivery)">Nairobi CBD (Same Day – Free above KES 15k)</option>
            <option value="Westlands / Parklands / Spring Valley">Westlands / Parklands / Spring Valley</option>
            <option value="Karen / Lavington / Runda / Muthaiga">Karen / Lavington / Runda / Muthaiga</option>
            <option value="Kilimani / Kileleshwa / Hurlingham">Kilimani / Kileleshwa / Hurlingham</option>
            <option value="Mombasa & Coastal Region">Mombasa & Coastal Region</option>
            <option value="Kisumu & Western Kenya">Kisumu & Western Kenya</option>
            <option value="Countrywide Courier (Fargo / G4S)">Countrywide Courier (Fargo / G4S)</option>
          </select>
        </div>

        <!-- Payment Method -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-charcoal-700">Select Payment Method</label>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2 p-3 rounded-lg bg-white border-2 border-emerald-400 cursor-pointer shadow-sm">
              <input type="radio" name="paymentMethod" value="M-PESA (STK Push)" checked class="accent-emerald-600">
              <span class="text-xs text-charcoal-800 font-bold">📱 M-Pesa STK Push</span>
            </label>
            <label class="flex items-center gap-2 p-3 rounded-lg bg-white border border-gold-200 cursor-pointer hover:border-gold-400 transition-colors shadow-sm">
              <input type="radio" name="paymentMethod" value="Credit / Debit Card" class="accent-gold-500">
              <span class="text-xs text-charcoal-800 font-semibold">💳 Card Payment</span>
            </label>
            <label class="flex items-center gap-2 p-3 rounded-lg bg-white border border-gold-200 cursor-pointer hover:border-gold-400 transition-colors shadow-sm">
              <input type="radio" name="paymentMethod" value="WhatsApp Pay" class="accent-emerald-600">
              <span class="text-xs text-charcoal-800 font-semibold"><i class="fab fa-whatsapp text-emerald-500"></i> WhatsApp Pay</span>
            </label>
            <label class="flex items-center gap-2 p-3 rounded-lg bg-white border border-gold-200 cursor-pointer hover:border-gold-400 transition-colors shadow-sm">
              <input type="radio" name="paymentMethod" value="Cash on Delivery" class="accent-amber-500">
              <span class="text-xs text-charcoal-800 font-semibold">💵 Cash on Delivery</span>
            </label>
          </div>
        </div>

        <button type="submit" id="submit-checkout-btn" class="w-full py-4 rounded-full bg-charcoal-900 hover:bg-charcoal-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2">
          <i class="fas fa-shield-halved text-gold-300"></i>
          <span>Pay & Confirm Order – ${store.formatPrice(total)}</span>
        </button>
      </form>
    </div>
  `;

  document.getElementById('close-checkout-btn')?.addEventListener('click', () => {
    closeModal('checkout-modal-overlay', 'checkout-modal');
  });

  document.getElementById('checkout-form-inner')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('chk-first-name')?.value;
    const lastName = document.getElementById('chk-last-name')?.value;
    const phone = document.getElementById('chk-phone')?.value;
    const deliveryAddress = document.getElementById('chk-address')?.value;
    const deliveryArea = document.getElementById('chk-area')?.value;
    const selectedPayMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'M-PESA (STK Push)';

    const orderPayload = {
      firstName,
      lastName,
      phone,
      deliveryAddress,
      deliveryArea,
      paymentMethod: selectedPayMethod
    };

    if (selectedPayMethod === 'M-PESA (STK Push)') {
      // Launch M-Pesa STK Push Simulator
      renderMpesaPrompt(orderPayload);
    } else {
      // Direct placement
      const created = store.createOrder(orderPayload);
      renderOrderSuccessModal(created);
    }
  });

  openModal('checkout-modal-overlay', 'checkout-modal');
}

// ─── M-PESA STK PUSH SIMULATOR MODAL ──────────────────────────────────────────

function renderMpesaPrompt(orderPayload) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  const total = store.getCartTotalKES();
  const phone = orderPayload.phone;

  modal.innerHTML = `
    <div class="p-4 text-center space-y-5">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30 animate-pulse">
        <i class="fas fa-mobile-screen"></i>
      </div>

      <div>
        <span class="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">Safaricom Daraja Gateway</span>
        <h3 class="font-serif text-2xl font-bold text-charcoal-900 mt-1">M-PESA Express STK Push</h3>
        <p class="text-xs text-charcoal-500 mt-1">A payment prompt of <strong class="text-charcoal-900">${store.formatPrice(total)}</strong> has been sent to <strong class="text-emerald-700 font-mono">${phone}</strong></p>
      </div>

      <!-- Phone Simulator Graphic -->
      <div class="max-w-xs mx-auto p-4 rounded-2xl bg-charcoal-900 text-white text-left space-y-3 shadow-2xl border-2 border-emerald-400">
        <div class="flex items-center justify-between text-[10px] text-charcoal-400">
          <span>SIM TOOLKIT</span>
          <span>M-PESA</span>
        </div>
        <div class="bg-charcoal-800 p-3 rounded-xl text-xs space-y-1">
          <p class="font-bold text-emerald-400">Do you want to pay KES ${total.toLocaleString()} to MAUREH PERFUMES TILL 849201?</p>
          <p class="text-[10px] text-charcoal-300">Enter M-Pesa PIN:</p>
          <div class="tracking-widest text-base font-mono text-center text-gold-300">••••</div>
        </div>
      </div>

      <div id="mpesa-countdown" class="text-xs text-charcoal-500 font-semibold flex items-center justify-center gap-2">
        <i class="fas fa-spinner fa-spin text-emerald-600"></i> Waiting for PIN authentication on phone... (5s)
      </div>

      <div class="flex gap-3 pt-2">
        <button id="cancel-mpesa-btn" class="flex-1 py-3 rounded-full border border-gold-300 text-charcoal-600 hover:bg-cream-100 text-xs font-bold uppercase tracking-wider">
          Cancel
        </button>
        <button id="confirm-mpesa-sim-btn" class="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2">
          <i class="fas fa-check"></i> Simulate PIN Entered
        </button>
      </div>
    </div>
  `;

  let timerSec = 4;
  const timerInterval = setInterval(() => {
    timerSec--;
    const countdownEl = document.getElementById('mpesa-countdown');
    if (countdownEl) {
      countdownEl.innerHTML = `<i class="fas fa-spinner fa-spin text-emerald-600"></i> Waiting for PIN authentication on phone... (${timerSec}s)`;
    }
    if (timerSec <= 0) {
      clearInterval(timerInterval);
      completeMpesaPayment();
    }
  }, 1000);

  function completeMpesaPayment() {
    clearInterval(timerInterval);
    const txCode = `MPESA-Q${Math.floor(100000 + Math.random() * 900000)}K`;
    orderPayload.transactionRef = txCode;
    const created = store.createOrder(orderPayload);
    renderOrderSuccessModal(created);
  }

  document.getElementById('confirm-mpesa-sim-btn')?.addEventListener('click', () => {
    completeMpesaPayment();
  });

  document.getElementById('cancel-mpesa-btn')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    closeModal('checkout-modal-overlay', 'checkout-modal');
  });
}

function renderOrderSuccessModal(order) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="p-6 text-center space-y-5">
      <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-md">
        <i class="fas fa-check-circle"></i>
      </div>

      <div>
        <span class="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">Payment Verified & Authorized</span>
        <h3 class="font-serif text-2xl font-bold text-charcoal-900 mt-1">Thank You for Your Order!</h3>
        <p class="text-xs text-charcoal-500 mt-0.5">Your luxury flacons have been reserved at the Maureh Vault.</p>
      </div>

      <div class="p-4 rounded-xl bg-cream-100 border border-gold-200 text-left text-xs space-y-2">
        <div class="flex justify-between border-b border-gold-200 pb-2 font-bold">
          <span>Tracking Order ID:</span>
          <span class="text-gold-600 font-cinzel text-sm">${order.id}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-charcoal-500">M-PESA Receipt / Ref:</span>
          <span class="font-mono text-emerald-700 font-bold">${order.transactionRef}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-charcoal-500">Recipient:</span>
          <span class="text-charcoal-800 font-semibold">${order.customerName} (${order.phone})</span>
        </div>
        <div class="flex justify-between">
          <span class="text-charcoal-500">Delivery Area:</span>
          <span class="text-charcoal-800">${order.deliveryArea}</span>
        </div>
        <div class="flex justify-between pt-1 border-t border-gold-200 font-bold text-sm">
          <span>Total Paid:</span>
          <span class="font-cinzel text-gold-600">${store.formatPrice(order.totalKES)}</span>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button id="close-order-success-btn" class="flex-1 py-3.5 rounded-full bg-charcoal-900 hover:bg-charcoal-800 text-white font-bold text-xs uppercase tracking-wider shadow-md">
          Back to Storefront
        </button>
        <a 
          href="https://wa.me/254102796209?text=Hi%20Maureh%20Perfumes!%20I%20just%20placed%20Order%20${order.id}%20with%20M-PESA%20Ref%20${order.transactionRef}.%20Please%20confirm%20rider%20dispatch."
          target="_blank"
          class="flex-1 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
        >
          <i class="fab fa-whatsapp"></i> Confirm on WhatsApp
        </a>
      </div>
    </div>
  `;

  document.getElementById('close-order-success-btn')?.addEventListener('click', () => {
    closeModal('checkout-modal-overlay', 'checkout-modal');
    renderProductGrid();
  });
}

// ─── LEGAL & POLICIES MODAL (PRIVACY, RETURNS, TERMS) ─────────────────────────

function renderLegalModal(initialTab = 'privacy') {
  const modal = document.getElementById('legal-modal');
  if (!modal) return;

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: 'fas fa-shield-halved' },
    { id: 'returns', label: 'Returns & Exchange', icon: 'fas fa-arrow-rotate-left' },
    { id: 'terms', label: 'Terms & Conditions', icon: 'fas fa-scale-balanced' },
    { id: 'authenticity', label: '100% Authenticity', icon: 'fas fa-certificate' },
    { id: 'delivery', label: 'Delivery Policy', icon: 'fas fa-truck-fast' }
  ];

  let currentTab = initialTab;

  function getTabContent(tab) {
    if (tab === 'privacy') {
      return `
        <div class="space-y-4 text-xs text-charcoal-700 leading-relaxed">
          <div class="p-3.5 rounded-xl bg-gold-50 border border-gold-200 text-charcoal-800">
            <h4 class="font-bold text-sm text-charcoal-900 mb-1">Maureh Perfumes Privacy Statement</h4>
            <p class="text-[11px] text-charcoal-600">Last Updated: October 2026 • Compliant with Kenya Data Protection Act 2019</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">1. Information We Collect</h5>
            <p>When you browse, order, or consult with our fragrance concierge, we collect necessary personal details including your name, contact phone number, email address, physical delivery address, and order transaction history.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">2. Payment Data Security</h5>
            <p>We do NOT store your sensitive M-Pesa PINs or credit card numbers. All payments are processed through encrypted, certified gateways (Safaricom Daraja API with 256-bit SSL encryption) to ensure zero data vulnerability.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">3. WhatsApp & Concierge Communications</h5>
            <p>Direct chats through our WhatsApp hotline (0102796209 / +254 102 796 209) are treated with strict confidentiality and used solely for dispatch updates, olfactory consultations, and order confirmations.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">4. Contact Our Data Protection Officer</h5>
            <p>For inquiries regarding your personal data, reach out to <code class="text-gold-700 font-bold bg-cream-100 px-1.5 py-0.5 rounded">machariamoureen78@gmail.com</code>.</p>
          </div>
        </div>
      `;
    } else if (tab === 'returns') {
      return `
        <div class="space-y-4 text-xs text-charcoal-700 leading-relaxed">
          <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900">
            <h4 class="font-bold text-sm text-emerald-950 mb-1">48-Hour Guarantee & Return Policy</h4>
            <p class="text-[11px] text-emerald-800">We want you to love your signature scent. Here is our straightforward returns process.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">1. Full Bottle Returns (48 Hours)</h5>
            <p>Unopened, original cellophane-sealed fragrance boxes may be returned or exchanged within <strong>48 hours of receipt</strong> in Nairobi or countrywide. Flacons must be in pristine, resalable condition with original batch barcodes intact.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">2. Damaged or Faulty Flacons in Transit</h5>
            <p>In the rare event of damage, atomizer malfunction, or leakage during courier transit, notify us within <strong>24 hours</strong> with photos via WhatsApp. We will immediately dispatch a replacement bottle at zero additional shipping cost.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">3. Discovery Atomizers & Decants</h5>
            <p>Due to health, hygiene, and sterile decanting lab protocols, customized 10ml travel decants are non-returnable once dispatched unless damaged upon arrival.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">4. Refund Processing</h5>
            <p>Approved refunds are disbursed via <strong>instant M-Pesa reversal</strong> or store credit gift voucher within 24 hours of item inspection at the Maureh Vault.</p>
          </div>
        </div>
      `;
    } else if (tab === 'terms') {
      return `
        <div class="space-y-4 text-xs text-charcoal-700 leading-relaxed">
          <div class="p-3.5 rounded-xl bg-cream-100 border border-gold-200 text-charcoal-900">
            <h4 class="font-bold text-sm mb-1">Terms of Service & Marketplace Agreement</h4>
            <p class="text-[11px] text-charcoal-600">Governing your use of Maureh Perfumes Marketplace (maureh-perfumes.vercel.app)</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">1. Marketplace Operation & Independent Boutiques</h5>
            <p>Maureh Perfumes operates as a curated luxury platform hosting verified independent fragrance houses and boutiques (such as Maison Niche Kenya, Arabian Oud Oasis, and The Decant Atelier). All sellers adhere to our strict provenance certification.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">2. Pricing & Currency</h5>
            <p>All prices are listed in Kenyan Shillings (KES) inclusive of applicable taxes. Converted rates (USD, EUR, GBP) are provided for international reference and processed transparently at prevailing exchange rates.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">3. Order Acceptance & Verification</h5>
            <p>Orders placed via M-Pesa STK Push, Card, or WhatsApp Concierge are subject to stock confirmation at the warehouse before courier handoff.</p>
          </div>
        </div>
      `;
    } else if (tab === 'authenticity') {
      return `
        <div class="space-y-4 text-xs text-charcoal-700 leading-relaxed">
          <div class="p-3.5 rounded-xl bg-gold-50 border border-gold-300 text-charcoal-900">
            <h4 class="font-bold text-sm text-gold-800 mb-1">100% Authenticity Guarantee</h4>
            <p class="text-[11px] text-charcoal-600">Our uncompromising promise to perfume collectors across Kenya.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">1. Direct Manufacturer Sourcing</h5>
            <p>Every fragrance listed on Maureh Perfumes is sourced directly from certified European perfumeries, authorized Middle Eastern perfume houses, and vetted official regional distributors.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">2. Batch-Code & Quality Inspection</h5>
            <p>Prior to warehouse shelf placement and dispatch, every bottle undergoes physical batch code verification against brand databases (e.g. CheckFresh/CheckCosmetic) for production freshness and genuine packaging seal.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">3. Double Your Money Back Promise</h5>
            <p>If any item purchased on Maureh Perfumes is proven non-authentic by an authorized brand representative, we provide a <strong>200% full money-back guarantee</strong>.</p>
          </div>
        </div>
      `;
    } else { // delivery
      return `
        <div class="space-y-4 text-xs text-charcoal-700 leading-relaxed">
          <div class="p-3.5 rounded-xl bg-cream-100 border border-gold-200 text-charcoal-900">
            <h4 class="font-bold text-sm mb-1">Fast & Secure Delivery Across Kenya</h4>
            <p class="text-[11px] text-charcoal-600">Dispatched in tamper-proof luxury packaging with live tracking.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">1. Nairobi Same-Day Express</h5>
            <p>Orders placed before 4:00 PM within Nairobi (CBD, Westlands, Kilimani, Karen, Lavington, Runda) are dispatched same day. Delivery is <strong>FREE for orders above KES 15,000</strong> (standard KES 350 for smaller orders).</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">2. Countrywide Deliveries (24 Hours)</h5>
            <p>Deliveries to Mombasa, Kisumu, Nakuru, Eldoret, Thika, and all major towns are fulfilled within 24 hours via G4S and Fargo Courier.</p>
          </div>

          <div class="space-y-2">
            <h5 class="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">3. Live SMS & Order Tracking</h5>
            <p>Track your courier in real-time by entering your order ID on our <button class="open-tracking-trigger text-gold-600 font-bold underline">Order Tracker</button>.</p>
          </div>
        </div>
      `;
    }
  }

  function updateModalUI() {
    modal.innerHTML = `
      <div class="p-5 border-b border-gold-200 bg-cream-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-file-contract text-gold-500 text-lg"></i>
          <h3 class="font-serif text-lg font-bold text-charcoal-900">Maureh Policies & Legal Information</h3>
        </div>
        <button id="close-legal-modal-btn" class="w-8 h-8 rounded-full bg-white border border-gold-200 text-charcoal-500 hover:bg-charcoal-900 hover:text-white flex items-center justify-center transition-colors">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <!-- Tabs Bar -->
      <div class="flex overflow-x-auto border-b border-gold-200 bg-white px-4 pt-2 gap-1 text-xs">
        ${tabs.map(t => `
          <button 
            class="legal-tab-btn px-3.5 py-2.5 rounded-t-lg font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${t.id === currentTab ? 'border-charcoal-900 text-charcoal-900 bg-cream-100' : 'border-transparent text-charcoal-400 hover:text-charcoal-700'}"
            data-tab="${t.id}"
          >
            <i class="${t.icon} text-xs"></i> ${t.label}
          </button>
        `).join('')}
      </div>

      <!-- Content Area -->
      <div class="p-6 overflow-y-auto flex-1 bg-white">
        ${getTabContent(currentTab)}
      </div>

      <!-- Footer CTA -->
      <div class="p-4 bg-cream-50 border-t border-gold-100 flex items-center justify-between text-xs">
        <span class="text-charcoal-500 text-[11px]">Need immediate assistance?</span>
        <a 
          href="https://wa.me/254102796209?text=Hello%20Maureh%20Concierge!%20I%20have%20a%20question%20regarding%20your%20policies."
          target="_blank"
          class="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
        >
          <i class="fab fa-whatsapp"></i> Chat with Concierge
        </a>
      </div>
    `;

    document.getElementById('close-legal-modal-btn')?.addEventListener('click', () => {
      closeModal('legal-modal-overlay', 'legal-modal');
      if (['#privacy', '#returns', '#terms', '#authenticity', '#delivery'].includes(window.location.hash)) {
        history.replaceState(null, null, ' ');
      }
    });

    modal.querySelectorAll('.legal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        window.location.hash = currentTab;
        updateModalUI();
      });
    });

    modal.querySelectorAll('.open-tracking-trigger').forEach(el => {
      el.addEventListener('click', () => {
        closeModal('legal-modal-overlay', 'legal-modal');
        openModal('tracking-modal-overlay', 'tracking-modal');
      });
    });
  }

  updateModalUI();
  openModal('legal-modal-overlay', 'legal-modal');
}

// ─── ADMIN & MULTI-VENDOR PORTAL ─────────────────────────────────────────────

function renderAdminPortal() {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;

  if (!store.isAdminAuthenticated) {
    // Render Unified Authentication (Manager Passkey OR Vendor Login)
    modal.innerHTML = `
      <div class="p-6 sm:p-8 max-w-lg mx-auto text-center space-y-6 my-auto">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-500 text-2xl shadow-md">
          <i class="fas fa-lock"></i>
        </div>
        <div>
          <h3 class="font-serif text-2xl font-bold text-charcoal-900">Maureh Portal Access</h3>
          <p class="text-xs text-charcoal-500 mt-1">General Manager & Marketplace Vendor Login</p>
        </div>

        <!-- Auth Tabs -->
        <div class="flex border-b border-gold-200 text-xs font-bold">
          <button id="tab-btn-gm" class="flex-1 py-2.5 border-b-2 border-charcoal-900 text-charcoal-900">
            Manager Passkey
          </button>
          <button id="tab-btn-vendor" class="flex-1 py-2.5 text-charcoal-400 hover:text-charcoal-700">
            Vendor Boutique Login
          </button>
        </div>

        <!-- Tab 1: General Manager PIN -->
        <form id="admin-login-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-charcoal-700 text-left mb-1">Master PIN / Passkey</label>
            <input 
              type="password" 
              id="admin-pass-input" 
              placeholder="Enter PIN (Demo: admin123)" 
              required
              class="w-full bg-cream-100 border border-gold-200 rounded-xl px-4 py-3 text-sm text-charcoal-900 text-center font-mono tracking-widest focus:border-gold-400 focus:outline-none"
            >
            <p class="text-[10px] text-charcoal-400 mt-1 text-left">Demo GM Passcode: <code class="bg-cream-200 px-1 py-0.5 rounded text-gold-600 font-bold">admin123</code></p>
          </div>
          <div class="flex gap-2">
            <button type="button" id="close-admin-btn-login" class="flex-1 py-3 rounded-xl border border-gold-200 text-charcoal-600 hover:bg-cream-100 text-xs font-bold uppercase tracking-wider">
              Cancel
            </button>
            <button type="submit" class="flex-1 py-3 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white font-bold text-xs uppercase tracking-wider shadow-md">
              Unlock as GM
            </button>
          </div>
        </form>

        <!-- Tab 2: Vendor Login -->
        <form id="vendor-login-form" class="hidden space-y-3 text-left">
          <div>
            <label class="block text-xs font-semibold text-charcoal-700 mb-1">Vendor Account Email</label>
            <input 
              type="email" 
              id="vendor-email-input" 
              placeholder="e.g. maison@niche.co.ke" 
              value="maison@niche.co.ke"
              required
              class="w-full bg-cream-100 border border-gold-200 rounded-lg px-3 py-2 text-xs text-charcoal-800"
            >
          </div>
          <div>
            <label class="block text-xs font-semibold text-charcoal-700 mb-1">Password</label>
            <input 
              type="password" 
              id="vendor-pass-input" 
              placeholder="Password (Demo: niche123)" 
              value="niche123"
              required
              class="w-full bg-cream-100 border border-gold-200 rounded-lg px-3 py-2 text-xs text-charcoal-800 font-mono"
            >
            <p class="text-[10px] text-charcoal-400 mt-1">Demo: <code class="text-gold-600 font-bold">maison@niche.co.ke</code> / <code class="text-gold-600 font-bold">niche123</code></p>
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" id="close-vendor-btn-login" class="flex-1 py-2.5 rounded-lg border border-gold-200 text-charcoal-600 hover:bg-cream-100 text-xs font-bold uppercase">
              Cancel
            </button>
            <button type="submit" class="flex-1 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-xs uppercase shadow-md">
              Vendor Sign In
            </button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('tab-btn-gm')?.addEventListener('click', () => {
      document.getElementById('tab-btn-gm').className = 'flex-1 py-2.5 border-b-2 border-charcoal-900 text-charcoal-900 font-bold';
      document.getElementById('tab-btn-vendor').className = 'flex-1 py-2.5 text-charcoal-400 hover:text-charcoal-700 font-bold';
      document.getElementById('admin-login-form').classList.remove('hidden');
      document.getElementById('vendor-login-form').classList.add('hidden');
    });

    document.getElementById('tab-btn-vendor')?.addEventListener('click', () => {
      document.getElementById('tab-btn-vendor').className = 'flex-1 py-2.5 border-b-2 border-charcoal-900 text-charcoal-900 font-bold';
      document.getElementById('tab-btn-gm').className = 'flex-1 py-2.5 text-charcoal-400 hover:text-charcoal-700 font-bold';
      document.getElementById('vendor-login-form').classList.remove('hidden');
      document.getElementById('admin-login-form').classList.add('hidden');
    });

    document.getElementById('close-admin-btn-login')?.addEventListener('click', () => {
      closeModal('admin-modal-overlay', 'admin-modal');
    });
    document.getElementById('close-vendor-btn-login')?.addEventListener('click', () => {
      closeModal('admin-modal-overlay', 'admin-modal');
    });

    document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('admin-pass-input')?.value;
      if (store.loginAdmin(val)) {
        renderAdminPortal();
      }
    });

    document.getElementById('vendor-login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('vendor-email-input')?.value;
      const pass = document.getElementById('vendor-pass-input')?.value;
      if (store.loginVendor(email, pass)) {
        renderAdminPortal();
      }
    });

    openModal('admin-modal-overlay', 'admin-modal');
    return;
  }

  // Filter items if vendor is logged in
  const isVendor = !!store.activeVendorUser;
  const currentVendor = store.activeVendorUser;
  const filteredInventory = isVendor 
    ? store.perfumes.filter(p => p.vendorId === currentVendor.id)
    : store.perfumes;

  const totalSKUs = filteredInventory.length;
  const outOfStockCount = filteredInventory.filter(p => !p.inStock).length;
  const totalValuationKES = filteredInventory.reduce((acc, p) => acc + (p.priceKES || 0), 0);

  modal.innerHTML = `
    <!-- Top Header -->
    <div class="p-5 border-b border-gold-200 bg-cream-100 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl ${isVendor ? 'bg-emerald-600 text-white' : 'bg-gold-400 text-charcoal-900'} flex items-center justify-center font-bold shadow-md">
          <i class="fas ${isVendor ? 'fa-store' : 'fa-boxes-stacked'}"></i>
        </div>
        <div>
          <h2 class="font-serif text-lg font-bold text-charcoal-900 leading-tight">
            ${isVendor ? `${currentVendor.name} Portal` : 'Master Catalog & Inventory Management'}
          </h2>
          <p class="text-xs text-charcoal-500">
            ${isVendor ? `Marketplace Vendor Dashboard (${(currentVendor.commissionRate * 100)}% platform commission)` : 'Full store access & live storefront synchronization'}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="admin-cloud-btn" class="px-3 py-1.5 rounded-lg border border-gold-300 text-charcoal-700 bg-white hover:bg-gold-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <i class="fas fa-cloud"></i> Cloud DB
        </button>
        <button id="admin-export-btn" class="px-3 py-1.5 rounded-lg border border-gold-300 text-charcoal-700 bg-white hover:bg-gold-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <i class="fas fa-download"></i> Backup
        </button>
        <button id="admin-import-btn" class="px-3 py-1.5 rounded-lg border border-gold-300 text-charcoal-700 bg-white hover:bg-gold-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <i class="fas fa-upload"></i> Import
        </button>
        <button id="admin-logout-btn" class="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 bg-white hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5">
          <i class="fas fa-arrow-right-from-bracket"></i> Lock
        </button>
        <button id="close-admin-btn-dashboard" class="w-8 h-8 rounded-full bg-white border border-gold-200 text-charcoal-500 hover:bg-charcoal-900 hover:text-white flex items-center justify-center transition-colors">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
    </div>

    <!-- Quick Stats Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-cream-50 border-b border-gold-100 text-xs">
      <div class="p-3 bg-white rounded-xl border border-gold-100 shadow-sm">
        <span class="text-charcoal-400 text-[10px] uppercase font-bold tracking-wider">Active SKUs</span>
        <div class="text-xl font-bold font-cinzel text-charcoal-900 mt-0.5">${totalSKUs} Flacons</div>
      </div>
      <div class="p-3 bg-white rounded-xl border border-gold-100 shadow-sm">
        <span class="text-charcoal-400 text-[10px] uppercase font-bold tracking-wider">Inventory Value</span>
        <div class="text-xl font-bold font-cinzel text-gold-600 mt-0.5">${store.formatPrice(totalValuationKES)}</div>
      </div>
      <div class="p-3 bg-white rounded-xl border border-gold-100 shadow-sm">
        <span class="text-charcoal-400 text-[10px] uppercase font-bold tracking-wider">Stock Status</span>
        <div class="text-xl font-bold font-cinzel ${outOfStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'} mt-0.5">
          ${totalSKUs - outOfStockCount} In / ${outOfStockCount} Out
        </div>
      </div>
      <div class="p-3 bg-white rounded-xl border border-gold-100 shadow-sm">
        <span class="text-charcoal-400 text-[10px] uppercase font-bold tracking-wider">Recent Orders</span>
        <div class="text-xl font-bold font-cinzel text-charcoal-900 mt-0.5">${store.orders.length} Processed</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="p-4 bg-white border-b border-gold-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="relative w-full sm:w-80">
        <input 
          type="text" 
          id="admin-search-input" 
          placeholder="Search your inventory by name, brand..." 
          class="w-full bg-cream-100 border border-gold-200 rounded-lg pl-9 pr-3 py-2 text-xs text-charcoal-800 focus:border-gold-400"
        >
        <i class="fas fa-search absolute left-3 top-2.5 text-charcoal-400 text-xs"></i>
      </div>
      
      <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button id="admin-add-perfume-btn" class="px-4 py-2 rounded-lg bg-charcoal-900 hover:bg-charcoal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md">
          <i class="fas fa-plus text-gold-300"></i> Add New Fragrance
        </button>
      </div>
    </div>

    <!-- Inventory Table Container -->
    <div class="flex-1 overflow-y-auto p-4 bg-cream-50">
      <div id="admin-inventory-table-container"></div>
    </div>
  `;

  document.getElementById('close-admin-btn-dashboard')?.addEventListener('click', () => {
    closeModal('admin-modal-overlay', 'admin-modal');
  });

  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    store.logoutAdmin();
    renderAdminPortal();
  });

  document.getElementById('admin-export-btn')?.addEventListener('click', () => {
    store.exportInventoryJSON();
  });

  document.getElementById('admin-import-btn')?.addEventListener('click', () => {
    const jsonStr = prompt("Paste your Maureh catalog JSON array here:");
    if (jsonStr) {
      if (store.importInventoryJSON(jsonStr)) {
        renderAdminPortal();
        renderProductGrid();
        populateBrandFilter();
      }
    }
  });

  document.getElementById('admin-cloud-btn')?.addEventListener('click', () => {
    renderCloudSyncModal();
  });

  document.getElementById('admin-add-perfume-btn')?.addEventListener('click', () => {
    renderAddOrEditPerfumeForm(null);
  });

  const searchInput = document.getElementById('admin-search-input');
  searchInput?.addEventListener('input', (e) => {
    renderAdminInventoryTable(e.target.value);
  });

  renderAdminInventoryTable('');
  openModal('admin-modal-overlay', 'admin-modal');
}

function renderCloudSyncModal() {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;

  const { supabaseUrl, supabaseKey, isConfigured } = getSupabaseCredentials();

  modal.innerHTML = `
    <div class="p-6 max-w-lg mx-auto space-y-5 bg-white">
      <div class="flex items-center justify-between border-b border-gold-200 pb-3">
        <h3 class="font-serif text-lg font-bold text-charcoal-900 flex items-center gap-2">
          <i class="fas fa-bolt text-gold-500"></i> Supabase Database Connection & Sync
        </h3>
        <button id="close-cloud-btn" class="w-8 h-8 rounded-full bg-cream-100 text-charcoal-600 hover:text-black flex items-center justify-center">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <div class="p-3.5 rounded-xl ${isConfigured ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' : 'bg-gold-50 border border-gold-200 text-charcoal-700'} text-xs flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas ${isConfigured ? 'fa-circle-check text-emerald-600' : 'fa-circle-info text-gold-600'} text-base"></i>
          <div>
            <p class="font-bold">${isConfigured ? 'Connected to Supabase PostgreSQL' : 'Using Local Storage Fallback'}</p>
            <p class="text-[10px] text-charcoal-500">${isConfigured ? 'Realtime multi-device cloud synchronization is active.' : 'Enter your Supabase project credentials below to enable live cloud sync.'}</p>
          </div>
        </div>
      </div>

      <form id="supabase-config-form" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-charcoal-700 mb-1">Supabase Project URL *</label>
          <input 
            type="url" 
            id="supabase-url-input" 
            value="${supabaseUrl || ''}" 
            placeholder="https://xyzcompany.supabase.co" 
            required
            class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800 focus:border-gold-400"
          >
          <p class="text-[10px] text-charcoal-400 mt-0.5">From your Supabase Project Settings → API → Project URL</p>
        </div>

        <div>
          <label class="block font-semibold text-charcoal-700 mb-1">Supabase Anon / Public API Key *</label>
          <input 
            type="password" 
            id="supabase-key-input" 
            value="${supabaseKey || ''}" 
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
            required
            class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800 font-mono focus:border-gold-400"
          >
          <p class="text-[10px] text-charcoal-400 mt-0.5">From Project Settings → API → Project API Keys → <code class="font-bold text-gold-600">anon public</code></p>
        </div>

        <div class="pt-2 border-t border-gold-100 flex flex-col gap-2">
          <button type="submit" class="w-full py-3 rounded-lg bg-charcoal-900 hover:bg-charcoal-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2">
            <i class="fas fa-plug text-gold-300"></i> Connect to Supabase
          </button>

          <button type="button" id="supabase-seed-btn" class="w-full py-2.5 rounded-lg border border-gold-400 bg-gold-50 hover:bg-gold-100 text-charcoal-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
            <i class="fas fa-seedling text-emerald-600"></i> Seed 14 Default Perfumes to Supabase
          </button>
        </div>
      </form>

      <div class="text-[11px] text-charcoal-500 bg-cream-100 p-3 rounded-xl border border-gold-200 space-y-1">
        <p class="font-bold text-charcoal-800"><i class="fas fa-book-bookmark text-gold-500"></i> Quick Setup Tip:</p>
        <p>Make sure you have executed the tables script from <code class="bg-white px-1 rounded text-gold-700 font-mono font-bold">supabase_schema.sql</code> in your Supabase SQL Editor first.</p>
      </div>
    </div>
  `;

  document.getElementById('close-cloud-btn')?.addEventListener('click', () => {
    renderAdminPortal();
  });

  document.getElementById('supabase-config-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('supabase-url-input')?.value;
    const key = document.getElementById('supabase-key-input')?.value;
    const success = await store.connectSupabase(url, key);
    if (success) {
      renderCloudSyncModal();
      renderProductGrid();
      populateBrandFilter();
    }
  });

  document.getElementById('supabase-seed-btn')?.addEventListener('click', async () => {
    await store.seedSupabase();
    renderProductGrid();
    populateBrandFilter();
  });
}

function renderAdminInventoryTable(filterQuery = '') {
  const container = document.getElementById('admin-inventory-table-container');
  if (!container) return;

  const isVendor = !!store.activeVendorUser;
  let items = isVendor ? store.perfumes.filter(p => p.vendorId === store.activeVendorUser.id) : store.perfumes;

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    items = items.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-xl border border-gold-100">
        <p class="text-xs text-charcoal-500">No fragrances matching query</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto bg-white rounded-xl border border-gold-200 shadow-sm">
      <table class="w-full text-left text-xs text-charcoal-700">
        <thead class="bg-cream-100 border-b border-gold-200 text-[11px] uppercase tracking-wider text-charcoal-600 font-bold">
          <tr>
            <th class="p-3">Flacon</th>
            <th class="p-3">Brand & Fragrance</th>
            <th class="p-3">Concentration</th>
            <th class="p-3">Category</th>
            <th class="p-3">Sizes & Prices</th>
            <th class="p-3 text-center">Status</th>
            <th class="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gold-100">
          ${items.map(p => `
            <tr class="hover:bg-cream-50 transition-colors">
              <td class="p-3 w-14">
                <img src="${p.image}" alt="${p.name}" class="w-12 h-12 rounded-lg object-cover border border-gold-200 flex-shrink-0">
              </td>
              <td class="p-3">
                <span class="text-[10px] text-gold-600 font-bold uppercase">${p.brand}</span>
                <div class="font-bold text-charcoal-900">${p.name}</div>
                <div class="text-[10px] text-charcoal-400">${p.vendorName || 'Maureh Vault'}</div>
              </td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded-full bg-cream-200 text-charcoal-700 text-[10px] font-semibold">${p.concentration || 'EDP'}</span>
              </td>
              <td class="p-3">
                <span class="text-charcoal-600">${p.category || 'Niche'}</span>
                <div class="text-[10px] text-charcoal-400">${p.gender || 'Unisex'}</div>
              </td>
              <td class="p-3 font-cinzel font-bold text-gold-600">
                ${store.formatPrice(p.priceKES)}
                <div class="text-[10px] text-charcoal-400 font-sans font-normal">${(p.sizes || []).length} size variant(s)</div>
              </td>
              <td class="p-3 text-center">
                <button 
                  class="admin-toggle-stock-btn px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${p.inStock ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300' : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}"
                  data-id="${p.id}"
                  title="Click to toggle stock availability"
                >
                  ${p.inStock ? '● In Stock' : '✕ Out of Stock'}
                </button>
              </td>
              <td class="p-3 text-right whitespace-nowrap">
                <button 
                  class="admin-edit-btn p-2 rounded-lg bg-cream-100 hover:bg-gold-50 border border-gold-200 text-gold-700 text-xs font-semibold mr-1 transition-colors"
                  data-id="${p.id}"
                  title="Edit Fragrance"
                >
                  <i class="fas fa-pen-to-square"></i>
                </button>
                <button 
                  class="admin-delete-btn p-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold transition-colors"
                  data-id="${p.id}"
                  title="Delete Fragrance"
                >
                  <i class="fas fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.admin-toggle-stock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.toggleStock(btn.dataset.id);
      renderAdminInventoryTable(document.getElementById('admin-search-input')?.value || '');
      renderProductGrid();
    });
  });

  container.querySelectorAll('.admin-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = store.perfumes.find(x => x.id === btn.dataset.id);
      if (p) renderAddOrEditPerfumeForm(p);
    });
  });

  container.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = store.perfumes.find(x => x.id === btn.dataset.id);
      if (p && confirm(`Are you sure you want to delete "${p.name}" from the catalog?`)) {
        store.deletePerfume(p.id);
        renderAdminInventoryTable(document.getElementById('admin-search-input')?.value || '');
        renderProductGrid();
        populateBrandFilter();
      }
    });
  });
}

// ─── ADD / EDIT PERFUME FORM WITH DRAG-AND-DROP FILE UPLOADER ─────────────────

function renderAddOrEditPerfumeForm(perfumeToEdit = null) {
  const isEditing = !!perfumeToEdit;
  const p = perfumeToEdit || {};

  const topNotes = p.notes?.top?.join(', ') || 'Calabrian Bergamot, Saffron';
  const heartNotes = p.notes?.heart?.join(', ') || 'Turkish Rose, Smoked Amber';
  const baseNotes = p.notes?.base?.join(', ') || 'Bourbon Vanilla, Agarwood Oud, Musk';
  const accords = p.accords?.join(', ') || 'Amber, Woody, Warm Spicy';

  let currentImageDataUrl = p.image || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80';

  const modal = document.getElementById('admin-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="p-5 border-b border-gold-200 bg-cream-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="fas ${isEditing ? 'fa-pen-to-square' : 'fa-plus'} text-gold-500 text-lg"></i>
        <h3 class="font-serif text-lg font-bold text-charcoal-900">${isEditing ? `Edit: ${p.name}` : 'Add New Luxury Fragrance'}</h3>
      </div>
      <button id="admin-back-to-table-btn" class="px-3 py-1.5 rounded-lg border border-gold-300 text-charcoal-700 bg-white hover:bg-gold-50 text-xs font-semibold flex items-center gap-1">
        <i class="fas fa-arrow-left"></i> Back to Inventory
      </button>
    </div>

    <form id="perfume-editor-form" class="p-6 overflow-y-auto flex-1 space-y-6 bg-white text-xs">
      
      <!-- Basic Details -->
      <div class="space-y-4">
        <h4 class="font-cinzel text-xs font-bold text-gold-600 uppercase tracking-wider border-b border-gold-100 pb-1">
          1. Brand & Fragrance Identity
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Fragrance Name *</label>
            <input type="text" id="form-name" required value="${p.name || ''}" placeholder="e.g. Oud Maracujá" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800 focus:border-gold-400">
          </div>
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Brand / Fragrance House *</label>
            <input type="text" id="form-brand" required value="${p.brand || ''}" placeholder="e.g. Maison Crivelli" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800 focus:border-gold-400">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Category *</label>
            <select id="form-category" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
              <option ${p.category === 'Niche & Haute' ? 'selected' : ''}>Niche & Haute</option>
              <option ${p.category === 'Arabian Oud' ? 'selected' : ''}>Arabian Oud</option>
              <option ${p.category === 'Men' ? 'selected' : ''}>Men</option>
              <option ${p.category === 'Women' ? 'selected' : ''}>Women</option>
              <option ${p.category === 'Decants & Samples' ? 'selected' : ''}>Decants & Samples</option>
              <option ${p.category === 'Gift Sets' ? 'selected' : ''}>Gift Sets</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Gender *</label>
            <select id="form-gender" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
              <option ${p.gender === 'Unisex' ? 'selected' : ''}>Unisex</option>
              <option ${p.gender === 'Men' ? 'selected' : ''}>Men</option>
              <option ${p.gender === 'Women' ? 'selected' : ''}>Women</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Concentration *</label>
            <select id="form-concentration" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
              <option ${p.concentration === 'Extrait de Parfum' ? 'selected' : ''}>Extrait de Parfum</option>
              <option ${p.concentration === 'Parfum' ? 'selected' : ''}>Parfum</option>
              <option ${p.concentration === 'Eau de Parfum' ? 'selected' : ''}>Eau de Parfum</option>
              <option ${p.concentration === 'Eau de Toilette' ? 'selected' : ''}>Eau de Toilette</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-semibold text-charcoal-700 mb-1">Short Subtitle</label>
          <input type="text" id="form-subtitle" value="${p.subtitle || ''}" placeholder="e.g. Extrait de Parfum • Passionfruit & Smoked Oud" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
        </div>

        <div>
          <label class="block font-semibold text-charcoal-700 mb-1">Editorial Description</label>
          <textarea id="form-description" rows="2" placeholder="Describe notes and longevity..." class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800 resize-none">${p.description || ''}</textarea>
        </div>
      </div>

      <!-- Drag & Drop Bottle Photo Upload Section -->
      <div class="space-y-3">
        <h4 class="font-cinzel text-xs font-bold text-gold-600 uppercase tracking-wider border-b border-gold-100 pb-1 flex items-center justify-between">
          <span>2. Flacon Imagery & Photo Upload</span>
          <span class="text-[10px] text-charcoal-400 font-sans font-normal">Drag & drop or URL</span>
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div class="sm:col-span-4 text-center">
            <img id="form-image-preview" src="${currentImageDataUrl}" alt="Preview" class="w-28 h-28 object-cover rounded-xl border-2 border-gold-300 mx-auto shadow-md">
            <span class="text-[10px] text-charcoal-400 block mt-1">Live Image Preview</span>
          </div>

          <div class="sm:col-span-8 space-y-2">
            <!-- Drag and Drop Dropzone -->
            <div id="image-dropzone" class="p-4 rounded-xl border-2 border-dashed border-gold-300 hover:border-gold-500 bg-cream-50 hover:bg-gold-50 text-center cursor-pointer transition-all">
              <i class="fas fa-cloud-arrow-up text-gold-500 text-xl mb-1"></i>
              <p class="font-bold text-charcoal-800 text-xs">Drag & Drop Flacon Photo Here</p>
              <p class="text-[10px] text-charcoal-400">or click to browse from device / camera</p>
              <input type="file" id="file-upload-input" accept="image/*" class="hidden">
            </div>

            <div class="relative">
              <span class="text-[10px] text-charcoal-400">Or enter Direct Image URL:</span>
              <input type="url" id="form-image" value="${p.image || ''}" placeholder="https://..." class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2 text-xs text-charcoal-800 mt-0.5">
            </div>
          </div>
        </div>
      </div>

      <!-- Olfactory Pyramid Notes -->
      <div class="space-y-4">
        <h4 class="font-cinzel text-xs font-bold text-gold-600 uppercase tracking-wider border-b border-gold-100 pb-1">
          3. Olfactory Note Pyramid (Comma Separated)
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block font-semibold text-sky-700 mb-1"><i class="fas fa-wind"></i> Top Notes</label>
            <input type="text" id="form-top-notes" value="${topNotes}" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
          </div>
          <div>
            <label class="block font-semibold text-rose-700 mb-1"><i class="fas fa-heart"></i> Heart Notes</label>
            <input type="text" id="form-heart-notes" value="${heartNotes}" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
          </div>
          <div>
            <label class="block font-semibold text-amber-800 mb-1"><i class="fas fa-mountain"></i> Base Notes</label>
            <input type="text" id="form-base-notes" value="${baseNotes}" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Accords (Comma separated)</label>
            <input type="text" id="form-accords" value="${accords}" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
          </div>
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Scent Family</label>
            <input type="text" id="form-family" value="${p.family || 'Fruity Woody'}" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
          </div>
        </div>
      </div>

      <!-- Pricing & Sizing -->
      <div class="space-y-4">
        <h4 class="font-cinzel text-xs font-bold text-gold-600 uppercase tracking-wider border-b border-gold-100 pb-1">
          4. Sizing & Marketplace Pricing (KES)
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Base Price (KES) *</label>
            <input type="number" id="form-price" required value="${p.priceKES || 45000}" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800 font-cinzel font-bold">
          </div>
          <div>
            <label class="block font-semibold text-charcoal-700 mb-1">Original Price (KES)</label>
            <input type="number" id="form-orig-price" value="${p.originalPriceKES || 50000}" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
          </div>
        </div>

        <div>
          <label class="block font-semibold text-charcoal-700 mb-1">Marketplace Vendor Source</label>
          <select id="form-vendor" class="w-full bg-cream-100 border border-gold-200 rounded-lg p-2.5 text-xs text-charcoal-800">
            <option value="maureh-vault" ${p.vendorId === 'maureh-vault' ? 'selected' : ''}>Maureh Flagship Vault</option>
            <option value="maison-niche" ${p.vendorId === 'maison-niche' ? 'selected' : ''}>Maison Niche Kenya</option>
            <option value="arabian-oud" ${p.vendorId === 'arabian-oud' ? 'selected' : ''}>Arabian Oud Oasis</option>
            <option value="decant-atelier" ${p.vendorId === 'decant-atelier' ? 'selected' : ''}>The Decant Atelier</option>
          </select>
        </div>

        <div class="flex flex-wrap gap-6 pt-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="form-in-stock" ${p.inStock !== false ? 'checked' : ''} class="accent-gold-500 w-4 h-4">
            <span class="font-semibold text-charcoal-800">In Stock</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="form-bestseller" ${p.isBestseller ? 'checked' : ''} class="accent-gold-500 w-4 h-4">
            <span class="font-semibold text-charcoal-800">Feature as Bestseller</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="form-new" ${p.isNew ? 'checked' : ''} class="accent-gold-500 w-4 h-4">
            <span class="font-semibold text-charcoal-800">New Arrival</span>
          </label>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-gold-200">
        <button type="button" id="admin-cancel-form-btn" class="px-5 py-2.5 rounded-xl border border-gold-300 text-charcoal-700 hover:bg-cream-100 font-bold uppercase tracking-wider">
          Cancel
        </button>
        <button type="submit" class="px-7 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white font-extrabold uppercase tracking-wider shadow-lg flex items-center gap-2">
          <i class="fas fa-check text-gold-300"></i> ${isEditing ? 'Save Changes' : 'Publish Fragrance to Catalog'}
        </button>
      </div>

    </form>
  `;

  // Dropzone file events
  const dropzone = document.getElementById('image-dropzone');
  const fileInput = document.getElementById('file-upload-input');
  const previewImg = document.getElementById('form-image-preview');
  const urlInput = document.getElementById('form-image');

  dropzone?.addEventListener('click', () => fileInput?.click());
  
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-gold-500', 'bg-gold-50');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-gold-500', 'bg-gold-50');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-gold-500', 'bg-gold-50');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0], (dataUrl) => {
        currentImageDataUrl = dataUrl;
        if (previewImg) previewImg.src = dataUrl;
        if (urlInput) urlInput.value = dataUrl;
        store.toast('Photo uploaded and formatted successfully!', 'success');
      });
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0], (dataUrl) => {
        currentImageDataUrl = dataUrl;
        if (previewImg) previewImg.src = dataUrl;
        if (urlInput) urlInput.value = dataUrl;
        store.toast('Photo uploaded and formatted successfully!', 'success');
      });
    }
  });

  urlInput?.addEventListener('input', (e) => {
    if (e.target.value && previewImg) {
      previewImg.src = e.target.value;
      currentImageDataUrl = e.target.value;
    }
  });

  document.getElementById('admin-back-to-table-btn')?.addEventListener('click', () => renderAdminPortal());
  document.getElementById('admin-cancel-form-btn')?.addEventListener('click', () => renderAdminPortal());

  document.getElementById('perfume-editor-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name')?.value;
    const brand = document.getElementById('form-brand')?.value;
    const category = document.getElementById('form-category')?.value;
    const gender = document.getElementById('form-gender')?.value;
    const concentration = document.getElementById('form-concentration')?.value;
    const subtitle = document.getElementById('form-subtitle')?.value;
    const description = document.getElementById('form-description')?.value;
    const priceKES = Number(document.getElementById('form-price')?.value) || 10000;
    const origPriceKES = Number(document.getElementById('form-orig-price')?.value) || priceKES * 1.15;
    const vendorId = document.getElementById('form-vendor')?.value;
    const inStock = document.getElementById('form-in-stock')?.checked;
    const isBestseller = document.getElementById('form-bestseller')?.checked;
    const isNew = document.getElementById('form-new')?.checked;
    const family = document.getElementById('form-family')?.value;

    const vendorMap = {
      'maureh-vault': 'Maureh Flagship Vault',
      'maison-niche': 'Maison Niche Kenya',
      'arabian-oud': 'Arabian Oud Oasis',
      'decant-atelier': 'The Decant Atelier'
    };

    const topList = (document.getElementById('form-top-notes')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const heartList = (document.getElementById('form-heart-notes')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const baseList = (document.getElementById('form-base-notes')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const accordsList = (document.getElementById('form-accords')?.value || '').split(',').map(s => s.trim()).filter(Boolean);

    const formData = {
      name,
      brand,
      subtitle: subtitle || `${concentration} • Luxury Flacon`,
      gender,
      category,
      family: family || 'Woody Amber',
      concentration,
      priceKES,
      originalPriceKES: origPriceKES,
      vendorId,
      vendorName: vendorMap[vendorId] || 'Maureh Vault',
      image: currentImageDataUrl,
      inStock,
      isBestseller,
      isNew,
      description: description || 'An authentic masterpiece curated for discerning fragrance collectors.',
      notes: {
        top: topList.length ? topList : ['Calabrian Bergamot'],
        heart: heartList.length ? heartList : ['Turkish Rose'],
        base: baseList.length ? baseList : ['Amber Oud']
      },
      accords: accordsList.length ? accordsList : ['Woody', 'Amber'],
      sizes: [
        { size: '10ml Decant', priceKES: Math.round(priceKES * 0.18) },
        { size: '100ml Bottle', priceKES: priceKES, isDefault: true }
      ]
    };

    if (isEditing) {
      store.updatePerfume(p.id, formData);
    } else {
      store.addPerfume(formData);
    }

    renderAdminPortal();
    renderProductGrid();
    populateBrandFilter();
  });
}

// ─── VENDOR CARDS ─────────────────────────────────────────────────────────────

function renderVendors() {
  const grid = document.getElementById('vendors-grid');
  if (!grid) return;
  grid.innerHTML = VENDORS.map(v => `
    <div class="bg-white border border-gold-200 rounded-2xl p-5 space-y-4 hover:border-gold-400 hover:shadow-xl hover:shadow-gold-200/40 transition-all duration-300 group shadow-sm">
      <div class="flex items-start gap-3">
        <img src="${v.avatar}" alt="${v.name}" class="w-14 h-14 rounded-xl object-cover border-2 border-gold-200 group-hover:border-gold-400 transition-colors">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h4 class="font-bold text-sm text-charcoal-900">${v.name}</h4>
            <i class="fas fa-check-circle text-emerald-500 text-xs" title="Verified Seller"></i>
          </div>
          <span class="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-gold-50 text-gold-700 border border-gold-200 text-[10px] font-semibold">${v.badge}</span>
        </div>
      </div>
      <p class="text-[11px] text-charcoal-600 leading-relaxed">${v.description}</p>
      <div class="grid grid-cols-2 gap-2 text-[11px]">
        <div class="flex items-center gap-1.5 text-charcoal-500">
          <i class="fas fa-star text-gold-400"></i>
          <span>${v.rating} (${v.reviewsCount.toLocaleString()})</span>
        </div>
        <div class="flex items-center gap-1.5 text-charcoal-500">
          <i class="fas fa-bolt text-gold-500"></i>
          <span>${v.dispatchTime}</span>
        </div>
        <div class="col-span-2 flex items-center gap-1.5 text-charcoal-500">
          <i class="fas fa-location-dot text-gold-500"></i>
          <span>${v.location}</span>
        </div>
      </div>
      <button
        class="w-full py-2 rounded-lg border border-gold-300 text-charcoal-800 hover:bg-gold-50 text-xs font-semibold transition-all"
        onclick="document.getElementById('vendor-filter').value='${v.id}'; document.getElementById('vendor-filter').dispatchEvent(new Event('change'))"
      >
        Browse ${v.name} →
      </button>
    </div>
  `).join('');
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

function renderReviews() {
  const grid = document.getElementById('reviews-grid');
  if (!grid) return;
  grid.innerHTML = REVIEWS.map(r => `
    <div class="bg-white border border-gold-200 rounded-2xl p-5 space-y-3 hover:border-gold-300 hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-sm">
          ${r.name.charAt(0)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-sm text-charcoal-900">${r.name}</span>
            ${r.verified ? '<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Verified Purchase</span>' : ''}
          </div>
          <div class="flex items-center gap-1.5 text-xs text-charcoal-400 mt-0.5">
            <i class="fas fa-location-dot text-gold-500 text-[10px]"></i>
            <span>${r.location}</span>
            <span class="text-charcoal-300">•</span>
            <span>${r.date}</span>
          </div>
        </div>
      </div>
      <div class="flex gap-0.5 text-xs">${stars(r.rating)}</div>
      <p class="text-[11px] text-charcoal-600 leading-relaxed">"${r.text}"</p>
      <div class="text-[10px] text-gold-600 font-semibold border-t border-gold-100 pt-2">
        <i class="fas fa-shopping-bag mr-1"></i> ${r.perfume}
      </div>
    </div>
  `).join('');
}

// ─── SCENT FINDER QUIZ ────────────────────────────────────────────────────────

const QUIZ_STEPS = [
  {
    question: "What kind of impression do you want to make?",
    icon: "fas fa-masks-theater",
    options: [
      { label: "Commanding & Dominant", emoji: "👑", hint: "Heavy sillage, long-lasting" },
      { label: "Seductive & Mysterious", emoji: "🌙", hint: "Smoky, oriental, amber" },
      { label: "Fresh & Approachable", emoji: "🌿", hint: "Clean, citrus, soft" },
      { label: "Unique & Artisanal", emoji: "🎨", hint: "Niche, avant-garde" }
    ]
  },
  {
    question: "What scent family resonates with you most?",
    icon: "fas fa-leaf",
    options: [
      { label: "Warm & Woody Amber", emoji: "🪵", hint: "Sandalwood, Oud, Amber" },
      { label: "Rich Floral & Rose", emoji: "🌹", hint: "Rose, Jasmine, Iris" },
      { label: "Gourmand & Coffee", emoji: "☕", hint: "Vanilla, Tobacco, Coffee" },
      { label: "Fresh Citrus & Marine", emoji: "🍊", hint: "Bergamot, Lemon, Sea" }
    ]
  },
  {
    question: "When do you wear fragrance most?",
    icon: "fas fa-clock",
    options: [
      { label: "Office / Daily Signature", emoji: "💼", hint: "Moderate, professional" },
      { label: "Evening Events & Dinners", emoji: "🥂", hint: "Sophisticated, rich" },
      { label: "Romantic Dates", emoji: "💌", hint: "Sensual, skin-hugging" },
      { label: "All Day Long", emoji: "☀️", hint: "Versatile, long-lasting" }
    ]
  },
  {
    question: "What's your budget per bottle?",
    icon: "fas fa-tag",
    options: [
      { label: "Under KSh 12,000", emoji: "💚", hint: "Arabian budget gems" },
      { label: "KSh 12,000 – 30,000", emoji: "💛", hint: "Designer flacons" },
      { label: "KSh 30,000 – 60,000", emoji: "🟠", hint: "Niche luxury houses" },
      { label: "KSh 60,000+", emoji: "👑", hint: "Haute extrait masterpieces" }
    ]
  }
];

let quizStep = 0;
let quizAnswers = [];

function renderQuiz() {
  const modal = document.getElementById('quiz-modal');
  if (!modal) return;

  if (quizStep < QUIZ_STEPS.length) {
    const step = QUIZ_STEPS[quizStep];
    modal.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-gold-500">
            <i class="${step.icon} text-xl"></i>
            <span class="text-xs font-bold uppercase tracking-widest text-charcoal-500">Step ${quizStep + 1} of ${QUIZ_STEPS.length}</span>
          </div>
          <button id="close-quiz-btn" class="w-8 h-8 rounded-full bg-cream-100 border border-gold-200 text-charcoal-500 hover:bg-charcoal-900 hover:text-white flex items-center justify-center transition-colors">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <div class="w-full bg-cream-200 rounded-full h-1.5">
          <div class="h-1.5 rounded-full bg-gold-400 transition-all duration-500" style="width:${((quizStep) / QUIZ_STEPS.length) * 100}%"></div>
        </div>

        <h3 class="font-serif text-xl font-bold text-charcoal-900 text-center">${step.question}</h3>

        <div class="grid grid-cols-2 gap-3">
          ${step.options.map((opt, i) => `
            <button class="quiz-option-btn p-4 rounded-xl border border-gold-200 bg-cream-50 hover:border-gold-400 hover:bg-gold-50 text-left transition-all group" data-index="${i}">
              <div class="text-2xl mb-2">${opt.emoji}</div>
              <div class="font-bold text-sm text-charcoal-900 group-hover:text-gold-700">${opt.label}</div>
              <div class="text-[11px] text-charcoal-500 mt-0.5">${opt.hint}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('close-quiz-btn')?.addEventListener('click', () => {
      closeModal('quiz-modal-overlay', 'quiz-modal');
      quizStep = 0; quizAnswers = [];
    });

    modal.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        quizAnswers.push(parseInt(btn.dataset.index));
        quizStep++;
        renderQuiz();
      });
    });

  } else {
    const maxPrice = [12000, 30000, 60000, 120000][quizAnswers[3]] || 120000;
    const matches = store.perfumes.filter(p => p.priceKES <= maxPrice).slice(0, 3);

    modal.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="font-serif text-xl font-bold text-charcoal-900 flex items-center gap-2">
            <i class="fas fa-wand-magic-sparkles text-gold-500"></i> Your Scent DNA Matches
          </h3>
          <button id="close-quiz-btn" class="w-8 h-8 rounded-full bg-cream-100 border border-gold-200 text-charcoal-500 hover:bg-charcoal-900 hover:text-white flex items-center justify-center transition-colors">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <p class="text-xs text-charcoal-600 text-center">
          Based on your preferences, we curated <strong class="text-gold-600">your top ${matches.length} matches</strong>:
        </p>

        <div class="space-y-3">
          ${matches.map((p, i) => `
            <div class="flex items-center gap-3 p-3 rounded-xl bg-cream-50 border border-gold-200 hover:border-gold-400 transition-all">
              <img src="${p.image}" class="w-14 h-14 rounded-lg object-cover border border-gold-200" alt="${p.name}">
              <div class="flex-1 min-w-0">
                <span class="text-[10px] text-gold-600 font-bold uppercase tracking-wider">Match #${i + 1}</span>
                <h4 class="font-bold text-sm text-charcoal-900 line-clamp-1">${p.name}</h4>
                <p class="text-[11px] text-charcoal-500">${p.brand} • ${store.formatPrice(p.priceKES)}</p>
              </div>
              <button class="quiz-add-btn px-3 py-1.5 rounded-lg bg-charcoal-900 text-white text-xs font-bold hover:bg-charcoal-800 transition-colors" data-id="${p.id}">
                Add to Bag
              </button>
            </div>
          `).join('')}
        </div>

        <div class="flex gap-3 pt-2">
          <button id="retake-quiz-btn" class="flex-1 py-3 rounded-full border border-gold-300 text-charcoal-800 hover:bg-cream-100 text-xs font-bold uppercase tracking-wider transition-all">
            Retake Quiz
          </button>
          <button id="close-quiz-btn-bottom" class="flex-1 py-3 rounded-full bg-charcoal-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-charcoal-800 transition-all">
            Browse Full Vault
          </button>
        </div>
      </div>
    `;

    document.getElementById('close-quiz-btn')?.addEventListener('click', () => {
      closeModal('quiz-modal-overlay', 'quiz-modal');
      quizStep = 0; quizAnswers = [];
    });

    document.getElementById('close-quiz-btn-bottom')?.addEventListener('click', () => {
      closeModal('quiz-modal-overlay', 'quiz-modal');
      quizStep = 0; quizAnswers = [];
    });

    document.getElementById('retake-quiz-btn')?.addEventListener('click', () => {
      quizStep = 0; quizAnswers = [];
      renderQuiz();
    });

    modal.querySelectorAll('.quiz-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = store.perfumes.find(x => x.id === btn.dataset.id);
        if (p) store.addToCart(p);
      });
    });
  }
}

// ─── MAIN PRODUCT GRID RENDERING ─────────────────────────────────────────────

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  const perfumes = store.getFilteredPerfumes();
  if (countEl) countEl.textContent = `${perfumes.length} fragrance${perfumes.length !== 1 ? 's' : ''} found`;

  if (perfumes.length === 0) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    if (emptyState) {
      emptyState.classList.remove('hidden');
      if (store.perfumes.length === 0) {
        emptyState.innerHTML = `
          <div class="w-16 h-16 mx-auto rounded-full bg-cream-200 border border-gold-300 flex items-center justify-center text-gold-500 text-2xl mb-4 shadow-inner">
            <i class="fas fa-sparkles"></i>
          </div>
          <h3 class="font-serif text-2xl font-bold text-charcoal-900">Fragrance Vault Ready For Stocking</h3>
          <p class="text-xs sm:text-sm text-charcoal-600 max-w-md mx-auto mt-2 leading-relaxed">
            Welcome to Maureh Perfumes! The catalog is currently clear for the store owner to add custom fragrances, set pricing, upload flacon photos, and manage inventory.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button class="open-admin-trigger px-6 py-3 rounded-full bg-charcoal-900 hover:bg-charcoal-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2">
              <i class="fas fa-plus text-gold-300"></i> Add Fragrances via Admin Portal
            </button>
            <a href="https://wa.me/254102796209?text=Hello%20Maureh%20Perfumes!%20I%20am%20inquiring%20about%20fragrances." target="_blank" class="px-6 py-3 rounded-full bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2">
              <i class="fab fa-whatsapp text-emerald-600"></i> Inquire on WhatsApp
            </a>
          </div>
        `;
        emptyState.querySelectorAll('.open-admin-trigger').forEach(btn => {
          btn.addEventListener('click', () => {
            openModal('admin-modal-overlay', 'admin-modal');
            renderAdminPortal();
          });
        });
      } else {
        emptyState.innerHTML = `
          <div class="w-16 h-16 mx-auto rounded-full bg-cream-200 border border-gold-200 flex items-center justify-center text-gold-400 text-2xl mb-4">
            <i class="fas fa-wind"></i>
          </div>
          <h3 class="font-serif text-xl font-bold text-charcoal-800">No Fragrances Found</h3>
          <p class="text-xs text-charcoal-500 max-w-sm mx-auto mt-2">Try widening your price range or resetting filters.</p>
          <button id="empty-reset-btn" class="mt-4 px-6 py-2.5 rounded-full bg-charcoal-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-charcoal-800 transition-colors">
            Reset Filters
          </button>
        `;
        document.getElementById('empty-reset-btn')?.addEventListener('click', () => {
          store.resetFilters();
          const priceInput = document.getElementById('price-range');
          if (priceInput) priceInput.value = 120000;
          const display = document.getElementById('price-slider-display');
          if (display) display.textContent = 'KSh 120,000';
          renderCategoryPills();
          renderProductGrid();
        });
      }
    }
  } else {
    grid.classList.remove('hidden');
    emptyState?.classList.add('hidden');
    grid.innerHTML = perfumes.map(renderProductCard).join('');

    grid.querySelectorAll('.quick-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = store.perfumes.find(x => x.id === btn.dataset.id);
        if (p) renderQuickView(p);
      });
    });

    grid.querySelectorAll('[data-quickview]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = store.perfumes.find(x => x.id === btn.dataset.quickview);
        if (p) renderQuickView(p);
      });
    });

    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = store.perfumes.find(x => x.id === btn.dataset.id);
        if (p && p.inStock) {
          store.addToCart(p);
          updateBadges();
          openCartDrawer();
        }
      });
    });

    grid.querySelectorAll('.wishlist-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        store.toggleWishlist(btn.dataset.id);
        renderProductGrid();
        updateBadges();
      });
    });
  }
}

// ─── CATEGORY PILLS ───────────────────────────────────────────────────────────

function renderCategoryPills() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  const categories = [
    { label: 'All Fragrances', value: 'All', icon: 'fas fa-sparkles' },
    { label: 'Men', value: 'Men', icon: 'fas fa-person' },
    { label: 'Women', value: 'Women', icon: 'fas fa-person-dress' },
    { label: 'Unisex', value: 'Unisex', icon: 'fas fa-infinity' },
    { label: 'Niche & Haute', value: 'Niche & Haute', icon: 'fas fa-crown' },
    { label: 'Arabian Oud', value: 'Arabian Oud', icon: 'fas fa-mosque' },
    { label: 'Travel Decants', value: 'Decants & Samples', icon: 'fas fa-vial' },
    { label: 'Gift Sets', value: 'Gift Sets', icon: 'fas fa-gift' },
  ];

  const active = store.filters.category;

  container.innerHTML = categories.map(cat => `
    <button 
      class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
        cat.value === active
          ? 'bg-charcoal-900 border-charcoal-900 text-white shadow-md'
          : 'bg-white border-gold-200 text-charcoal-700 hover:border-gold-400 hover:text-gold-700 shadow-sm'
      }"
      data-cat="${cat.value}"
    >
      <i class="${cat.icon} text-[10px]"></i> ${cat.label}
    </button>
  `).join('');

  container.querySelectorAll('.category-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      store.setFilter('category', btn.dataset.cat);
      renderCategoryPills();
      renderProductGrid();
    });
  });
}

// ─── BADGE UPDATES ────────────────────────────────────────────────────────────

function updateBadges() {
  const count = store.getCartCount();
  const wishCount = store.wishlist.length;

  ['cart-badge', 'mobile-cart-badge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = count;
      el.classList.toggle('hidden', count === 0);
    }
  });

  ['wishlist-badge', 'mobile-wishlist-badge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = wishCount;
      el.classList.toggle('hidden', wishCount === 0);
    }
  });
}

// ─── BRAND FILTER POPULATOR ───────────────────────────────────────────────────

function populateBrandFilter() {
  const select = document.getElementById('brand-filter');
  if (!select) return;
  select.innerHTML = '<option value="All">All Fragrance Houses</option>';
  const brands = [...new Set(store.perfumes.map(p => p.brand))].sort();
  brands.forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand;
    opt.textContent = brand;
    select.appendChild(opt);
  });
}

// ─── ORDER TRACKER LOOKUP ─────────────────────────────────────────────────────

function handleOrderTrackingSearch() {
  const input = document.getElementById('tracking-input');
  const resultBox = document.getElementById('tracking-result-box');
  if (!input || !resultBox) return;

  const code = input.value.trim().toUpperCase();
  const order = store.getOrder(code);

  if (order) {
    resultBox.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <span class="text-charcoal-600">Order: <strong class="text-charcoal-900 font-cinzel">${order.id}</strong></span>
        <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-300">${order.status}</span>
      </div>
      <div class="text-[11px] text-charcoal-500">
        <p><strong>Customer:</strong> ${order.customerName} (${order.phone})</p>
        <p><strong>Delivery Address:</strong> ${order.deliveryAddress}, ${order.deliveryArea}</p>
        <p><strong>Payment Ref:</strong> <span class="font-mono text-emerald-700">${order.transactionRef}</span></p>
        <p><strong>Total:</strong> ${store.formatPrice(order.totalKES)}</p>
      </div>
      <div class="space-y-3 pt-2 text-xs border-t border-gold-200">
        <div class="flex items-start gap-3">
          <span class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold"><i class="fas fa-check"></i></span>
          <div><p class="font-bold text-charcoal-800">Order Authenticated & Packed</p><p class="text-[10px] text-charcoal-400">Inspected at Maureh Vault</p></div>
        </div>
        <div class="flex items-start gap-3">
          <span class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold"><i class="fas fa-check"></i></span>
          <div><p class="font-bold text-charcoal-800">Dispatched via Dedicated Courier</p><p class="text-[10px] text-charcoal-400">Nairobi logistics hub</p></div>
        </div>
        <div class="flex items-start gap-3">
          <span class="w-5 h-5 rounded-full bg-gold-400 text-charcoal-900 flex items-center justify-center text-[10px] font-bold animate-pulse"><i class="fas fa-motorcycle"></i></span>
          <div><p class="font-bold text-gold-600">${order.status}</p><p class="text-[10px] text-charcoal-400">Estimated delivery within 30-45 mins</p></div>
        </div>
      </div>
    `;
  } else {
    resultBox.innerHTML = `
      <div class="p-3 text-center text-xs text-rose-600 bg-rose-50 rounded-lg border border-rose-200">
        No order found with code "${code}". Please verify your order number or contact WhatsApp concierge.
      </div>
    `;
  }
}

// ─── BOOT & EVENT BINDINGS ────────────────────────────────────────────────────

function init() {
  renderProductGrid();
  renderCategoryPills();
  renderVendors();
  renderReviews();
  populateBrandFilter();
  updateBadges();

  store.subscribe(() => updateBadges());

  // Currency Switcher
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) {
    currencySelect.value = store.currency;
    currencySelect.addEventListener('change', (e) => {
      store.setCurrency(e.target.value);
      renderProductGrid();
    });
  }

  // Global Search Inputs
  function bindSearch(inputId) {
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById('clear-search-btn');
    if (!input) return;
    input.addEventListener('input', () => {
      store.setFilter('search', input.value);
      if (clearBtn) clearBtn.classList.toggle('hidden', !input.value);
      renderProductGrid();
    });
    clearBtn?.addEventListener('click', () => {
      input.value = '';
      store.setFilter('search', '');
      clearBtn.classList.add('hidden');
      renderProductGrid();
    });
  }
  bindSearch('global-search-input');
  bindSearch('mobile-search-input');

  // Filter Controls
  const filters = [
    { id: 'price-range', event: 'input', handler: (e) => {
      const val = parseInt(e.target.value);
      store.setFilter('maxPrice', val);
      const display = document.getElementById('price-slider-display');
      if (display) display.textContent = `KSh ${val.toLocaleString()}`;
      renderProductGrid();
    }},
    { id: 'brand-filter', event: 'change', handler: (e) => { store.setFilter('brand', e.target.value); renderProductGrid(); }},
    { id: 'family-filter', event: 'change', handler: (e) => { store.setFilter('family', e.target.value); renderProductGrid(); }},
    { id: 'concentration-filter', event: 'change', handler: (e) => { store.setFilter('concentration', e.target.value); renderProductGrid(); }},
    { id: 'vendor-filter', event: 'change', handler: (e) => { store.setFilter('vendor', e.target.value); renderProductGrid(); }},
    { id: 'sort-filter', event: 'change', handler: (e) => { store.setFilter('sortBy', e.target.value); renderProductGrid(); }},
  ];

  filters.forEach(({ id, event, handler }) => {
    document.getElementById(id)?.addEventListener(event, handler);
  });

  // Reset Filters
  ['reset-filters-btn', 'empty-reset-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      store.resetFilters();
      ['brand-filter', 'family-filter', 'concentration-filter', 'vendor-filter', 'sort-filter']
        .forEach(fid => { const el = document.getElementById(fid); if (el) el.value = 'All'; });
      const priceRange = document.getElementById('price-range');
      if (priceRange) priceRange.value = 120000;
      const display = document.getElementById('price-slider-display');
      if (display) display.textContent = 'KSh 120,000';
      renderCategoryPills();
      renderProductGrid();
    });
  });

  // Cart Drawer
  ['cart-drawer-btn', 'mobile-cart-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', openCartDrawer);
  });
  document.getElementById('close-cart-btn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cart-drawer-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('cart-drawer-overlay')) closeCartDrawer();
  });

  // Promo Code
  document.getElementById('apply-promo-btn')?.addEventListener('click', () => {
    const val = document.getElementById('promo-input')?.value;
    const applied = store.applyPromo(val);
    if (applied) renderCartDrawer();
  });

  // Checkout
  ['checkout-trigger-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      closeCartDrawer();
      setTimeout(renderCheckout, 350);
    });
  });
  document.getElementById('checkout-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('checkout-modal-overlay'))
      closeModal('checkout-modal-overlay', 'checkout-modal');
  });

  // WhatsApp Cart Order Button
  document.getElementById('whatsapp-cart-order-btn')?.addEventListener('click', () => {
    const lines = store.cart.map(i => `• ${i.name} (${i.size}) x${i.quantity} — KES ${(i.priceKES * i.quantity).toLocaleString()}`).join('\n');
    const total = `TOTAL: KES ${store.getCartTotalKES().toLocaleString()}`;
    const text = `Hello Maureh Perfumes! I would like to place this order:\n\n${lines}\n\n${total}\n\nPlease confirm and arrange delivery. Thank you!`;
    window.open(`https://wa.me/254102796209?text=${encodeURIComponent(text)}`, '_blank');
  });

  // Quick View Overlay close
  document.getElementById('quickview-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('quickview-modal-overlay'))
      closeModal('quickview-modal-overlay', 'quickview-modal');
  });

  // Hero Quick View button
  document.querySelector('[data-quickview="mrh-01"]')?.addEventListener('click', () => {
    const p = store.perfumes.find(x => x.id === 'mrh-01') || store.perfumes[0];
    if (p) {
      renderQuickView(p);
    } else {
      openModal('admin-modal-overlay', 'admin-modal');
      renderAdminPortal();
    }
  });

  // Admin & Inventory Portal Trigger
  const openAdmin = () => {
    window.location.hash = 'admin';
    renderAdminPortal();
  };
  ['open-admin-btn', 'nav-admin-btn'].forEach(id => document.getElementById(id)?.addEventListener('click', openAdmin));
  document.querySelectorAll('.open-admin-trigger').forEach(el => el.addEventListener('click', openAdmin));
  document.getElementById('admin-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('admin-modal-overlay')) {
      closeModal('admin-modal-overlay', 'admin-modal');
      if (window.location.hash === '#admin') history.replaceState(null, null, ' ');
    }
  });

  // Legal & Policy Triggers
  document.querySelectorAll('.open-privacy-trigger').forEach(el => el.addEventListener('click', () => { window.location.hash = 'privacy'; renderLegalModal('privacy'); }));
  document.querySelectorAll('.open-returns-trigger').forEach(el => el.addEventListener('click', () => { window.location.hash = 'returns'; renderLegalModal('returns'); }));
  document.querySelectorAll('.open-terms-trigger').forEach(el => el.addEventListener('click', () => { window.location.hash = 'terms'; renderLegalModal('terms'); }));
  document.querySelectorAll('.open-authenticity-trigger').forEach(el => el.addEventListener('click', () => { window.location.hash = 'authenticity'; renderLegalModal('authenticity'); }));
  document.querySelectorAll('.open-delivery-trigger').forEach(el => el.addEventListener('click', () => { window.location.hash = 'delivery'; renderLegalModal('delivery'); }));
  document.getElementById('legal-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('legal-modal-overlay')) {
      closeModal('legal-modal-overlay', 'legal-modal');
      if (['#privacy', '#returns', '#terms', '#authenticity', '#delivery'].includes(window.location.hash)) {
        history.replaceState(null, null, ' ');
      }
    }
  });

  // URL Hash Auto-Router (e.g. going directly to #admin or #privacy)
  function handleHashChange() {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#admin' || hash === '#portal' || hash === '#inventory') {
      renderAdminPortal();
    } else if (hash === '#privacy') {
      renderLegalModal('privacy');
    } else if (hash === '#returns' || hash === '#refunds') {
      renderLegalModal('returns');
    } else if (hash === '#terms' || hash === '#tos') {
      renderLegalModal('terms');
    } else if (hash === '#authenticity') {
      renderLegalModal('authenticity');
    } else if (hash === '#delivery' || hash === '#shipping') {
      renderLegalModal('delivery');
    } else if (hash === '#quiz') {
      openQuiz();
    } else if (hash === '#cart') {
      openCartDrawer();
    } else if (hash === '#track') {
      openTracking();
    }
  }
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  // Quiz Buttons
  const openQuiz = () => { quizStep = 0; quizAnswers = []; renderQuiz(); openModal('quiz-modal-overlay', 'quiz-modal'); };
  ['nav-quiz-btn', 'hero-quiz-btn', 'callout-quiz-btn', 'mobile-quiz-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', openQuiz);
  });
  document.querySelectorAll('.open-quiz-trigger').forEach(el => el.addEventListener('click', openQuiz));
  document.getElementById('quiz-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('quiz-modal-overlay')) {
      closeModal('quiz-modal-overlay', 'quiz-modal');
      quizStep = 0; quizAnswers = [];
    }
  });

  // Hero Decant Button
  document.getElementById('hero-decant-btn')?.addEventListener('click', () => {
    store.setFilter('category', 'Decants & Samples');
    renderCategoryPills();
    renderProductGrid();
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Tracking Modal
  const openTracking = () => openModal('tracking-modal-overlay', 'tracking-modal');
  ['open-tracking-btn'].forEach(id => document.getElementById(id)?.addEventListener('click', openTracking));
  document.querySelectorAll('.open-tracking-trigger').forEach(el => el.addEventListener('click', openTracking));
  document.getElementById('close-tracking-modal')?.addEventListener('click', () => closeModal('tracking-modal-overlay', 'tracking-modal'));
  document.getElementById('track-status-btn')?.addEventListener('click', handleOrderTrackingSearch);
  document.getElementById('tracking-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('tracking-modal-overlay')) closeModal('tracking-modal-overlay', 'tracking-modal');
  });

  // Seller Modal
  const openSeller = () => openModal('seller-modal-overlay', 'seller-modal');
  ['open-seller-btn'].forEach(id => document.getElementById(id)?.addEventListener('click', openSeller));
  document.querySelectorAll('.open-seller-trigger').forEach(el => el.addEventListener('click', openSeller));
  document.getElementById('close-seller-modal')?.addEventListener('click', () => closeModal('seller-modal-overlay', 'seller-modal'));
  document.getElementById('seller-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('seller-modal-overlay')) closeModal('seller-modal-overlay', 'seller-modal');
  });

  // Vendor Application Form
  document.getElementById('vendor-application-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal('seller-modal-overlay', 'seller-modal');
    store.toast('Application received! Our vendor team will review and contact you within 24 hours.', 'success');
  });

  // Wishlist Buttons
  ['wishlist-btn', 'mobile-wishlist-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      if (store.wishlist.length === 0) {
        store.toast('Your wishlist is empty. Heart fragrances you love!', 'info');
      } else {
        store.toast(`You have ${store.wishlist.length} fragrance${store.wishlist.length !== 1 ? 's' : ''} saved to your wishlist.`, 'info');
      }
    });
  });

  // Newsletter Form
  document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    store.toast('Welcome to the Maureh VIP Club! Check your inbox for a welcome gift.', 'success');
    e.target.reset();
  });

  // Contact Form
  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    store.toast('Your VIP inquiry was sent! Our fragrance specialist will respond within 30 minutes.', 'success');
    e.target.reset();
  });

  const promoInput = document.getElementById('promo-input');
  if (promoInput && store.promoCode) {
    promoInput.value = store.promoCode;
  }

  // Global Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal('quickview-modal-overlay', 'quickview-modal');
      closeModal('quiz-modal-overlay', 'quiz-modal');
      closeModal('checkout-modal-overlay', 'checkout-modal');
      closeModal('tracking-modal-overlay', 'tracking-modal');
      closeModal('seller-modal-overlay', 'seller-modal');
      closeModal('admin-modal-overlay', 'admin-modal');
      closeModal('legal-modal-overlay', 'legal-modal');
      closeCartDrawer();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
