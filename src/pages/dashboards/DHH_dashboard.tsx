
// import {
//   Video,
//   Settings,
//   Bell,
//   Calendar,
//   ChevronRight,
//   Clock,
//   CheckCircle2,
//   Star,
//   AlertCircle, // Added for the emergency button
// } from 'lucide-react';

// import { useEffect, useState } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import { api } from '../../services/api';
// import './DHH_dashboard.css';
// import aminaImage from '../../assets/interpreter2.png';
// import danielImage from '../../assets/interpreter3.png';

// /** The part of GET /api/v1/dashboard/deaf/ this page uses. */
// interface DeafDashboard {
//   requests: Record<string, unknown>[];
//   sessions: Record<string, unknown>[];
// }

// function greeting(date = new Date()) {
//   const hour = date.getHours();
//   if (hour < 12) return 'Good morning';
//   if (hour < 18) return 'Good afternoon';
//   return 'Good evening';
// }

// // --- SAMPLE DATA ---
// const availableInterpreters = [
//   {
//     id: 1,
//     name: 'Amina Okafor',
//     languages: 'USL, English',
//     rating: 4.9,
//     specialties: 'Healthcare, Legal',
//     isAvailable: true,
//     image: aminaImage,
//   },
//   {
//     id: 2,
//     name: 'Daniel Brooks',
//     languages: 'USL, English',
//     rating: 4.5,
//     specialties: 'Education, Legal',
//     isAvailable: false,
//     image: danielImage,
//   },
// ];

// export function DashboardPage() {
//   const { session } = useAuth();
//   const firstName = (session?.user.name ?? '').trim().split(/\s+/)[0] ?? '';
//   const [sessions, setSessions] = useState<DeafDashboard['sessions'] | null>(null);

//   useEffect(() => {
//     let cancelled = false;
//     api<DeafDashboard>('/api/v1/dashboard/deaf/').then(
//       (data) => {
//         if (!cancelled) setSessions(data.sessions);
//       },
//       () => {
//         if (!cancelled) setSessions([]);
//       },
//     );
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const sessionCount = sessions?.length ?? 0;

//   return (
//     <>
//       {/* Header */}
//       <header className="dashboard-header">
//         <div>
//           <h1 className="greeting">{[greeting(), firstName].filter(Boolean).join(', ')}</h1>
//           <p className="sub-greeting">How can we help you communicate today?</p>
//         </div>
//         <button className="icon-btn notification-btn">
//           <Bell size={20} />
//           <span className="notification-dot"></span>
//         </button>
//       </header>

//       {/* Hero Banner */}
//       <section className="hero-banner">
//         <div className="hero-content">
//           <span className="hero-tag">ON DEMAND VRI</span>
//           <h2 className="hero-title">Start session now</h2>
//           <p className="hero-subtitle">Connect with a verified interpreter in under two minutes.</p>

//           {/* Buttons Group */}
//           <div className="hero-buttons-group">
//             <button className="dash-btn-primary">
//               <Video size={18} /> Start VRI Session
//             </button>
            
//             <button 
//               className="dash-btn-emergency"
//               onClick={() => {
//                 // Add your emergency logic here later
//                 console.log("Emergency request triggered");
//               }}
//             >
//               <AlertCircle size={18} /> Emergency Request
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Quick Actions */}
//       <section className="quick-actions">
//         <button className="action-card">
//           <div className="action-icon">
//             <Calendar size={20} />
//           </div>
//           <div className="action-text">
//             <strong>Schedule Session</strong>
//             <span>Book for later</span>
//           </div>
//           <ChevronRight size={18} className="action-arrow" />
//         </button>
//         <button className="action-card">
//           <div className="action-icon">
//             <Settings size={20} />
//           </div>
//           <div className="action-text">
//             <strong>Accessibility Setup</strong>
//             <span>Communication preferences</span>
//           </div>
//           <ChevronRight size={18} className="action-arrow" />
//         </button>
//       </section>

//       {/* Stats Grid */}
//       <section className="stats-grid">
//         <div className="stat-card">
//           <span className="stat-label">Upcoming</span>
//           <span className="stat-value">
//             {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
//           </span>
//           <span className="stat-sub">
//             {sessionCount === 0 ? 'Nothing booked yet' : 'Scheduled with an interpreter'}
//           </span>
//         </div>
//         <div className="stat-card">
//           <span className="stat-label">Wallet</span>
//           <span className="stat-value">UGX 0</span>
//           <span className="stat-sub">Available balance (sample)</span>
//         </div>
//         <div className="stat-card">
//           <span className="stat-label">This month</span>
//           <span className="stat-value">0 sessions</span>
//           <span className="stat-sub">0h 0m interpreted (sample)</span>
//         </div>
//       </section>

//       {/* Upcoming Sessions */}
//       <section className="dashboard-section">
//         <div className="section-header">
//           <h3>Upcoming sessions</h3>
//           <a href="#" className="view-all">
//             View all <ChevronRight size={16} />
//           </a>
//         </div>

//         <div className="session-list">
//           {sessions !== null && sessionCount === 0 && (
//             <p className="text-muted">No upcoming sessions yet.</p>
//           )}
//           {sessions?.map((item, index) => (
//             <div key={String(item.id ?? index)} className="session-card">
//               <div className="session-details">
//                 <h4>{String(item.interpreter_name ?? 'Interpreter session')}</h4>
//                 <p>
//                   <Clock size={14} /> {String(item.starts_at ?? '')}
//                 </p>
//               </div>
//               <div className="session-status">
//                 <span className="badge badge-scheduled">Scheduled</span>
//               </div>
//               <ChevronRight size={20} className="session-arrow" />
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Available Interpreters */}
//       <section className="dashboard-section">
//         <div className="section-header">
//           <h3>Available interpreters (sample)</h3>
//           <a href="#" className="view-all">
//             See all <ChevronRight size={16} />
//           </a>
//         </div>

//         <div className="interpreter-grid">
//           {availableInterpreters.map((interpreter) => (
//             <div key={interpreter.id} className="interpreter-card">
//               <div className="interpreter-image-wrap">
//                 <img src={interpreter.image} alt={interpreter.name} />
//                 {interpreter.isAvailable && <span className="status-badge">Available</span>}
//               </div>
//               <div className="interpreter-info">
//                 <div className="interpreter-header">
//                   <h4>{interpreter.name}</h4>
//                   <CheckCircle2 size={16} className="verified-icon" />
//                 </div>
//                 <p className="interpreter-langs">{interpreter.languages}</p>
//                 <div className="interpreter-rating">
//                   <Star size={14} className="star-icon" />
//                   <span>{interpreter.rating}</span>
//                   <span className="text-muted">· {interpreter.specialties}</span>
//                 </div>
//                 <button className="btn-outline">View profile</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>
//     </>
//   );
// }


import {
  Video,
  Settings,
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  Star,
  AlertCircle,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import './DHH_dashboard.css';
import aminaImage from '../../assets/interpreter2.png';
import danielImage from '../../assets/interpreter3.png';

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

// --- SAMPLE DATA ---
const availableInterpreters = [
  {
    id: 1,
    name: 'Amina Okafor',
    languages: 'USL, English',
    rating: 4.9,
    specialties: 'Healthcare, Legal',
    isAvailable: true,
    image: aminaImage,
  },
  {
    id: 2,
    name: 'Daniel Brooks',
    languages: 'USL, English',
    rating: 4.9,
    specialties: 'Education, Legal',
    isAvailable: false,
    image: danielImage,
  },
];

export function DashboardPage() {
  const { session } = useAuth();
  const firstName = (session?.user.name ?? '').trim().split(/\s+/)[0] ?? '';
  
  // --- STATE ---
  const [sessions, setSessions] = useState<DeafDashboard['sessions'] | null>(null);
  
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
          
          // TODO: When backend is ready, I will uncomment this and replace with actual API fields
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

  const sessionCount = sessions?.length ?? 0;

    // --- HELPERS ---
  const formatCurrency = (amount: number) => {
    // 1. Format the number with commas (e.g., 50000 -> "50,000")
    const formattedNumber = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount);
    
    // 2. Hardcode the prefix to guarantee it says "UGX"
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
            <button className="dash-btn-primary">
              <Video size={18} /> Start VRI Session
            </button>
            
            <button 
              className="dash-btn-emergency"
              onClick={() => {
                // TODO: Add emergency logic here
                console.log("Emergency request triggered");
              }}
            >
              <AlertCircle size={18} /> Emergency Request
            </button>
          </div>
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

        <div className="interpreter-grid">
          {availableInterpreters.map((interpreter) => (
            <div key={interpreter.id} className="interpreter-card">
              <div className="interpreter-image-wrap">
                <img src={interpreter.image} alt={interpreter.name} />
                {interpreter.isAvailable && <span className="status-badge">Available</span>}
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
                <button className="btn-outline">View profile</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
