import type { SessionRequest } from './sessionRequests';

// Stand-in for the backend while it is being built. Only used when
// VITE_MOCK_SESSION_REQUESTS=true. The request moves on by itself: queued, offered, then accepted.
let current: { id: string; startedAt: number; cancelled: boolean } | null = null;

function snapshot(): SessionRequest {
  if (!current) throw new Error('No mock request');
  const base = { id: current.id, createdAt: new Date(current.startedAt).toISOString() };
  if (current.cancelled) return { ...base, state: 'CANCELLED' };
  const seconds = (Date.now() - current.startedAt) / 1000;
  if (seconds < 4) return { ...base, state: 'QUEUED' };
  if (seconds < 8) return { ...base, state: 'OFFERED' };
  return {
    ...base,
    state: 'ACCEPTED',
    interpreter: { name: 'Amina Okafor', languages: 'Ugandan Sign Language ⇄ English' },
  };
}

export async function mockCreate(): Promise<SessionRequest> {
  current = { id: 'mock-1', startedAt: Date.now(), cancelled: false };
  return snapshot();
}

export async function mockGet(id: string): Promise<SessionRequest> {
  if (current?.id !== id) throw new Error('Unknown mock request');
  return snapshot();
}

export async function mockCancel(id: string): Promise<SessionRequest> {
  if (current?.id !== id) throw new Error('Unknown mock request');
  current.cancelled = true;
  return snapshot();
}
