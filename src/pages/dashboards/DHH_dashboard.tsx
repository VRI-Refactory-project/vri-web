import {
  Video,
  Settings,
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import './DHH_dashboard.css';
import { InterpreterProfileModal } from './InterpreterProfileModal';
import {
  getAvailableInterpreters,
  type AvailableInterpreter,
} from '../../services/availableInterpreters';

/** The part of GET /api/v1/dashboard/deaf/ this page uses. */
interface DeafDashboard {
  requests: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
}

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export function DashboardPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const firstName = (session?.user.name ?? '').trim().split(/\s+/)[0] ?? '';

  // --- STATE ---
  const [sessions, setSessions] = useState<DeafDashboard['sessions'] | null>(null);

  // null while loading; empty when nobody is available right now.
  const [interpreters, setInterpreters] = useState<AvailableInterpreter[] | null>(null);
  const [openProfileId, setOpenProfileId] = useState<number | null>(null);

  // State for stats (Defaults to 0 until backend is connected)
  const [stats, setStats] = useState({
    walletBalance: 0,
    monthlySessions: 0,
    monthlyMinutes: 0,
  });

  // --- EFFECTS ---
  useEffect(() => {
    let cancelled = false;

    api<DeafDashboard>('/api/v1/dashboard/deaf/').then(
      (data) => {
        if (!cancelled) {
          setSessions(data.sessions);

          // This sets the stats to 0 for now.
          // It also satisfies the ESLint rule that requires setStats to be used.
          setStats({
            walletBalance: 0,
            monthlySessions: 0,
            monthlyMinutes: 0,
          });

          // When backend is ready, I will replace the 0s above with actual API fields:
          // setStats({
          //   walletBalance: data.wallet_balance || 0,
          //   monthlySessions: data.monthly_sessions || 0,
          //   monthlyMinutes: data.monthly_minutes || 0
          // });
        }
      },
      () => {
        if (!cancelled) setSessions([]);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAvailableInterpreters().then(
      (list) => {
        if (!cancelled) setInterpreters(list);
      },
      () => {
        if (!cancelled) setInterpreters([]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const sessionCount = sessions?.length ?? 0;

  // --- HELPERS ---
  const formatCurrency = (amount: number) => {
    // Format the number with commas (e.g., 50000 -> "50,000")
    const formattedNumber = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount);

    // Hardcode the prefix to guarantee it says "UGX"
    return `UGX ${formattedNumber}`;
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="greeting">{[greeting(), firstName].filter(Boolean).join(', ')}</h1>
          <p className="sub-greeting">How can we help you communicate today?</p>
        </div>
        <button className="icon-btn notification-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>
      </header>

      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <span className="hero-tag">ON DEMAND VRI</span>
          <h2 className="hero-title">Start session now</h2>
          <p className="hero-subtitle">Connect with a verified interpreter in under two minutes.</p>

          <div className="hero-buttons-group">
            <button
              className="dash-btn-primary"
              onClick={() => navigate('/dashboard/deaf/sessions/new')}
            >
              <Video size={18} /> Start VRI Session
            </button>

            <button
              className="dash-btn-emergency"
              onClick={() => navigate('/dashboard/deaf/sessions/new?priority=emergency')}
            >
              <AlertCircle size={18} /> Emergency Request
            </button>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <button className="action-card" onClick={() => navigate('/dashboard/deaf/schedule')}>
          <div className="action-icon">
            <Calendar size={20} />
          </div>
          <div className="action-text">
            <strong>Schedule Session</strong>
            <span>Book for later</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </button>
        <button className="action-card" onClick={() => navigate('/dashboard/deaf/accessibility')}>
          <div className="action-icon">
            <Settings size={20} />
          </div>
          <div className="action-text">
            <strong>Accessibility Setup</strong>
            <span>Communication preferences</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </button>
      </section>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Upcoming</span>
          <span className="stat-value">
            {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
          </span>
          <span className="stat-sub">
            {sessionCount === 0 ? 'Nothing booked yet' : 'Scheduled with an interpreter'}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Wallet</span>
          <span className="stat-value">{formatCurrency(stats.walletBalance)}</span>
          <span className="stat-sub">Available balance</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">This month</span>
          <span className="stat-value">
            {stats.monthlySessions} {stats.monthlySessions === 1 ? 'session' : 'sessions'}
          </span>
          <span className="stat-sub">{formatTime(stats.monthlyMinutes)} interpreted</span>
        </div>
      </section>

      {/* Upcoming Sessions */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3>Upcoming sessions</h3>
          <a href="#" className="view-all">
            View all <ChevronRight size={16} />
          </a>
        </div>

        <div className="session-list">
          {sessions !== null && sessionCount === 0 && (
            <p className="text-muted">No upcoming sessions yet.</p>
          )}
          {sessions?.map((item, index) => (
            <div key={String(item.id ?? index)} className="session-card">
              <div className="session-details">
                <h4>{String(item.interpreter_name ?? 'Interpreter session')}</h4>
                <p>
                  <Clock size={14} /> {String(item.starts_at ?? '')}
                </p>
              </div>
              <div className="session-status">
                <span className="badge badge-scheduled">Scheduled</span>
              </div>
              <ChevronRight size={20} className="session-arrow" />
            </div>
          ))}
        </div>
      </section>

      {/* Available Interpreters */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3>Available interpreters</h3>
          <a href="#" className="view-all">
            See all <ChevronRight size={16} />
          </a>
        </div>

        {interpreters !== null && interpreters.length === 0 && (
          <p className="text-muted">No interpreters are available right now.</p>
        )}
        <div className="interpreter-grid">
          {interpreters?.map((interpreter) => (
            <div key={interpreter.id} className="interpreter-card">
              <div className="interpreter-image-wrap">
                {interpreter.photoUrl ? (
                  <img src={interpreter.photoUrl} alt={interpreter.name} />
                ) : (
                  <div
                    aria-hidden="true"
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#e5e7eb',
                      color: '#374151',
                      fontSize: 32,
                      fontWeight: 600,
                    }}
                  >
                    {initials(interpreter.name)}
                  </div>
                )}
                <span className="status-badge">Available</span>
              </div>
              <div className="interpreter-info">
                <div className="interpreter-header">
                  <h4>{interpreter.name}</h4>
                  <CheckCircle2 size={16} className="verified-icon" />
                </div>
                <p className="interpreter-langs">{interpreter.signLanguages.join(', ')}</p>
                <div className="interpreter-rating">
                  <span className="text-muted">{interpreter.specialisation}</span>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setOpenProfileId(interpreter.id)}
                >
                  View profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {openProfileId !== null && (
        <InterpreterProfileModal
          interpreterId={openProfileId}
          onClose={() => setOpenProfileId(null)}
        />
      )}
    </>
  );
}
