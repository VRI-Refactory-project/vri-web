import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionHistoryPage } from './SessionHistoryPage';

vi.mock('../../services/mySessions', () => ({ getMySessions: vi.fn() }));
import { getMySessions } from '../../services/mySessions';

afterEach(cleanup);

const show = () =>
  render(
    <MemoryRouter>
      <SessionHistoryPage />
    </MemoryRouter>,
  );

describe('SessionHistoryPage', () => {
  it('lists the sessions with their status', async () => {
    vi.mocked(getMySessions).mockResolvedValue([
      {
        id: '1',
        status: 'matched',
        interpreterName: 'Amina Okafor',
        emergency: false,
        createdAt: '2026-10-01T10:00:00',
      },
      {
        id: '2',
        status: 'missed',
        interpreterName: null,
        emergency: true,
        createdAt: '2026-10-02T10:00:00',
      },
    ]);
    show();
    expect(await screen.findByText('Amina Okafor')).toBeTruthy();
    // "Matched" is also an option in the status filter, so look for the one on the row.
    expect(screen.getAllByText('Matched').some((el) => el.className.includes('sh-pill'))).toBe(
      true,
    );
    expect(screen.getByText(/Emergency/)).toBeTruthy();
  });

  it('filters by search and says when nothing matches', async () => {
    vi.mocked(getMySessions).mockResolvedValue([
      {
        id: '1',
        status: 'matched',
        interpreterName: 'Amina Okafor',
        emergency: false,
        createdAt: '2026-10-01T10:00:00',
      },
    ]);
    show();
    await screen.findByText('Amina Okafor');
    fireEvent.change(screen.getByLabelText('Search sessions'), { target: { value: 'zzz' } });
    expect(screen.getByText('No sessions match your search.')).toBeTruthy();
  });

  it('says so when there are no sessions yet', async () => {
    vi.mocked(getMySessions).mockResolvedValue([]);
    show();
    expect(await screen.findByText('You have no sessions yet.')).toBeTruthy();
  });

  it('shows an error when the list cannot be loaded', async () => {
    vi.mocked(getMySessions).mockRejectedValue(new Error('down'));
    show();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });
});
