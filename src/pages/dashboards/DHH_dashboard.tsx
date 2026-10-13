import React from 'react';
import {
  Home,
  Video,
  MessageSquare,
  Wallet,
  User,
  Settings,
  Bell,
  Search,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  Star,
  MoreVertical,
  LogOut,
} from 'lucide-react';

import logo from '../../assets/no_bg.png';

import './DHH_dashboard.css';

// --- MOCK DATA ---
const upcomingSessions = [
  {
    id: 1,
    day: '21',
    month: 'SEP',
    name: 'Dr. Sarah Chen',
    time: 'Today, 3:30 PM',
    type: 'Healthcare · American Sign Language',
    status: 'Scheduled',
  },
];

const availableInterpreters = [
  {
    id: 1,
    name: 'Amina Okafor',
    languages: 'ASL, English',
    rating: 4.9,
    specialties: 'Healthcare, Legal',
    isAvailable: true,
    image: 'https://i.pravatar.cc/150?u=amina',
  },
  {
    id: 2,
    name: 'Daniel Brooks',
    languages: 'ASL, English',
    rating: 4.9,
    specialties: 'Healthcare, Legal',
    isAvailable: false,
    image: 'https://i.pravatar.cc/150?u=daniel',
  },
];

export function DashboardPage() {
  return (
    <div className="dashboard-layout">
      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
        <img src={logo} alt="SignConnect" className="logo-image" />
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <Home size={20} /> <span>Home</span>
          </a>
          <a href="#" className="nav-item">
            <Video size={20} /> <span>Sessions</span>
          </a>
          <a href="#" className="nav-item">
            <MessageSquare size={20} /> <span>Messages</span>
          </a>
          <a href="#" className="nav-item">
            <Wallet size={20} /> <span>Wallet</span>
          </a>
          <a href="#" className="nav-item">
            <User size={20} /> <span>Profile</span>
          </a>
          <a href="#" className="nav-item">
            <Settings size={20} /> <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-mini">
            <div className="avatar-circle">MK</div>
            <div className="user-info">
              <span className="user-name">Micheal Kiggundu</span>
              <span className="user-role">view account</span>
            </div>
            <MoreVertical size={16} className="text-muted" />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="greeting">Good morning, Micheal</h1>
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
            <p className="hero-subtitle">
              Connect with a verified interpreter in under two minutes.
            </p>
            <button className="btn-primary">
              <Video size={18} /> Start VRI Session
            </button>
          </div>
          <div className="hero-illustration">
            {/* Using a large icon as a placeholder for the illustration */}
            <div className="hand-icon-placeholder">✋</div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <button className="action-card">
            <div className="action-icon">
              <Calendar size={20} />
            </div>
            <div className="action-text">
              <strong>Schedule Session</strong>
              <span>Book for later</span>
            </div>
            <ChevronRight size={18} className="action-arrow" />
          </button>
          <button className="action-card">
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
            <span className="stat-value">2 sessions</span>
            <span className="stat-sub">Next: Today, 3:30 PM</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Wallet</span>
            <span className="stat-value">$48.50</span>
            <span className="stat-sub">Available balance</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">This month</span>
            <span className="stat-value">7 sessions</span>
            <span className="stat-sub">3h 15m interpreted</span>
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
            {upcomingSessions.map((session) => (
              <div key={session.id} className="session-card">
                <div className="session-date">
                  <span className="date-day">{session.day}</span>
                  <span className="date-month">{session.month}</span>
                </div>
                <div className="session-details">
                  <h4>{session.name}</h4>
                  <p>
                    <Clock size={14} /> {session.time}
                  </p>
                  <p className="session-type">{session.type}</p>
                </div>
                <div className="session-status">
                  <span className="badge badge-scheduled">{session.status}</span>
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

          <div className="interpreter-grid">
            {availableInterpreters.map((interpreter) => (
              <div key={interpreter.id} className="interpreter-card">
                <div className="interpreter-image-wrap">
                  <img src={interpreter.image} alt={interpreter.name} />
                  {interpreter.isAvailable && (
                    <span className="status-dot-online"></span>
                  )}
                </div>
                <div className="interpreter-info">
                  <div className="interpreter-header">
                    <h4>{interpreter.name}</h4>
                    <CheckCircle2 size={16} className="verified-icon" />
                  </div>
                  <p className="interpreter-langs">{interpreter.languages}</p>
                  <div className="interpreter-rating">
                    <Star size={14} className="star-icon" />
                    <span>{interpreter.rating}</span>
                    <span className="text-muted">· {interpreter.specialties}</span>
                  </div>
                </div>
                <button className="btn-outline">View profile</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}