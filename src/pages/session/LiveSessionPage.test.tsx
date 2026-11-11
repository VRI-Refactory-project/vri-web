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
import type { OpenSessionSocket, SessionEvents } from '../../features/session/sessionSocket';
import type { SessionRequestState } from '../../services/sessionRequests';
import { LiveSessionPage } from './LiveSessionPage';
import { AuthProvider } from '../../features/auth/AuthProvider'; // IMPORTED AuthProvider

vi.mock('../../services/sessionRequests', () => ({
  cancelSessionRequest: vi.fn().mockResolvedValue(undefined),
  endSession: vi.fn().mockResolvedValue(undefined),
  FINAL_STATES: ['FAILED', 'CANCELLED', 'COMPLETED'],
}));
import { cancelSessionRequest, endSession } from '../../services/sessionRequests';

function fakeCall(join: CallConnection['join'] = () => Promise.resolve()) {
  const calls = { join: vi.fn(join), setMic: vi.fn(), setCam: vi.fn(), leave: vi.fn() };
  let events: CallEvents | undefined;
  const create: CreateConnection = (e) => {
    events = e;
    return calls;
  };
  return { calls, create, events: () => events as CallEvents };
}

/** A session socket that never touches the network, so the tests can play what the server says. */
function fakeSocket() {
  let events: SessionEvents | undefined;
  const close = vi.fn();
  const open: OpenSessionSocket = (_id, e) => {
    events = e;
    return { close };
  };
  return { open, close, status: (state: SessionRequestState) => events?.onStatus(state) };
}

const AMINA: RemotePerson = {
  id: 'user-9',
  name: 'Amina Okafor',
  stream: {} as MediaStream,
  cameraOff: true,
};

// WRAPPED THE PAGE IN AuthProvider
function renderPage(role: 'deaf' | 'interpreter', call = fakeCall(), socket = fakeSocket()) {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={[{ pathname: '/session/7', state: { interpreterName: 'Amina Okafor' } }]}
      >
        <Routes>
          <Route
            path="/session/:id"
            element={
              <LiveSessionPage
                viewerRole={role}
                createConnection={call.create}
                openSocket={socket.open}
              />
            }
          />
          <Route path="/dashboard/deaf" element={<p>Deaf home</p>} />
          <Route path="/dashboard/interpreter" element={<p>Interpreter home</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.mocked(cancelSessionRequest).mockClear();
  vi.mocked(endSession).mockClear();
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

  // 👇 UPDATED TEST 👇
  it('shows the session-ended screen after ending', async () => {
    renderPage('deaf');
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    fireEvent.click(screen.getByRole('button', { name: /^end session$/i }));

    // The person who ended it sees the Google Meet style title
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'You left the session' })).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
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
    await waitFor(() => expect(call.calls.leave).toHaveBeenCalled());
  });

  it('ends the session for everyone through the API before leaving', async () => {
    const call = fakeCall();
    renderPage('deaf', call);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    fireEvent.click(screen.getByRole('button', { name: /^end session$/i }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'You left the session' })).toBeTruthy(),
    );
    expect(endSession).toHaveBeenCalledWith('7');
    expect(call.calls.leave).toHaveBeenCalled();
  });

  it('gives an interpreter Leave but not End', async () => {
    renderPage('interpreter');
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /leave call/i })).toBeTruthy());
    expect(screen.queryByRole('button', { name: /end call/i })).toBeNull();
  });

  it('gives the person who started the session both Leave and End', async () => {
    renderPage('deaf');
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /leave call/i })).toBeTruthy());
    expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy();
  });

  it('leaving does not end the session and offers Rejoin', async () => {
    const call = fakeCall();
    renderPage('interpreter', call);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /leave call/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /leave call/i }));

    expect(screen.getByRole('heading', { name: 'You left the session' })).toBeTruthy();
    expect(call.calls.leave).toHaveBeenCalled();
    expect(endSession).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /rejoin/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /rejoin/i }));
    expect(screen.getByText('Ready to connect?')).toBeTruthy();
  });

  it('takes Rejoin away if the session ends for everyone after someone left', async () => {
    const socket = fakeSocket();
    renderPage('interpreter', fakeCall(), socket);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /leave call/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /leave call/i }));
    expect(screen.getByRole('button', { name: /rejoin/i })).toBeTruthy();

    act(() => socket.status('COMPLETED'));

    expect(screen.queryByRole('button', { name: /rejoin/i })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Session ended' })).toBeTruthy();
  });

  it('stays in the call and says why when the server will not end it', async () => {
    vi.mocked(endSession).mockRejectedValueOnce(
      new ApiError(403, 'Only the person who started this session can end it for everyone.'),
    );
    const call = fakeCall();
    renderPage('deaf', call);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /end call/i }));
    fireEvent.click(screen.getByRole('button', { name: /^end session$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Only the person who started'),
    );
    expect(screen.getByText('End this session?')).toBeTruthy();
    expect(call.calls.leave).not.toHaveBeenCalled();
  });

  it('shows the ended screen to everyone when the server says the session is over', async () => {
    const call = fakeCall();
    const socket = fakeSocket();
    renderPage('deaf', call, socket);
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());

    act(() => socket.status('COMPLETED'));
    expect(screen.getByRole('heading', { name: 'Session ended' })).toBeTruthy();
    expect(call.calls.leave).toHaveBeenCalled();
  });

  it('offers no Rejoin once the session is over for everyone', async () => {
    const socket = fakeSocket();
    renderPage('deaf', fakeCall(), socket);
    act(() => socket.status('COMPLETED'));
    expect(screen.queryByRole('button', { name: /rejoin/i })).toBeNull();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeTruthy();
  });

  it('tells the person how it ended when the session failed', () => {
    const socket = fakeSocket();
    renderPage('deaf', fakeCall(), socket);
    act(() => socket.status('FAILED'));
    expect(screen.getByRole('heading', { name: 'We could not connect you' })).toBeTruthy();
  });

  it('ignores status updates that do not end the session', () => {
    const socket = fakeSocket();
    renderPage('deaf', fakeCall(), socket);
    act(() => socket.status('ACCEPTED'));
    expect(screen.getByText('Ready to connect?')).toBeTruthy();
  });

  it('stops listening to the server when the page closes', () => {
    const socket = fakeSocket();
    const view = renderPage('deaf', fakeCall(), socket);
    view.unmount();
    expect(socket.close).toHaveBeenCalled();
  });

  it('says access is needed when Mute or Stop Video is pressed without access', async () => {
    const denied = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(denied) },
      configurable: true,
    });
    const call = fakeCall();
    renderPage('deaf', call);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('blocked'));
    fireEvent.click(screen.getByRole('button', { name: /join session/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /end call/i })).toBeTruthy());
    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /mute/i }));
    expect(screen.getByRole('alert').textContent).toContain('Allow access');
    expect(call.calls.setMic).toHaveBeenCalledTimes(1); // only the one from joining
    fireEvent.click(screen.getByRole('button', { name: /stop video/i }));
    expect(call.calls.setCam).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /mute/i })).toBeTruthy();
  });
});
