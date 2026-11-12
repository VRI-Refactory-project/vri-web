import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMySession, getMySessions } from './mySessions';

vi.mock('./api', () => ({ api: vi.fn() }));
import { api } from './api';

beforeEach(() => vi.mocked(api).mockReset());

describe('getMySessions', () => {
  it('maps the API statuses to the words shown in the history', async () => {
    vi.mocked(api).mockResolvedValue([
      {
        id: 1,
        status: 'ASSIGNED',
        created_at: '2026-10-01T10:00:00Z',
        interpreter: { name: 'Amina' },
      },
      { id: 2, status: 'PENDING', created_at: '2026-10-02T10:00:00Z', interpreter: null },
      { id: 3, status: 'CANCELLED', created_at: '2026-10-03T10:00:00Z' },
      { id: 4, status: 'FAILED', priority: 'EMERGENCY', created_at: '2026-10-04T10:00:00Z' },
    ]);
    const items = await getMySessions();
    expect(items.map((i) => i.status)).toEqual(['matched', 'waiting', 'cancelled', 'missed']);
    expect(items[0].interpreterName).toBe('Amina');
    expect(items[1].interpreterName).toBeNull();
    expect(items[3].emergency).toBe(true);
  });

  it('shows finished and in-progress sessions as such, not as waiting', async () => {
    vi.mocked(api).mockResolvedValue([
      { id: 1, status: 'COMPLETED', created_at: '2026-10-01T10:00:00Z' },
      { id: 2, status: 'ACTIVE', created_at: '2026-10-02T10:00:00Z' },
      { id: 3, status: 'CONNECTING', created_at: '2026-10-03T10:00:00Z' },
    ]);
    const items = await getMySessions();
    expect(items.map((i) => i.status)).toEqual(['completed', 'matched', 'matched']);
  });

  it('reads one request in full for the details screen', async () => {
    vi.mocked(api).mockResolvedValue({
      id: 5,
      status: 'ASSIGNED',
      priority: 'EMERGENCY',
      created_at: '2026-10-01T10:00:00Z',
      assigned_at: '2026-10-01T10:02:00Z',
      specialisation_required: 'MEDICAL',
      description: 'Clinic visit',
      interpreter: { name: 'Amina Okafor', languages: 'Ugandan Sign Language' },
    });
    expect(await getMySession('5')).toEqual({
      id: '5',
      status: 'matched',
      interpreterName: 'Amina Okafor',
      emergency: true,
      createdAt: '2026-10-01T10:00:00Z',
      languages: 'Ugandan Sign Language',
      specialisation: 'MEDICAL',
      description: 'Clinic visit',
      matchedAt: '2026-10-01T10:02:00Z',
    });
    expect(api).toHaveBeenCalledWith('/api/v1/requests/5/');
  });

  it('accepts a paged answer', async () => {
    vi.mocked(api).mockResolvedValue({
      results: [{ id: 9, status: 'ASSIGNED', created_at: '2026-10-01T10:00:00Z' }],
    });
    expect(await getMySessions()).toHaveLength(1);
  });
});
