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

/**
 * The viewer's own camera and microphone, for the lobby preview and the call. The mic and camera
 * can be switched off without stopping the stream, and everything is released on leaving.
 */
export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  // Known straight away, so it is not set from inside the effect below.
  const [error, setError] = useState<string | null>(() =>
    typeof navigator.mediaDevices?.getUserMedia === 'function'
      ? null
      : 'This browser cannot use a camera. Try a recent version of Chrome, Edge or Firefox.',
  );
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const live = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        live.current = s;
        setStream(s);
      })
      .catch((err) => {
        if (!cancelled) setError(mediaErrorMessage(err));
      });
    return () => {
      cancelled = true;
      live.current?.getTracks().forEach((t) => t.stop());
      live.current = null;
    };
  }, []);

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

  return {
    stream,
    error,
    micOn,
    camOn,
    toggleMic: () => toggle('audio'),
    toggleCam: () => toggle('video'),
  };
}
