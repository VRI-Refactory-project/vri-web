import { api } from './api';

const KEY_PATH = '/api/v1/notifications/web-push/key/';
const SUBSCRIPTION_PATH = '/api/v1/notifications/web-push/';

/** The person said no to the browser's "Allow notifications?" question, or blocked the site earlier. */
export class WebPushBlocked extends Error {}

/** True when this browser can show notifications while the site is closed. */
export const webPushSupported = () =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/** The key the browser needs to subscribe. Empty when the server has browser notifications switched off. */
export async function getWebPushKey(): Promise<string> {
  const { public_key } = await api<{ public_key: string }>(KEY_PATH);
  return public_key;
}

/** The server's key is URL-safe base64 text; the browser wants it as bytes. */
function keyToBytes(key: string) {
  const padded = (key + '='.repeat((4 - (key.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

const currentSubscription = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
};

const tellServer = (subscription: PushSubscription) =>
  api<void>(SUBSCRIPTION_PATH, { method: 'POST', body: JSON.stringify(subscription.toJSON()) });

/**
 * If this browser already has notifications on, tell the server it belongs to the signed-in person.
 * A browser keeps its subscription when someone signs out, so the next person to sign in takes it over.
 * Returns whether notifications are on.
 */
export async function syncWebPush(): Promise<boolean> {
  if (Notification.permission !== 'granted') return false;
  const subscription = await currentSubscription();
  if (!subscription) return false;
  await tellServer(subscription);
  return true;
}

/** Ask the browser for permission, subscribe, and give the server the subscription. */
export async function enableWebPush(publicKey: string) {
  if ((await Notification.requestPermission()) !== 'granted') throw new WebPushBlocked();

  await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true, // the browser requires every push to show a notification
      applicationServerKey: keyToBytes(publicKey),
    }));

  await tellServer(subscription);
}

/** Tell the server to stop, then drop the subscription from this browser. */
export async function disableWebPush() {
  const subscription = await currentSubscription();
  if (!subscription) return;

  await api<void>(SUBSCRIPTION_PATH, {
    method: 'DELETE',
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}
