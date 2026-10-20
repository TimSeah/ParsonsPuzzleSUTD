// The educator key lives in sessionStorage: it is sent only to our API, and
// it is forgotten when the browser tab closes.
const STORAGE_KEY = 'educator_key';

export function getEducatorKey() {
  try { return sessionStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

export function setEducatorKey(key) {
  try { sessionStorage.setItem(STORAGE_KEY, key); } catch { /* storage disabled: stay signed out */ }
}

export function clearEducatorKey() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
}
