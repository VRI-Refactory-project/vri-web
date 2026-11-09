import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, PhoneOff, CheckCircle2, Video as VideoIcon, X, Star } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SessionStatusBanner } from '../../components/session/SessionStatusBanner';
import { CallControls } from '../../components/session/CallControls';
import { GuestInvitePanel } from '../../components/session/GuestInvitePanel';
import { VideoTile } from '../../components/session/VideoTile';
import { useLocalMedia } from '../../features/session/useLocalMedia';
import { useAuth } from '../../hooks/useAuth';
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

const BANNER: Record<Phase, SessionRequestState> = {
  lobby: 'ACCEPTED',
  joining: 'CONNECTING',
  call: 'ACTIVE',
  confirmEnd: 'ACTIVE',
  ended: 'COMPLETED',
};

const HOME = { deaf: '/dashboard/deaf', interpreter: '/dashboard/interpreter' } as const;

const FEEDBACK_TAGS = [
  'Great Interpreter',
  'Clear Video',
  'Clear Audio',
  'Professional',
  'Technical Issues',
];

interface Props {
  viewerRole: 'deaf' | 'interpreter';
  createConnection?: CreateConnection;
}

export function LiveSessionPage({ viewerRole, createConnection = createLiveKitConnection }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const interpreterName = (location.state as { interpreterName?: string } | null)?.interpreterName;
  const media = useLocalMedia();
  const [phase, setPhase] = useState<Phase>('lobby');
  const [seconds, setSeconds] = useState(0);
  const [lastLength, setLastLength] = useState(0);
  const [others, setOthers] = useState<RemotePerson[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const home = HOME[viewerRole];

  // --- Feedback State ---
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const submitFeedback = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      console.log('Feedback submitted:', {
        sessionId: id,
        rating,
        tags: selectedTags,
        comment: feedbackText,
      });
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [connection] = useState(() =>
    createConnection({
      onPeople: setOthers,
      onLost: () => {
        setJoinError('You were disconnected from the call. Join again to reconnect.');
        setPhase('lobby');
      },
    }),
  );

  useEffect(() => () => connection.leave(), [connection]);

  const join = async () => {
    setJoinError(null);
    setPhase('joining');
    try {
      await connection.join(id ?? '', media.stream);
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

  // Use the real user name instead of 'You'
  const selfName = session?.user?.name || 'You';
  // Safely access the profile picture field if it exists (removed 'any')
  const selfProfilePicture =
    (session?.user as unknown as { profilePicture?: string; photo_url?: string })?.profilePicture ||
    (session?.user as unknown as { profilePicture?: string; photo_url?: string })?.photo_url ||
    null;

  if (phase === 'ended') {
    return (
      <main className="ls ls--center">
        <section className="ls-card" aria-labelledby="ls-ended">
          <span className="ls-badge" aria-hidden="true">
            <CheckCircle2 size={34} />
          </span>
          <h1 id="ls-ended">Session ended</h1>
          <p>Your session lasted {formatDuration(lastLength)}.</p>

          <div className="custom-ended-banner">
            <div className="custom-ended-icon">
              <X size={14} />
            </div>
            <div className="custom-ended-text">
              <strong>Session ended</strong>
              <p>This session has finished. Thank you for using SignConnect.</p>
            </div>
          </div>

          {!feedbackSubmitted ? (
            <div className="feedback-form">
              <h3>How was your session?</h3>
              <p>Your feedback helps us improve SignConnect.</p>

              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} out of 5`}
                  >
                    <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>

              <div className="feedback-tags">
                {FEEDBACK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`feedback-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <textarea
                className="feedback-textarea"
                placeholder="Tell us more... (Optional)"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
              />

              <button
                type="button"
                className="ls-btn ls-btn--primary"
                onClick={submitFeedback}
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          ) : (
            <div className="feedback-success">
              <CheckCircle2 size={48} className="text-green-500" />
              <h3>Thank you!</h3>
              <p>We appreciate you taking the time to help us improve.</p>
            </div>
          )}

          <button
            type="button"
            className="ls-btn ls-btn--outline"
            onClick={() => navigate(home)}
            style={{ marginTop: feedbackSubmitted ? '16px' : '0' }}
          >
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
          <VideoTile
            name={selfName}
            stream={media.stream}
            cameraOff={!media.camOn}
            large
            muted
            profilePicture={selfProfilePicture}
          />
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

  const joining = phase === 'joining';
  return (
    <main className="ls">
      <header className="ls-top">
        <span className="ls-brand">SignConnect</span>
      </header>
      <div className="ls-lobby">
        <div className="ls-preview">
          <VideoTile
            name={selfName}
            stream={media.stream}
            cameraOff={!media.camOn}
            large
            muted
            profilePicture={selfProfilePicture}
          />
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
