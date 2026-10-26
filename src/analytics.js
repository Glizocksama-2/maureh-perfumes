// ─── MAUREH PERFUMES LUXURY ANALYTICS ENGINE ────────────────────────────────
// Zero-dependency event tracking & business metrics collector for Maureh Perfumes.
// Persists local metrics for the Admin Dashboard and forwards to Google Analytics / GTM if present.

const ANALYTICS_STORAGE_KEY = 'maureh_analytics_summary';

function getStoredSummary() {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return initSummary();
    const data = JSON.parse(raw);
    return data;
  } catch {
    return initSummary();
  }
}

function initSummary() {
  return {
    totalPageViews: 0,
    totalProductViews: 0,
    totalCartAdds: 0,
    totalCartRemoves: 0,
    totalCheckoutsStarted: 0,
    totalWhatsAppOrders: 0,
    totalMpesaOrders: 0,
    totalQuizCompletions: 0,
    totalRevenueKES: 0,
    firstTrackedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    recentEvents: []
  };
}

function saveSummary(data) {
  try {
    data.lastActiveAt = new Date().toISOString();
    // Cap recent events array to last 50
    if (data.recentEvents.length > 50) {
      data.recentEvents = data.recentEvents.slice(0, 50);
    }
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not persist analytics to localStorage', err);
  }
}

export const analytics = {
  track(eventName, payload = {}) {
    const timestamp = new Date().toISOString();
    const eventObj = {
      event: eventName,
      payload,
      timestamp
    };

    // 1. Update persistent local summary
    const summary = getStoredSummary();
    switch (eventName) {
      case 'page_view':
        summary.totalPageViews = (summary.totalPageViews || 0) + 1;
        break;
      case 'product_view':
      case 'quickview_open':
        summary.totalProductViews = (summary.totalProductViews || 0) + 1;
        break;
      case 'add_to_cart':
        summary.totalCartAdds = (summary.totalCartAdds || 0) + 1;
        break;
      case 'remove_from_cart':
        summary.totalCartRemoves = (summary.totalCartRemoves || 0) + 1;
        break;
      case 'begin_checkout':
        summary.totalCheckoutsStarted = (summary.totalCheckoutsStarted || 0) + 1;
        break;
      case 'checkout_whatsapp':
        summary.totalWhatsAppOrders = (summary.totalWhatsAppOrders || 0) + 1;
        if (payload?.totalKES) {
          summary.totalRevenueKES = (summary.totalRevenueKES || 0) + Number(payload.totalKES);
        }
        break;
      case 'checkout_mpesa':
        summary.totalMpesaOrders = (summary.totalMpesaOrders || 0) + 1;
        if (payload?.totalKES) {
          summary.totalRevenueKES = (summary.totalRevenueKES || 0) + Number(payload.totalKES);
        }
        break;
      case 'quiz_complete':
        summary.totalQuizCompletions = (summary.totalQuizCompletions || 0) + 1;
        break;
      default:
        break;
    }

    summary.recentEvents.unshift(eventObj);
    saveSummary(summary);

    // 2. Dispatch custom event for extensible listeners
    try {
      window.dispatchEvent(new CustomEvent('maureh:analytics', { detail: eventObj }));
    } catch {}

    // 3. Forward to Google Analytics (gtag.js) if loaded on window
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }

    // 4. Forward to Google Tag Manager (dataLayer) if present
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: `maureh_${eventName}`,
        ...payload,
        event_time: timestamp
      });
    }

    // Development / debugging visibility
    if (import.meta.env?.DEV) {
      console.debug(`[Analytics] 📊 ${eventName}`, payload);
    }
  },

  getSummary() {
    return getStoredSummary();
  },

  clearSummary() {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    return initSummary();
  }
};
