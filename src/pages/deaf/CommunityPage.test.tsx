import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommunityMember, ConnectionRequest } from '../../services/community';
import { CommunityPage } from './CommunityPage';

const svc = vi.hoisted(() => ({
  getPeople: vi.fn(),
  getRequests: vi.fn(),
  getConnections: vi.fn(),
  sendRequest: vi.fn(),
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  cancelRequest: vi.fn(),
}));
vi.mock('../../services/community', () => svc);

const base = (id: number, name: string) => ({ id, name, location: 'Kampala', photoUrl: null });
const member = (id: number, name: string, relationship: CommunityMember['relationship']) => ({
  ...base(id, name),
  relationship,
});
const request = (id: number, personId: number, name: string): ConnectionRequest => ({
  id,
  person: base(personId, name),
  createdAt: '2026-11-14T10:00:00Z',
});

const people = [
  member(1, 'Nora New', 'none'),
  member(2, 'Sam Sent', 'request_sent'),
  member(3, 'Rita Received', 'request_received'),
  member(4, 'Cal Connected', 'connected'),
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <CommunityPage />
    </MemoryRouter>,
  );

const card = (name: string) => screen.getByText(name).closest('li') as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  svc.getPeople.mockResolvedValue(people);
  svc.getRequests.mockImplementation(async (direction: string) =>
    direction === 'incoming' ? [request(30, 3, 'Rita Received')] : [request(20, 2, 'Sam Sent')],
  );
  svc.getConnections.mockResolvedValue([
    { id: 40, person: base(4, 'Cal Connected'), connectedAt: '' },
  ]);
  for (const fn of [svc.sendRequest, svc.acceptRequest, svc.declineRequest, svc.cancelRequest]) {
    fn.mockResolvedValue(undefined);
  }
});
afterEach(cleanup);

describe('CommunityPage', () => {
  it('shows each person with the action that fits where you stand', async () => {
    renderPage();
    await screen.findByText('Nora New');
    const people = screen.getByRole('region', { name: 'People' });

    expect(
      within(card('Nora New')).getByRole('button', { name: /Connect with Nora New/ }),
    ).toBeEnabled();
    expect(
      within(card('Sam Sent')).getByRole('button', { name: /Cancel request to Sam Sent/ }),
    ).toBeEnabled();
    expect(within(people).getByRole('button', { name: /Accept/ })).toBeEnabled();
    expect(within(card('Cal Connected')).getByRole('link', { name: 'Message' })).toHaveAttribute(
      'href',
      '/dashboard/deaf/messages?c=40',
    );
  });

  it('asks someone to connect, then refreshes', async () => {
    renderPage();
    await screen.findByText('Nora New');

    await userEvent.click(screen.getByRole('button', { name: /Connect with Nora New/ }));

    expect(svc.sendRequest).toHaveBeenCalledWith(1);
    await waitFor(() => expect(svc.getPeople.mock.calls.length).toBeGreaterThan(1));
  });

  it('shows requests for you on their own and accepts one', async () => {
    renderPage();
    const section = await screen.findByRole('region', { name: 'Requests for you' });

    await userEvent.click(
      within(section).getByRole('button', { name: 'Accept request from Rita Received' }),
    );

    expect(svc.acceptRequest).toHaveBeenCalledWith(30);
  });

  it('declines a request', async () => {
    renderPage();
    const section = await screen.findByRole('region', { name: 'Requests for you' });

    await userEvent.click(
      within(section).getByRole('button', { name: 'Decline request from Rita Received' }),
    );

    expect(svc.declineRequest).toHaveBeenCalledWith(30);
  });

  it('takes back a request you sent', async () => {
    renderPage();
    await screen.findByText('Sam Sent');

    await userEvent.click(screen.getByRole('button', { name: /Cancel request to Sam Sent/ }));

    expect(svc.cancelRequest).toHaveBeenCalledWith(20);
  });

  it('shows a sent request as sent when it can no longer be cancelled', async () => {
    svc.getRequests.mockResolvedValue([]);
    renderPage();
    await screen.findByText('Sam Sent');

    expect(within(card('Sam Sent')).getByRole('button', { name: 'Request sent' })).toBeDisabled();
  });

  it('searches after a short pause', async () => {
    renderPage();
    await screen.findByText('Nora New');

    await userEvent.type(screen.getByLabelText('Search people'), 'nor');

    await waitFor(() => expect(svc.getPeople).toHaveBeenLastCalledWith('nor'));
  });

  it('says when nobody matches', async () => {
    svc.getPeople.mockResolvedValue([]);
    renderPage();
    await screen.findByText(/No one else has joined/);

    await userEvent.type(screen.getByLabelText('Search people'), 'zzz');

    expect(await screen.findByText('No one matches that search.')).toBeInTheDocument();
  });

  it('shows an error when something fails', async () => {
    svc.sendRequest.mockRejectedValue(new Error('offline'));
    renderPage();
    await screen.findByText('Nora New');

    await userEvent.click(screen.getByRole('button', { name: /Connect with Nora New/ }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
