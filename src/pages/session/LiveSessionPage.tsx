import { useEffect, useState } from 'react';
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
import { BrandMark } from '../../components/session/BrandMark';
import { CallControls } from '../../components/session/CallControls';
import { CallScreen } from '../../components/session/CallScreen';
import { GuestInvitePanel } from '../../components/session/GuestInvitePanel';
import { VideoTile } from '../../components/session/VideoTile';
import { useCall } from '../../features/session/useCall';
import { useAuth } from '../../hooks/useAuth';
import {
  createLiveKitConnection,
  type CreateConnection,
} from '../../features/session/callConnection';
import { labelFor } from '../../features/session/sessionStatus';
import { openSessionSocket, type OpenSessionSocket } from '../../features/session/sessionSocket';
import { ApiError, describeError } from '../../services/api';
import {
  submitSessionFeedback,
  type FeedbackCategory,
  type FeedbackInput,
} from '../../services/sessionFeedback';
import {
  cancelSessionRequest,
  endSession,
  FINAL_STATES,
  type SessionRequestState,
} from '../../services/sessionRequests';
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
  /** Where to go when the session is over. Defaults to the role's own dashboard. */
  home?: string;
  createConnection?: CreateConnection;
  /** How the page hears that the session ended. Tests pass a fake one. */
  openSocket?: OpenSessionSocket;
}

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

const CATEGORIES: FeedbackCategory[] = ['Audio', 'Video', 'Other'];

// The question at the top of the feedback card, worded for each person's side of the call.
const FEEDBACK_QUESTION = {
  deaf: 'How was the audio and video?',
  interpreter: 'How was the call quality for you?',
} as const;

// The API keeps one category per feedback, so use the first one the person's choices belong to.
function categoryOf(issues: string[], comment: string): FeedbackCategory | undefined {
  for (const category of CATEGORIES) {
    if (CATEGORY_ISSUES[category].some((option) => issues.includes(option.label))) return category;
  }
  return comment.trim() ? 'Other' : undefined;
}

/**
 * The live session, for the Deaf user and the interpreter (V2-011, V2-031). One page walks through
 * the design's screens: the lobby ("Ready to connect?"), the call, the end-session confirmation
 * and the session-ended screen. The lobby previews the viewer's camera. "Join Session" asks the
 * API for a call token and joins the LiveKit room, and the other people's video and audio appear
 * as they arrive.
 */
export function LiveSessionPage({
  viewerRole,
  home: homeOverride,
  createConnection = createLiveKitConnection,
  openSocket = openSessionSocket,
}: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const interpreterName = (location.state as { interpreterName?: string } | null)?.interpreterName;
  // The camera, the connection, the others, chat, sharing and the timer: the same for every role.
  const call = useCall({ createConnection });
  const { media, leave } = call;

  const [rawPhase, setPhase] = useState<Phase>('lobby');
  // A dropped connection puts the person back in the lobby, where they can join again.
  const phase: Phase =
    call.lost && (rawPhase === 'call' || rawPhase === 'confirmEnd') ? 'lobby' : rawPhase;
  const [joinError, setJoinError] = useState<string | null>(null);
  // How the session ended, so the ended screen says the right thing (V2-031, V2-034).
  const [endedState, setEndedState] = useState<SessionRequestState>('COMPLETED');
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  // True for the person who pressed "End session", so their screen says "You left the session".
  const [endedByMe, setEndedByMe] = useState(false);
  // True for a person who only left the call. The session carries on for the others, so they may rejoin.
  const [leftEarly, setLeftEarly] = useState(false);
  const home = homeOverride ?? HOME[viewerRole];

  // --- Feedback Wizard State ---
  const [rating, setRating] = useState(0);
  const [feedbackStep, setFeedbackStep] = useState<'rating' | 'details' | 'success'>('rating');
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>('Audio');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Sends the feedback (V2-041). True when it is saved, or was already saved (say from another tab).
  const sendFeedback = async (input: FeedbackInput): Promise<boolean> => {
    if (!id) return false;
    setFeedbackError(null);
    try {
      await submitSessionFeedback(id, input);
      return true;
    } catch (err) {
      const code = err instanceof ApiError ? (err.body as { code?: string } | null)?.code : null;
      if (code === 'already_submitted') return true;
      setFeedbackError(describeError(err));
      return false;
    }
  };

  const handleStarClick = (star: number) => {
    setRating(star);

    setTimeout(() => {
      if (star === 5) {
        // Nothing went wrong, so a 5-star rating is the whole feedback.
        void sendFeedback({ rating: 5 }).then((saved) => {
          if (saved) setFeedbackStep('success');
        });
      } else {
        setFeedbackStep('details');
      }
    }, 1000);
  };

  const toggleIssue = (label: string) => {
    setSelectedIssues((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const submitDetailedFeedback = async () => {
    setIsSubmitting(true);
    const saved = await sendFeedback({
      rating,
      category: categoryOf(selectedIssues, customFeedback),
      issues: selectedIssues,
      comment: customFeedback.trim(),
    });
    if (saved) setFeedbackStep('success');
    setIsSubmitting(false);
  };

  const changeCategory = (direction: 'next' | 'prev') => {
    const currentIndex = CATEGORIES.indexOf(selectedCategory);
    if (direction === 'next' && currentIndex < CATEGORIES.length - 1) {
      setSelectedCategory(CATEGORIES[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedCategory(CATEGORIES[currentIndex - 1]);
    }
  };

  // The server tells everyone when the session ends, whoever ended it (V2-034).
  useEffect(() => {
    if (!id) return;
    const socket = openSocket(id, {
      onStatus: (state) => {
        if (!FINAL_STATES.includes(state)) return;
        leave();
        // The session is over for everyone now, so there is nothing left to rejoin.
        setLeftEarly(false);
        setEndedState(state);
        setPhase('ended');
      },
    });
    return () => socket.close();
  }, [id, openSocket, leave]);

  const join = async () => {
    setJoinError(null);
    setLeftEarly(false);
    setPhase('joining');
    const joined = await call.join(id ?? '');
    setPhase(joined ? 'call' : 'lobby');
  };

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

  // Ends the session for everyone. If the server refuses, the person stays in the call.
  const endCall = async () => {
    if (!id) return;
    setEnding(true);
    setEndError(null);
    setEndedByMe(true);
    try {
      await endSession(id);
    } catch (err) {
      setEndError(describeError(err));
      setEndedByMe(false);
      setEnding(false);
      return;
    }
    setEnding(false);
    leave();
    setEndedState('COMPLETED');
    setPhase('ended');
  };

  // Leaving ends nothing: the others stay in the session, and this person may rejoin (V2-033).
  const leaveCall = () => {
    leave();
    setLeftEarly(true);
    setPhase('ended');
  };

  // Only the person who started the session (the Deaf user) can end it for everyone.
  const canEnd = viewerRole === 'deaf';

  const selfName = session?.user?.name || 'You';
  const selfProfilePicture =
    (session?.user as unknown as { profilePicture?: string; photo_url?: string })?.profilePicture ||
    (session?.user as unknown as { profilePicture?: string; photo_url?: string })?.photo_url ||
    null;

  if (phase === 'ended') {
    // The person who ended it hears "You left"; everyone else is told how the session ended.
    const endedTitle =
      leftEarly || (endedByMe && endedState === 'COMPLETED')
        ? 'You left the session'
        : labelFor(endedState).title;
    // Rejoin only makes sense for someone who left while the session carries on for the others.
    const canRejoin = leftEarly;
    // Feedback is for a finished session. Someone who only left has nothing to rate yet.
    const canGiveFeedback = endedState === 'COMPLETED' && !leftEarly;
    return (
      <div className="gm-ended-page">
        <div className="gm-ended-content">
          <h1 className="gm-ended-title">{endedTitle}</h1>

          <div className="gm-ended-actions">
            {canRejoin && (
              <button
                type="button"
                className="gm-btn gm-btn--outline"
                onClick={() => setPhase('lobby')}
              >
                Rejoin
              </button>
            )}
            <button type="button" className="gm-btn gm-btn--primary" onClick={() => navigate(home)}>
              Go to Dashboard
            </button>
          </div>

          {canGiveFeedback && (
            <div className="gm-feedback-card">
              {feedbackError && (
                <p className="ls-error" role="alert">
                  {feedbackError}
                </p>
              )}
              {feedbackStep === 'rating' && (
                <>
                  <h3>{FEEDBACK_QUESTION[viewerRole]}</h3>
                  <div className="gm-star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="gm-star-wrapper">
                        <button
                          type="button"
                          className={`gm-star-btn ${rating >= star ? 'active' : ''}`}
                          aria-label={`${star} out of 5`}
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

              {feedbackStep === 'success' && (
                <div className="gm-feedback-success">
                  <CheckCircle2 size={40} color="#10b981" />
                  <h3>Thank you for your feedback!</h3>
                  <p>We appreciate you taking the time to help us improve.</p>
                </div>
              )}
            </div>
          )}
        </div>

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
          {endError && (
            <p className="ls-error" role="alert">
              {endError}
            </p>
          )}
          <button
            type="button"
            className="ls-btn ls-btn--primary"
            onClick={() => void endCall()}
            disabled={ending}
          >
            End session
          </button>
          <button
            type="button"
            className="ls-btn ls-btn--outline"
            onClick={() => {
              setEndError(null);
              setPhase('call');
            }}
            disabled={ending}
          >
            Continue session
          </button>
        </section>
      </main>
    );
  }

  if (phase === 'call') {
    return (
      <CallScreen
        call={call}
        selfName={selfName}
        selfPicture={selfProfilePicture}
        selfEmail={session?.user?.email}
        highlightName={viewerRole === 'deaf' ? interpreterName : undefined}
        headerExtra={
          <>
            <SessionStatusBanner
              state="ACTIVE"
              interpreterName={viewerRole === 'deaf' ? interpreterName : undefined}
            />
            {viewerRole === 'deaf' && id && <GuestInvitePanel sessionId={id} />}
          </>
        }
        onLeave={leaveCall}
        onEnd={canEnd ? () => setPhase('confirmEnd') : undefined}
      />
    );
  }

  const joining = phase === 'joining';
  return (
    <main className="ls">
      <header className="ls-top">
        <BrandMark />
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
              onToggleMic={call.toggleMic}
              onToggleCam={call.toggleCam}
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
          {(joinError ?? call.error ?? media.error) && (
            <p className="ls-error" role="alert">
              {joinError ?? call.error ?? media.error}
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
