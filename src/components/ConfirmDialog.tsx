// import { Check } from 'lucide-react';
// import './ConfirmDialog.css';

// interface Props {
//   open: boolean;
//   title: string;
//   message: string;
//   confirmLabel?: string;
//   onClose: () => void;
// }

// export function ConfirmDialog({
//   open,
//   title,
//   message,
//   confirmLabel = 'Done',
//   onClose,
// }: Props) {
//   if (!open) return null;

//   return (
//     <div className="cd-overlay" role="dialog" aria-modal="true" aria-labelledby="cd-title">
//       <div className="cd-card">
//         <div className="cd-icon" aria-hidden="true">
//           <Check size={20} strokeWidth={3} />
//         </div>
//         <h2 id="cd-title" className="cd-title">
//           {title}
//         </h2>
//         <p className="cd-message">{message}</p>
//         <button type="button" className="cd-btn" onClick={onClose}>
//           {confirmLabel}
//         </button>
//       </div>
//     </div>
//   );
// }

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
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

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

        <button
          type="button"
          className={`cd-btn cd-btn--${variant}`}
          onClick={() => onConfirm(withReason ? reason : undefined)}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}