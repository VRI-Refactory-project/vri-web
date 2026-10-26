import { useState } from 'react';
import { Search, SlidersHorizontal, Video, ChevronRight } from 'lucide-react';
import './InstitutionSessionsPage.css';

// Mock data representing active sessions
const MOCK_ACTIVE_SESSIONS = [
  {
    id: 1,
    location: 'Room 204',
    interpreter: 'Amina Okafor',
    status: 'Live',
    duration: '08:42',
    type: 'live',
  },
  {
    id: 2,
    location: 'Emergency',
    interpreter: 'Daniel Brooks',
    status: 'Live',
    duration: '03:16',
    type: 'live',
  },
  {
    id: 3,
    location: 'Social Services',
    interpreter: 'Grace Lee',
    status: 'Connecting',
    duration: '',
    type: 'connecting',
  },
];

export function InstitutionSessionsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic based on search input
  const filteredSessions = MOCK_ACTIVE_SESSIONS.filter(
    (session) =>
      session.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.interpreter.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="institution-sessions-page">
      {/* Header */}
      <header className="sessions-header">
        <h1>Active sessions</h1>
        <p>Manage and review live SignConnect interpreting sessions.</p>
      </header>

      {/* Top Metric Cards */}
      <section className="sessions-metrics">
        <div className="metric-card">
          <span className="metric-label">ACTIVE NOW</span>
          <span className="metric-value">3</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">LONGEST RUNNING</span>
          <span className="metric-value">08:42</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">AVG. CONNECT TIME</span>
          <span className="metric-value">Under 2 min</span>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="sessions-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by room, interpreter or department"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <SlidersHorizontal size={16} /> Filter
        </button>
      </section>

      {/* Active Sessions List */}
      <section className="sessions-list-container">
        {filteredSessions.length === 0 ? (
          <div className="empty-state">No active sessions found.</div>
        ) : (
          filteredSessions.map((session) => (
            <div key={session.id} className="session-row">
              {/* Left Icon */}
              <div className="session-icon-wrapper">
                <Video size={20} className="session-icon" />
              </div>

              {/* Details */}
              <div className="session-details">
                <h3>{session.location}</h3>
                <p>{session.interpreter}</p>
              </div>

              {/* Status Badge */}
              <div className={`active-status-badge ${session.type}`}>
                <span className="status-dot"></span>
                {session.status} {session.duration && `· ${session.duration}`}
              </div>

              {/* Right Arrow */}
              <ChevronRight size={20} className="session-arrow" />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
