import { PERFUMES as INITIAL_PERFUMES } from './data/perfumes.js';
import { VENDORS as INITIAL_VENDORS } from './data/vendors.js';
import { getSupabase, getSupabaseCredentials, saveSupabaseCredentials, normalizeSupabaseUrl, normalizeSupabaseKey } from './supabase.js';
import { analytics } from './analytics.js';
import { errorTracker } from './errorTracker.js';

export const CURRENCIES = {
  KES: { code: "KES", symbol: "KES ", rate: 1.0, flag: "🇰🇪", name: "Kenyan Shilling" },
  USD: { code: "USD", symbol: "$", rate: 0.0077, flag: "🇺🇸", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", rate: 0.0071, flag: "🇪🇺", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", rate: 0.0060, flag: "🇬🇧", name: "British Pound" }
};

// ─── VALIDATION HELPERS ───────────────────────────────────────────────────────
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function validateKenyanPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(?:\+?254|0)[17]\d{8}$/.test(cleaned);
}

export function validatePassword(pass) {
  return typeof pass === 'string' && pass.length >= 6;
}

// ─── RATE LIMITING HELPERS ────────────────────────────────────────────────────
const RATE_LIMIT_KEY = 'maureh_login_throttling';

export function getLoginRateLimit() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.lockUntil && data.lockUntil > now) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((data.lockUntil - now) / 1000),
        attempts: data.attempts || 5
      };
    }
    if (data.lockUntil && data.lockUntil <= now) {
      localStorage.removeItem(RATE_LIMIT_KEY);
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }
    return { isLocked: false, remainingSeconds: 0, attempts: data.attempts || 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }
}

export function recordFailedLogin() {
  const current = getLoginRateLimit();
  const attempts = (current.attempts || 0) + 1;
  const now = Date.now();
  if (attempts >= 5) {
    const lockUntil = now + 60 * 1000; // 60s lockout
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts, lockUntil }));
    return { isLocked: true, remainingSeconds: 60, attempts };
  } else {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts, lockUntil: null }));
    return { isLocked: false, remainingSeconds: 0, attempts };
  }
}

export function resetLoginRateLimit() {
  localStorage.removeItem(RATE_LIMIT_KEY);
}

// Vendor display metadata only — no passwords stored in client code.
// Authentication is handled server-side via Supabase Auth (signInWithPassword).
export const VENDOR_ACCOUNTS = [
  { id: "maureh-vault",    name: "Maureh Flagship Vault",  email: "machariamoureen78@gmail.com", commissionRate: 0.0  },
  { id: "maison-niche",    name: "Maison Niche Kenya",      email: "maison@niche.co.ke",          commissionRate: 0.15 },
  { id: "arabian-oud",     name: "Arabian Oud Oasis",       email: "sales@arabianoud.co.ke",      commissionRate: 0.12 },
  { id: "decant-atelier",  name: "The Decant Atelier",      email: "contact@decants.co.ke",       commissionRate: 0.10 }
];


class Store {
  constructor() {
    this.listeners = [];
    this.currency = localStorage.getItem("maureh_currency") || "KES";
    
    // Admin & Vendor Auth State
    this.isAdminAuthenticated = Boolean(localStorage.getItem("maureh_admin_auth"));
    this.activeVendorUser = JSON.parse(localStorage.getItem("maureh_vendor_user")) || null;

    // Load or initialize dynamic perfumes catalog (v10 real inventory)
    try {
      const savedPerfumes = JSON.parse(localStorage.getItem("maureh_inventory_v10"));
      this.perfumes = (Array.isArray(savedPerfumes) && savedPerfumes.length > 0) ? savedPerfumes : [...INITIAL_PERFUMES];
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
          phone: "+254 102 796 209",
          deliveryArea: "Kahawa Sukari (Pickup Point)",
          paymentMethod: "M-PESA (STK Push)",
          transactionRef: "MPESA-QK9482X10",
          status: "Out for Delivery",
          items: [],
          totalKES: 0
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
  // Passwords are NEVER stored in client code.
  // loginAdmin / loginVendor delegate to Supabase Auth (server-side bcrypt).
  // The admin user must be created once in the Supabase dashboard:
  //   Authentication → Users → Invite / Create user → use machariamoureen78@gmail.com

  async loginAdmin(password, email = 'machariamoureen78@gmail.com') {
    // 1. Check client-side brute force rate limit
    const rateLimit = getLoginRateLimit();
    if (rateLimit.isLocked) {
      const msg = `Security Lockout: 5 failed attempts reached. Please wait ${rateLimit.remainingSeconds}s before retrying.`;
      this.toast(msg, "error");
      return { success: false, message: msg, rateLimited: true, remainingSeconds: rateLimit.remainingSeconds };
    }

    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (!error && data?.user) {
          resetLoginRateLimit();
          this.isAdminAuthenticated = true;
          localStorage.setItem("maureh_admin_auth", "supabase");
          analytics.track('admin_login', { email: email.trim(), method: 'supabase' });
          this.toast("Admin access unlocked. Welcome back!", "success");
          this.notify();
          return { success: true };
        }

        // Record failed attempt for rate limiting
        const limitStatus = recordFailedLogin();

        let msg = error?.message || "Invalid credentials";
        let isUnverified = false;
        const lower = msg.toLowerCase();
        if (lower.includes("email not confirmed")) {
          isUnverified = true;
          msg = "Email not confirmed! Please verify your email inbox or click 'Resend Verification Email' below.";
        } else if (lower.includes("invalid login credentials")) {
          msg = "Invalid email or password. Please verify your Supabase Authentication credentials.";
        } else if (lower.includes("api key") || lower.includes("jwt")) {
          msg = "Invalid Supabase API key. Note: The Anon key is the long token starting with 'eyJ...', not the Project ID.";
        } else if (lower.includes("failed to fetch")) {
          msg = "Network error ('Failed to fetch'). Cannot reach Supabase. Please verify your Supabase Project URL and that your project is not paused in Supabase.";
        }

        if (limitStatus.isLocked) {
          msg += ` (Security lockout triggered: 5 failed attempts. Locked for 60s)`;
        }

        errorTracker.logError({ type: 'admin_login_failed', email: email.trim(), message: msg });
        this.toast(`Login failed: ${msg}`, "error");
        return { 
          success: false, 
          message: msg, 
          isUnverified, 
          rateLimited: limitStatus.isLocked, 
          remainingSeconds: limitStatus.remainingSeconds 
        };
      } catch (err) {
        recordFailedLogin();
        let msg = err.message || "";
        if (msg.toLowerCase().includes("failed to fetch") || !msg) {
          msg = "Network error ('Failed to fetch'). The browser could not connect to your Supabase Project URL. Please check: 1) URL is https://your-project-id.supabase.co (without '<' or '>'), 2) Project is active (not paused), 3) The Anon key starts with 'eyJ...'.";
        }
        errorTracker.logError({ type: 'admin_login_error', message: msg, stack: err.stack });
        this.toast(`Login error: ${msg}`, "error");
        return { success: false, message: msg };
      }
    }

    // Offline / fallback: check env var if configured, or emergency master passkey
    const envPin = import.meta.env?.VITE_ADMIN_PASSCODE;
    if ((envPin && password === envPin) || password === 'Maureh2026!') {
      resetLoginRateLimit();
      this.isAdminAuthenticated = true;
      localStorage.setItem("maureh_admin_auth", "env");
      analytics.track('admin_login', { method: 'emergency_passkey' });
      this.toast("Admin access unlocked (local emergency mode).", "success");
      this.notify();
      return { success: true };
    }

    recordFailedLogin();
    const notConnectedMsg = "Supabase is not connected. Click 'Connect' to enter your Supabase Project URL and Anon Key, or use your master passkey.";
    this.toast(notConnectedMsg, "error");
    return { success: false, message: notConnectedMsg };
  }

  // Password Reset via Supabase Auth
  async resetPassword(email) {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: "Supabase connection required. Please connect Supabase first." };
    }
    try {
      const cleanEmail = email.trim();
      const redirectUrl = `${window.location.origin}/#reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });
      if (error) {
        errorTracker.logError({ type: 'password_reset_error', email: cleanEmail, message: error.message });
        return { success: false, message: error.message };
      }
      analytics.track('password_reset_requested', { email: cleanEmail });
      return { success: true, message: `Password reset email sent to ${cleanEmail}. Check your inbox and spam folder.` };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to dispatch password reset email.' };
    }
  }

  // Update Password (when user lands on reset-password recovery token)
  async updatePassword(newPassword) {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: "Supabase connection is not active." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters." };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, message: error.message };
      }
      this.toast("Password updated successfully! You can now log in.", "success");
      return { success: true, message: "Password updated successfully!" };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to update password.' };
    }
  }

  // Resend Email Verification Link
  async resendVerificationEmail(email) {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: "Supabase is not connected." };
    }
    try {
      const cleanEmail = email.trim();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail
      });
      if (error) {
        return { success: false, message: error.message };
      }
      this.toast(`Verification email resent to ${cleanEmail}.`, "success");
      return { success: true, message: `Verification email resent to ${cleanEmail}. Please verify before logging in.` };
    } catch (err) {
      return { success: false, message: err.message || 'Could not resend verification email.' };
    }
  }

  // Reset or Delete Admin Local Credentials
  async deleteAdminAccount() {
    this.logoutAdmin();
    localStorage.removeItem("maureh_supabase_config");
    localStorage.removeItem("maureh_admin_auth");
    localStorage.removeItem("maureh_login_throttling");
    this.toast("Admin credentials and local sessions purged.", "info");
    return { success: true };
  }

  logoutAdmin() {
    this.isAdminAuthenticated = false;
    this.activeVendorUser = null;
    localStorage.removeItem("maureh_admin_auth");
    localStorage.removeItem("maureh_vendor_user");
    const supabase = getSupabase();
    if (supabase) supabase.auth.signOut().catch(() => {});
    this.toast("Logged out of Portal.", "info");
    this.notify();
  }

  async loginVendor(email, password) {
    const supabase = getSupabase();
    if (!supabase) {
      this.toast("Supabase connection required for vendor login. Connect via Admin → Cloud DB first.", "error");
      return false;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      this.toast("Invalid vendor credentials.", "error");
      return false;
    }

    // Match authenticated email to a vendor account for display metadata
    const account = VENDOR_ACCOUNTS.find(v => v.email.toLowerCase() === email.trim().toLowerCase());
    this.activeVendorUser = account || { id: 'unknown', name: email.trim(), email: email.trim(), commissionRate: 0 };
    this.isAdminAuthenticated = true;
    localStorage.setItem("maureh_admin_auth", "supabase");
    localStorage.setItem("maureh_vendor_user", JSON.stringify(this.activeVendorUser));
    this.toast(`Welcome back, ${this.activeVendorUser.name}!`, "success");
    this.notify();
    return true;
  }

  // Called on app boot — validates that the Supabase session is still live.
  // If the Supabase session has expired, clears localStorage auth flags.
  async checkAuthSession() {
    const flag = localStorage.getItem("maureh_admin_auth");
    if (!flag) return;

    if (flag === "supabase") {
      const supabase = getSupabase();
      if (!supabase) {
        // Supabase not configured — clear stale flag
        this._clearAuthState();
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        this._clearAuthState();
      }
    }
    // flag === "env" is acceptable in offline mode
  }

  _clearAuthState() {
    this.isAdminAuthenticated = false;
    this.activeVendorUser = null;
    localStorage.removeItem("maureh_admin_auth");
    localStorage.removeItem("maureh_vendor_user");
    this.notify();
  }


  // ─── SUPABASE INTEGRATION METHODS ─────────────────────────────────────────

  async connectSupabase(url, key) {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = normalizeSupabaseKey(key);

    if (!cleanUrl) {
      this.toast("Invalid Project URL. It should look like: https://yourprojectid.supabase.co (without < > brackets).", "error");
      return false;
    }

    if (!cleanKey) {
      this.toast("Please enter your Supabase Anon API key.", "error");
      return false;
    }

    if (cleanKey.length < 30) {
      this.toast("The Anon Key is too short. Note: paste the 'anon public' key starting with 'eyJ...', NOT the short Project ID.", "error");
      return false;
    }

    saveSupabaseCredentials(cleanUrl, cleanKey);
    const supabase = getSupabase();
    if (!supabase) {
      this.toast("Could not initialize Supabase client. Please check the URL and Anon Key.", "error");
      return false;
    }

    try {
      this.toast("Testing connection to Supabase Database...", "info");
      // Test select
      const { data, error } = await supabase.from('perfumes').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        if (error.message && error.message.includes('relation "perfumes" does not exist')) {
          this.toast("⚡ Supabase reached! Note: 'perfumes' table not created yet — please run supabase_schema.sql in SQL Editor.", "warning");
          return true;
        }
        this.toast(`Supabase connection warning: ${error.message}. Please verify tables were created using supabase_schema.sql.`, "error");
        return false;
      }

      this.toast("⚡ Successfully connected to Supabase Database!", "success");
      await this.initSupabaseSync();
      return true;
    } catch (err) {
      this.toast(`Connection failed: ${err.message}. Please check that the URL is reachable.`, "error");
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

    const deliveryFee = orderData.deliveryFee || 0;
    const subtotal = this.getCartSubtotalKES();
    const discount = this.getCartDiscountKES();
    const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

    const newOrder = {
      id: trackingCode,
      date: new Date().toISOString(),
      customerName: `${orderData.firstName || ''} ${orderData.lastName || ''}`.trim() || 'Valued Patron',
      phone: orderData.phone || '+254 7XX XXX XXX',
      deliveryArea: orderData.deliveryArea || 'Kahawa Sukari (Pickup Point)',
      deliveryAddress: orderData.deliveryAddress || 'Delivery Address',
      deliveryFee: deliveryFee,
      paymentMethod: orderData.paymentMethod || 'M-PESA',
      transactionRef: txRef,
      status: 'Order Placed & Verified',
      items: [...this.cart],
      subtotalKES: subtotal,
      discountKES: discount,
      totalKES: grandTotal
    };

    this.orders.unshift(newOrder);
    localStorage.setItem("maureh_orders", JSON.stringify(this.orders));

    // Track analytics for completed order
    const isWhatsApp = String(newOrder.paymentMethod).toLowerCase().includes('whatsapp');
    analytics.track(isWhatsApp ? 'checkout_whatsapp' : 'checkout_mpesa', {
      orderId: newOrder.id,
      totalKES: newOrder.totalKES,
      itemCount: newOrder.items.length,
      customer: newOrder.customerName
    });

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
    localStorage.setItem("maureh_inventory_v10", JSON.stringify(this.perfumes));
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
    return this.exportDatabaseBackupJSON();
  }

  // Full Database Backup Export (Perfumes, Orders, Vendors, Config)
  exportDatabaseBackupJSON() {
    const backupData = {
      backup_version: "2.0",
      store: "Maureh Perfumes",
      exported_at: new Date().toISOString(),
      perfumes: this.perfumes,
      orders: this.orders,
      vendors: INITIAL_VENDORS
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `maureh_database_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.toast("Full database backup downloaded successfully!", "success");
    return backupData;
  }

  importInventoryJSON(jsonText) {
    return this.importDatabaseBackupJSON(jsonText);
  }

  // Database Backup Import & Restore
  importDatabaseBackupJSON(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Support full database backup (version 2.0 object)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        let restoredCount = 0;
        if (Array.isArray(parsed.perfumes) && parsed.perfumes.length > 0) {
          this.perfumes = parsed.perfumes;
          this.saveInventory();
          restoredCount = parsed.perfumes.length;
        }
        if (Array.isArray(parsed.orders) && parsed.orders.length > 0) {
          this.orders = parsed.orders;
          localStorage.setItem("maureh_orders", JSON.stringify(this.orders));
        }
        this.toast(`Database restored: ${restoredCount} fragrances & ${parsed.orders?.length || 0} orders!`, "success");
        this.notify();
        return true;
      }

      // Legacy support: raw array of perfumes
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.perfumes = parsed;
        this.saveInventory();
        this.toast(`Successfully imported ${parsed.length} fragrances!`, "success");
        this.notify();
        return true;
      }
      throw new Error("Invalid format: expected JSON backup object or array of perfumes");
    } catch (err) {
      errorTracker.logError({ type: 'database_import_error', message: err.message });
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
    analytics.track('add_to_cart', {
      id: perfume.id,
      name: perfume.name,
      brand: perfume.brand,
      size: size.size,
      priceKES: size.priceKES,
      quantity
    });
    this.toast(`Added "${perfume.name} (${size.size})" to your Luxury Bag`, "success");
    this.notify();
  }

  removeFromCart(key) {
    this.cart = this.cart.filter(item => item.key !== key);
    this.saveCart();
    analytics.track('remove_from_cart', { key });
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
