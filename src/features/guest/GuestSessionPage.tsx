import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Video } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout'; // IMPORTED AuthLayout
import { ApiError } from '../../services/api';
import type { CallToken } from '../../services/callToken';
import { getGuestLobby, joinAsGuest } from '../../services/guestSession';
import { CallScreen } from '../../components/session/CallScreen';
import { liveKitConnectionWith } from '../session/callConnection';
import { useCall } from '../session/useCall';

type Mode = 'video' | 'audio' | 'listen';

/**
 * What each way of joining is allowed to send. "Audio only" never asks for a camera, and
 * "Listen only" asks for neither, so the browser does not even show the permission box for them.
 */
const CALL_MODES: Record<Mode, { video: boolean; audio: boolean }> = {
  video: { video: true, audio: true },
  audio: { video: false, audio: true },
  listen: { video: false, audio: false },
};

interface GuestCallProps {
  token: CallToken;
  mode: Mode;
  onLeave: () => void;
}

/** The call for the hearing guest: the same screen the Deaf user and interpreter get. */
function GuestCall({ token, mode, onLeave }: GuestCallProps) {
  const call = useCall({
    createConnection: liveKitConnectionWith(() => Promise.resolve(token)),
    mode: CALL_MODES[mode],
  });

  // If the connection drops, go back to the waiting page, which checks the session again.
  const { lost } = call;
  useEffect(() => {
    if (lost) onLeave();
    // onLeave is a new function every render; only a drop should send the guest back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lost]);

  // Joins as soon as the browser has given the camera and microphone (or said no).
  const { ready, join } = call;
  useEffect(() => {
    if (ready) void join();
    // join changes every render; the call must start once, when ready turns true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <CallScreen
      call={call}
      selfName="Hearing guest"
      onLeave={() => {
        call.leave();
        onLeave();
      }}
    />
  );
}
type Phase = 'waiting' | 'ready' | 'closed' | 'invalid';

const POLL_MS = 3000;

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

export function GuestSessionPage() {
  const { token = '' } = useParams();
  const [phase, setPhase] = useState<Phase>('waiting');
  const [mode, setMode] = useState<Mode>('video');
  const [call, setCall] = useState<CallToken | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (call) return;
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
    return <GuestCall token={call} mode={mode} onLeave={() => setCall(null)} />;
  }

  const canChoose = phase === 'waiting' || phase === 'ready';

  return (
    <AuthLayout
      title="You are invited to an interpreted session"
      subtitle={messages[phase]}
      backTo="/"
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {notice && (
          <p role="alert" style={{ color: '#b91c1c', marginBottom: '16px', textAlign: 'center' }}>
            {notice}
          </p>
        )}

        {canChoose && (
          <>
            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 24px 0' }}>
              <legend
                style={{
                  fontWeight: 600,
                  color: '#1b1240',
                  marginBottom: '16px',
                  fontSize: '0.95rem',
                }}
              >
                How do you want to join?
              </legend>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {MODES.map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={mode === option.value}
                      onChange={() => setMode(option.value)}
                      style={{ marginTop: '4px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1b1240', fontSize: '0.95rem' }}>
                        {option.label}
                      </div>
                      <div style={{ color: '#6b6785', fontSize: '0.85rem', marginTop: '2px' }}>
                        {option.hint}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={join}
              disabled={phase !== 'ready' || busy}
              className="ls-btn ls-btn--primary"
              style={{ marginTop: 0 }}
            >
              <Video size={18} aria-hidden="true" /> {busy ? 'Joining…' : 'Join session'}
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
