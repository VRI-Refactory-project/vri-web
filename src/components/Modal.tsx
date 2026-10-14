import { useEffect, useRef, type ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  title: string;
  /** Called on Escape or a click outside. Leave out for a pop-up that must be answered. */
  onClose?: () => void;
  children: ReactNode;
}

/** A centred pop-up over a dimmed page. Focus moves into it when it opens. */
export function Modal({ title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose?.();
        }}
      >
        {children}
      </div>
    </div>
  );
}
