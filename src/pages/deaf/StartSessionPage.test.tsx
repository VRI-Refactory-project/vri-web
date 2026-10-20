import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../services/api';
import {
  cancelSessionRequest,
  createSessionRequest,
  getSessionRequest,
  type SessionRequest,
} from '../../services/sessionRequests';
import { StartSessionPage } from './StartSessionPage';

vi.mock('../../services/sessionRequests', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/sessionRequests')>()),
  createSessionRequest: vi.fn(),
  getSessionRequest: vi.fn(),
  cancelSessionRequest: vi.fn(),
}));

const request = (state: SessionRequest['state'], extra: Partial<SessionRequest> = {}) => ({
  id: '12',
  state,
  createdAt: '2026-10-20T08:00:00Z',
  ...extra,
});

function renderPage() {
  return render(
    <MemoryRouter>
      <StartSessionPage pollMs={10} />
    </MemoryRouter>,
  );
}

describe('StartSessionPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('offers to connect and does not ask for anything yet', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Start a VRI session' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect now' })).toBeEnabled();
    expect(createSessionRequest).not.toHaveBeenCalled();
  });

  it('asks for an interpreter and moves to the waiting screen', async () => {
    vi.mocked(createSessionRequest).mockResolvedValue(request('QUEUED'));
    vi.mocked(getSessionRequest).mockResolvedValue(request('QUEUED'));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Connect now' }));

    expect(
      await screen.findByRole('heading', { name: 'Finding an interpreter' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Looking for an interpreter');
    expect(screen.getByText('Request sent')).toBeInTheDocument();
    expect(screen.getByText('Interpreter found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel request' })).toBeEnabled();
  });

  it('shows how long the request has been waiting', async () => {
    const sent = new Date(Date.now() - 65_000).toISOString();
    vi.mocked(createSessionRequest).mockResolvedValue(request('OFFERED', { createdAt: sent }));
    vi.mocked(getSessionRequest).mockResolvedValue(request('OFFERED', { createdAt: sent }));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Connect now' }));

    expect(await screen.findByText(/Waiting 1:0\d/)).toBeInTheDocument();
  });

  it('goes back to the start when the request is cancelled', async () => {
    vi.mocked(createSessionRequest).mockResolvedValue(request('QUEUED'));
    vi.mocked(getSessionRequest).mockResolvedValue(request('QUEUED'));
    vi.mocked(cancelSessionRequest).mockResolvedValue(request('CANCELLED'));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Connect now' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel request' }));

    expect(cancelSessionRequest).toHaveBeenCalledWith('12');
    expect(await screen.findByRole('button', { name: 'Connect now' })).toBeEnabled();
  });

  it('shows the interpreter once one accepts', async () => {
    vi.mocked(createSessionRequest).mockResolvedValue(request('QUEUED'));
    vi.mocked(getSessionRequest).mockResolvedValue(
      request('ACCEPTED', {
        interpreter: { name: 'Amina Okafor', languages: 'Ugandan Sign Language ⇄ English' },
      }),
    );
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Connect now' }));

    expect(await screen.findByRole('heading', { name: 'Interpreter found' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Amina Okafor' })).toBeInTheDocument();
    expect(screen.getByText('Ugandan Sign Language ⇄ English')).toBeInTheDocument();
  });

  it('shows the server message when the request cannot be made', async () => {
    vi.mocked(createSessionRequest).mockRejectedValue(
      new ApiError(409, 'You already have an open request.'),
    );
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Connect now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You already have an open request.');
    expect(screen.getByRole('button', { name: 'Connect now' })).toBeEnabled();
  });

  it('still says something when the server fails without a message', async () => {
    // For example a 404 page: there is no JSON, so the API client has no text to pass on.
    vi.mocked(createSessionRequest).mockRejectedValue(new ApiError(404, ''));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Connect now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Connect now' })).toBeEnabled();
  });

  it('says so when no interpreter could be found, and lets the person try again', async () => {
    vi.mocked(createSessionRequest).mockResolvedValue(request('QUEUED'));
    vi.mocked(getSessionRequest).mockResolvedValue(request('FAILED'));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Connect now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('could not connect you');
    expect(screen.getByRole('button', { name: 'Connect now' })).toBeEnabled();
  });
});
