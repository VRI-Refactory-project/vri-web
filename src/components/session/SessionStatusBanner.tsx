import { CheckCircle2, Clock, Loader2, TriangleAlert, XCircle } from 'lucide-react';
import type { SessionRequestState } from '../../services/sessionRequests';
import { labelFor, type StatusStage } from '../../features/session/sessionStatus';
import './SessionStatusBanner.css';

const ICONS: Record<StatusStage, typeof Clock> = {
  waiting: Clock,
  connecting: Loader2,
  connected: CheckCircle2,
  ended: XCircle,
  problem: TriangleAlert,
};

interface Props {
  state: SessionRequestState;
  /** Shown once an interpreter has accepted, for example "Connecting with Sarah". */
  interpreterName?: string;
}

/**
 * Tells a participant where their session is (V2-031): waiting, connecting, connected or ended.
 * It reads the words from the one label table. A failed session is announced as an alert; every
 * other change is a polite status update for screen readers.
 */
export function SessionStatusBanner({ state, interpreterName }: Props) {
  const label = labelFor(state);
  const Icon = ICONS[label.stage];
  const withName =
    interpreterName && (state === 'CONNECTING' || state === 'ACTIVE')
      ? ` with ${interpreterName}`
      : '';
  return (
    <div
      className={`session-status session-status--${label.stage}`}
      role={label.stage === 'problem' ? 'alert' : 'status'}
      data-state={state}
    >
      <Icon
        className={`session-status__icon${label.stage === 'connecting' ? ' session-status__icon--spin' : ''}`}
        aria-hidden="true"
      />
      <div>
        <p className="session-status__title">
          {label.title}
          {withName}
        </p>
        <p className="session-status__detail">{label.detail}</p>
      </div>
    </div>
  );
}
