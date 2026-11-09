import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PhoneOff,
  CheckCircle2,
  Video as VideoIcon,
  X,
  Star,
} from 'lucide-react';
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

interface Props {
  viewerRole: 'deaf' | 'interpreter';
  createConnection?: CreateConnection;
}

// UPDATED: Removed Presentation
const CATEGORY_ISSUES: Record<string, { label: string }[]> = {
  Audio: [
    { label: 'Sound was delayed' },
    { label: 'There was echo' },
    { label: "Others couldn't hear me" },
    { label: "I couldn't hear others" },
    { label: 'Audio was breaking up' },
    { label: 'Other audio issue' },
  ],
  Video: [
    { label: 'The video was blurry' },
    { label: 'Audio and video were not in sync' },
    { label: "My camera didn't work" },
    { label: 'The video was breaking up' },
    { label: "I couldn't see others' video" },
    { label: 'Other video issue' },
  ],
  Other: [
    { label: 'Screen sharing issues' },
    { label: 'Connection dropped' },
    { label: 'Other issue' },
  ],
};

// UPDATED: Removed Presentation
const CATEGORIES = ['Audio', 'Video', 'Other'];

export function LiveSessionPage({ viewerRole, createConnection = createLiveKitConnection }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const interpreterName = (location.state as { interpreterName?: string } | null)?.interpreterName;
  const media = useLocalMedia();

  // For testing, you can temporarily change this to 'ended' or 'confirmEnd'
  const [phase, setPhase] = useState<Phase>('lobby');
  const [seconds, setSeconds] = useState(0);
  // const [lastLength, setLastLength] = useState(0);
  const [others, setOthers] = useState<RemotePerson[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const home = HOME[viewerRole];

  // --- Feedback Wizard State ---
  const [rating, setRating] = useState(0);
  const [feedbackStep, setFeedbackStep] = useState<'rating' | 'details' | 'success'>('rating');
  const [selectedCategory, setSelectedCategory] = useState('Audio');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (star: number) => {
    setRating(star);

    // Use a timeout so the user sees the star fill in before the page changes
    setTimeout(() => {
      if (star === 5) {
        setFeedbackStep('success');
        console.log('Submitted 5-star feedback');
      } else {
        setFeedbackStep('details');
      }
    }, 1000); // 1000ms delay
  };

  const toggleIssue = (label: string) => {
    setSelectedIssues((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const submitDetailedFeedback = async () => {
    setIsSubmitting(true);
    try {
      console.log('Feedback submitted:', {
        sessionId: id,
        rating,
        category: selectedCategory,
        issues: selectedIssues,
        customText: selectedCategory === 'Other' ? customFeedback : undefined,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      setFeedbackStep('success');
    } catch (error) {
      console.error('Failed to submit feedback', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeCategory = (direction: 'next' | 'prev') => {
    const currentIndex = CATEGORIES.indexOf(selectedCategory);
    if (direction === 'next' && currentIndex < CATEGORIES.length - 1) {
      setSelectedCategory(CATEGORIES[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedCategory(CATEGORIES[currentIndex - 1]);
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
    // setLastLength(Math.floor((Date.now() - startedAt.current) / 1000));
    setPhase('ended');
  };

  const selfName = session?.user?.name || 'You';
  const selfProfilePicture =
    (session?.user as unknown as { profilePicture?: string; photo_url?: string })?.profilePicture ||
    (session?.user as unknown as { profilePicture?: string; photo_url?: string })?.photo_url ||
    null;

  // --- ENDED SCREEN (GOOGLE MEET STYLE) ---
  if (phase === 'ended') {
    return (
      <div className="gm-ended-page">
        <div className="gm-ended-content">
          <h1 className="gm-ended-title">You left the session</h1>

          {/* Action Buttons */}
          <div className="gm-ended-actions">
            <button
              type="button"
              className="gm-btn gm-btn--outline"
              onClick={() => setPhase('lobby')}
            >
              Rejoin
            </button>
            <button type="button" className="gm-btn gm-btn--primary" onClick={() => navigate(home)}>
              Go to Dashboard
            </button>
          </div>

          {/* Feedback Wizard */}
          <div className="gm-feedback-card">
            {/* STEP 1: STAR RATING */}
            {feedbackStep === 'rating' && (
              <>
                <h3>How was the audio and video?</h3>
                <div className="gm-star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="gm-star-wrapper">
                      <button
                        type="button"
                        className={`gm-star-btn ${rating >= star ? 'active' : ''}`}
                        onClick={() => handleStarClick(star)}
                      >
                        <Star
                          size={32}
                          strokeWidth={1.5}
                          fill={rating >= star ? 'currentColor' : 'none'}
                        />
                      </button>
                      {star === 1 && <span className="gm-star-label">Very bad</span>}
                      {star === 5 && <span className="gm-star-label">Very good</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* STEP 2: WHAT WENT WRONG (Only for 1-4 stars) */}
            {feedbackStep === 'details' && (
              <div className="gm-issue-wizard">
                <div className="gm-stepper">
                  {CATEGORIES.map((cat, idx) => (
                    <div key={cat} className="gm-step-item">
                      <div
                        className={`gm-step-circle ${selectedCategory === cat ? 'active' : ''}`}
                      />
                      <span>{cat}</span>
                      {idx < CATEGORIES.length - 1 && <div className="gm-step-line" />}
                    </div>
                  ))}
                </div>

                <div className="gm-issue-slider">
                  <button
                    className="gm-nav-arrow"
                    onClick={() => changeCategory('prev')}
                    disabled={selectedCategory === 'Audio'}
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <div className="gm-issue-card">
                    <h3 className="gm-issue-title">What went wrong?</h3>

                    {/* NEW: Show textarea if "Other" is selected */}
                    {selectedCategory === 'Other' ? (
                      <div className="gm-other-input-wrapper">
                        <textarea
                          className="gm-other-textarea"
                          placeholder="Tell us more"
                          maxLength={500}
                          value={customFeedback}
                          onChange={(e) => setCustomFeedback(e.target.value)}
                        />
                        <span className="gm-char-count">{customFeedback.length}/500</span>
                      </div>
                    ) : (
                      /* Otherwise, show the normal checkboxes */
                      <div className="gm-issue-list">
                        {CATEGORY_ISSUES[selectedCategory].map((option) => (
                          <label key={option.label} className="gm-issue-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedIssues.includes(option.label)}
                              onChange={() => toggleIssue(option.label)}
                            />
                            <span className="gm-checkbox-custom" />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className="gm-nav-arrow"
                    onClick={() => changeCategory('next')}
                    disabled={selectedCategory === 'Other'}
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                <div className="gm-wizard-actions">
                  <button
                    className="gm-btn gm-btn--primary"
                    onClick={submitDetailedFeedback}
                    disabled={isSubmitting}
                    style={{ width: '100%' }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS MESSAGE */}
            {feedbackStep === 'success' && (
              <div className="gm-feedback-success">
                <CheckCircle2 size={40} color="#10b981" />
                <h3>Thank you for your feedback!</h3>
                <p>We appreciate you taking the time to help us improve.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Left Feedback Link */}
        <button
          type="button"
          className="gm-bottom-feedback"
          onClick={() => alert('Feedback opened')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Feedback
        </button>
      </div>
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

        {/* THE GRID: Everyone goes in here together */}
        <div className="ls-stage">
          <VideoTile
            name={selfName}
            stream={media.stream}
            cameraOff={!media.camOn}
            muted
            profilePicture={selfProfilePicture}
            highlight
          />
          {others.map((person) => (
            <VideoTile
              key={person.id}
              name={person.name}
              stream={person.stream}
              cameraOff={person.cameraOff}
              highlight={person.name === interpreterName}
            />
          ))}
          {others.length === 0 && (
            <div className="vt ls-waiting" role="status">
              Waiting for others to join…
            </div>
          )}
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
