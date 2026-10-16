import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import './ConfirmDialog.css';

interface Props {
  open: boolean;
  variant?: 'success' | 'danger';
  title: string;
  message: string;
  confirmLabel?: string;
  withReason?: boolean;
  reasonPlaceholder?: string;
  /** Shown under the reason box, for example when the server refused the action. */
  error?: string;
  /** Disables the button while the action is being sent. */
  busy?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  variant = 'success',
  title,
  message,
  confirmLabel = 'Done',
  withReason = false,
  reasonPlaceholder = 'Reason for rejection',
  error = '',
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState('');

  //   useEffect(() => {
  //     if (open) setReason('');
  //   }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const Icon = variant === 'danger' ? X : Check;

  return (
    <div
      className="cd-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      onClick={onClose}
    >
      <div className="cd-card" onClick={(e) => e.stopPropagation()}>
        <div className={`cd-icon cd-icon--${variant}`} aria-hidden="true">
          <Icon size={20} strokeWidth={3} />
        </div>

        <h2 id="cd-title" className="cd-title">
          {title}
        </h2>
        <p className="cd-message">{message}</p>

        {withReason && (
          <input
            type="text"
            className="cd-input"
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        )}

        {error && (
          <p className="cd-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className={`cd-btn cd-btn--${variant}`}
          disabled={busy}
          onClick={() => onConfirm(withReason ? reason : undefined)}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
