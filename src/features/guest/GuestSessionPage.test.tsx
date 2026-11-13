import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CallConnection } from '../session/callConnection';

const connection = vi.hoisted((): CallConnection => ({
  join: vi.fn().mockResolvedValue(undefined),
  setMic: vi.fn(),
  setCam: vi.fn(),
  leave: vi.fn(),
  setScreenShare: vi.fn().mockResolvedValue(undefined),
  sendChat: vi.fn(),
  replaceTrack: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../session/callConnection', () => ({
  liveKitConnectionWith: () => () => connection,
}));
vi.mock('../../services/guestSession', () => ({
  getGuestLobby: vi.fn().mockResolvedValue({ interpreter_here: true }),
  joinAsGuest: vi
    .fn()
    .mockResolvedValue({ token: 'guest-jwt', url: 'wss://live.example', room: 'session-7' }),
}));

import { GuestSessionPage } from './GuestSessionPage';

const track = (kind: string) => ({
  kind,
  enabled: true,
  stop: vi.fn(),
  getSettings: () => ({ deviceId: `${kind}-1` }),
});

/** jsdom has no MediaStream; this keeps just the parts the page uses. */
class FakeStream {
  tracks: ReturnType<typeof track>[];
  constructor(tracks: ReturnType<typeof track>[] = []) {
    this.tracks = tracks;
  }
  getTracks = () => this.tracks;
  getAudioTracks = () => this.tracks.filter((t) => t.kind === 'audio');
  getVideoTracks = () => this.tracks.filter((t) => t.kind === 'video');
  addTrack = (t: ReturnType<typeof track>) => this.tracks.push(t);
  removeTrack = (t: ReturnType<typeof track>) => (this.tracks = this.tracks.filter((x) => x !== t));
}

const getUserMedia = vi.fn();

beforeEach(() => {
  vi.stubGlobal('MediaStream', FakeStream);
  getUserMedia.mockReset();
  getUserMedia.mockImplementation(async (wanted: { video?: boolean; audio?: boolean }) => {
    const tracks = [];
    if (wanted.audio) tracks.push(track('audio'));
    if (wanted.video) tracks.push(track('video'));
    return new FakeStream(tracks);
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia, enumerateDevices: vi.fn().mockResolvedValue([]) },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function joinWith(option: RegExp | null) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/join/abc']}>
      <Routes>
        <Route path="/join/:token" element={<GuestSessionPage />} />
      </Routes>
    </MemoryRouter>,
  );
  const join = await screen.findByRole('button', { name: /join session/i });
  await waitFor(() => expect(join).toBeEnabled());
  if (option) await user.click(screen.getByLabelText(option));
  await user.click(join);
  await screen.findByRole('toolbar', { name: /call controls/i });
}

describe('GuestSessionPage: how the hearing guest joins', () => {
  it('"Video and audio" asks for both and shows every control', async () => {
    await joinWith(/video and audio/i);

    expect(getUserMedia).toHaveBeenCalledWith({ video: true, audio: true });
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop video/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share screen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^chat$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /leave call/i })).toBeInTheDocument();
  });

  it('"Audio only" asks for the microphone only and has no camera button', async () => {
    await joinWith(/audio only/i);

    expect(getUserMedia).toHaveBeenCalledWith({ video: false, audio: true });
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /video/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /share screen/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^chat$/i })).toBeInTheDocument();
  });

  it('"Listen only" never asks for the camera or microphone and has neither button', async () => {
    await joinWith(/listen only/i);

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /mute/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /video/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /share screen/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /leave call/i })).toBeInTheDocument();
  });

  it('never shows "End Call": only the Deaf user ends the session for everyone', async () => {
    await joinWith(/video and audio/i);

    expect(screen.queryByRole('button', { name: /end call/i })).not.toBeInTheDocument();
  });

  it('shows the SignConnect name in the call header', async () => {
    await joinWith(null);

    expect(screen.getByText('SignConnect')).toBeInTheDocument();
  });

  it('joins the room once the camera and microphone are ready', async () => {
    await joinWith(null);

    await waitFor(() => expect(connection.join).toHaveBeenCalledTimes(1));
  });
});
