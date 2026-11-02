const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const TIMEOUT_MS = 5000;

export async function checkBackendConnection(): Promise<boolean> {
  if (!navigator.onLine) return false;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health/?_=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}
