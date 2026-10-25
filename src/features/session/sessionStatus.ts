import type { SessionRequestState } from '../../services/sessionRequests';

/** The four stages a person sees, plus "problem" for a session that did not work out. */
export type StatusStage = 'waiting' | 'connecting' | 'connected' | 'ended' | 'problem';

export interface StatusLabel {
  stage: StatusStage;
  /** Short headline for the banner. */
  title: string;
  /** One calm sentence saying what is happening and what, if anything, to do. */
  detail: string;
}

/**
 * The words shown for each internal state (V2-031). Every screen uses this one table, so the
 * wording cannot drift between pages. Completed, cancelled and failed each have their own
 * wording, so a person can tell how the session ended.
 */
export const STATUS_LABELS: Record<SessionRequestState, StatusLabel> = {
  CREATED: {
    stage: 'waiting',
    title: 'Sending your request',
    detail: 'Your request is being sent. This only takes a moment.',
  },
  QUEUED: {
    stage: 'waiting',
    title: 'Waiting for an interpreter',
    detail: 'We are looking for an available interpreter. You can stay on this page.',
  },
  OFFERED: {
    stage: 'waiting',
    title: 'Contacting an interpreter',
    detail: 'An interpreter has been asked to take your request. Waiting for their answer.',
  },
  ACCEPTED: {
    stage: 'connecting',
    title: 'Interpreter found',
    detail: 'An interpreter has accepted. Getting your session ready.',
  },
  CONNECTING: {
    stage: 'connecting',
    title: 'Connecting',
    detail: 'Setting up the video call. Please keep this page open.',
  },
  ACTIVE: {
    stage: 'connected',
    title: 'Connected',
    detail: 'Your session is live.',
  },
  COMPLETED: {
    stage: 'ended',
    title: 'Session ended',
    detail: 'This session has finished. Thank you for using SignConnect.',
  },
  CANCELLED: {
    stage: 'ended',
    title: 'Request cancelled',
    detail: 'This request was cancelled before the session started.',
  },
  FAILED: {
    stage: 'problem',
    title: 'We could not connect you',
    detail: 'No session could be started. You can make a new request.',
  },
};

/** An unknown state is shown as still waiting, the same way the request service treats it. */
export function labelFor(state: SessionRequestState | string): StatusLabel {
  return STATUS_LABELS[state as SessionRequestState] ?? STATUS_LABELS.QUEUED;
}
