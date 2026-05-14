const STORAGE_KEY = 'inAppNotifications:v1';
const MAX_ITEMS = 50;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

let items = load();
const listeners = new Set();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

function emit() {
  for (const fn of listeners) fn(items);
}

export function getAll() {
  return items;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function add({ title, body, link, icon }) {
  const item = {
    id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()),
    title: title || 'Notification',
    body: body || '',
    link: link || null,
    icon: icon || null,
    createdAt: new Date().toISOString(),
    read: false,
  };
  items = [item, ...items].slice(0, MAX_ITEMS);
  persist();
  emit();
  return item;
}

export function markRead(id) {
  let changed = false;
  items = items.map((n) => {
    if (n.id === id && !n.read) { changed = true; return { ...n, read: true }; }
    return n;
  });
  if (changed) { persist(); emit(); }
}

export function markAllRead() {
  let changed = false;
  items = items.map((n) => {
    if (!n.read) { changed = true; return { ...n, read: true }; }
    return n;
  });
  if (changed) { persist(); emit(); }
}

export function remove(id) {
  const before = items.length;
  items = items.filter((n) => n.id !== id);
  if (items.length !== before) { persist(); emit(); }
}

export function clearAll() {
  if (items.length === 0) return;
  items = [];
  persist();
  emit();
}
