import { useEffect, useState } from 'react';
import { AlertCircle, Check, Clock, Users, Video, X } from 'lucide-react';
import { offersApi, type InterpreterOffer } from '../../services/offersApi';
import { describeError } from '../../services/api';
import './RequestsPage.css';

const RESPONSE_TIMEOUT_SECONDS = 180;

export default function RequestsPage() {
  const [offers, setOffers] = useState<InterpreterOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    offersApi
      .getOffers()
      .then((data) => {
        if (active) setOffers(data);
      })
      .catch((err) => {
        if (active) setError(describeError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (offers.length === 0) return;
    const interval = setInterval(async () => {
      const pending = offers.filter((o) => new Date(o.expiresAt) > new Date());
      if (pending.length === 0) return;
      try {
        const updated = await Promise.all(
          pending.map(async (offer) => {
            const state = await offersApi.getOfferState(offer.id);
            return { id: offer.id, status: state.status };
          }),
        );
        setOffers((prev) => {
          let changed = false;
          const next = prev.filter((o) => {
            const update = updated.find((u) => u.id === o.id);
            if (update && update.status && update.status !== 'pending') {
              changed = true;
              return false;
            }
            return true;
          });
          return changed ? next : prev;
        });
      } catch {
        /* silent — background poll */
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [offers]);

  const handleAction = async (id: string, action: 'accept' | 'decline') => {
    setProcessingId(id);
    try {
      await offersApi.respondToOffer(id, action);
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      alert(describeError(err));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="requests-loading">Loading requests...</div>;

  return (
    <div className="requests-page">
      <header className="requests-header">
        <h1>Available requests</h1>
      </header>

      {error ? (
        <div className="requests-error">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <>
          <div className="requests-top-bar">
            <span>{offers.length} requests available</span>
            <select className="requests-sort">
              <option>Longest waiting first</option>
            </select>
          </div>

          <div className="requests-list">
            {offers.length === 0 ? (
              <div className="requests-empty">No pending requests right now.</div>
            ) : (
              offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  isProcessing={processingId === offer.id}
                  onAction={handleAction}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface OfferCardProps {
  offer: InterpreterOffer;
  isProcessing: boolean;
  onAction: (id: string, action: 'accept' | 'decline') => void;
}

function OfferCard({ offer, isProcessing, onAction }: OfferCardProps) {
  const [timeLeft, setTimeLeft] = useState(RESPONSE_TIMEOUT_SECONDS);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(offer.expiresAt).getTime();
      setTimeLeft(Math.max(0, Math.floor((expiry - now) / 1000)));
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [offer.expiresAt]);

  const isExpired = timeLeft === 0;
  const isUrgent = timeLeft < 60;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const r = (s % 60).toString().padStart(2, '0');
    return `${m}:${r}`;
  };

  return (
    <div className={`offer-card ${isExpired ? 'offer-card--expired' : ''}`}>
      <div className="offer-card__header">
        <div>
          <h2 className="offer-card__title">{offer.title}</h2>
          <p className="offer-card__institution">
            {offer.institutionName}
            {offer.sector ? ` · ${offer.sector}` : ''}
          </p>
        </div>
        <div
          className={`offer-badge ${
            isExpired
              ? 'offer-badge--expired'
              : isUrgent
                ? 'offer-badge--urgent'
                : 'offer-badge--safe'
          }`}
        >
          <Clock size={14} />
          <span>{isExpired ? 'Expired' : `Waiting ${formatTime(timeLeft)}`}</span>
        </div>
      </div>

      <div className="offer-card__details">
        {offer.language && (
          <div className="offer-detail">
            <Video size={16} /> {offer.language}
          </div>
        )}
        {offer.participants && (
          <div className="offer-detail">
            <Users size={16} /> {offer.participants}
          </div>
        )}
      </div>

      <div className="offer-card__actions">
        <button
          className="btn-decline"
          onClick={() => onAction(offer.id, 'decline')}
          disabled={isExpired || isProcessing}
        >
          <X size={16} /> Decline
        </button>
        <button
          className="btn-accept"
          onClick={() => onAction(offer.id, 'accept')}
          disabled={isExpired || isProcessing}
        >
          <Check size={16} /> {isProcessing ? 'Processing...' : 'Accept'}
        </button>
      </div>
    </div>
  );
}
