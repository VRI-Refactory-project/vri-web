import { beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (...args: unknown[]) => void;

/** A stand-in for LiveKit's Room: records what the adapter does and lets a test fire its events. */
const room = vi.hoisted(() => {
  const handlers = new Map<string, Handler>();
  const publications = new Map<string, { mute: () => void; unmute: () => void }>();
  const fake = {
    handlers,
    publications,
    remoteParticipants: new Map<string, unknown>(),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    localParticipant: {
      publishTrack: vi.fn().mockResolvedValue(undefined),
      getTrackPublication: (source: string) => publications.get(source),
    },
    on(event: string, handler: Handler) {
      handlers.set(event, handler);
      return fake;
    },
  };
  return fake;
});

vi.mock('livekit-client', () => ({
  Room: vi.fn(function () {
    return room;
  }),
  RoomEvent: {
    ParticipantConnected: 'participantConnected',
    ParticipantDisconnected: 'participantDisconnected',
    TrackSubscribed: 'trackSubscribed',
    TrackUnsubscribed: 'trackUnsubscribed',
    TrackMuted: 'trackMuted',
    TrackUnmuted: 'trackUnmuted',
    ParticipantNameChanged: 'participantNameChanged',
    Disconnected: 'disconnected',
  },
  Track: { Source: { Camera: 'camera', Microphone: 'microphone' } },
}));
vi.mock('../../services/callToken', () => ({
  getCallToken: vi
    .fn()
    .mockResolvedValue({ token: 'jwt', url: 'wss://live.example', room: 'session-7' }),
}));

import { getCallToken } from '../../services/callToken';
import { createLiveKitConnection } from './callConnection';

/** jsdom has no MediaStream; this keeps just the part the adapter uses. */
class FakeStream {
  tracks: { kind: string }[] = [];
  getTracks = () => this.tracks;
  getAudioTracks = () => this.tracks.filter((t) => t.kind === 'audio');
  getVideoTracks = () => this.tracks.filter((t) => t.kind === 'video');
  addTrack = (t: { kind: string }) => this.tracks.push(t);
  removeTrack = (t: { kind: string }) => (this.tracks = this.tracks.filter((x) => x !== t));
}
vi.stubGlobal('MediaStream', FakeStream);

const events = () => ({ onPeople: vi.fn(), onLost: vi.fn() });

beforeEach(() => {
  room.remoteParticipants.clear();
  room.publications.clear();
  room.connect.mockClear();
  room.disconnect.mockClear();
  room.localParticipant.publishTrack.mockClear();
  vi.mocked(getCallToken).mockClear();
});

describe('createLiveKitConnection', () => {
  it('gets a token for the session, connects with it and publishes the local camera and mic', async () => {
    const connection = createLiveKitConnection(events());
    const local = new FakeStream();
    local.tracks = [{ kind: 'video' }, { kind: 'audio' }];

    await connection.join('7', local as unknown as MediaStream);

    expect(getCallToken).toHaveBeenCalledWith('7');
    expect(room.connect).toHaveBeenCalledWith('wss://live.example', 'jwt', { rtcConfig: { iceServers: [] } });
    expect(room.localParticipant.publishTrack).toHaveBeenCalledTimes(2);
    expect(room.localParticipant.publishTrack.mock.calls.map((c) => c[1].source)).toEqual([
      'camera',
      'microphone',
    ]);
  });

  it('reports the people already in the room, with their video and audio on one stream', async () => {
    const e = events();
    const videoTrack = { kind: 'video' };
    const audioTrack = { kind: 'audio' };
    room.remoteParticipants.set('user-9', {
      identity: 'user-9',
      name: 'Amina Okafor',
      getTrackPublication: (source: string) =>
        source === 'camera'
          ? { track: { mediaStreamTrack: videoTrack }, isMuted: false }
          : { track: { mediaStreamTrack: audioTrack }, isMuted: false },
    });
    const connection = createLiveKitConnection(e);

    await connection.join('7', null);

    const [people] = e.onPeople.mock.calls.at(-1)!;
    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({ id: 'user-9', name: 'Amina Okafor', cameraOff: false });
    expect(people[0].stream.getVideoTracks()).toEqual([videoTrack]);
    expect(people[0].stream.getAudioTracks()).toEqual([audioTrack]);
  });

  it('marks a person whose camera is muted as camera off, and keeps their stream', async () => {
    const e = events();
    room.remoteParticipants.set('user-9', {
      identity: 'user-9',
      name: 'Amina Okafor',
      getTrackPublication: (source: string) =>
        source === 'camera'
          ? { track: { mediaStreamTrack: { kind: 'video' } }, isMuted: true }
          : undefined,
    });
    createLiveKitConnection(e);

    room.handlers.get('trackMuted')!();

    expect(e.onPeople.mock.calls.at(-1)![0][0].cameraOff).toBe(true);
  });

  it('mutes and unmutes the published tracks', async () => {
    const camera = { mute: vi.fn(), unmute: vi.fn() };
    room.publications.set('camera', camera);
    const connection = createLiveKitConnection(events());

    connection.setCam(false);
    connection.setCam(true);

    expect(camera.mute).toHaveBeenCalledTimes(1);
    expect(camera.unmute).toHaveBeenCalledTimes(1);
  });

  it('connects through the STUN and TURN servers the API sends with the token', async () => {
    const iceServers = [{ urls: ['stun:stun.example.com:3478'] }];
    vi.mocked(getCallToken).mockResolvedValueOnce({
      token: 'jwt',
      url: 'wss://live.example',
      room: 'session-7',
      ice_servers: iceServers,
    });
    const connection = createLiveKitConnection(events());

    await connection.join('7', null);

    expect(room.connect).toHaveBeenCalledWith('wss://live.example', 'jwt', { rtcConfig: { iceServers } });
  });

  it('tells the page when the connection drops, but not when the page leaves on purpose', () => {
    const e = events();
    const connection = createLiveKitConnection(e);

    room.handlers.get('disconnected')!();
    expect(e.onLost).toHaveBeenCalledTimes(1);

    connection.leave();
    room.handlers.get('disconnected')!();
    expect(e.onLost).toHaveBeenCalledTimes(1);
    expect(room.disconnect).toHaveBeenCalled();
  });

  it('does not stay connected when the page was left while connecting', async () => {
    const connection = createLiveKitConnection(events());
    room.connect.mockImplementationOnce(async () => connection.leave());
    room.disconnect.mockClear();

    await connection.join('7', null);

    expect(room.localParticipant.publishTrack).not.toHaveBeenCalled();
    expect(room.disconnect).toHaveBeenCalled();
  });
});
