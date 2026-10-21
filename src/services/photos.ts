import { api } from './api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * The API gives a photo as a path on the API server (it works in an <img> without signing in).
 * This turns it into a full address, or null when the user has no photo.
 */
export const photoSrc = (path: string | null | undefined): string | null =>
  path ? `${BASE_URL}${path}` : null;

interface PhotoResponse {
  profile_photo: string | null;
}

/** The signed-in user's photo address, or null. */
export async function getMyPhoto(): Promise<string | null> {
  const raw = await api<PhotoResponse>('/api/v1/auth/me/photo/');
  return photoSrc(raw.profile_photo);
}

/** Uploads a picture (up to 5 MB); returns its address. Throws an ApiError with a readable message. */
export async function uploadMyPhoto(file: File): Promise<string | null> {
  const form = new FormData();
  form.append('photo', file);
  const raw = await api<PhotoResponse>('/api/v1/auth/me/photo/', { method: 'POST', body: form });
  return photoSrc(raw.profile_photo);
}

export async function removeMyPhoto(): Promise<void> {
  await api('/api/v1/auth/me/photo/', { method: 'DELETE' });
}
