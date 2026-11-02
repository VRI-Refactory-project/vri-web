import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMySessions } from './mySessions';

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

  it('accepts a paged answer', async () => {
    vi.mocked(api).mockResolvedValue({
      results: [{ id: 9, status: 'ASSIGNED', created_at: '2026-10-01T10:00:00Z' }],
    });
    expect(await getMySessions()).toHaveLength(1);
  });
});
