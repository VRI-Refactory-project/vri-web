import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import { getMySession, type SessionDetail } from '../../services/mySessions';
import { cancelSessionRequest } from '../../services/sessionRequests';
import { SessionDetailsPage } from './SessionDetailsPage';

// V2-013: staff can cancel a request that is still waiting from its details page.

vi.mock('../../services/mySessions', () => ({ getMySession: vi.fn() }));
vi.mock('../../services/sessionRequests', () => ({ cancelSessionRequest: vi.fn() }));

const session = (status: SessionDetail['status']): SessionDetail => ({
  id: '7',
  status,
  interpreterName: null,
  emergency: false,
  createdAt: '2026-11-16T10:00:00',
  languages: '',
  specialisation: 'MEDICAL',
  description: '',
  matchedAt: null,
});

const show = (allowCancel = true) =>
  render(
    <MemoryRouter initialEntries={['/sessions/7']}>
      <Routes>
        <Route
          path="/sessions/:id"
          element={
            <SessionDetailsPage backTo="/dashboard/staff/sessions" allowCancel={allowCancel} />
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('SessionDetailsPage: cancelling a waiting request', () => {
  beforeEach(() => vi.resetAllMocks());

  it('cancels a request that is still waiting', async () => {
    const user = userEvent.setup();
    vi.mocked(getMySession).mockResolvedValue(session('waiting'));
    vi.mocked(cancelSessionRequest).mockResolvedValue({
      id: '7',
      state: 'CANCELLED',
      createdAt: '2026-11-16T10:00:00',
    });
    show();

    await user.click(await screen.findByRole('button', { name: 'Cancel request' }));

    expect(cancelSessionRequest).toHaveBeenCalledWith('7');
    expect(await screen.findByRole('status')).toHaveTextContent('Request cancelled.');
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).not.toBeInTheDocument();
  });

  it('shows why when it can no longer be cancelled', async () => {
    const user = userEvent.setup();
    vi.mocked(getMySession).mockResolvedValue(session('waiting'));
    vi.mocked(cancelSessionRequest).mockRejectedValue(
      new ApiError(409, 'An interpreter has already accepted this request.'),
    );
    show();

    await user.click(await screen.findByRole('button', { name: 'Cancel request' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An interpreter has already accepted this request.',
    );
    expect(screen.getByRole('button', { name: 'Cancel request' })).toBeEnabled();
  });

  it('does not offer to cancel a session that has an interpreter or has ended', async () => {
    vi.mocked(getMySession).mockResolvedValue(session('matched'));
    show();

    expect(await screen.findByText('Matched')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).not.toBeInTheDocument();
  });

  it('does not offer it where it is not switched on (Deaf users)', async () => {
    vi.mocked(getMySession).mockResolvedValue(session('waiting'));
    show(false);

    expect(await screen.findByText('Waiting')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).not.toBeInTheDocument();
  });
});
