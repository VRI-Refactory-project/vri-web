import { useCallback, useEffect, useRef, useState } from 'react';

/** A plain message for each way the camera and microphone can fail, with what to do about it. */
export function mediaErrorMessage(err: unknown): string {
  const name = (err as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera and microphone are blocked. Allow access in your browser’s address bar, then reload this page.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera or microphone was found. Connect one and reload this page.';
  }
  if (name === 'NotReadableError') {
    return 'Your camera or microphone is being used by another app. Close it and reload this page.';
  }
  return 'We could not start your camera and microphone. Check them and reload this page.';
}

/** One camera or microphone the person can pick from. */
export interface MediaDevice {
  id: string;
  label: string;
}

export interface LocalMediaOptions {
  /** Ask the browser for a camera. Off for "Audio only" and "Listen only". */
  video?: boolean;
  /** Ask the browser for a microphone. Off for "Listen only". */
  audio?: boolean;
}

/**
 * The viewer's own camera and microphone, for the lobby preview and the call. The mic and camera
 * can be switched off without stopping the stream, and everything is released on leaving.
 * Whatever is switched off in `options` is never requested, so the browser never even asks for it.
 */
export function useLocalMedia({ video = true, audio = true }: LocalMediaOptions = {}) {
  const wantsMedia = video || audio;
  const [stream, setStream] = useState<MediaStream | null>(null);
  // Known straight away, so it is not set from inside the effect below.
  const [error, setError] = useState<string | null>(() =>
    !wantsMedia || typeof navigator.mediaDevices?.getUserMedia === 'function'
      ? null
      : 'This browser cannot use a camera. Try a recent version of Chrome, Edge or Firefox.',
  );
  // True once the browser has refused the camera and microphone (blocked, missing or in use).
  const [blocked, setBlocked] = useState(false);
  const [micOn, setMicOn] = useState(audio);
  const [camOn, setCamOn] = useState(video);
  const [mics, setMics] = useState<MediaDevice[]>([]);
  const [cams, setCams] = useState<MediaDevice[]>([]);
  const [selectedMic, setSelectedMic] = useState<string | null>(null);
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const live = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!wantsMedia || !navigator.mediaDevices?.getUserMedia) return;

    // The lists of devices only carry names once the person has allowed access.
    const refreshDevices = async () => {
      if (!navigator.mediaDevices.enumerateDevices) return;
      const all = await navigator.mediaDevices.enumerateDevices();
      if (cancelled) return;
      const pick = (kind: MediaDeviceKind, fallback: string): MediaDevice[] =>
        all
          .filter((d) => d.kind === kind && d.deviceId)
          .map((d, i) => ({ id: d.deviceId, label: d.label || `${fallback} ${i + 1}` }));
      setMics(pick('audioinput', 'Microphone'));
      setCams(pick('videoinput', 'Camera'));
    };

    navigator.mediaDevices
      .getUserMedia({ video, audio })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        live.current = s;
        setStream(s);
        setSelectedMic(s.getAudioTracks()[0]?.getSettings().deviceId ?? null);
        setSelectedCam(s.getVideoTracks()[0]?.getSettings().deviceId ?? null);
        void refreshDevices();
      })
      .catch((err) => {
        if (cancelled) return;
        setError(mediaErrorMessage(err));
        setBlocked(true);
      });

    const onDeviceChange = () => void refreshDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', onDeviceChange);
    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener?.('devicechange', onDeviceChange);
      live.current?.getTracks().forEach((t) => t.stop());
      live.current = null;
    };
  }, [wantsMedia, video, audio]);

  const toggle = useCallback((kind: 'audio' | 'video') => {
    const on = kind === 'audio' ? setMicOn : setCamOn;
    on((current) => {
      const next = !current;
      const tracks =
        kind === 'audio' ? live.current?.getAudioTracks() : live.current?.getVideoTracks();
      tracks?.forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  /**
   * Switches to another microphone or camera. Returns the new track so the call can send it, or
   * null when the switch failed (the old device keeps working).
   */
  const selectDevice = useCallback(
    async (kind: 'audio' | 'video', deviceId: string): Promise<MediaStreamTrack | null> => {
      const current = live.current;
      if (!current) return null;
      try {
        const next = await navigator.mediaDevices.getUserMedia(
          kind === 'audio'
            ? { audio: { deviceId: { exact: deviceId } } }
            : { video: { deviceId: { exact: deviceId } } },
        );
        const track = (kind === 'audio' ? next.getAudioTracks() : next.getVideoTracks())[0];
        if (!track) return null;
        const old = kind === 'audio' ? current.getAudioTracks() : current.getVideoTracks();
        // Keep the mute state: someone who is muted stays muted on the new device.
        track.enabled = old[0]?.enabled ?? true;
        old.forEach((t) => {
          current.removeTrack(t);
          t.stop();
        });
        current.addTrack(track);
        (kind === 'audio' ? setSelectedMic : setSelectedCam)(deviceId);
        return track;
      } catch (err) {
        setError(mediaErrorMessage(err));
        return null;
      }
    },
    [],
  );

  /** Limits the size and speed of the video being sent, to save data (or restores the full size). */
  const setVideoLimits = useCallback(
    async (limits: { width: number; height: number; frameRate: number }) => {
      const track = live.current?.getVideoTracks()[0];
      if (!track?.applyConstraints) return;
      try {
        await track.applyConstraints({
          width: { ideal: limits.width },
          height: { ideal: limits.height },
          frameRate: { ideal: limits.frameRate },
        });
      } catch {
        // This camera cannot do that size; it keeps sending what it already was.
      }
    },
    [],
  );

  return {
    stream,
    error,
    blocked,
    micOn,
    camOn,
    mics,
    cams,
    selectedMic,
    selectedCam,
    selectDevice,
    setVideoLimits,
    toggleMic: () => toggle('audio'),
    toggleCam: () => toggle('video'),
  };
}
