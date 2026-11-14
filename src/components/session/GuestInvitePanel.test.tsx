import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import type { GuestInvitation } from '../../services/guestInvitations';
import { GuestInvitePanel } from './GuestInvitePanel';

vi.mock('../../services/guestInvitations', () => ({
  listInvitations: vi.fn(),
  createInvitation: vi.fn(),
  removeInvitation: vi.fn(),
}));
import {
  createInvitation,
  listInvitations,
  removeInvitation,
} from '../../services/guestInvitations';

const guest = (over: Partial<GuestInvitation> = {}): GuestInvitation => ({
  id: 1,
  email: 'guest@example.com',
  phone: '',
  created_at: '2026-11-05T10:00:00Z',
  joined_at: null,
  removed_at: null,
  ...over,
});

const openPanel = () => {
  render(<GuestInvitePanel sessionId="7" />);
  fireEvent.click(screen.getByRole('button', { name: /invite a hearing guest/i }));
};

beforeEach(() => {
  vi.mocked(listInvitations).mockReset().mockResolvedValue([]);
  vi.mocked(createInvitation).mockReset();
  vi.mocked(removeInvitation).mockReset();
});

afterEach(cleanup);

describe('GuestInvitePanel', () => {
  it('stays closed and makes no request until it is opened', () => {
    render(<GuestInvitePanel sessionId="7" />);

    expect(screen.getByRole('button', { name: /invite a hearing guest/i })).toBeTruthy();
    expect(listInvitations).not.toHaveBeenCalled();
  });

  it('shows who was invited and whether they joined', async () => {
    vi.mocked(listInvitations).mockResolvedValue([
      guest({ id: 1, email: 'joined@example.com', joined_at: '2026-11-05T10:05:00Z' }),
      guest({ id: 2, email: 'waiting@example.com' }),
    ]);

    openPanel();

    expect(await screen.findByText('Joined the session')).toBeTruthy();
    expect(screen.getByText('Invited, not joined yet')).toBeTruthy();
  });

  it('sends an invitation to the typed email and lists the guest', async () => {
    vi.mocked(createInvitation).mockResolvedValue(guest({ email: 'new@example.com' }));
    openPanel();

    fireEvent.change(screen.getByLabelText(/guest’s email/i), {
      target: { value: '  new@example.com ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    expect(await screen.findByText('new@example.com')).toBeTruthy();
    expect(createInvitation).toHaveBeenCalledWith('7', 'new@example.com');
  });

  it('shows the server’s message when the invitation is refused', async () => {
    vi.mocked(createInvitation).mockRejectedValue(
      new ApiError(409, 'You can invite someone once an interpreter has accepted.'),
    );
    openPanel();

    fireEvent.change(screen.getByLabelText(/guest’s email/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('once an interpreter has accepted');
  });

  it('removes a guest and marks them removed', async () => {
    vi.mocked(listInvitations).mockResolvedValue([guest({ email: 'guest@example.com' })]);
    vi.mocked(removeInvitation).mockResolvedValue(
      guest({ email: 'guest@example.com', removed_at: '2026-11-05T10:10:00Z' }),
    );
    openPanel();

    fireEvent.click(await screen.findByRole('button', { name: 'Remove guest@example.com' }));

    await waitFor(() => expect(screen.getByText('Removed')).toBeTruthy());
    expect(removeInvitation).toHaveBeenCalledWith('7', 1);
    expect(screen.queryByRole('button', { name: 'Remove guest@example.com' })).toBeNull();
  });
});
