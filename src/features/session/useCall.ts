import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError } from '../../services/api';
import type { ChatMessage, CreateConnection, RemotePerson } from './callConnection';
import { useLocalMedia } from './useLocalMedia';
import { QUALITY_PRESETS, type ConnectionQuality, type VideoQualityChoice } from './videoQuality';

/** What the person is allowed to send. "Audio only" is { video: false }, "Listen only" is neither. */
export interface CallMode {
  video: boolean;
  audio: boolean;
}

interface Options {
  createConnection: CreateConnection;
  mode?: CallMode;
}

/**
 * Everything a call screen needs, in one place so every role gets the same controls: the
 * person's own camera and microphone, the others in the room, chat, screen sharing and the timer.
 * The screen itself (CallScreen) only draws what this gives it.
 */
export function useCall({ createConnection, mode = { video: true, audio: true } }: Options) {
  const media = useLocalMedia(mode);
  const [others, setOthers] = useState<RemotePerson[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  // How many messages were there when the chat was last open, so the rest count as unread.
  const [seenCount, setSeenCount] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [selfQuality, setSelfQuality] = useState<ConnectionQuality>('unknown');
  const [quality, setQuality] = useState<VideoQualityChoice>('auto');
  const [phase, setPhase] = useState<'idle' | 'joining' | 'live'>('idle');
  // True when the connection dropped without the person leaving.
  const [lost, setLost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Without access the buttons cannot work, so say why instead of doing nothing.
  const [accessNotice, setAccessNotice] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef(0);

  const [connection] = useState(() =>
    createConnection({
      onPeople: setOthers,
      onLost: () => {
        setError('You were disconnected from the call. Join again to reconnect.');
        setPhase('idle');
        setSharing(false);
        setLost(true);
      },
      onChat: (message) => setMessages((all) => [...all, message]),
      onSharing: setSharing,
      onSelfQuality: setSelfQuality,
    }),
  );

  useEffect(() => () => connection.leave(), [connection]);

  // What the browser has to give before the call can start: the stream, or a clear "no".
  const needsMedia = mode.video || mode.audio;
  const ready = !needsMedia || media.stream !== null || media.blocked;

  /** Joins the room. True when the person is in, false when it failed (the reason is in `error`). */
  const join = async (sessionId = ''): Promise<boolean> => {
    setError(null);
    setLost(false);
    setPhase('joining');
    try {
      await connection.join(sessionId, media.stream);
      connection.setMic(media.micOn);
      connection.setCam(media.camOn);
      startedAt.current = Date.now();
      setSeconds(0);
      setPhase('live');
      return true;
    } catch (err) {
      setError(describeError(err));
      setPhase('idle');
      return false;
    }
  };

  // Stable, so a page can use it inside an effect without resubscribing on every render.
  const leave = useCallback(() => {
    connection.leave();
    startedAt.current = 0;
    setSharing(false);
    setPhase('idle');
  }, [connection]);

  useEffect(() => {
    if (phase !== 'live') return;
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [phase]);

  const toggleMic = () => {
    if (!mode.audio) return;
    if (media.blocked) return setAccessNotice(media.error);
    media.toggleMic();
    connection.setMic(!media.micOn);
  };

  const toggleCam = () => {
    if (!mode.video) return;
    if (media.blocked) return setAccessNotice(media.error);
    media.toggleCam();
    connection.setCam(!media.camOn);
  };

  const toggleShare = () => {
    // Sharing a screen sends video, so it is only offered to people who may send video.
    if (!mode.video) return;
    void connection.setScreenShare?.(!sharing);
  };

  const pickDevice = async (kind: 'audio' | 'video', deviceId: string) => {
    const track = await media.selectDevice(kind, deviceId);
    if (track) await connection.replaceTrack?.(kind, track);
  };

  // Picks how sharp the video is, both what you receive and what you send.
  const pickQuality = (choice: VideoQualityChoice) => {
    setQuality(choice);
    const preset = QUALITY_PRESETS[choice];
    connection.setIncomingQuality?.(preset.incoming);
    void media.setVideoLimits(preset.outgoing);
  };

  const openChat = (open: boolean) => {
    setChatOpen(open);
    // Everything up to now has been seen, whether the chat is opening or closing.
    setSeenCount(messages.length);
  };

  // Messages that came in while the chat was shut, not counting your own.
  const unread = chatOpen ? 0 : messages.slice(seenCount).filter((m) => !m.mine).length;

  return {
    mode,
    media,
    others,
    messages,
    chatOpen,
    unread,
    sharing,
    selfQuality,
    quality,
    phase,
    lost,
    error,
    accessNotice,
    seconds,
    ready,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleShare,
    pickDevice,
    pickQuality,
    openChat,
    sendChat: (text: string) => connection.sendChat?.(text),
  };
}

export type Call = ReturnType<typeof useCall>;
