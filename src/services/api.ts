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

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  // For FormData the browser must set Content-Type itself (it adds the multipart boundary).
  const isFormData = init.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorMessage(body) ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
