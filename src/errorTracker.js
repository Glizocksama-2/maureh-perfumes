// ─── MAUREH PERFUMES CLIENT ERROR TRACKER ─────────────────────────────────────
// Real-time error interceptor and health diagnostics for production resilience.
// Captures uncaught errors, network failures, and unhandled promise rejections.

const ERROR_STORAGE_KEY = 'maureh_error_logs';
const MAX_LOGS = 50;

function getStoredLogs() {
  try {
    const raw = localStorage.getItem(ERROR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistLogs(logs) {
  try {
    const trimmed = logs.slice(0, MAX_LOGS);
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Could not store error log', err);
  }
}

export const errorTracker = {
  isInitialized: false,

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Uncaught runtime errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'uncaught_exception',
        message: event.message || 'Unknown runtime error',
        filename: event.filename || '',
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || null
      });
    });

    // 2. Unhandled promise rejections (async/fetch errors)
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.logError({
        type: 'unhandled_rejection',
        message: typeof reason === 'object' ? (reason?.message || JSON.stringify(reason)) : String(reason),
        stack: reason?.stack || null
      });
    });

    if (import.meta.env?.DEV) {
      console.log('🛡️ Maureh Error Tracker initialized.');
    }
  },

  logError(details) {
    const logEntry = {
      id: 'err_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      time: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...details
    };

    const logs = getStoredLogs();
    logs.unshift(logEntry);
    persistLogs(logs);

    try {
      window.dispatchEvent(new CustomEvent('maureh:error', { detail: logEntry }));
    } catch {}

    return logEntry;
  },

  getLogs() {
    return getStoredLogs();
  },

  getLastError() {
    const logs = getStoredLogs();
    return logs.length > 0 ? logs[0] : null;
  },

  clearLogs() {
    localStorage.removeItem(ERROR_STORAGE_KEY);
  }
};
