import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, PhoneOff, CheckCircle2, Video as VideoIcon, X } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SessionStatusBanner } from '../../components/session/SessionStatusBanner';
import { CallControls } from '../../components/session/CallControls';
import { VideoTile } from '../../components/session/VideoTile';
import { useLocalMedia } from '../../features/session/useLocalMedia';
import { buildParticipants, formatDuration } from '../../services/liveSession';
import { cancelSessionRequest, type SessionRequestState } from '../../services/sessionRequests';
import './LiveSessionPage.css';

type Phase = 'lobby' | 'joining' | 'call' | 'confirmEnd' | 'ended';

/** What the status banner says in each phase. It follows the server's state once V2-011 sends it. */
const BANNER: Record<Phase, SessionRequestState> = {
  lobby: 'ACCEPTED',
  joining: 'CONNECTING',
  call: 'ACTIVE',
  confirmEnd: 'ACTIVE',
  ended: 'COMPLETED',
};

const HOME = { deaf: '/dashboard/deaf', interpreter: '/dashboard/interpreter' } as const;

interface Props {
  viewerRole: 'deaf' | 'interpreter';
  /** How long "Connecting" lasts before the call opens, until real signalling replaces it. */
  connectMs?: number;
}

/**
 * The live session, for the Deaf user and the interpreter (V2-011, V2-031). One page walks through
 * the design's screens: the lobby ("Ready to connect?"), the call, the end-session confirmation
 * and the session-ended screen. The viewer's own camera and microphone work; the other people's
 * video arrives with the WebRTC server, so their tiles show initials for now.
 */
export function LiveSessionPage({ viewerRole, connectMs = 1500 }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const interpreterName = (location.state as { interpreterName?: string } | null)?.interpreterName;
  const media = useLocalMedia();
  const [phase, setPhase] = useState<Phase>('lobby');
  const [seconds, setSeconds] = useState(0);
  const [lastLength, setLastLength] = useState(0);
  const startedAt = useRef(0);
  const people = useMemo(
    () => buildParticipants({ viewerRole, interpreterName }),
    [viewerRole, interpreterName],
  );
  const home = HOME[viewerRole];

  // "Connecting" then the call. This stands in for the signalling server.
  useEffect(() => {
    if (phase !== 'joining') return;
    const timer = setTimeout(() => {
      startedAt.current = Date.now();
      setSeconds(0);
      setPhase('call');
    }, connectMs);
    return () => clearTimeout(timer);
  }, [phase, connectMs]);

  useEffect(() => {
    if (phase !== 'call' && phase !== 'confirmEnd') return;
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [phase]);

  const cancelLobby = async () => {
    // The Deaf user's request is still open until they join, so cancelling frees the queue.
    if (viewerRole === 'deaf' && id) {
      try {
        await cancelSessionRequest(id);
      } catch {
        // already closed on the server: leaving is still right
      }
    }
    navigate(home);
  };

  const endCall = () => {
    setLastLength(Math.floor((Date.now() - startedAt.current) / 1000));
    setPhase('ended');
  };

  const self = people[0];
  const others = people.slice(1);

  if (phase === 'ended') {
    return (
      <main className="ls ls--center">
        <section className="ls-card" aria-labelledby="ls-ended">
          <span className="ls-badge" aria-hidden="true">
            <CheckCircle2 size={34} />
          </span>
          <h1 id="ls-ended">Session ended</h1>
          <p>Your session lasted {formatDuration(lastLength)}.</p>
          <SessionStatusBanner state="COMPLETED" />
          <button type="button" className="ls-btn ls-btn--primary" onClick={() => navigate(home)}>
            Back to dashboard
          </button>
        </section>
      </main>
    );
  }

  if (phase === 'confirmEnd') {
    return (
      <main className="ls ls--center">
        <section className="ls-card" role="dialog" aria-labelledby="ls-end-title">
          <span className="ls-badge" aria-hidden="true">
            <PhoneOff size={30} />
          </span>
          <h1 id="ls-end-title">End this session?</h1>
          <p>Everyone will be disconnected from the session.</p>
          <button type="button" className="ls-btn ls-btn--primary" onClick={endCall}>
            End session
          </button>
          <button type="button" className="ls-btn ls-btn--outline" onClick={() => setPhase('call')}>
            Continue session
          </button>
        </section>
      </main>
    );
  }

  if (phase === 'call') {
    const [first, second] = others;
    return (
      <main className="ls ls--call">
        <header className="ls-top">
          <span className="ls-brand">SignConnect</span>
          <span className="ls-timer" aria-label="Call length">
            {formatDuration(seconds)}
          </span>
        </header>
        <SessionStatusBanner
          state="ACTIVE"
          interpreterName={viewerRole === 'deaf' ? first.name : undefined}
        />
        <div className="ls-stage">
          <VideoTile name={self.name} stream={media.stream} cameraOff={!media.camOn} large muted />
          <div className="ls-side">
            <VideoTile name={first.name} highlight={first.role === 'interpreter'} />
            <VideoTile name={second.name} />
          </div>
        </div>
        <CallControls
          micOn={media.micOn}
          camOn={media.camOn}
          onToggleMic={media.toggleMic}
          onToggleCam={media.toggleCam}
          onEnd={() => setPhase('confirmEnd')}
        />
      </main>
    );
  }

  // lobby and joining
  const joining = phase === 'joining';
  return (
    <main className="ls">
      <header className="ls-top">
        <span className="ls-brand">SignConnect</span>
      </header>
      <div className="ls-lobby">
        <div className="ls-preview">
          <VideoTile name={self.name} stream={media.stream} cameraOff={!media.camOn} large muted />
          <div className="ls-preview-controls">
            <CallControls
              micOn={media.micOn}
              camOn={media.camOn}
              onToggleMic={media.toggleMic}
              onToggleCam={media.toggleCam}
              onEnd={() => undefined}
              lobby
            />
          </div>
        </div>
        <section className="ls-ready" aria-labelledby="ls-ready-title">
          <h1 id="ls-ready-title">Ready to connect?</h1>
          <p className="ls-ready-sub">
            {viewerRole === 'deaf'
              ? 'You’re about to join a session with'
              : 'You’re about to join the session'}
          </p>
          {viewerRole === 'deaf' && (
            <p className="ls-who">
              <strong>{interpreterName ?? 'Your interpreter'}</strong>
              <span className="ls-verified">Verified Interpreter</span>
            </p>
          )}
          <SessionStatusBanner state={BANNER[phase]} interpreterName={interpreterName} />
          {media.error && (
            <p className="ls-error" role="alert">
              {media.error}
            </p>
          )}
          <button
            type="button"
            className="ls-btn ls-btn--primary"
            onClick={() => setPhase('joining')}
            disabled={joining}
          >
            <VideoIcon size={18} aria-hidden="true" /> {joining ? 'Connecting…' : 'Join Session'}
          </button>
          <button
            type="button"
            className="ls-btn ls-btn--outline"
            onClick={cancelLobby}
            disabled={joining}
          >
            <X size={18} aria-hidden="true" /> Cancel
          </button>
        </section>
      </div>
      <button type="button" className="ls-back" onClick={cancelLobby} disabled={joining}>
        <ChevronLeft size={18} aria-hidden="true" /> Back
      </button>
    </main>
  );
}
