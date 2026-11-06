import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, PhoneOff, CheckCircle2, Video as VideoIcon, X } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SessionStatusBanner } from '../../components/session/SessionStatusBanner';
import { CallControls } from '../../components/session/CallControls';
import { GuestInvitePanel } from '../../components/session/GuestInvitePanel';
import { VideoTile } from '../../components/session/VideoTile';
import { useLocalMedia } from '../../features/session/useLocalMedia';
import {
  createLiveKitConnection,
  type CreateConnection,
  type RemotePerson,
} from '../../features/session/callConnection';
import { describeError } from '../../services/api';
import { formatDuration } from '../../services/liveSession';
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
  /** How the page reaches the video server. Tests pass a fake one. */
  createConnection?: CreateConnection;
}

/**
 * The live session, for the Deaf user and the interpreter (V2-011, V2-031). One page walks through
 * the design's screens: the lobby ("Ready to connect?"), the call, the end-session confirmation
 * and the session-ended screen. The lobby previews the viewer's camera. "Join Session" asks the
 * API for a call token and joins the LiveKit room, and the other people's video and audio appear
 * as they arrive.
 */
export function LiveSessionPage({ viewerRole, createConnection = createLiveKitConnection }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const interpreterName = (location.state as { interpreterName?: string } | null)?.interpreterName;
  const media = useLocalMedia();
  const [phase, setPhase] = useState<Phase>('lobby');
  // const [phase, setPhase] = useState<Phase>('ended');
  const [seconds, setSeconds] = useState(0);
  const [lastLength, setLastLength] = useState(0);
  const [others, setOthers] = useState<RemotePerson[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const home = HOME[viewerRole];

  const [connection] = useState(() =>
    createConnection({
      onPeople: setOthers,
      onLost: () => {
        setJoinError('You were disconnected from the call. Join again to reconnect.');
        setPhase('lobby');
      },
    }),
  );
  // Leaving the page leaves the call.
  useEffect(() => () => connection.leave(), [connection]);

  const join = async () => {
    setJoinError(null);
    setPhase('joining');
    try {
      await connection.join(id ?? '', media.stream);
      // What the viewer chose in the lobby carries into the call.
      connection.setMic(media.micOn);
      connection.setCam(media.camOn);
      startedAt.current = Date.now();
      setSeconds(0);
      setPhase('call');
    } catch (err) {
      setJoinError(describeError(err));
      setPhase('lobby');
    }
  };

  const toggleMic = () => {
    media.toggleMic();
    connection.setMic(!media.micOn);
  };
  const toggleCam = () => {
    media.toggleCam();
    connection.setCam(!media.camOn);
  };

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
    connection.leave();
    setLastLength(Math.floor((Date.now() - startedAt.current) / 1000));
    setPhase('ended');
  };

  const selfName = 'You';

  if (phase === 'ended') {
    return (
      <main className="ls ls--center">
        <section className="ls-card" aria-labelledby="ls-ended">
          <span className="ls-badge" aria-hidden="true">
            <CheckCircle2 size={34} />
          </span>
          <h1 id="ls-ended">Session ended</h1>
          <p>Your session lasted {formatDuration(lastLength)}.</p>
          {/* <SessionStatusBanner state="COMPLETED" /> */}
          <div className="custom-ended-banner">
            <div className="custom-ended-icon">
              <X size={14} />
            </div>
            <div className="custom-ended-text">
              <strong>Session ended</strong>
              <p>This session has finished. Thank you for using SignConnect.</p>
            </div>
          </div>
          {/* 👆 END OF CUSTOM HTML 👆 */}

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
          interpreterName={viewerRole === 'deaf' ? interpreterName : undefined}
        />
        {viewerRole === 'deaf' && id && <GuestInvitePanel sessionId={id} />}
        <div className="ls-stage">
          <VideoTile name={selfName} stream={media.stream} cameraOff={!media.camOn} large muted />
          <div className="ls-side">
            {others.length === 0 && (
              <p className="vt ls-waiting" role="status">
                Waiting for others to join…
              </p>
            )}
            {others.map((person) => (
              <VideoTile
                key={person.id}
                name={person.name}
                stream={person.stream}
                cameraOff={person.cameraOff}
                highlight={person.name === interpreterName}
              />
            ))}
          </div>
        </div>
        <CallControls
          micOn={media.micOn}
          camOn={media.camOn}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
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
          <VideoTile name={selfName} stream={media.stream} cameraOff={!media.camOn} large muted />
          <div className="ls-preview-controls">
            <CallControls
              micOn={media.micOn}
              camOn={media.camOn}
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
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
          {(joinError ?? media.error) && (
            <p className="ls-error" role="alert">
              {joinError ?? media.error}
            </p>
          )}
          {viewerRole === 'deaf' && id && <GuestInvitePanel sessionId={id} />}
          <button
            type="button"
            className="ls-btn ls-btn--primary"
            onClick={join}
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
