import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function arrayBufferToBase64(buf) {
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

const isSupported = typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window;

export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(() =>
    isSupported ? Notification.permission : 'unsupported'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Detect current subscription state on mount.
  useEffect(() => {
    if (!isSupported || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        setIsSubscribed(!!sub);
      } catch (e) {
        console.error('[usePushNotifications] init failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser.');
      return false;
    }
    if (!VAPID_PUBLIC_KEY) {
      setError('VAPID public key is missing. Check VITE_VAPID_PUBLIC_KEY in .env.');
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setError('Notification permission denied.');
        setBusy(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON();
      const p256dh = json.keys?.p256dh || arrayBufferToBase64(sub.getKey('p256dh'));
      const authKey = json.keys?.auth || arrayBufferToBase64(sub.getKey('auth'));

      const { error: upsertError } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint: sub.endpoint,
            p256dh,
            auth: authKey,
            user_agent: navigator.userAgent,
          },
          { onConflict: 'endpoint' }
        );

      if (upsertError) {
        console.error('[usePushNotifications] upsert failed:', upsertError);
        setError('Could not save subscription. Try again.');
        setBusy(false);
        return false;
      }

      setIsSubscribed(true);
      setBusy(false);
      return true;
    } catch (e) {
      console.error('[usePushNotifications] subscribe failed:', e);
      setError(e.message || 'Subscription failed.');
      setBusy(false);
      return false;
    }
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint)
          .eq('user_id', userId);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      setBusy(false);
      return true;
    } catch (e) {
      console.error('[usePushNotifications] unsubscribe failed:', e);
      setError(e.message || 'Unsubscribe failed.');
      setBusy(false);
      return false;
    }
  }, [userId]);

  return {
    supported: isSupported,
    permission,
    isSubscribed,
    busy,
    error,
    subscribe,
    unsubscribe,
  };
}
