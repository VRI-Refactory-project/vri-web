import { api } from './api';

const KEY_PATH = '/api/v1/notifications/web-push/key/';
const SUBSCRIPTION_PATH = '/api/v1/notifications/web-push/';

/** The person said no to the browser's notification permission request. */
export class WebPushBlocked extends Error {}

/** True when this browser can show notifications while the site is closed. */
export const webPushSupported = () =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/** Retrieve the current public VAPID key from the backend. */
export async function getWebPushKey(): Promise<string> {
  const { public_key } = await api<{ public_key: string }>(KEY_PATH);
  return public_key;
}

function keyToBytes(key: string): Uint8Array<ArrayBuffer> {
  const padded = (key + '='.repeat((4 - (key.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

/** Check whether a browser subscription was created using the current VAPID key. */
function subscriptionMatchesKey(subscription: PushSubscription, publicKey: string): boolean {
  const existingKey = subscription.options.applicationServerKey;

  if (!existingKey) return false;

  const expected = keyToBytes(publicKey);
  const actual = new Uint8Array(existingKey);

  return (
    expected.length === actual.length && expected.every((byte, index) => byte === actual[index])
  );
}

const currentSubscription = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
};

const tellServer = (subscription: PushSubscription) =>
  api<void>(SUBSCRIPTION_PATH, {
    method: 'POST',
    body: JSON.stringify(subscription.toJSON()),
  });

/**
 * Reuse a subscription only when it matches the current VAPID public key.
 * Otherwise remove the old subscription and create a new one.
 */
async function getOrCreateSubscription(
  registration: ServiceWorkerRegistration,
  publicKey: string,
): Promise<PushSubscription> {
  let subscription = await registration.pushManager.getSubscription();

  if (subscription && !subscriptionMatchesKey(subscription, publicKey)) {
    await subscription.unsubscribe();
    subscription = null;
  }

  return (
    subscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyToBytes(publicKey),
    }))
  );
}

/**
 * Reconcile an existing browser subscription with the current server key.
 * Also registers the subscription for whoever is currently signed in.
 */
export async function syncWebPush(): Promise<boolean> {
  if (Notification.permission !== 'granted') return false;

  const publicKey = await getWebPushKey();
  if (!publicKey) return false;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;

  const existing = await registration.pushManager.getSubscription();
  if (!existing) return false;

  const subscription = await getOrCreateSubscription(registration, publicKey);

  await tellServer(subscription);
  return true;
}

/** Ask for permission, subscribe, and register the subscription with the backend. */
export async function enableWebPush(publicKey: string) {
  if ((await Notification.requestPermission()) !== 'granted') {
    throw new WebPushBlocked();
  }

  await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;

  const subscription = await getOrCreateSubscription(registration, publicKey);

  await tellServer(subscription);
}

/** Tell the server to stop, then remove the browser subscription. */
export async function disableWebPush() {
  const subscription = await currentSubscription();
  if (!subscription) return;

  await api<void>(SUBSCRIPTION_PATH, {
    method: 'DELETE',
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}
