import { api } from './api';
import { photoSrc } from './photos';

/** An interpreter a Deaf user could be connected to right now. */
export interface AvailableInterpreter {
  id: number;
  name: string;
  signLanguages: string[];
  specialisation: string;
  photoUrl: string | null;
}

/** GET /api/v1/dashboard/deaf/available-interpreters/ (apps/dashboards: AvailableInterpretersView). */
interface ApiInterpreter {
  id: number;
  name: string;
  sign_languages: string[];
  specialisation: string;
  photo_url: string | null;
}

export async function getAvailableInterpreters(): Promise<AvailableInterpreter[]> {
  const raw = await api<ApiInterpreter[]>('/api/v1/dashboard/deaf/available-interpreters/');
  return raw.map((o) => ({
    id: o.id,
    name: o.name,
    signLanguages: o.sign_languages,
    specialisation: o.specialisation,
    photoUrl: photoSrc(o.photo_url),
  }));
}

/** One interpreter's public profile; the Deaf dashboard opens it from "View profile". */
export interface InterpreterPublicProfile extends AvailableInterpreter {
  availableNow: boolean;
}

export async function getInterpreterProfile(id: number): Promise<InterpreterPublicProfile> {
  const o = await api<ApiInterpreter & { available_now: boolean }>(
    `/api/v1/dashboard/deaf/interpreters/${id}/`,
  );
  return {
    id: o.id,
    name: o.name,
    signLanguages: o.sign_languages,
    specialisation: o.specialisation,
    photoUrl: photoSrc(o.photo_url),
    availableNow: o.available_now,
  };
}
