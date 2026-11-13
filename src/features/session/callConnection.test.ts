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
      publishData: vi.fn().mockResolvedValue(undefined),
      setScreenShareEnabled: vi.fn().mockResolvedValue(undefined),
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
    LocalTrackPublished: 'localTrackPublished',
    LocalTrackUnpublished: 'localTrackUnpublished',
    DataReceived: 'dataReceived',
    Disconnected: 'disconnected',
  },
  Track: { Source: { Camera: 'camera', Microphone: 'microphone', ScreenShare: 'screen_share' } },
}));
vi.mock('../../services/callToken', () => ({
  getCallToken: vi
    .fn()
    .mockResolvedValue({ token: 'jwt', url: 'wss://live.example', room: 'session-7' }),
}));

import { getCallToken } from '../../services/callToken';
import { createLiveKitConnection, liveKitConnectionWith } from './callConnection';

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
  room.localParticipant.publishData.mockClear();
  room.localParticipant.setScreenShareEnabled.mockClear();
  vi.mocked(getCallToken).mockClear();
});

describe('createLiveKitConnection', () => {
  it('gets a token for the session, connects with it and publishes the local camera and mic', async () => {
    const connection = createLiveKitConnection(events());
    const local = new FakeStream();
    local.tracks = [{ kind: 'video' }, { kind: 'audio' }];

    await connection.join('7', local as unknown as MediaStream);

    expect(getCallToken).toHaveBeenCalledWith('7');
    expect(room.connect).toHaveBeenCalledWith('wss://live.example', 'jwt', {
      rtcConfig: { iceServers: [] },
    });
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
          : source === 'microphone'
            ? { track: { mediaStreamTrack: audioTrack }, isMuted: false }
            : undefined,
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

    expect(room.connect).toHaveBeenCalledWith('wss://live.example', 'jwt', {
      rtcConfig: { iceServers },
    });
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

describe('screen sharing, chat and devices', () => {
  const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));

  it('shows a shared screen as its own tile next to the person, not mirrored like a camera', async () => {
    const e = events();
    const screenTrack = { kind: 'video' };
    room.remoteParticipants.set('user-9', {
      identity: 'user-9',
      name: 'Amina Okafor',
      getTrackPublication: (source: string) =>
        source === 'screen_share' ? { track: { mediaStreamTrack: screenTrack } } : undefined,
    });
    await createLiveKitConnection(e).join('7', null);

    const [people] = e.onPeople.mock.calls.at(-1)!;
    expect(people).toHaveLength(2);
    expect(people[1]).toMatchObject({ id: 'user-9#screen', screen: true });
    expect(people[1].stream.getVideoTracks()).toEqual([screenTrack]);
  });

  it('starts and stops sharing the screen, and reports a refused share as not sharing', async () => {
    const e = { ...events(), onSharing: vi.fn() };
    const connection = createLiveKitConnection(e);

    await connection.setScreenShare!(true);
    expect(room.localParticipant.setScreenShareEnabled).toHaveBeenCalledWith(true);

    room.localParticipant.setScreenShareEnabled.mockRejectedValueOnce(new Error('cancelled'));
    await connection.setScreenShare!(true);
    expect(e.onSharing).toHaveBeenLastCalledWith(false);
  });

  it('tells the page when the browser’s own "Stop sharing" button is used', () => {
    const e = { ...events(), onSharing: vi.fn() };
    createLiveKitConnection(e);

    room.handlers.get('localTrackPublished')!({ source: 'screen_share' });
    expect(e.onSharing).toHaveBeenLastCalledWith(true);
    room.handlers.get('localTrackUnpublished')!({ source: 'screen_share' });
    expect(e.onSharing).toHaveBeenLastCalledWith(false);
    room.handlers.get('localTrackPublished')!({ source: 'camera' });
    expect(e.onSharing).toHaveBeenCalledTimes(2);
  });

  it('sends a chat message to the room and shows it to the sender straight away', () => {
    const e = { ...events(), onChat: vi.fn() };
    const connection = createLiveKitConnection(e);

    connection.sendChat!('  Hello  ');

    const [payload, options] = room.localParticipant.publishData.mock.calls[0];
    expect(JSON.parse(new TextDecoder().decode(payload)).text).toBe('Hello');
    expect(options).toMatchObject({ reliable: true, topic: 'chat' });
    expect(e.onChat).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'You', text: 'Hello', mine: true }),
    );

    connection.sendChat!('   ');
    expect(room.localParticipant.publishData).toHaveBeenCalledTimes(1);
  });

  it('passes on chat from others, and ignores other topics and broken messages', () => {
    const e = { ...events(), onChat: vi.fn() };
    createLiveKitConnection(e);
    const received = room.handlers.get('dataReceived')!;
    const amina = { identity: 'user-9', name: 'Amina Okafor' };

    received(encode({ text: 'Hi there', at: 5 }), amina, undefined, 'chat');
    received(encode({ text: 'ignored' }), amina, undefined, 'something-else');
    received(new TextEncoder().encode('not json'), amina, undefined, 'chat');
    received(encode({ text: 42 }), amina, undefined, 'chat');

    expect(e.onChat).toHaveBeenCalledTimes(1);
    expect(e.onChat).toHaveBeenCalledWith({
      id: 'user-9-5',
      from: 'Amina Okafor',
      text: 'Hi there',
      mine: false,
      at: 5,
    });
  });

  it('swaps the sent camera or microphone when another device is picked', async () => {
    const replaceTrack = vi.fn().mockResolvedValue(undefined);
    room.publications.set('microphone', { track: { replaceTrack } } as never);
    const connection = createLiveKitConnection(events());
    const next = { kind: 'audio' } as MediaStreamTrack;

    await connection.replaceTrack!('audio', next);

    expect(replaceTrack).toHaveBeenCalledWith(next);
  });
});

describe('liveKitConnectionWith (the hearing guest)', () => {
  it('joins with the token the guest already holds, without asking the signed-in token API', async () => {
    const connection = liveKitConnectionWith(() =>
      Promise.resolve({ token: 'guest-jwt', url: 'wss://live.example', room: 'session-7' }),
    )(events());

    await connection.join('', null);

    expect(getCallToken).not.toHaveBeenCalled();
    expect(room.connect).toHaveBeenCalledWith('wss://live.example', 'guest-jwt', {
      rtcConfig: { iceServers: [] },
    });
  });

  it('connects once when a join is cancelled and started again straight away', async () => {
    const connection = createLiveKitConnection(events());

    const first = connection.join('7', null);
    connection.leave();
    const second = connection.join('7', null);
    await Promise.all([first, second]);

    expect(room.connect).toHaveBeenCalledTimes(1);
  });
});
