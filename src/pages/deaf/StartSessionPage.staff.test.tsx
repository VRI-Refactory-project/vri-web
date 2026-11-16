import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../services/api';
import {
  createSessionRequest,
  getOpenSessionRequest,
  type SessionRequest,
} from '../../services/sessionRequests';
import { StartSessionPage } from './StartSessionPage';

// V2-013: institution staff start a session for a Deaf client who is with them.

vi.mock('../../services/sessionRequests', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/sessionRequests')>()),
  createSessionRequest: vi.fn(),
  getSessionRequest: vi.fn(),
  cancelSessionRequest: vi.fn(),
  getOpenSessionRequest: vi.fn(),
}));

const request = (state: SessionRequest['state']): SessionRequest => ({
  id: '21',
  state,
  createdAt: new Date().toISOString(),
});

function renderPage(path = '/dashboard/staff/start-session') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <StartSessionPage pollMs={60_000} />
    </MemoryRouter>,
  );
}

describe('StartSessionPage for institution staff', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getOpenSessionRequest).mockResolvedValue(null);
  });

  it('speaks to the staff member about their client', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Start an interpreter session' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/the Deaf client who is with you now/)).toBeInTheDocument();
    expect(await screen.findByRole('radio', { name: 'General' })).toBeChecked();
  });

  it('sends the chosen kind of session', async () => {
    const user = userEvent.setup();
    vi.mocked(createSessionRequest).mockResolvedValue(request('QUEUED'));
    renderPage();

    await user.click(screen.getByRole('radio', { name: 'Medical' }));
    await user.click(screen.getByRole('button', { name: /connect now/i }));

    expect(createSessionRequest).toHaveBeenCalledWith(undefined, 'MEDICAL');
    expect(await screen.findByText('Looking for an interpreter…')).toBeInTheDocument();
  });

  it('comes back to a request that is still open', async () => {
    vi.mocked(getOpenSessionRequest).mockResolvedValue(request('OFFERED'));
    renderPage();

    expect(await screen.findByText('Looking for an interpreter…')).toBeInTheDocument();
    expect(createSessionRequest).not.toHaveBeenCalled();
  });

  it('shows the open request instead of an error when one already exists', async () => {
    const user = userEvent.setup();
    vi.mocked(createSessionRequest).mockRejectedValue(
      new ApiError(409, 'You already have an open request.', { code: 'open_request_exists' }),
    );
    renderPage();
    await screen.findByRole('radio', { name: 'General' });
    vi.mocked(getOpenSessionRequest).mockResolvedValue(request('QUEUED'));

    await user.click(screen.getByRole('button', { name: /connect now/i }));

    expect(await screen.findByText('Looking for an interpreter…')).toBeInTheDocument();
    expect(screen.queryByText('You already have an open request.')).not.toBeInTheDocument();
  });

  it('leaves Deaf users as they were: no choice of session and no resuming', () => {
    renderPage('/dashboard/deaf/start-session');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Start a VRI session' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(getOpenSessionRequest).not.toHaveBeenCalled();
  });
});
