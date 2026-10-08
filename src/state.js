import { PERFUMES as INITIAL_PERFUMES } from './data/perfumes.js';
import { VENDORS as INITIAL_VENDORS } from './data/vendors.js';
import { getSupabase, getSupabaseCredentials, saveSupabaseCredentials } from './supabase.js';

export const CURRENCIES = {
  KES: { code: "KES", symbol: "KES ", rate: 1.0, flag: "🇰🇪", name: "Kenyan Shilling" },
  USD: { code: "USD", symbol: "$", rate: 0.0077, flag: "🇺🇸", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", rate: 0.0071, flag: "🇪🇺", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", rate: 0.0060, flag: "🇬🇧", name: "British Pound" }
};

export const VENDOR_ACCOUNTS = [
  { id: "maureh-vault", name: "Maureh Flagship Vault", email: "vault@maureh.com", pass: "vault123", commissionRate: 0.0 },
  { id: "maison-niche", name: "Maison Niche Kenya", email: "maison@niche.co.ke", pass: "niche123", commissionRate: 0.15 },
  { id: "arabian-oud", name: "Arabian Oud Oasis", email: "sales@arabianoud.co.ke", pass: "oud123", commissionRate: 0.12 },
  { id: "decant-atelier", name: "The Decant Atelier", email: "contact@decants.co.ke", pass: "decant123", commissionRate: 0.10 }
];

class Store {
  constructor() {
    this.listeners = [];
    this.currency = localStorage.getItem("maureh_currency") || "KES";
    
    // Admin & Vendor Auth State
    this.isAdminAuthenticated = localStorage.getItem("maureh_admin_auth") === "true";
    this.activeVendorUser = JSON.parse(localStorage.getItem("maureh_vendor_user")) || null;

    // Load or initialize dynamic perfumes catalog
    try {
      const savedPerfumes = JSON.parse(localStorage.getItem("maureh_inventory"));
      this.perfumes = Array.isArray(savedPerfumes) && savedPerfumes.length > 0 ? savedPerfumes : [...INITIAL_PERFUMES];
    } catch {
      this.perfumes = [...INITIAL_PERFUMES];
    }

    // Load Orders
    try {
      this.orders = JSON.parse(localStorage.getItem("maureh_orders")) || [
        {
          id: "MRH-89421",
          date: new Date(Date.now() - 3600000 * 3).toISOString(),
          customerName: "Dr. Ken Mutua",
          phone: "+254 722 144 837",
          deliveryArea: "Westlands, GTC Nairobi",
          paymentMethod: "M-PESA (STK Push)",
          transactionRef: "MPESA-QK9482X10",
          status: "Out for Delivery",
          items: [
            { name: "Baccarat Rouge 540 Extrait", size: "70ml Bottle", quantity: 1, priceKES: 58500 }
          ],
          totalKES: 58500
        }
      ];
    } catch {
      this.orders = [];
    }

    // Load Cart
    try {
      this.cart = JSON.parse(localStorage.getItem("maureh_cart")) || [];
    } catch {
      this.cart = [];
    }

    // Load Wishlist
    try {
      this.wishlist = JSON.parse(localStorage.getItem("maureh_wishlist")) || [];
    } catch {
      this.wishlist = [];
    }

    // Promo Code
    this.promoCode = localStorage.getItem("maureh_promo") || "";
    this.discountPercent = this.promoCode === "MAUREH10" ? 0.10 : 0;

    // Filters
    this.filters = {
      search: "",
      category: "All",
      brand: "All",
      family: "All",
      concentration: "All",
      vendor: "All",
      maxPrice: 120000,
      sortBy: "featured"
    };

    // Try live fetch from Supabase if connected
    this.initSupabaseSync();
  }

  async initSupabaseSync() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('perfumes').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          // Map snake_case DB columns to camelCase
          this.perfumes = data.map(row => ({
            id: row.id,
            name: row.name,
            brand: row.brand,
            subtitle: row.subtitle,
            gender: row.gender,
            category: row.category,
            family: row.family,
            concentration: row.concentration,
            priceKES: Number(row.price_kes),
            originalPriceKES: Number(row.original_price_kes),
            rating: Number(row.rating),
            reviewsCount: Number(row.reviews_count),
            vendorId: row.vendor_id,
            vendorName: row.vendor_name,
            inStock: row.in_stock,
            isBestseller: row.is_bestseller,
            isNew: row.is_new,
            image: row.image,
            description: row.description,
            notes: row.notes || { top: [], heart: [], base: [] },
            performance: row.performance || {},
            sizes: row.sizes || [],
            accords: row.accords || []
          }));
          this.saveInventory();
          this.notify();
        }
      } catch (err) {
        console.warn('Supabase fetch error, using local fallback:', err);
      }
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  setCurrency(curr) {
    if (CURRENCIES[curr]) {
      this.currency = curr;
      localStorage.setItem("maureh_currency", curr);
      this.notify();
    }
  }

  formatPrice(kesAmount) {
    const cur = CURRENCIES[this.currency] || CURRENCIES.KES;
    const converted = (kesAmount || 0) * cur.rate;
    if (this.currency === "KES") {
      return `${cur.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${cur.symbol}${converted.toFixed(2)}`;
  }

  // ─── ADMIN & VENDOR AUTHENTICATION ────────────────────────────────────────

  loginAdmin(passcode) {
    if (passcode === "admin123" || passcode === "maureh2026") {
      this.isAdminAuthenticated = true;
      localStorage.setItem("maureh_admin_auth", "true");
      this.toast("Admin access unlocked. Welcome back, General Manager!", "success");
      this.notify();
      return true;
    }
    this.toast("Invalid passkey. Access denied.", "error");
    return false;
  }

  logoutAdmin() {
    this.isAdminAuthenticated = false;
    this.activeVendorUser = null;
    localStorage.removeItem("maureh_admin_auth");
    localStorage.removeItem("maureh_vendor_user");
    this.toast("Logged out of Portal.", "info");
    this.notify();
  }

  loginVendor(email, password) {
    const account = VENDOR_ACCOUNTS.find(v => v.email.toLowerCase() === email.trim().toLowerCase() && v.pass === password);
    if (account) {
      this.activeVendorUser = account;
      this.isAdminAuthenticated = true;
      localStorage.setItem("maureh_admin_auth", "true");
      localStorage.setItem("maureh_vendor_user", JSON.stringify(account));
      this.toast(`Welcome back, ${account.name}!`, "success");
      this.notify();
      return true;
    }
    this.toast("Invalid vendor credentials.", "error");
    return false;
  }

  // ─── SUPABASE INTEGRATION METHODS ─────────────────────────────────────────

  async connectSupabase(url, key) {
    saveSupabaseCredentials(url, key);
    const supabase = getSupabase();
    if (!supabase) {
      this.toast("Invalid Supabase connection parameters.", "error");
      return false;
    }

    try {
      this.toast("Connecting to Supabase Database...", "info");
      // Test select
      const { data, error } = await supabase.from('perfumes').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        this.toast(`Supabase connection error: ${error.message}. Please verify tables were created using supabase_schema.sql.`, "error");
        return false;
      }

      this.toast("⚡ Successfully connected to Supabase Database!", "success");
      await this.initSupabaseSync();
      return true;
    } catch (err) {
      this.toast(`Connection failed: ${err.message}`, "error");
      return false;
    }
  }

  async seedSupabase() {
    const supabase = getSupabase();
    if (!supabase) {
      this.toast("Connect Supabase first.", "error");
      return;
    }

    try {
      this.toast("Seeding 14 default luxury fragrances to Supabase...", "info");
      const rows = this.perfumes.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        subtitle: p.subtitle,
        gender: p.gender,
        category: p.category,
        family: p.family,
        concentration: p.concentration,
        price_kes: p.priceKES,
        original_price_kes: p.originalPriceKES,
        rating: p.rating,
        reviews_count: p.reviewsCount,
        vendor_id: p.vendorId,
        vendor_name: p.vendorName,
        in_stock: p.inStock,
        is_bestseller: p.isBestseller,
        is_new: p.isNew,
        image: p.image,
        description: p.description,
        notes: p.notes,
        performance: p.performance,
        sizes: p.sizes,
        accords: p.accords
      }));

      const { error } = await supabase.from('perfumes').upsert(rows);
      if (error) throw error;

      this.toast("🎉 Database seeded successfully with all perfumes!", "success");
    } catch (err) {
      this.toast(`Seeding error: ${err.message}`, "error");
    }
  }

  // ─── ORDERS & M-PESA ───────────────────────────────────────────────────────

  async createOrder(orderData) {
    const trackingCode = `MRH-${Math.floor(10000 + Math.random() * 90000)}`;
    const txRef = orderData.transactionRef || `MPESA-Q${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const newOrder = {
      id: trackingCode,
      date: new Date().toISOString(),
      customerName: `${orderData.firstName || ''} ${orderData.lastName || ''}`.trim() || 'Valued Patron',
      phone: orderData.phone || '+254 7XX XXX XXX',
      deliveryArea: orderData.deliveryArea || 'Nairobi Central',
      deliveryAddress: orderData.deliveryAddress || 'Delivery Address',
      paymentMethod: orderData.paymentMethod || 'M-PESA (STK Push)',
      transactionRef: txRef,
      status: 'Order Placed & Verified',
      items: [...this.cart],
      subtotalKES: this.getCartSubtotalKES(),
      discountKES: this.getCartDiscountKES(),
      totalKES: this.getCartTotalKES()
    };

    this.orders.unshift(newOrder);
    localStorage.setItem("maureh_orders", JSON.stringify(this.orders));

    // Also push to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('orders').insert([{
          id: newOrder.id,
          customer_name: newOrder.customerName,
          phone: newOrder.phone,
          delivery_area: newOrder.deliveryArea,
          delivery_address: newOrder.deliveryAddress,
          payment_method: newOrder.paymentMethod,
          transaction_ref: newOrder.transactionRef,
          status: newOrder.status,
          items: newOrder.items,
          subtotal_kes: newOrder.subtotalKES,
          discount_kes: newOrder.discountKES,
          total_kes: newOrder.totalKES
        }]);
      } catch (err) {
        console.warn('Supabase order sync error:', err);
      }
    }

    this.clearCart();
    this.notify();
    return newOrder;
  }

  getOrder(id) {
    return this.orders.find(o => o.id.toUpperCase() === id.trim().toUpperCase());
  }

  // ─── INVENTORY CRUD OPERATIONS ────────────────────────────────────────────

  saveInventory() {
    localStorage.setItem("maureh_inventory", JSON.stringify(this.perfumes));
  }

  async addPerfume(data) {
    const nextNum = this.perfumes.length + 1;
    const newId = `mrh-${String(nextNum).padStart(2, '0')}_${Date.now().toString().slice(-4)}`;
    
    const defaultSizes = data.sizes && data.sizes.length > 0 ? data.sizes : [
      { size: "10ml Decant", priceKES: Math.round((data.priceKES || 10000) * 0.18) },
      { size: "100ml Bottle", priceKES: data.priceKES || 10000, isDefault: true }
    ];

    const newPerfume = {
      id: newId,
      name: data.name || "Untitled Fragrance",
      brand: data.brand || "Artisan House",
      subtitle: data.subtitle || `${data.concentration || 'Eau de Parfum'} • Luxury Scent`,
      gender: data.gender || "Unisex",
      category: data.category || "Niche & Haute",
      family: data.family || "Woody Amber",
      concentration: data.concentration || "Eau de Parfum",
      priceKES: Number(data.priceKES) || 15000,
      originalPriceKES: Number(data.originalPriceKES) || (Number(data.priceKES) * 1.15),
      rating: Number(data.rating) || 5.0,
      reviewsCount: Number(data.reviewsCount) || 1,
      vendorId: data.vendorId || (this.activeVendorUser ? this.activeVendorUser.id : "maureh-vault"),
      vendorName: data.vendorName || (this.activeVendorUser ? this.activeVendorUser.name : "Maureh Flagship Vault"),
      inStock: data.inStock !== false,
      isBestseller: !!data.isBestseller,
      isNew: data.isNew !== false,
      image: data.image || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      description: data.description || "An exquisite olfactory creation with opulent notes and remarkable longevity.",
      notes: data.notes || { top: ["Bergamot", "Saffron"], heart: ["Rose", "Amber"], base: ["Sandalwood", "Oud"] },
      performance: data.performance || { sillage: "Strong", longevity: "10-12 Hours", season: "All-Season", occasion: "Signature" },
      sizes: defaultSizes,
      accords: data.accords && data.accords.length > 0 ? data.accords : ["Woody", "Amber", "Spicy"]
    };

    this.perfumes.unshift(newPerfume);
    this.saveInventory();

    // Supabase insert
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('perfumes').insert([{
          id: newPerfume.id,
          name: newPerfume.name,
          brand: newPerfume.brand,
          subtitle: newPerfume.subtitle,
          gender: newPerfume.gender,
          category: newPerfume.category,
          family: newPerfume.family,
          concentration: newPerfume.concentration,
          price_kes: newPerfume.priceKES,
          original_price_kes: newPerfume.originalPriceKES,
          vendor_id: newPerfume.vendorId,
          vendor_name: newPerfume.vendorName,
          in_stock: newPerfume.inStock,
          is_bestseller: newPerfume.isBestseller,
          is_new: newPerfume.isNew,
          image: newPerfume.image,
          description: newPerfume.description,
          notes: newPerfume.notes,
          performance: newPerfume.performance,
          sizes: newPerfume.sizes,
          accords: newPerfume.accords
        }]);
      } catch (err) {
        console.warn('Supabase sync error:', err);
      }
    }

    this.toast(`Added "${newPerfume.name}" to inventory!`, "success");
    this.notify();
    return newPerfume;
  }

  async updatePerfume(id, updatedFields) {
    const index = this.perfumes.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.perfumes[index] = {
      ...this.perfumes[index],
      ...updatedFields
    };

    this.saveInventory();

    // Supabase update
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('perfumes').update({
          name: updatedFields.name,
          brand: updatedFields.brand,
          subtitle: updatedFields.subtitle,
          gender: updatedFields.gender,
          category: updatedFields.category,
          family: updatedFields.family,
          concentration: updatedFields.concentration,
          price_kes: updatedFields.priceKES,
          original_price_kes: updatedFields.originalPriceKES,
          vendor_id: updatedFields.vendorId,
          vendor_name: updatedFields.vendorName,
          in_stock: updatedFields.inStock,
          is_bestseller: updatedFields.isBestseller,
          is_new: updatedFields.isNew,
          image: updatedFields.image,
          description: updatedFields.description,
          notes: updatedFields.notes,
          performance: updatedFields.performance,
          sizes: updatedFields.sizes,
          accords: updatedFields.accords
        }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update error:', err);
      }
    }

    this.toast(`Updated "${this.perfumes[index].name}" details.`, "success");
    this.notify();
    return true;
  }

  async deletePerfume(id) {
    const p = this.perfumes.find(x => x.id === id);
    const name = p ? p.name : "Item";
    this.perfumes = this.perfumes.filter(x => x.id !== id);
    this.saveInventory();

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('perfumes').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    this.toast(`Deleted "${name}" from inventory.`, "info");
    this.notify();
  }

  async toggleStock(id) {
    const p = this.perfumes.find(x => x.id === id);
    if (p) {
      p.inStock = !p.inStock;
      this.saveInventory();

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('perfumes').update({ in_stock: p.inStock }).eq('id', id);
        } catch (err) {
          console.warn('Supabase stock toggle error:', err);
        }
      }

      this.toast(`"${p.name}" is now ${p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}.`, "info");
      this.notify();
    }
  }

  resetToDefaultInventory() {
    this.perfumes = [...INITIAL_PERFUMES];
    this.saveInventory();
    this.toast("Catalog reset to factory default fragrances.", "info");
    this.notify();
  }

  exportInventoryJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.perfumes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `maureh_perfumes_catalog_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.toast("Inventory backup downloaded!", "success");
  }

  importInventoryJSON(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.perfumes = parsed;
        this.saveInventory();
        this.toast(`Successfully imported ${parsed.length} fragrances!`, "success");
        this.notify();
        return true;
      }
      throw new Error("Invalid format: expected array of perfumes");
    } catch (err) {
      this.toast(`Import failed: ${err.message}`, "error");
      return false;
    }
  }

  // ─── CART METHODS ─────────────────────────────────────────────────────────

  addToCart(perfume, selectedSize = null, quantity = 1) {
    const size = selectedSize || perfume.sizes.find(s => s.isDefault) || perfume.sizes[0];
    const key = `${perfume.id}_${size.size}`;
    const existing = this.cart.find(item => item.key === key);

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({
        key,
        id: perfume.id,
        name: perfume.name,
        brand: perfume.brand,
        image: perfume.image,
        size: size.size,
        priceKES: size.priceKES,
        vendorName: perfume.vendorName,
        vendorId: perfume.vendorId,
        quantity: quantity
      });
    }

    this.saveCart();
    this.toast(`Added "${perfume.name} (${size.size})" to your Luxury Bag`, "success");
    this.notify();
  }

  removeFromCart(key) {
    this.cart = this.cart.filter(item => item.key !== key);
    this.saveCart();
    this.notify();
  }

  updateCartQty(key, delta) {
    const item = this.cart.find(i => i.key === key);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeFromCart(key);
      return;
    }
    this.saveCart();
    this.notify();
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.notify();
  }

  saveCart() {
    localStorage.setItem("maureh_cart", JSON.stringify(this.cart));
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  getCartSubtotalKES() {
    return this.cart.reduce((sum, item) => sum + (item.priceKES * item.quantity), 0);
  }

  getCartDiscountKES() {
    return this.getCartSubtotalKES() * this.discountPercent;
  }

  getCartTotalKES() {
    const sub = this.getCartSubtotalKES();
    const disc = this.getCartDiscountKES();
    return Math.max(0, sub - disc);
  }

  applyPromo(code) {
    const clean = (code || "").trim().toUpperCase();
    if (clean === "MAUREH10") {
      this.promoCode = clean;
      this.discountPercent = 0.10;
      localStorage.setItem("maureh_promo", clean);
      this.toast("Promo MAUREH10 applied! 10% VIP discount unlocked.", "success");
      this.notify();
      return true;
    } else {
      this.toast("Invalid or expired coupon code", "error");
      return false;
    }
  }

  removePromo() {
    this.promoCode = "";
    this.discountPercent = 0;
    localStorage.removeItem("maureh_promo");
    this.notify();
  }

  // ─── WISHLIST ─────────────────────────────────────────────────────────────

  toggleWishlist(perfumeId) {
    if (this.wishlist.includes(perfumeId)) {
      this.wishlist = this.wishlist.filter(id => id !== perfumeId);
      this.toast("Removed from your Fragrance Wishlist", "info");
    } else {
      this.wishlist.push(perfumeId);
      this.toast("Saved to your Fragrance Wishlist", "success");
    }
    localStorage.setItem("maureh_wishlist", JSON.stringify(this.wishlist));
    this.notify();
  }

  isWishlisted(perfumeId) {
    return this.wishlist.includes(perfumeId);
  }

  // ─── FILTERS ──────────────────────────────────────────────────────────────

  setFilter(key, value) {
    this.filters[key] = value;
    this.notify();
  }

  resetFilters() {
    this.filters = {
      search: "",
      category: "All",
      brand: "All",
      family: "All",
      concentration: "All",
      vendor: "All",
      maxPrice: 120000,
      sortBy: "featured"
    };
    this.notify();
  }

  getFilteredPerfumes() {
    return this.perfumes.filter(p => {
      // Search
      if (this.filters.search) {
        const q = this.filters.search.toLowerCase();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchBrand = (p.brand || "").toLowerCase().includes(q);
        const notesArr = p.notes ? [...(p.notes.top || []), ...(p.notes.heart || []), ...(p.notes.base || [])] : [];
        const matchNotes = notesArr.some(n => n.toLowerCase().includes(q));
        const matchAccords = (p.accords || []).some(a => a.toLowerCase().includes(q));
        if (!matchName && !matchBrand && !matchNotes && !matchAccords) return false;
      }
      // Category
      if (this.filters.category !== "All") {
        if (this.filters.category === "Men" && p.gender !== "Men" && p.gender !== "Unisex") return false;
        if (this.filters.category === "Women" && p.gender !== "Women" && p.gender !== "Unisex") return false;
        if (this.filters.category === "Unisex" && p.gender !== "Unisex") return false;
        if (this.filters.category === "Niche & Haute" && p.category !== "Niche & Haute") return false;
        if (this.filters.category === "Arabian Oud" && p.category !== "Arabian Oud") return false;
        if (this.filters.category === "Decants & Samples" && p.category !== "Decants & Samples") return false;
        if (this.filters.category === "Gift Sets" && p.category !== "Gift Sets") return false;
      }
      // Brand
      if (this.filters.brand !== "All" && p.brand !== this.filters.brand) return false;
      // Family
      if (this.filters.family !== "All" && !(p.family || "").toLowerCase().includes(this.filters.family.toLowerCase())) return false;
      // Concentration
      if (this.filters.concentration !== "All" && p.concentration !== this.filters.concentration) return false;
      // Vendor
      if (this.filters.vendor !== "All" && p.vendorId !== this.filters.vendor) return false;
      // Max Price
      if (p.priceKES > this.filters.maxPrice) return false;

      return true;
    }).sort((a, b) => {
      if (this.filters.sortBy === "price-low") return a.priceKES - b.priceKES;
      if (this.filters.sortBy === "price-high") return b.priceKES - a.priceKES;
      if (this.filters.sortBy === "rating") return b.rating - a.rating;
      return 0; // featured
    });
  }

  // ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────

  toast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toastEl = document.createElement("div");
    toastEl.className = `toast-message flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border transition-all duration-300 transform translate-y-2 opacity-0 z-50`;
    
    let icon = "✨";
    let bg = "bg-white border-gold-300 text-charcoal-800 shadow-gold-200/50";
    if (type === "success") {
      icon = "✓";
      bg = "bg-emerald-50 border-emerald-300 text-emerald-800";
    } else if (type === "error") {
      icon = "✕";
      bg = "bg-rose-50 border-rose-300 text-rose-800";
    }

    toastEl.className += ` ${bg}`;
    toastEl.innerHTML = `
      <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs bg-black/5 border border-current flex-shrink-0">${icon}</span>
      <span class="flex-1 leading-snug">${message}</span>
    `;

    container.appendChild(toastEl);
    requestAnimationFrame(() => {
      toastEl.classList.remove("translate-y-2", "opacity-0");
    });

    setTimeout(() => {
      toastEl.classList.add("opacity-0", "-translate-y-2");
      setTimeout(() => toastEl.remove(), 350);
    }, 3200);
  }
}

export const store = new Store();
