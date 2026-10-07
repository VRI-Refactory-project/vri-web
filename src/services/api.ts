const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** DRF returns `{detail}` or field errors like `{document: ["..."]}`; show the first message. */
function errorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;
  for (const value of Object.values(record)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === 'string') return first;
  }
  return undefined;
}

let refreshHandler: (() => Promise<string | null>) | null = null;

/**
 * Registers how to get a new access token when the current one has expired (401).
 * It returns the new token, or null when the session can no longer be renewed.
 */
export const setRefreshHandler = (handler: (() => Promise<string | null>) | null) => {
  refreshHandler = handler;
};

// If several requests fail at once, they share one refresh instead of each starting their own.
let refreshing: Promise<string | null> | null = null;
const refreshOnce = () => {
  refreshing ??= (refreshHandler?.() ?? Promise.resolve(null)).finally(() => {
    refreshing = null;
  });
  return refreshing;
};

const NO_REFRESH = ['/api/v1/auth/login/', '/api/v1/auth/token/refresh/'];

function send(path: string, init: RequestInit) {
  // For FormData the browser must set Content-Type itself (it adds the multipart boundary).
  const isFormData = init.body instanceof FormData;
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init.headers,
    },
  });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await send(path, init);
  // An expired access token: renew it once and repeat the request. Login and the refresh call
  // itself are excluded so a wrong password or a dead refresh token cannot loop.
  if (res.status === 401 && authToken && refreshHandler && !NO_REFRESH.includes(path)) {
    const renewed = await refreshOnce();
    if (renewed) {
      authToken = renewed;
      res = await send(path, init);
    }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorMessage(body) ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
