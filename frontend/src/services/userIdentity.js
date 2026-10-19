const STORAGE_KEY = 'parsons-puzzle-anonymous-user-id';

export function getStableUserId() {
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `anon_${crypto.randomUUID()}`;
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
