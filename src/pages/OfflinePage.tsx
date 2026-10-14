// src/pages/OfflinePage.tsx
import { useNavigate } from 'react-router-dom';
import { RotateCw, ArrowLeft } from 'lucide-react';
import offlineIllustration from '../assets/offline-illustration.png';
import './OfflinePage.css';

export function OfflinePage() {
  const navigate = useNavigate();

  return (
    <main className="op-page">
      <div className="op-content">
        <div className="op-illustration">
          <img src={offlineIllustration} alt="You're offline" />
        </div>

        <div className="op-text">
          <h1 className="op-title">You're offline</h1>
          <p className="op-description">
            Looks like you're not connected to the internet. We can't create your account right now,
            but don't worry — you can try again once you're back online.
          </p>

          <button type="button" className="op-btn" onClick={() => window.location.reload()}>
            <RotateCw size={18} aria-hidden="true" />
            Try Again
          </button>

          <button type="button" className="op-back" onClick={() => navigate('/landing')}>
            <ArrowLeft size={16} aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
