import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { ApiError } from '../../services/api';
import type {
  CallConnection,
  CallEvents,
  CreateConnection,
  RemotePerson,
} from '../../features/session/callConnection';
import { LiveSessionPage } from './LiveSessionPage';

vi.mock('../../services/sessionRequests', () => ({
  cancelSessionRequest: vi.fn().mockResolvedValue(undefined),
}));
import { cancelSessionRequest } from '../../services/sessionRequests';

/** A call connection that never touches the network, so the tests can drive what it reports. */
function fakeCall(join: CallConnection['join'] = () => Promise.resolve()) {
  const calls = { join: vi.fn(join), setMic: vi.fn(), setCam: vi.fn(), leave: vi.fn() };
  let events: CallEvents | undefined;
  const create: CreateConnection = (e) => {
    events = e;
    return calls;
  };
  return { calls, create, events: () => events as CallEvents };
}

const AMINA: RemotePerson = {
  id: 'user-9',
  name: 'Amina Okafor',
  // jsdom has no MediaStream, and the tile only passes it on to a <video> element.
  stream: {} as MediaStream,
  cameraOff: true,
};

function renderPage(role: 'deaf' | 'interpreter', call = fakeCall()) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/session/7', state: { interpreterName: 'Amina Okafor' } }]}
    >
      <Routes>
        <Route
          path="/session/:id"
          element={<LiveSessionPage viewerRole={role} createConnection={call.create} />}
        />
        <Route path="/dashboard/deaf" element={<p>Deaf home</p>} />
        <Route path="/dashboard/interpreter" element={<p>Interpreter home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(cancelSessionRequest).mockClear();
  // jsdom has no camera: the page must still work and say why.
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
});

afterEach(cleanup);

describe('LiveSessionPage', () => {
  it('opens on the lobby and names the interpreter for a Deaf user', () => {
    renderPage('deaf');
    expect(screen.getByText('Ready to connect?')).toBeTruthy();
    expect(screen.getByText('Amina Okafor')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('camera');
  });

  it('cancelling the lobby closes the request and goes home', async () => {
    renderPage('deaf');
    fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0]);
    await waitFor(() => expect(screen.getByText('Deaf home')).toBeTruthy());
    expect(cancelSessionRequest).toHaveBeenCalledWith('7');
  });

  it('an interpreter leaving the lobby does not cancel the request', async () => {
    renderPage('interpreter');
    fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0]);
    await waitFor(() => expect(screen.getByText('Interpreter home')).toBeTruthy());
    expect(cancelSessionRequest).not.toHaveBeenCalled();
  });

  it('joins, shows the call, then asks before ending', async () => {
    renderPage('deaf');
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    expect(screen.getByText('Connecting with Amina Okafor')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());
    expect(screen.getByText('Connected with Amina Okafor')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    expect(screen.getByText('End this session?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /continue session/i }));
    expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy();
  });

  it('shows the session-ended screen after ending', async () => {
    renderPage('deaf');
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    fireEvent.click(screen.getByRole('button', { name: /^end session$/i }));
    expect(screen.getByRole('heading', { name: 'Session ended' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(screen.getByText('Deaf home')).toBeTruthy();
  });

  it('asks the video server to join this session when Join Session is pressed', async () => {
    const call = fakeCall();
    renderPage('deaf', call);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());
    expect(call.calls.join).toHaveBeenCalledWith('7', null);
  });

  it('shows who else is in the call as the server reports them', async () => {
    const call = fakeCall();
    renderPage('deaf', call);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByText('Waiting for others to join…')).toBeTruthy());

    act(() => call.events().onPeople([AMINA]));
    expect(screen.queryByText('Waiting for others to join…')).toBeNull();
    expect(screen.getByRole('figure', { name: 'Amina Okafor' })).toBeTruthy();

    act(() => call.events().onPeople([]));
    expect(screen.getByText('Waiting for others to join…')).toBeTruthy();
  });

  it('stays in the lobby and says why when the session is not ready to join', async () => {
    const call = fakeCall(() =>
      Promise.reject(new ApiError(409, 'This session is not ready to join.')),
    );
    renderPage('deaf', call);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('not ready to join'),
    );
    expect(screen.getByText('Ready to connect?')).toBeTruthy();
    expect(screen.getByRole('button', { name: /join session/i })).toBeTruthy();
  });

  it('returns to the lobby with a message when the connection is lost', async () => {
    const call = fakeCall();
    renderPage('deaf', call);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());

    act(() => call.events().onLost());
    expect(screen.getByText('Ready to connect?')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('disconnected');
  });

  it('passes the mic and camera buttons on to the call and leaves it when ending', async () => {
    const call = fakeCall();
    renderPage('deaf', call);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /mute/i }));
    expect(call.calls.setMic).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: /stop video/i }));
    expect(call.calls.setCam).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    fireEvent.click(screen.getByRole('button', { name: /^end session$/i }));
    expect(call.calls.leave).toHaveBeenCalled();
  });
});
