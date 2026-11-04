import { Room, RoomEvent, Track, type RemoteParticipant } from 'livekit-client';
import { getCallToken } from '../../services/callToken';

/** Someone else in the call, with the stream the screen plays for them. */
export interface RemotePerson {
  id: string;
  name: string;
  /** Their camera and microphone together, so one element plays both. */
  stream: MediaStream;
  cameraOff: boolean;
}

export interface CallEvents {
  /** Everyone else in the room, sent again whenever someone joins, leaves or switches video. */
  onPeople(people: RemotePerson[]): void;
  /** The connection dropped without the app asking for it. */
  onLost(): void;
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
}

export type CreateConnection = (events: CallEvents) => CallConnection;

/** Keeps one track of the given kind on the stream, swapping it when LiveKit gives a new one. */
function setStreamTrack(stream: MediaStream, kind: 'audio' | 'video', track?: MediaStreamTrack) {
  const current = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
  if (current[0] === track) return;
  current.forEach((t) => stream.removeTrack(t));
  if (track) stream.addTrack(track);
}

/** The LiveKit version of a call connection. */
export const createLiveKitConnection: CreateConnection = (events) => {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  // One stream per person for the whole call, so their video does not restart on every change.
  const streams = new Map<string, MediaStream>();
  let leaving = false;

  const toPerson = (p: RemoteParticipant): RemotePerson => {
    const stream = streams.get(p.identity) ?? new MediaStream();
    streams.set(p.identity, stream);
    const camera = p.getTrackPublication(Track.Source.Camera);
    const mic = p.getTrackPublication(Track.Source.Microphone);
    setStreamTrack(stream, 'video', camera?.track?.mediaStreamTrack);
    setStreamTrack(stream, 'audio', mic?.track?.mediaStreamTrack);
    return {
      id: p.identity,
      name: p.name || 'Participant',
      stream,
      cameraOff: !camera?.track || camera.isMuted,
    };
  };

  const send = () => events.onPeople([...room.remoteParticipants.values()].map(toPerson));

  room
    .on(RoomEvent.ParticipantConnected, send)
    .on(RoomEvent.ParticipantDisconnected, (p) => {
      streams.delete(p.identity);
      send();
    })
    .on(RoomEvent.TrackSubscribed, send)
    .on(RoomEvent.TrackUnsubscribed, send)
    .on(RoomEvent.TrackMuted, send)
    .on(RoomEvent.TrackUnmuted, send)
    .on(RoomEvent.ParticipantNameChanged, send)
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
      const { token, url } = await getCallToken(sessionId);
      await room.connect(url, token);
      if (leaving) {
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
      void room.disconnect();
    },
  };
};
