// Client-side Web Push helpers: SW registration, subscribe, unsubscribe

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPushPermissionState(): PushPermissionState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PushPermissionState;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'no-vapid-key' | 'permission-denied' | 'sw-failed' | 'subscribe-failed' | 'server-failed'; message?: string };

export async function subscribeToPush(): Promise<SubscribeResult> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
    return { ok: false, reason: 'no-vapid-key' };
  }

  // IMPORTANT: call requestPermission FIRST, synchronously from the user
  // gesture. Awaiting other things first (e.g. SW registration) can consume
  // the user-activation token in some browsers (Safari especially) and
  // cause the prompt to silently never appear.
  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch (err) {
    console.error('Notification.requestPermission threw:', err);
    return { ok: false, reason: 'permission-denied', message: String(err) };
  }
  if (permission !== 'granted') {
    return { ok: false, reason: 'permission-denied' };
  }

  try {
    const registration = await registerServiceWorker();
    if (!registration) return { ok: false, reason: 'sw-failed' };

    // Reuse existing subscription if any
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      } catch (err) {
        console.error('pushManager.subscribe failed:', err);
        return { ok: false, reason: 'subscribe-failed', message: String(err) };
      }
    }

    const sub = subscription.toJSON();
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        p256dh: sub.keys?.p256dh,
        auth: sub.keys?.auth,
      }),
    });

    if (!response.ok) {
      return { ok: false, reason: 'server-failed', message: `HTTP ${response.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('Push subscription failed:', err);
    return { ok: false, reason: 'subscribe-failed', message: String(err) };
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return true;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const response = await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });

    return response.ok;
  } catch (err) {
    console.error('Push unsubscription failed:', err);
    return false;
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return null;
    return registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}
