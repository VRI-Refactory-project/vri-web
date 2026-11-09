import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../services/api';
import type { CallToken } from '../../services/callToken';
import { getGuestLobby, joinAsGuest } from '../../services/guestSession';
import { VideoRoom } from '../video/VideoRoom';

/** How the hearing guest wants to take part. */
type Mode = 'video' | 'audio' | 'listen';

/**
 * waiting = the interpreter is not in the call yet; ready = they are, so the guest can join;
 * closed = the session ended or the guest was removed; invalid = the link is not a real invitation.
 */
type Phase = 'waiting' | 'ready' | 'closed' | 'invalid';

const POLL_MS = 3000; // how often the lobby asks "is the interpreter here?"

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: 'video', label: 'Video and audio', hint: 'Be seen and heard.' },
  { value: 'audio', label: 'Audio only', hint: 'Speak and listen, with your camera off.' },
  {
    value: 'listen',
    label: 'Listen only',
    hint: 'Hear the session, with your camera and microphone off.',
  },
];

const messages: Record<Phase, string> = {
  waiting: 'Waiting for the interpreter to arrive. This page updates by itself.',
  ready: 'The interpreter is here. You can join now.',
  closed: 'This session has ended, or you were removed from it.',
  invalid: 'This invitation link is not valid. Please check the link in your email.',
};

/** The page a hearing guest lands on from the invitation email: /join/<token>. No account needed. */
export function GuestSessionPage() {
  const { token = '' } = useParams();
  const [phase, setPhase] = useState<Phase>('waiting');
  const [mode, setMode] = useState<Mode>('video');
  const [call, setCall] = useState<CallToken | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // The lobby: ask every few seconds whether the interpreter is in the call yet.
  useEffect(() => {
    if (call) return; // already in the call, nothing to wait for
    let cancelled = false;
    let timer: number | undefined;

    const check = async () => {
      try {
        const { interpreter_here } = await getGuestLobby(token);
        if (!cancelled) setPhase(interpreter_here ? 'ready' : 'waiting');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) return setPhase('invalid');
        if (err instanceof ApiError && err.status === 410) return setPhase('closed');
        // Anything else (for example a dropped connection): keep waiting and try again.
      }
      if (!cancelled) timer = window.setTimeout(check, POLL_MS);
    };

    check();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [token, call]);

  const join = async () => {
    setBusy(true);
    setNotice(null);
    try {
      setCall(await joinAsGuest(token));
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) setPhase('closed');
      else if (err instanceof ApiError && err.status === 409) {
        setPhase('waiting');
        setNotice('The interpreter has not arrived yet. Please wait a moment.');
      } else setNotice('We could not join the session. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (call) {
    return (
      <VideoRoom
        token={call.token}
        serverUrl={call.url}
        video={mode === 'video'}
        audio={mode !== 'listen'}
        onLeave={() => setCall(null)} // back to the lobby; they can rejoin while the session lasts
      />
    );
  }

  const canChoose = phase === 'waiting' || phase === 'ready';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
        backgroundColor: '#f5f4fb',
        fontFamily: "'Manrope', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          width: '100%',
          maxWidth: '440px',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ margin: '0 0 0.25rem', color: '#382c77', fontSize: '1.5rem' }}>SignConnect</h1>
        <h2 style={{ margin: '0 0 1rem', color: '#1e293b', fontSize: '1.1rem' }}>
          You are invited to an interpreted session
        </h2>

        <p role="status" style={{ color: '#1e293b', lineHeight: 1.5 }}>
          {messages[phase]}
        </p>
        {notice && (
          <p role="alert" style={{ color: '#c53030' }}>
            {notice}
          </p>
        )}

        {canChoose && (
          <>
            <fieldset style={{ border: 'none', padding: 0, margin: '1rem 0' }}>
              <legend style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                How do you want to join?
              </legend>
              {MODES.map((option) => (
                <label
                  key={option.value}
                  style={{ display: 'block', marginBottom: '0.6rem', color: '#1e293b' }}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                  />{' '}
                  <strong>{option.label}</strong>
                  <div style={{ marginLeft: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    {option.hint}
                  </div>
                </label>
              ))}
            </fieldset>

            <button
              type="button"
              onClick={join}
              disabled={phase !== 'ready' || busy}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: phase === 'ready' ? '#382c77' : '#94a3b8',
                cursor: phase === 'ready' && !busy ? 'pointer' : 'not-allowed',
              }}
            >
              {busy ? 'Joining…' : 'Join session'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
