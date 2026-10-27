
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Video, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import './InstitutionSessionsPage.css';

// 1. Define the data structure we expect from the backend
interface ActiveSession {
  id: number;
  location: string;
  interpreter: string;
  status: 'Live' | 'Connecting';
  duration: string;
  type: 'live' | 'connecting';
}

export function InstitutionSessionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 2. State for data, loading, and errors
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. Fetch data from the backend
  useEffect(() => {
    let cancelled = false;

    // Replace this URL with your actual backend endpoint for active sessions
    api<ActiveSession[]>('/api/v1/sessions/active/')
      .then((data) => {
        if (!cancelled) {
          setSessions(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // If backend isn't ready, just show empty list for now
          setSessions([]); 
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 4. Filter logic based on search input
  const filteredSessions = sessions.filter(
    (session) =>
      session.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.interpreter.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 5. Calculate dynamic top metrics based on the real data
  const activeCount = sessions.length;
  const longestRunning = sessions.length > 0 
    ? sessions.reduce((max, s) => (s.duration > max ? s.duration : max), '00:00') 
    : '00:00';

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
          <span className="metric-value">{activeCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">LONGEST RUNNING</span>
          <span className="metric-value">{longestRunning}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">AVG. CONNECT TIME</span>
          <span className="metric-value">Under 2 min</span> {/* Can be calculated later */}
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
        {loading ? (
          <div className="empty-state">Loading active sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="empty-state">No active sessions right now.</div>
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