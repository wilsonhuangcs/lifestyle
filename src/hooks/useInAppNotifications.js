import { useEffect, useState } from 'react';
import {
  getAll, subscribe, add, markRead, markAllRead, remove, clearAll,
} from '../lib/inAppNotifications';

export function useInAppNotifications() {
  const [items, setItems] = useState(getAll);
  useEffect(() => subscribe(setItems), []);
  const unreadCount = items.reduce((n, i) => n + (i.read ? 0 : 1), 0);
  return { items, unreadCount, add, markRead, markAllRead, remove, clearAll };
}
