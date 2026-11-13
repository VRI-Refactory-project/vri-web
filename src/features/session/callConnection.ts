import { Room, RoomEvent, Track, VideoQuality, type RemoteParticipant } from 'livekit-client';
import { getCallToken, type CallToken } from '../../services/callToken';
import type { ConnectionQuality } from './videoQuality';

/** Someone else in the call, with the stream the screen plays for them. */
export interface RemotePerson {
  id: string;
  name: string;
  /** Their camera and microphone together, so one element plays both. */
  stream: MediaStream;
  cameraOff: boolean;
  /** True for a shared screen. It gets its own tile and is not mirrored like a camera. */
  screen?: boolean;
  /** How good their connection is, shown as bars on their tile. */
  quality?: ConnectionQuality;
}

/** One line in the call's chat. */
export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  mine: boolean;
  at: number;
}

export interface CallEvents {
  /** Everyone else in the room, sent again whenever someone joins, leaves or switches video. */
  onPeople(people: RemotePerson[]): void;
  /** The connection dropped without the app asking for it. */
  onLost(): void;
  /** A chat message arrived, or one of your own was sent. */
  onChat?(message: ChatMessage): void;
  /** Your own screen share started or stopped (the browser's "Stop sharing" button counts too). */
  onSharing?(on: boolean): void;
  /** How good your own connection is. */
  onSelfQuality?(quality: ConnectionQuality): void;
}

/**
 * What the session page needs from a video call. The page knows nothing about LiveKit, so the
 * provider can change (or be faked in tests) by supplying another connection.
 */
export interface CallConnection {
  /** Joins the session's room and sends the viewer's own camera and microphone. */
  join(sessionId: string, local: MediaStream | null): Promise<void>;
  setMic(on: boolean): void;
  setCam(on: boolean): void;
  leave(): void;
  /** Starts or stops sharing the viewer's screen. */
  setScreenShare?(on: boolean): Promise<void>;
  /** Sends a chat message to everyone in the call. */
  sendChat?(text: string): void;
  /** Swaps the camera or microphone being sent, after the viewer picks another device. */
  replaceTrack?(kind: 'audio' | 'video', track: MediaStreamTrack): Promise<void>;
  /** Limits how sharp the video coming from the others may be, to save data. */
  setIncomingQuality?(quality: 'low' | 'medium' | 'high'): void;
}

export type CreateConnection = (events: CallEvents) => CallConnection;

const CHAT_TOPIC = 'chat';

/** LiveKit reports quality as one of these words; anything else counts as unknown. */
function toQuality(value: unknown): ConnectionQuality {
  return value === 'excellent' || value === 'good' || value === 'poor' || value === 'lost'
    ? value
    : 'unknown';
}
const MAX_CHAT_LENGTH = 2000;

/** Keeps one track of the given kind on the stream, swapping it when LiveKit gives a new one. */
function setStreamTrack(stream: MediaStream, kind: 'audio' | 'video', track?: MediaStreamTrack) {
  const current = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
  if (current[0] === track) return;
  current.forEach((t) => stream.removeTrack(t));
  if (track) stream.addTrack(track);
}

/** Reads a chat message sent by another person. Anything that is not a plain message is dropped. */
function readChat(payload: Uint8Array): { text: string; at: number } | null {
  try {
    const data = JSON.parse(new TextDecoder().decode(payload)) as { text?: unknown; at?: unknown };
    if (typeof data.text !== 'string' || !data.text.trim()) return null;
    return {
      text: data.text.slice(0, MAX_CHAT_LENGTH),
      at: typeof data.at === 'number' ? data.at : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * The LiveKit version of a call connection. `getToken` decides how the person gets into the room:
 * signed-in people ask the API with the session id, a hearing guest already holds a token.
 */
export function liveKitConnectionWith(
  getToken: (sessionId: string) => Promise<CallToken>,
): CreateConnection {
  return (events) => {
    const room = new Room({ adaptiveStream: true, dynacast: true });
    // One stream per person for the whole call, so their video does not restart on every change.
    const streams = new Map<string, MediaStream>();
    let leaving = false;
    // Counts joins and leaves, so a join that was cancelled halfway (or replaced by a newer one,
    // as React's StrictMode does while developing) stops instead of connecting twice.
    let attempt = 0;
    // Set when the person picks a video quality. Until then LiveKit chooses by itself.
    let incoming: 'low' | 'medium' | 'high' | null = null;

    const streamFor = (key: string) => {
      const stream = streams.get(key) ?? new MediaStream();
      streams.set(key, stream);
      return stream;
    };

    const toPeople = (p: RemoteParticipant): RemotePerson[] => {
      const stream = streamFor(p.identity);
      const camera = p.getTrackPublication(Track.Source.Camera);
      const mic = p.getTrackPublication(Track.Source.Microphone);
      setStreamTrack(stream, 'video', camera?.track?.mediaStreamTrack);
      setStreamTrack(stream, 'audio', mic?.track?.mediaStreamTrack);
      const name = p.name || 'Participant';
      const people: RemotePerson[] = [
        {
          id: p.identity,
          name,
          stream,
          cameraOff: !camera?.track || camera.isMuted,
          quality: toQuality(p.connectionQuality),
        },
      ];

      // A shared screen is shown as one more tile next to the person.
      const shared = p.getTrackPublication(Track.Source.ScreenShare)?.track?.mediaStreamTrack;
      if (shared) {
        const screenStream = streamFor(`${p.identity}#screen`);
        setStreamTrack(screenStream, 'video', shared);
        people.push({
          id: `${p.identity}#screen`,
          name: `${name}’s screen`,
          stream: screenStream,
          cameraOff: false,
          screen: true,
        });
      } else {
        streams.delete(`${p.identity}#screen`);
      }
      return people;
    };

    const send = () =>
      events.onPeople([...room.remoteParticipants.values()].flatMap((p) => toPeople(p)));

    // Applies the chosen quality to every video coming in, including ones that arrive later.
    const applyIncoming = () => {
      if (!incoming) return;
      const level = { low: VideoQuality.LOW, medium: VideoQuality.MEDIUM, high: VideoQuality.HIGH }[
        incoming
      ];
      for (const p of room.remoteParticipants.values()) {
        p.videoTrackPublications?.forEach((publication) => publication.setVideoQuality?.(level));
      }
    };

    room
      .on(RoomEvent.ParticipantConnected, send)
      .on(RoomEvent.ParticipantDisconnected, (p) => {
        streams.delete(p.identity);
        streams.delete(`${p.identity}#screen`);
        send();
      })
      .on(RoomEvent.TrackSubscribed, () => {
        applyIncoming();
        send();
      })
      .on(RoomEvent.TrackUnsubscribed, send)
      .on(RoomEvent.TrackMuted, send)
      .on(RoomEvent.TrackUnmuted, send)
      .on(RoomEvent.ParticipantNameChanged, send)
      .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        if (participant.isLocal) events.onSelfQuality?.(toQuality(quality));
        else send();
      })
      .on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.source === Track.Source.ScreenShare) events.onSharing?.(true);
      })
      .on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.source === Track.Source.ScreenShare) events.onSharing?.(false);
      })
      .on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
        if (topic !== CHAT_TOPIC) return;
        const message = readChat(payload);
        if (!message) return;
        events.onChat?.({
          id: `${participant?.identity ?? 'unknown'}-${message.at}`,
          from: participant?.name || 'Participant',
          text: message.text,
          mine: false,
          at: message.at,
        });
      })
      .on(RoomEvent.Disconnected, () => {
        streams.clear();
        send();
        if (!leaving) events.onLost();
      });

    const setPublished = (source: Track.Source, on: boolean) => {
      const publication = room.localParticipant.getTrackPublication(source);
      if (on) void publication?.unmute();
      else void publication?.mute();
    };

    return {
      async join(sessionId, local) {
        leaving = false;
        const mine = ++attempt;
        const { token, url, ice_servers } = await getToken(sessionId);
        if (mine !== attempt) return;
        await room.connect(url, token, { rtcConfig: { iceServers: ice_servers ?? [] } });
        if (leaving || mine !== attempt) {
          // The person left the page while the connection was being made.
          void room.disconnect();
          return;
        }
        for (const track of local?.getTracks() ?? []) {
          await room.localParticipant.publishTrack(track, {
            source: track.kind === 'video' ? Track.Source.Camera : Track.Source.Microphone,
          });
        }
        send();
      },
      setMic: (on) => setPublished(Track.Source.Microphone, on),
      setCam: (on) => setPublished(Track.Source.Camera, on),
      leave() {
        leaving = true;
        attempt++;
        void room.disconnect();
      },
      async setScreenShare(on) {
        try {
          await room.localParticipant.setScreenShareEnabled(on);
        } catch {
          // The person closed the browser's "choose a screen" box, so nothing is being shared.
          events.onSharing?.(false);
        }
      },
      sendChat(text) {
        const body = text.trim().slice(0, MAX_CHAT_LENGTH);
        if (!body) return;
        const at = Date.now();
        const payload = new TextEncoder().encode(JSON.stringify({ text: body, at }));
        void room.localParticipant.publishData(payload, { reliable: true, topic: CHAT_TOPIC });
        events.onChat?.({ id: `me-${at}`, from: 'You', text: body, mine: true, at });
      },
      setIncomingQuality(quality) {
        incoming = quality;
        applyIncoming();
      },
      async replaceTrack(kind, track) {
        const source = kind === 'video' ? Track.Source.Camera : Track.Source.Microphone;
        await room.localParticipant.getTrackPublication(source)?.track?.replaceTrack(track);
      },
    };
  };
}

/** Signed-in people (the Deaf user, the interpreter) ask the API for a token for the session. */
export const createLiveKitConnection: CreateConnection = liveKitConnectionWith((sessionId) =>
  getCallToken(sessionId),
);
