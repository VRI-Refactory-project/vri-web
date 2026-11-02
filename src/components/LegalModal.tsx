import React from 'react';
import { X } from 'lucide-react';
import './LegalContent.css'; // We will use the CSS you already created here

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="legal-modal-backdrop" onClick={onClose}>
      <div className="legal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="legal-modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="legal-modal-body">{children}</div>
      </div>
    </div>
  );
};
