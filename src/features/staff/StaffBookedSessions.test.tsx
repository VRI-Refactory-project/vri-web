import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StaffBookedSessions } from './StaffBookedSessions';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const reply = (ok: boolean, status: number, body: unknown) => ({
  ok,
  status,
  statusText: 'x',
  json: async () => body,
});

const booking = (id: number, over = {}) => ({
  id,
  date: '2026-12-01',
  time: '10:00:00',
  duration: 30,
  session_type: 'medical',
  status: 'PENDING',
  interpreter_name: null,
  can_join: false,
  no_show: '',
  ...over,
});

function respond(list: unknown[], post?: ReturnType<typeof reply>) {
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
    init?.method === 'POST' ? (post ?? reply(true, 200, {})) : reply(true, 200, list),
  );
}

function renderCard() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<StaffBookedSessions />} />
        <Route path="/live/institution/:id" element={<p>In the call</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => fetchMock.mockReset());

describe('StaffBookedSessions', () => {
  it('says so when nothing is booked', async () => {
    respond([]);
    renderCard();
    expect(await screen.findByText('No booked sessions')).toBeInTheDocument();
  });

  it('shows who is coming, or that nobody has taken it yet', async () => {
    respond([booking(1, { status: 'CONFIRMED', interpreter_name: 'Amina Okafor' }), booking(2)]);
    renderCard();
    expect(await screen.findByText('Confirmed with Amina Okafor')).toBeInTheDocument();
    expect(screen.getByText('Waiting for an interpreter')).toBeInTheDocument();
  });

  it('opens the call and goes into it when Join call is pressed', async () => {
    respond(
      [booking(3, { status: 'CONFIRMED', can_join: true })],
      reply(true, 200, { request_id: 88 }),
    );
    renderCard();
    fireEvent.click(await screen.findByRole('button', { name: 'Join call' }));

    expect(await screen.findByText('In the call')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(String(post?.[0])).toContain('/interpreters/sessions/booked/3/start/');
  });

  it('shows the server message when the call cannot be opened', async () => {
    respond(
      [booking(3, { status: 'CONFIRMED', can_join: true })],
      reply(false, 400, { detail: 'This session was missed.' }),
    );
    renderCard();
    fireEvent.click(await screen.findByRole('button', { name: 'Join call' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This session was missed.');
  });

  it('cancels a booking that has not started', async () => {
    respond([booking(4)]);
    renderCard();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(screen.queryByText('Waiting for an interpreter')).not.toBeInTheDocument(),
    );
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(String(post?.[0])).toContain('/interpreters/sessions/booked/4/cancel/');
  });

  it('says what went wrong when someone did not join, with no buttons', async () => {
    respond([booking(5, { status: 'CONFIRMED', no_show: 'interpreter' })]);
    renderCard();

    expect(await screen.findByText('Interpreter did not join')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
