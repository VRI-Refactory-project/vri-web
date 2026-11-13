// import { useEffect, useMemo, useRef, useState } from 'react';
// import {
//   Search,
//   Calendar,
//   Bell,
//   ChevronDown,
//   Users,
//   Building2,
//   Video,
//   ShieldCheck,
//   Lightbulb,
//   BarChart3,
//   Clock,
//   CheckCircle2,
// } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth';
// import {
//   fetchAdminSummary,
//   fetchSessionActivity,
//   fetchSessionTypes,
//   fetchActivityFeed,
//   fetchUserGrowth,
//   fetchInterpreterPerformance,
//   fetchVerificationStatus,
//   fetchUpcomingSessions,
//   type AdminDashboardSummary,
//   type SessionActivityPoint,
//   type SessionTypesBreakdown,
//   type ActivityItem,
//   type GrowthPoint,
//   type InterpreterPerformance,
//   type VerificationStatusBreakdown,
//   type SessionRow,
// } from '../../services/admin';
// import {
//   fetchNotifications,
//   markNotificationRead,
//   type AppNotification,
// } from '../../services/notifications';
// import './AdminDashboardPage.css';
// import { useNavigate } from 'react-router-dom';

// const KPI_META = [
//   { id: 'total-users', label: 'Total Users', trend: 'up' as const, Icon: Users, color: 'purple' },
//   { id: 'dhh', label: 'DHH Users', trend: 'up' as const, Icon: Users, color: 'green' },
//   {
//     id: 'institutions',
//     label: 'Institutions',
//     trend: 'up' as const,
//     Icon: Building2,
//     color: 'blue',
//   },
//   { id: 'interpreters', label: 'Interpreters', trend: 'up' as const, Icon: Video, color: 'pink' },
//   {
//     id: 'pending',
//     label: 'Pending Verifications',
//     trend: 'down' as const,
//     Icon: ShieldCheck,
//     color: 'orange',
//   },
// ];

// function todayLabel() {
//   return new Date().toLocaleDateString('en-GB', {
//     day: 'numeric',
//     month: 'short',
//     year: 'numeric',
//   });
// }

// // Status pill colours for the "Upcoming sessions" table
// function statusStyle(status: string) {
//   const s = status.toLowerCase();
//   if (s === 'pending') return { bg: '#fef3c7', text: '#b45309' };
//   if (s === 'cancelled') return { bg: '#fee2e2', text: '#b91c1c' };
//   return { bg: '#dcfce7', text: '#15803d' }; // Scheduled / Confirmed / Completed
// }

// export function AdminDashboardPage() {
//   const { session } = useAuth();
//   const navigate = useNavigate();
//   const name = session?.user.name ?? 'Admin';
//   const role = session?.user.role ?? 'admin';
//   const initial = name.trim().charAt(0).toUpperCase() || '?';

//   const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
//   const [activity, setActivity] = useState<SessionActivityPoint[] | null>(null);
//   const [types, setTypes] = useState<SessionTypesBreakdown | null>(null);
//   const [feed, setFeed] = useState<ActivityItem[] | null>(null);
//   const [growth, setGrowth] = useState<GrowthPoint[] | null>(null);
//   const [performance, setPerformance] = useState<InterpreterPerformance | null>(null);
//   const [verification, setVerification] = useState<VerificationStatusBreakdown | null>(null);
//   const [sessions, setSessions] = useState<SessionRow[] | null>(null);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [query, setQuery] = useState('');
//   const [bellOpen, setBellOpen] = useState(false);
//   const bellRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     fetchAdminSummary()
//       .then((data) => {
//         setSummary(data);
//         setUnreadCount(data.unread_notifications ?? 0);
//       })
//       .catch(() => setSummary(null));
//     fetchSessionActivity()
//       .then(setActivity)
//       .catch(() => setActivity([]));
//     fetchSessionTypes()
//       .then(setTypes)
//       .catch(() => setTypes(null));
//     fetchActivityFeed()
//       .then(setFeed)
//       .catch(() => setFeed([]));
//     fetchUserGrowth()
//       .then(setGrowth)
//       .catch(() => setGrowth([]));
//     fetchInterpreterPerformance()
//       .then(setPerformance)
//       .catch(() => setPerformance(null));
//     fetchVerificationStatus()
//       .then(setVerification)
//       .catch(() => setVerification(null));
//     fetchUpcomingSessions()
//       .then(setSessions)
//       .catch(() => setSessions([]));
//     fetchNotifications()
//       .then(setNotifications)
//       .catch(() => setNotifications([]));
//   }, []);

//   useEffect(() => {
//     if (!bellOpen) return;
//     const onClickOutside = (e: MouseEvent) => {
//       if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
//         setBellOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', onClickOutside);
//     return () => document.removeEventListener('mousedown', onClickOutside);
//   }, [bellOpen]);

//   const handleNotificationClick = async (n: AppNotification) => {
//     if (n.read_at) return;
//     setNotifications((prev) =>
//       prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
//     );
//     setUnreadCount((c) => Math.max(0, c - 1));
//     try {
//       await markNotificationRead(n.id);
//     } catch {
//       setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: null } : x)));
//       setUnreadCount((c) => c + 1);
//     }
//   };

//   const kpiValues: Record<string, string> = {
//     'total-users': (summary?.totalUsers ?? 0).toLocaleString(),
//     dhh: (summary?.dhhUsers ?? 0).toLocaleString(),
//     institutions: (summary?.institutions ?? 0).toLocaleString(),
//     interpreters: (summary?.interpreters ?? 0).toLocaleString(),
//     pending: (summary?.pendingVerifications ?? 0).toLocaleString(),
//   };

//   const totalSessions = types?.total ?? 0;
//   const vriPct = totalSessions ? Math.round(((types?.vri ?? 0) / totalSessions) * 100) : 0;
//   const onsitePct = totalSessions ? Math.round(((types?.onsite ?? 0) / totalSessions) * 100) : 0;
//   const donutBg = `conic-gradient(#4b34a0 0 ${vriPct}%, #16a34a ${vriPct}% ${vriPct + onsitePct}%, #cbd5e1 ${vriPct + onsitePct}% 100%)`;

//   const vTotal = verification?.total ?? 0;
//   const bar = (n: number) => (vTotal ? `${Math.round((n / vTotal) * 100)}%` : '0%');

//   const needle = query.trim().toLowerCase();

//   const filteredFeed = useMemo(() => {
//     if (!feed) return feed;
//     if (!needle) return feed;
//     return feed.filter((a) => a.text.toLowerCase().includes(needle));
//   }, [feed, needle]);

//   const filteredSessions = useMemo(() => {
//     if (!sessions) return sessions;
//     if (!needle) return sessions;
//     return sessions.filter((s) =>
//       [s.id, s.client, s.interpreter, s.type, s.status].some((v) =>
//         v.toLowerCase().includes(needle),
//       ),
//     );
//   }, [sessions, needle]);

//   // Scale for the Session activity chart
//   const activityMax = Math.max(1, ...(activity ?? []).map((x) => x.value));
//   const yMax = Math.ceil(activityMax / 50) * 50 || 250;

//   return (
//     <div className="ad-page">
//       {/* Top bar */}
//       <div className="ad-topbar">
//         <div className="ad-search">
//           <Search size={16} aria-hidden="true" />
//           <input
//             placeholder="Search sessions or activity..."
//             aria-label="Search sessions or activity"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//         </div>
//         <div className="ad-actions">
//           <button type="button" className="ad-date">
//             <Calendar size={15} /> <span>{todayLabel()}</span>
//           </button>

//           <div className="ad-bell-wrap" ref={bellRef}>
//             <button
//               type="button"
//               className="ad-icon-btn"
//               aria-label="Notifications"
//               onClick={() => setBellOpen((v) => !v)}
//             >
//               <Bell size={17} />
//               {unreadCount > 0 && <span className="ad-dot" />}
//             </button>
//             {bellOpen && (
//               <div className="ad-bell-panel" role="dialog" aria-label="Notifications">
//                 <div className="ad-bell-header">
//                   Notifications
//                   {unreadCount > 0 && (
//                     <span
//                       style={{
//                         background: '#ef4444',
//                         color: 'white',
//                         borderRadius: '999px',
//                         padding: '1px 8px',
//                         fontSize: '11px',
//                         fontWeight: 700,
//                         marginLeft: '8px',
//                       }}
//                     >
//                       {unreadCount}
//                     </span>
//                   )}
//                 </div>
//                 {notifications.length > 0 ? (
//                   <ul className="ad-bell-list">
//                     {notifications.slice(0, 6).map((n) => {
//                       const isUnread = !n.read_at;
//                       return (
//                         <li
//                           key={n.id}
//                           onClick={() => handleNotificationClick(n)}
//                           style={{
//                             cursor: isUnread ? 'pointer' : 'default',
//                             background: isUnread ? '#f8fafc' : 'white',
//                           }}
//                         >
//                           <span
//                             className="ad-bell-dot"
//                             style={{ background: isUnread ? '#ef4444' : '#cbd5e1' }}
//                           />
//                           <div>
//                             <strong>{n.title}</strong>
//                             {n.body && (
//                               <small style={{ display: 'block', color: '#6b7280' }}>{n.body}</small>
//                             )}
//                           </div>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 ) : (
//                   <p className="ad-bell-empty">No notifications yet.</p>
//                 )}
//               </div>
//             )}
//           </div>

//           <button type="button" className="ad-user">
//             <span className="ad-avatar">{initial}</span>
//             <span className="ad-user-text">
//               <strong>{name}</strong>
//               <small>{role.charAt(0).toUpperCase() + role.slice(1)}</small>
//             </span>
//             <ChevronDown size={14} />
//           </button>
//         </div>
//       </div>

//       {/* Title */}
//       <div className="ad-title">
//         <h1>Admin dashboard</h1>
//         <p>Here's what's happening today.</p>
//       </div>

//       {/* KPI cards */}
//       <div className="ad-kpis">
//         {KPI_META.map(({ id, label, trend, Icon, color }) => (
//           <div key={id} className="ad-kpi">
//             <div className="ad-kpi-head">
//               <span className={`ad-kpi-icon ad-kpi-icon--${color}`}>
//                 <Icon size={14} />
//               </span>
//               <span>{label}</span>
//             </div>
//             <div className="ad-kpi-value">{kpiValues[id] ?? '0'}</div>
//             <div className={`ad-kpi-delta ad-kpi-delta--${trend}`}></div>
//           </div>
//         ))}
//       </div>

//       {/* Row: Session activity | Session types | Recent activity */}
//       <div className="ad-row ad-row--top">
//         {/* Session activity panel — no dropdown, no box */}
//         <div className="ad-panel">
//           <div className="ad-panel-head" style={{ alignItems: 'flex-start' }}>
//             <div>
//               <h3 style={{ margin: 0 }}>Session activity</h3>
//             </div>
//             <div
//               style={{
//                 fontSize: '13px',
//                 color: '#9ca3af',
//                 fontWeight: 500,
//                 marginTop: '2px',
//               }}
//             >
//               Last 7 days
//             </div>
//           </div>

//           {activity && activity.length > 0 ? (
//             <div style={{ display: 'flex', marginTop: '20px', height: '260px' }}>
//               {/* Y-Axis Labels */}
//               <div
//                 style={{
//                   display: 'flex',
//                   flexDirection: 'column',
//                   justifyContent: 'space-between',
//                   paddingBottom: '24px',
//                   fontSize: '11px',
//                   color: '#9ca3af',
//                   width: '30px',
//                 }}
//               >
//                 {[
//                   yMax,
//                   Math.round(yMax * 0.8),
//                   Math.round(yMax * 0.6),
//                   Math.round(yMax * 0.4),
//                   Math.round(yMax * 0.2),
//                   0,
//                 ].map((v) => (
//                   <span key={v}>{v}</span>
//                 ))}
//               </div>

//               {/* Bars area */}
//               <div style={{ flex: 1, position: 'relative' }}>
//                 {/* Grid lines */}
//                 <div
//                   style={{
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     bottom: '24px',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     justifyContent: 'space-between',
//                   }}
//                 >
//                   {[0, 1, 2, 3, 4].map((i) => (
//                     <div key={i} style={{ borderBottom: '1px dashed #f1f5f9', width: '100%' }} />
//                   ))}
//                   <div style={{ borderBottom: '1px solid #e2e8f0', width: '100%' }} />
//                 </div>

//                 {/* Bars */}
//                 <div
//                   style={{
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     bottom: '24px',
//                     display: 'flex',
//                     alignItems: 'flex-end',
//                     justifyContent: 'space-around',
//                     zIndex: 1,
//                     gap: '8px',
//                   }}
//                 >
//                   {activity.map((b) => {
//                     const heightPct = Math.min(100, (b.value / yMax) * 100);
//                     return (
//                       <div
//                         key={b.label}
//                         style={{
//                           display: 'flex',
//                           flexDirection: 'column',
//                           alignItems: 'center',
//                           height: '100%',
//                           justifyContent: 'flex-end',
//                           flex: 1,
//                           maxWidth: '40px',
//                         }}
//                       >
//                         <div
//                           style={{
//                             height: `${heightPct}%`,
//                             width: '100%',
//                             background: '#4b34a0',
//                             borderRadius: '6px 6px 0 0',
//                             transition: 'height 0.5s ease',
//                             minHeight: '4px',
//                           }}
//                           title={`${b.label}: ${b.value}`}
//                         />
//                       </div>
//                     );
//                   })}
//                 </div>

//                 {/* X-Axis labels */}
//                 <div
//                   style={{
//                     position: 'absolute',
//                     bottom: 0,
//                     left: 0,
//                     right: 0,
//                     display: 'flex',
//                     justifyContent: 'space-around',
//                     fontSize: '11px',
//                     color: '#9ca3af',
//                     gap: '8px',
//                   }}
//                 >
//                   {activity.map((b) => (
//                     <span key={b.label} style={{ flex: 1, textAlign: 'center' }}>
//                       {b.label}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <p className="ad-empty">No data yet.</p>
//           )}
//         </div>

//         <div className="ad-panel">
//           <div className="ad-panel-head">
//             <h3>Session types</h3>
//           </div>
//           {types ? (
//             <div className="ad-donut-wrap">
//               <div className="ad-donut" style={{ background: donutBg }}>
//                 <div className="ad-donut-hole">
//                   <strong>{totalSessions}</strong>
//                   <small>Total</small>
//                 </div>
//               </div>
//               <div className="ad-legend">
//                 <div>
//                   <span className="ad-legend-dot" style={{ background: '#4b34a0' }} />
//                   Video call (VRI) · {types.vri}
//                 </div>
//                 <div>
//                   <span className="ad-legend-dot" style={{ background: '#16a34a' }} />
//                   On-site · {types.onsite}
//                 </div>
//                 <div>
//                   <span className="ad-legend-dot" style={{ background: '#cbd5e1' }} />
//                   Still waiting · {types.pending}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <p className="ad-empty">No data yet.</p>
//           )}
//         </div>

//         <div className="ad-panel">
//           <div className="ad-panel-head">
//             <h3>Recent activity</h3>
//             <button
//               type="button"
//               onClick={() => navigate('/dashboard/admin/audit-logs')}
//               style={{
//                 background: 'none',
//                 border: 'none',
//                 color: '#4b34a0',
//                 fontWeight: 600,
//                 fontSize: '13px',
//                 cursor: 'pointer',
//                 padding: 0
//               }}
//             >
//               View all
//             </button>
//           </div>
//           {filteredFeed && filteredFeed.length > 0 ? (
//             <div className="ad-feed">
//               {filteredFeed.map((a, i) => (
//                 <div key={i} className="ad-feed-item">
//                   <span className="ad-feed-dot" />
//                   <span>{a.text}</span>
//                   <span className="ad-feed-time">{a.time}</span>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="ad-empty">
//               {feed && feed.length > 0 && needle
//                 ? 'No activity matches your search.'
//                 : 'No data yet.'}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Row: Top session types | User growth | Quick insights */}
//       <div className="ad-row ad-row--mid">
//         <div className="ad-panel">
//           <div className="ad-panel-head">
//             <h3>Top session types</h3>
//             <small>All time</small>
//           </div>

//           {summary?.top_session_types && summary.top_session_types.length > 0 ? (
//             <div className="ad-locations" style={{ marginTop: '20px' }}>
//               {(() => {
//                 const total = summary.top_session_types!.reduce((sum, item) => sum + item.count, 0);
//                 const colors = ['#4b34a0', '#8b5cf6', '#c4b5fd', '#e5e7eb'];

//                 return summary.top_session_types!.slice(0, 4).map((item, index) => {
//                   const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
//                   const label = item.type.charAt(0).toUpperCase() + item.type.slice(1);

//                   return (
//                     <div key={index} style={{ marginBottom: index === 3 ? 0 : '16px' }}>
//                       <div className="ad-loc-row">
//                         <span style={{ fontWeight: 600, color: '#111827' }}>{label}</span>
//                         <span style={{ color: '#6b7280' }}>{percentage}%</span>
//                       </div>
//                       <div
//                         className="ad-loc-bar"
//                         style={{
//                           background: '#f3f4f6',
//                           height: '8px',
//                           borderRadius: '4px',
//                           marginTop: '6px',
//                         }}
//                       >
//                         <span
//                           style={{
//                             width: `${percentage}%`,
//                             background: colors[index % colors.length],
//                             display: 'block',
//                             height: '100%',
//                             borderRadius: '4px',
//                             transition: 'width 0.5s ease-in-out',
//                           }}
//                         />
//                       </div>
//                     </div>
//                   );
//                 });
//               })()}
//             </div>
//           ) : (
//             <p className="ad-empty">No session data yet.</p>
//           )}
//         </div>

//         <div className="ad-panel">
//           <div className="ad-panel-head" style={{ alignItems: 'flex-start' }}>
//             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
//               <div
//                 style={{
//                   background: '#f3e8ff',
//                   padding: '8px',
//                   borderRadius: '8px',
//                   color: '#4b34a0',
//                 }}
//               >
//                 <BarChart3 size={18} />
//               </div>
//               <div>
//                 <h3 style={{ margin: 0 }}>User growth</h3>
//                 <small style={{ color: '#6b7280', fontSize: '12px' }}>Last 30 days</small>
//               </div>
//             </div>

//             <div
//               style={{
//                 background: '#4b34a0',
//                 color: 'white',
//                 padding: '4px 10px',
//                 borderRadius: '6px',
//                 fontSize: '13px',
//                 fontWeight: 'bold',
//               }}
//             >
//               {(summary?.totalUsers ?? 0).toLocaleString()}
//             </div>
//           </div>

//           {growth && growth.length > 1 ? (
//             <div style={{ position: 'relative', marginTop: '20px' }}>
//               <div
//                 style={{
//                   position: 'absolute',
//                   left: 0,
//                   top: 0,
//                   bottom: 30,
//                   display: 'flex',
//                   flexDirection: 'column',
//                   justifyContent: 'space-between',
//                   fontSize: '11px',
//                   color: '#9ca3af',
//                 }}
//               >
//                 {(() => {
//                   const max = Math.max(1, ...growth.map((g) => g.value));
//                   const formatY = (val: number) => {
//                     if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
//                     if (val >= 1000) return `${Math.round(val / 1000)}K`;
//                     return Math.round(val).toString();
//                   };
//                   return (
//                     <>
//                       <span>{formatY(max)}</span>
//                       <span>{formatY(max * 0.66)}</span>
//                       <span>{formatY(max * 0.33)}</span>
//                       <span>0</span>
//                     </>
//                   );
//                 })()}
//               </div>

//               <svg viewBox="0 0 320 160" style={{ width: '100%', height: 180, marginLeft: '25px' }}>
//                 <defs>
//                   <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor="#4b34a0" stopOpacity="0.2" />
//                     <stop offset="100%" stopColor="#4b34a0" stopOpacity="0" />
//                   </linearGradient>
//                 </defs>

//                 <line x1="0" y1="10" x2="320" y2="10" stroke="#f3f4f6" strokeWidth="1" />
//                 <line x1="0" y1="50" x2="320" y2="50" stroke="#f3f4f6" strokeWidth="1" />
//                 <line x1="0" y1="90" x2="320" y2="90" stroke="#f3f4f6" strokeWidth="1" />
//                 <line x1="0" y1="130" x2="320" y2="130" stroke="#f3f4f6" strokeWidth="1" />

//                 {(() => {
//                   const max = Math.max(1, ...growth.map((g) => g.value));
//                   const stepX = 300 / Math.max(1, growth.length - 1);
//                   const points = growth.map((g, i) => {
//                     const x = 10 + i * stepX;
//                     const y = 130 - (g.value / max) * 110;
//                     return { x, y };
//                   });
//                   const line = points
//                     .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
//                     .join(' ');
//                   const area = `${line} L${points[points.length - 1].x},130 L${points[0].x},130 Z`;

//                   const lastPoint = points[points.length - 1];

//                   return (
//                     <>
//                       <path d={area} fill="url(#ug)" />
//                       <path
//                         d={line}
//                         stroke="#4b34a0"
//                         strokeWidth="3"
//                         fill="none"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                       />
//                       <circle
//                         cx={lastPoint.x}
//                         cy={lastPoint.y}
//                         r="4"
//                         fill="#4b34a0"
//                         stroke="white"
//                         strokeWidth="2"
//                       />
//                     </>
//                   );
//                 })()}
//               </svg>

//               <div
//                 style={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   marginLeft: '25px',
//                   marginTop: '8px',
//                   fontSize: '11px',
//                   color: '#9ca3af',
//                 }}
//               >
//                 {growth.map((g, i) => (
//                   <span key={i}>{g.label}</span>
//                 ))}
//               </div>
//             </div>
//           ) : (
//             <p className="ad-empty">No data yet.</p>
//           )}
//         </div>

//         <div className="ad-panel">
//           <div className="ad-panel-head">
//             <h3>Quick insights</h3>
//           </div>
//           <div className="ad-insights">
//             <div className="ad-insight">
//               <Lightbulb size={14} />
//               <span>
//                 {summary
//                   ? `${summary.pendingVerifications} interpreter verification${summary.pendingVerifications === 1 ? '' : 's'} pending.`
//                   : 'Insights will appear once data is available.'}
//               </span>
//             </div>
//             <div className="ad-insight">
//               <Lightbulb size={14} />
//               <span>
//                 {summary
//                   ? `${summary.institutions} institution${summary.institutions === 1 ? '' : 's'} in the platform.`
//                   : 'Insights will appear once data is available.'}
//               </span>
//             </div>
//             <div className="ad-insight">
//               <Lightbulb size={14} />
//               <span>
//                 {summary
//                   ? `${summary.interpreters} interpreter${summary.interpreters === 1 ? '' : 's'} registered.`
//                   : 'Insights will appear once data is available.'}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Row: Interpreter performance | Verification status */}
//       <div className="ad-row ad-row--bottom">
//         <div className="ad-panel">
//           <div className="ad-panel-head">
//             <div>
//               <h3 style={{ margin: 0 }}>Interpreter performance</h3>
//               <small style={{ color: '#6b7280', fontSize: '13px' }}>
//                 Average response time & session completion rate
//               </small>
//             </div>
//           </div>

//           {performance ? (
//             <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
//               {/* Left Card: Avg Response Time */}
//               <div
//                 style={{
//                   flex: 1,
//                   background: '#f8fafc',
//                   padding: '16px',
//                   borderRadius: '12px',
//                   border: '1px solid #f1f5f9',
//                 }}
//               >
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                   <div
//                     style={{
//                       background: '#ede9fe',
//                       color: '#6d28d9',
//                       width: '40px',
//                       height: '40px',
//                       borderRadius: '50%',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                     }}
//                   >
//                     <Clock size={20} />
//                   </div>
//                   <div>
//                     <span
//                       style={{
//                         fontSize: '12px',
//                         color: '#64748b',
//                         fontWeight: 600,
//                         textTransform: 'uppercase',
//                         letterSpacing: '0.5px',
//                       }}
//                     >
//                       Avg. response time
//                     </span>
//                     <h2 style={{ margin: '2px 0', fontSize: '24px', color: '#111827' }}>
//                       {performance.avgResponseTime}
//                     </h2>
//                   </div>
//                 </div>
//                 <div
//                   style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}
//                 >
//                   ↑ {performance.responseTrend}{' '}
//                   <span style={{ color: '#9ca3af', fontWeight: 400 }}>vs. last 7 days</span>
//                 </div>
//               </div>

//               {/* Right Card: Completion Rate */}
//               <div
//                 style={{
//                   flex: 1,
//                   background: '#f8fafc',
//                   padding: '16px',
//                   borderRadius: '12px',
//                   border: '1px solid #f1f5f9',
//                 }}
//               >
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                   <div
//                     style={{
//                       background: '#dcfce7',
//                       color: '#16a34a',
//                       width: '40px',
//                       height: '40px',
//                       borderRadius: '50%',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                     }}
//                   >
//                     <CheckCircle2 size={20} />
//                   </div>
//                   <div>
//                     <span
//                       style={{
//                         fontSize: '12px',
//                         color: '#64748b',
//                         fontWeight: 600,
//                         textTransform: 'uppercase',
//                         letterSpacing: '0.5px',
//                       }}
//                     >
//                       Session completion rate
//                     </span>
//                     <h2 style={{ margin: '2px 0', fontSize: '24px', color: '#111827' }}>
//                       {performance.completionRate}
//                     </h2>
//                   </div>
//                 </div>
//                 <div
//                   style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}
//                 >
//                   ↑ {performance.completionTrend}{' '}
//                   <span style={{ color: '#9ca3af', fontWeight: 400 }}>vs. last 7 days</span>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <p className="ad-empty">No data yet.</p>
//           )}
//         </div>

//         <div className="ad-panel">
//           <div className="ad-panel-head">
//             <h3>Verification status</h3>
//           </div>
//           {verification ? (
//             <>
//               <div className="ad-vbar">
//                 <span style={{ width: bar(verification.approved), background: '#16a34a' }} />
//                 <span style={{ width: bar(verification.pending), background: '#f59e0b' }} />
//                 <span style={{ width: bar(verification.rejected), background: '#ef4444' }} />
//                 <span style={{ width: bar(verification.flagged), background: '#4b34a0' }} />
//               </div>
//               <div className="ad-vlegend">
//                 <span>
//                   <i style={{ background: '#16a34a' }} />
//                   Approved · {verification.approved}
//                 </span>
//                 <span>
//                   <i style={{ background: '#f59e0b' }} />
//                   Pending · {verification.pending}
//                 </span>
//                 <span>
//                   <i style={{ background: '#ef4444' }} />
//                   Rejected · {verification.rejected}
//                 </span>
//                 <span>
//                   <i style={{ background: '#4b34a0' }} />
//                   Flagged · {verification.flagged}
//                 </span>
//               </div>
//             </>
//           ) : (
//             <p className="ad-empty">No data yet.</p>
//           )}
//         </div>
//       </div>

//       {/* Upcoming sessions */}
//       <div className="ad-panel">
//         <div className="ad-panel-head" style={{ alignItems: 'center' }}>
//           <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//             <div style={{ color: '#4b34a0' }}>
//               <Calendar size={20} />
//             </div>
//             <h3 style={{ margin: 0 }}>Upcoming sessions</h3>
//           </div>
//           <a
//             href="/dashboard/admin/sessions"
//             style={{ color: '#4b34a0', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
//           >
//             View all
//           </a>
//         </div>

//         {filteredSessions && filteredSessions.length > 0 ? (
//           <table className="ad-table">
//             <thead>
//               <tr>
//                 {['Time', 'User', 'Interpreter', 'Session type', 'Status'].map((h) => (
//                   <th
//                     key={h}
//                     style={{
//                       fontSize: '11px',
//                       textTransform: 'uppercase',
//                       letterSpacing: '0.5px',
//                       color: '#9ca3af',
//                     }}
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {filteredSessions.map((s) => {
//                 const typeLabel = s.type ? s.type.charAt(0).toUpperCase() + s.type.slice(1) : '—';
//                 const st = statusStyle(s.status);

//                 return (
//                   <tr key={s.id}>
//                     <td style={{ color: '#6b7280', fontSize: '13px' }}>{s.date}</td>
//                     <td style={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>
//                       {s.client}
//                     </td>
//                     <td style={{ color: '#6b7280', fontSize: '13px' }}>{s.interpreter || '—'}</td>
//                     <td>
//                       <span
//                         style={{
//                           display: 'inline-block',
//                           padding: '2px 8px',
//                           borderRadius: '6px',
//                           background: '#f4f1fa',
//                           color: '#4b34a0',
//                           fontSize: '12px',
//                           fontWeight: 600,
//                           textTransform: 'capitalize',
//                         }}
//                       >
//                         {typeLabel}
//                       </span>
//                     </td>
//                     <td>
//                       <span
//                         style={{
//                           display: 'inline-block',
//                           padding: '2px 8px',
//                           borderRadius: '6px',
//                           background: st.bg,
//                           color: st.text,
//                           fontSize: '12px',
//                           fontWeight: 600,
//                           textTransform: 'capitalize',
//                         }}
//                       >
//                         {s.status}
//                       </span>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         ) : (
//           <p className="ad-empty">
//             {sessions && sessions.length > 0 && needle
//               ? 'No sessions match your search.'
//               : 'No upcoming sessions yet.'}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Calendar,
  Bell,
  ChevronDown,
  Users,
  Building2,
  Video,
  ShieldCheck,
  Lightbulb,
  BarChart3,
  Clock,
  CheckCircle2,
  UserPlus,
  XCircle,
  Headphones,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAdminSummary,
  fetchSessionActivity,
  fetchActivityFeed,
  fetchUserGrowth,
  fetchInterpreterPerformance,
  fetchVerificationStatus,
  fetchUpcomingSessions,
  type AdminDashboardSummary,
  type SessionActivityPoint,
  type ActivityItem,
  type GrowthPoint,
  type InterpreterPerformance,
  type VerificationStatusBreakdown,
  type SessionRow,
} from '../../services/admin';
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from '../../services/notifications';
import './AdminDashboardPage.css';
import { useNavigate } from 'react-router-dom';

const KPI_META = [
  { id: 'total-users', label: 'Total Users', trend: 'up' as const, Icon: Users, color: 'purple' },
  { id: 'dhh', label: 'DHH Users', trend: 'up' as const, Icon: Users, color: 'green' },
  {
    id: 'institutions',
    label: 'Institutions',
    trend: 'up' as const,
    Icon: Building2,
    color: 'blue',
  },
  { id: 'interpreters', label: 'Interpreters', trend: 'up' as const, Icon: Video, color: 'pink' },
  {
    id: 'pending',
    label: 'Pending Verifications',
    trend: 'down' as const,
    Icon: ShieldCheck,
    color: 'orange',
  },
];

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Status pill colours for the "Upcoming sessions" table
function statusStyle(status: string) {
  const s = status.toLowerCase();
  if (s === 'pending') return { bg: '#fef3c7', text: '#b45309' };
  if (s === 'cancelled') return { bg: '#fee2e2', text: '#b91c1c' };
  return { bg: '#dcfce7', text: '#15803d' };
}

// Helper to choose the icon + colours based on the activity text
function getActivityIcon(text: string) {
  const t = text.toLowerCase();

  if (t.includes('signed in') || t.includes('sign-in'))
    return { Icon: Users, bg: '#e0f2fe', color: '#0284c7' };

  if (t.includes('video') || t.includes('session') || t.includes('call'))
    return { Icon: Video, bg: '#dcfce7', color: '#16a34a' };

  if (t.includes('register') || t.includes('new user'))
    return { Icon: UserPlus, bg: '#f3e8ff', color: '#9333ea' };

  if (t.includes('verification') || t.includes('verified') || t.includes('approved'))
    return { Icon: ShieldCheck, bg: '#e0f2fe', color: '#0284c7' };

  if (t.includes('reject') || t.includes('failed') || t.includes('error'))
    return { Icon: XCircle, bg: '#fee2e2', color: '#ef4444' };

  if (t.includes('request') || t.includes('offer') || t.includes('interpreter'))
    return { Icon: Headphones, bg: '#fef3c7', color: '#b45309' };

  return { Icon: Lightbulb, bg: '#f3f4f6', color: '#6b7280' };
}

export function AdminDashboardPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const name = session?.user.name ?? 'Admin';
  const role = session?.user.role ?? 'admin';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [activity, setActivity] = useState<SessionActivityPoint[] | null>(null);
  const [feed, setFeed] = useState<ActivityItem[] | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[] | null>(null);
  const [performance, setPerformance] = useState<InterpreterPerformance | null>(null);
  const [verification, setVerification] = useState<VerificationStatusBreakdown | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState('');
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAdminSummary()
      .then((data) => {
        setSummary(data);
        setUnreadCount(data.unread_notifications ?? 0);
      })
      .catch(() => setSummary(null));
    fetchSessionActivity()
      .then(setActivity)
      .catch(() => setActivity([]));
    fetchActivityFeed()
      .then(setFeed)
      .catch(() => setFeed([]));
    fetchUserGrowth()
      .then(setGrowth)
      .catch(() => setGrowth([]));
    fetchInterpreterPerformance()
      .then(setPerformance)
      .catch(() => setPerformance(null));
    fetchVerificationStatus()
      .then(setVerification)
      .catch(() => setVerification(null));
    fetchUpcomingSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
    fetchNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [bellOpen]);

  const handleNotificationClick = async (n: AppNotification) => {
    if (n.read_at) return;
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(n.id);
    } catch {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: null } : x)));
      setUnreadCount((c) => c + 1);
    }
  };

  const kpiValues: Record<string, string> = {
    'total-users': (summary?.totalUsers ?? 0).toLocaleString(),
    dhh: (summary?.dhhUsers ?? 0).toLocaleString(),
    institutions: (summary?.institutions ?? 0).toLocaleString(),
    interpreters: (summary?.interpreters ?? 0).toLocaleString(),
    pending: (summary?.pendingVerifications ?? 0).toLocaleString(),
  };

  const vTotal = verification?.total ?? 0;
  const bar = (n: number) => (vTotal ? `${Math.round((n / vTotal) * 100)}%` : '0%');

  const needle = query.trim().toLowerCase();

  const filteredFeed = useMemo(() => {
    if (!feed) return feed;
    if (!needle) return feed;
    return feed.filter((a) => a.text.toLowerCase().includes(needle));
  }, [feed, needle]);

  const filteredSessions = useMemo(() => {
    if (!sessions) return sessions;
    if (!needle) return sessions;
    return sessions.filter((s) =>
      [s.id, s.client, s.interpreter, s.type, s.status].some((v) =>
        v.toLowerCase().includes(needle),
      ),
    );
  }, [sessions, needle]);

  const activityMax = Math.max(1, ...(activity ?? []).map((x) => x.value));
  const yMax = Math.ceil(activityMax / 50) * 50 || 250;

  // 👇 Placeholder maths for the Interpreter availability donut
  const totalInterps = summary?.interpreters ?? 0;
  const availableInterps = Math.round(totalInterps * 0.6);
  const busyInterps = Math.round(totalInterps * 0.25);
  const offlineInterps = totalInterps - availableInterps - busyInterps;

  const availPct = totalInterps ? Math.round((availableInterps / totalInterps) * 100) : 0;
  const busyPct = totalInterps ? Math.round((busyInterps / totalInterps) * 100) : 0;
  const offlinePct = totalInterps ? 100 - availPct - busyPct : 0;

  const availabilityDonut = `conic-gradient(#4b34a0 0 ${availPct}%, #16a34a ${availPct}% ${availPct + busyPct}%, #cbd5e1 ${availPct + busyPct}% 100%)`;

  return (
    <div className="ad-page">
      {/* Top bar */}
      <div className="ad-topbar">
        <div className="ad-search">
          <Search size={16} aria-hidden="true" />
          <input
            placeholder="Search sessions or activity..."
            aria-label="Search sessions or activity"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="ad-actions">
          <button type="button" className="ad-date">
            <Calendar size={15} /> <span>{todayLabel()}</span>
          </button>

          <div className="ad-bell-wrap" ref={bellRef}>
            <button
              type="button"
              className="ad-icon-btn"
              aria-label="Notifications"
              onClick={() => setBellOpen((v) => !v)}
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="ad-dot" />}
            </button>
            {bellOpen && (
              <div className="ad-bell-panel" role="dialog" aria-label="Notifications">
                <div className="ad-bell-header">
                  Notifications
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '999px',
                        padding: '1px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        marginLeft: '8px',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                {notifications.length > 0 ? (
                  <ul className="ad-bell-list">
                    {notifications.slice(0, 6).map((n) => {
                      const isUnread = !n.read_at;
                      return (
                        <li
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          style={{
                            cursor: isUnread ? 'pointer' : 'default',
                            background: isUnread ? '#f8fafc' : 'white',
                          }}
                        >
                          <span
                            className="ad-bell-dot"
                            style={{ background: isUnread ? '#ef4444' : '#cbd5e1' }}
                          />
                          <div>
                            <strong>{n.title}</strong>
                            {n.body && (
                              <small style={{ display: 'block', color: '#6b7280' }}>{n.body}</small>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="ad-bell-empty">No notifications yet.</p>
                )}
              </div>
            )}
          </div>

          <button type="button" className="ad-user">
            <span className="ad-avatar">{initial}</span>
            <span className="ad-user-text">
              <strong>{name}</strong>
              <small>{role.charAt(0).toUpperCase() + role.slice(1)}</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="ad-title">
        <h1>Admin dashboard</h1>
        <p>Here's what's happening today.</p>
      </div>

      {/* KPI cards */}
      <div className="ad-kpis">
        {KPI_META.map(({ id, label, trend, Icon, color }) => (
          <div key={id} className="ad-kpi">
            <div className="ad-kpi-head">
              <span className={`ad-kpi-icon ad-kpi-icon--${color}`}>
                <Icon size={14} />
              </span>
              <span>{label}</span>
            </div>
            <div className="ad-kpi-value">{kpiValues[id] ?? '0'}</div>
            <div className={`ad-kpi-delta ad-kpi-delta--${trend}`}></div>
          </div>
        ))}
      </div>

      {/* Row: Session activity | Interpreter availability | Recent activity */}
      <div className="ad-row ad-row--top" style={{ alignItems: 'start' }}>
        <div className="ad-panel">
          <div className="ad-panel-head" style={{ alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0 }}>Session activity</h3>
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#9ca3af',
                fontWeight: 500,
                marginTop: '2px',
              }}
            >
              Last 7 days
            </div>
          </div>

          {activity && activity.length > 0 ? (
            <div style={{ display: 'flex', marginTop: '20px', height: '260px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingBottom: '24px',
                  fontSize: '11px',
                  color: '#9ca3af',
                  width: '30px',
                }}
              >
                {[
                  yMax,
                  Math.round(yMax * 0.8),
                  Math.round(yMax * 0.6),
                  Math.round(yMax * 0.4),
                  Math.round(yMax * 0.2),
                  0,
                ].map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ borderBottom: '1px dashed #f1f5f9', width: '100%' }} />
                  ))}
                  <div style={{ borderBottom: '1px solid #e2e8f0', width: '100%' }} />
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    zIndex: 1,
                    gap: '8px',
                  }}
                >
                  {activity.map((b) => {
                    const heightPct = Math.min(100, (b.value / yMax) * 100);
                    return (
                      <div
                        key={b.label}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          justifyContent: 'flex-end',
                          flex: 1,
                          maxWidth: '40px',
                        }}
                      >
                        <div
                          style={{
                            height: `${heightPct}%`,
                            width: '100%',
                            background: '#4b34a0',
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.5s ease',
                            minHeight: '4px',
                          }}
                          title={`${b.label}: ${b.value}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-around',
                    fontSize: '11px',
                    color: '#9ca3af',
                    gap: '8px',
                  }}
                >
                  {activity.map((b) => (
                    <span key={b.label} style={{ flex: 1, textAlign: 'center' }}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        {/* Interpreter availability donut */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <div>
              <h3 style={{ margin: 0 }}>Interpreter availability</h3>
              <small style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 500 }}>
                Right now
              </small>
            </div>
          </div>

          <div className="ad-donut-wrap" style={{ marginTop: '24px' }}>
            <div className="ad-donut" style={{ background: availabilityDonut }}>
              <div className="ad-donut-hole">
                <strong>{totalInterps}</strong>
                <small>Total</small>
              </div>
            </div>
            <div className="ad-legend" style={{ gap: '16px' }}>
              <div>
                <span className="ad-legend-dot" style={{ background: '#4b34a0' }} />
                <div>
                  <strong style={{ display: 'block', color: '#111827', fontSize: '13px' }}>
                    Available
                  </strong>
                  <small style={{ color: '#9ca3af' }}>
                    {availPct}% · {availableInterps}
                  </small>
                </div>
              </div>
              <div>
                <span className="ad-legend-dot" style={{ background: '#16a34a' }} />
                <div>
                  <strong style={{ display: 'block', color: '#111827', fontSize: '13px' }}>
                    In session / Busy
                  </strong>
                  <small style={{ color: '#9ca3af' }}>
                    {busyPct}% · {busyInterps}
                  </small>
                </div>
              </div>
              <div>
                <span className="ad-legend-dot" style={{ background: '#cbd5e1' }} />
                <div>
                  <strong style={{ display: 'block', color: '#111827', fontSize: '13px' }}>
                    Offline
                  </strong>
                  <small style={{ color: '#9ca3af' }}>
                    {offlinePct}% · {offlineInterps}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head" style={{ alignItems: 'center' }}>
            <h3>Recent activity</h3>
            <button
              type="button"
              onClick={() => navigate('/dashboard/admin/audit-logs')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4b34a0',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              View all
            </button>
          </div>
          {filteredFeed && filteredFeed.length > 0 ? (
            <div className="ad-feed">
              {filteredFeed.slice(0, 5).map((a, i) => {
                const { Icon, bg, color } = getActivityIcon(a.text);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div
                      style={{
                        background: bg,
                        color: color,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#111827',
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        {a.text}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}
                    >
                      {a.time}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="ad-empty">
              {feed && feed.length > 0 && needle
                ? 'No activity matches your search.'
                : 'No data yet.'}
            </p>
          )}
        </div>
      </div>

      {/* Row: Top session types | User growth | Quick insights */}
      <div className="ad-row ad-row--mid" style={{ alignItems: 'start' }}>
        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Top session types</h3>
            <small>All time</small>
          </div>

          {summary?.top_session_types && summary.top_session_types.length > 0 ? (
            <div className="ad-locations" style={{ marginTop: '20px' }}>
              {(() => {
                const total = summary.top_session_types!.reduce((sum, item) => sum + item.count, 0);
                const colors = ['#4b34a0', '#8b5cf6', '#c4b5fd', '#e5e7eb'];

                return summary.top_session_types!.slice(0, 4).map((item, index) => {
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  const label = item.type.charAt(0).toUpperCase() + item.type.slice(1);

                  return (
                    <div key={index} style={{ marginBottom: index === 3 ? 0 : '16px' }}>
                      <div className="ad-loc-row">
                        <span style={{ fontWeight: 600, color: '#111827' }}>{label}</span>
                        <span style={{ color: '#6b7280' }}>{percentage}%</span>
                      </div>
                      <div
                        className="ad-loc-bar"
                        style={{
                          background: '#f3f4f6',
                          height: '8px',
                          borderRadius: '4px',
                          marginTop: '6px',
                        }}
                      >
                        <span
                          style={{
                            width: `${percentage}%`,
                            background: colors[index % colors.length],
                            display: 'block',
                            height: '100%',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease-in-out',
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <p className="ad-empty">No session data yet.</p>
          )}
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  background: '#f3e8ff',
                  padding: '8px',
                  borderRadius: '8px',
                  color: '#4b34a0',
                }}
              >
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>User growth</h3>
                <small style={{ color: '#6b7280', fontSize: '12px' }}>Last 30 days</small>
              </div>
            </div>

            <div
              style={{
                background: '#4b34a0',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              {(summary?.totalUsers ?? 0).toLocaleString()}
            </div>
          </div>

          {growth && growth.length > 1 ? (
            <div style={{ position: 'relative', marginTop: '20px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#9ca3af',
                }}
              >
                {(() => {
                  const max = Math.max(1, ...growth.map((g) => g.value));
                  const formatY = (val: number) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${Math.round(val / 1000)}K`;
                    return Math.round(val).toString();
                  };
                  return (
                    <>
                      <span>{formatY(max)}</span>
                      <span>{formatY(max * 0.66)}</span>
                      <span>{formatY(max * 0.33)}</span>
                      <span>0</span>
                    </>
                  );
                })()}
              </div>

              <svg viewBox="0 0 320 160" style={{ width: '100%', height: 180, marginLeft: '25px' }}>
                <defs>
                  <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4b34a0" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4b34a0" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="10" x2="320" y2="10" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="50" x2="320" y2="50" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="90" x2="320" y2="90" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="130" x2="320" y2="130" stroke="#f3f4f6" strokeWidth="1" />

                {(() => {
                  const max = Math.max(1, ...growth.map((g) => g.value));
                  const stepX = 300 / Math.max(1, growth.length - 1);
                  const points = growth.map((g, i) => {
                    const x = 10 + i * stepX;
                    const y = 130 - (g.value / max) * 110;
                    return { x, y };
                  });
                  const line = points
                    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
                    .join(' ');
                  const area = `${line} L${points[points.length - 1].x},130 L${points[0].x},130 Z`;

                  const lastPoint = points[points.length - 1];

                  return (
                    <>
                      <path d={area} fill="url(#ug)" />
                      <path
                        d={line}
                        stroke="#4b34a0"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx={lastPoint.x}
                        cy={lastPoint.y}
                        r="4"
                        fill="#4b34a0"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </>
                  );
                })()}
              </svg>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginLeft: '25px',
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#9ca3af',
                }}
              >
                {growth.map((g, i) => (
                  <span key={i}>{g.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Quick insights</h3>
          </div>
          <div className="ad-insights">
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                {summary
                  ? `${summary.pendingVerifications} interpreter verification${summary.pendingVerifications === 1 ? '' : 's'} pending.`
                  : 'Insights will appear once data is available.'}
              </span>
            </div>
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                {summary
                  ? `${summary.institutions} institution${summary.institutions === 1 ? '' : 's'} in the platform.`
                  : 'Insights will appear once data is available.'}
              </span>
            </div>
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                {summary
                  ? `${summary.interpreters} interpreter${summary.interpreters === 1 ? '' : 's'} registered.`
                  : 'Insights will appear once data is available.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Interpreter performance | Verification status */}
      <div className="ad-row ad-row--bottom" style={{ alignItems: 'start' }}>
        <div className="ad-panel">
          <div className="ad-panel-head">
            <div>
              <h3 style={{ margin: 0 }}>Interpreter performance</h3>
              <small style={{ color: '#6b7280', fontSize: '13px' }}>
                Average response time & session completion rate
              </small>
            </div>
          </div>

          {performance ? (
            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <div
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      background: '#ede9fe',
                      color: '#6d28d9',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Avg. response time
                    </span>
                    <h2 style={{ margin: '2px 0', fontSize: '24px', color: '#111827' }}>
                      {performance.avgResponseTime}
                    </h2>
                  </div>
                </div>
                <div
                  style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}
                >
                  ↑ {performance.responseTrend}{' '}
                  <span style={{ color: '#9ca3af', fontWeight: 400 }}>vs. last 7 days</span>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      background: '#dcfce7',
                      color: '#16a34a',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Session completion rate
                    </span>
                    <h2 style={{ margin: '2px 0', fontSize: '24px', color: '#111827' }}>
                      {performance.completionRate}
                    </h2>
                  </div>
                </div>
                <div
                  style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}
                >
                  ↑ {performance.completionTrend}{' '}
                  <span style={{ color: '#9ca3af', fontWeight: 400 }}>vs. last 7 days</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Verification status</h3>
          </div>
          {verification ? (
            <>
              <div className="ad-vbar">
                <span style={{ width: bar(verification.approved), background: '#16a34a' }} />
                <span style={{ width: bar(verification.pending), background: '#f59e0b' }} />
                <span style={{ width: bar(verification.rejected), background: '#ef4444' }} />
                <span style={{ width: bar(verification.flagged), background: '#4b34a0' }} />
              </div>
              <div className="ad-vlegend">
                <span>
                  <i style={{ background: '#16a34a' }} />
                  Approved · {verification.approved}
                </span>
                <span>
                  <i style={{ background: '#f59e0b' }} />
                  Pending · {verification.pending}
                </span>
                <span>
                  <i style={{ background: '#ef4444' }} />
                  Rejected · {verification.rejected}
                </span>
                <span>
                  <i style={{ background: '#4b34a0' }} />
                  Flagged · {verification.flagged}
                </span>
              </div>
            </>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="ad-panel">
        <div className="ad-panel-head" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ color: '#4b34a0' }}>
              <Calendar size={20} />
            </div>
            <h3 style={{ margin: 0 }}>Upcoming sessions</h3>
          </div>
          <a
            href="/dashboard/admin/sessions"
            style={{ color: '#4b34a0', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
          >
            View all
          </a>
        </div>

        {filteredSessions && filteredSessions.length > 0 ? (
          <table className="ad-table">
            <thead>
              <tr>
                {['Time', 'User', 'Interpreter', 'Session type', 'Status'].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#9ca3af',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => {
                const typeLabel = s.type ? s.type.charAt(0).toUpperCase() + s.type.slice(1) : '—';
                const st = statusStyle(s.status);

                return (
                  <tr key={s.id}>
                    <td style={{ color: '#6b7280', fontSize: '13px' }}>{s.date}</td>
                    <td style={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>
                      {s.client}
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '13px' }}>{s.interpreter || '—'}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#f4f1fa',
                          color: '#4b34a0',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {typeLabel}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: st.bg,
                          color: st.text,
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="ad-empty">
            {sessions && sessions.length > 0 && needle
              ? 'No sessions match your search.'
              : 'No upcoming sessions yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
