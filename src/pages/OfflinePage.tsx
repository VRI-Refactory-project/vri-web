import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, ArrowLeft } from 'lucide-react';
import offlineIllustration from '../assets/offline-illustration.png';
import './OfflinePage.css';

type OfflinePageProps = {
  overlay?: boolean;
  onRetry?: () => Promise<boolean>;
  onBack?: () => void;
};

export function OfflinePage({ overlay = false, onRetry, onBack }: OfflinePageProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);

  const retry = async () => {
    if (!onRetry) {
      window.location.reload();
      return;
    }

    setChecking(true);
    setStillOffline(false);

    const isBackOnline = await onRetry();

    setChecking(false);
    setStillOffline(!isBackOnline);
  };

  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate('/landing');
  };

  return (
    <main className={overlay ? 'op-page op-page--overlay' : 'op-page'}>
      <div className="op-content">
        <div className="op-illustration">
          <img src={offlineIllustration} alt="You're offline" />
        </div>

        <div className="op-text">
          <h1 className="op-title">You're offline</h1>

          <p className="op-description">
            Looks like you're not connected to the internet. Check your Wi-Fi or mobile data, then
            try again once you're back online.
          </p>

          <p className="op-status" role="status">
            {stillOffline ? 'Still offline. Check your connection and try again.' : ''}
          </p>

          <button type="button" className="op-btn" onClick={retry} disabled={checking}>
            <RotateCw size={18} aria-hidden="true" />
            {checking ? 'Checking...' : 'Try Again'}
          </button>

          <button type="button" className="op-back" onClick={goBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
