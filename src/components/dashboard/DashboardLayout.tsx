import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getConversations } from '../../services/community';
import { useInterval } from '../../features/community/useInterval';
import { Menu, X, type LucideIcon } from 'lucide-react';
import logo from '../../assets/no_bg.png';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLayout.css';

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

interface Props {
  links: NavItem[];
  navLabel: string;
  badges?: Record<string, number>;
  accountTo: string;
  accountLabel?: string;
  organisation?: string;
}

export function DashboardLayout({
  links,
  navLabel,
  badges = {},
  accountTo,
  accountLabel = 'View account',
  organisation,
}: Props) {
  const { session } = useAuth();
  useEffect(() => {
    document.body.classList.add('dashboard-page-active');
    return () => document.body.classList.remove('dashboard-page-active');
  }, []);

  const isDeaf = session?.user.role === 'deaf';
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { pathname } = useLocation();

  const loadUnread = useCallback(() => {
    if (!isDeaf) return; // only Deaf users have chat
    getConversations()
      .then((list) => setUnreadMessages(list.reduce((total, c) => total + c.unread, 0)))
      .catch(() => {}); // if one refresh fails, keep the last number
  }, [isDeaf]);

  // Load when the dashboard opens and whenever the person goes to another page...
  useEffect(() => {
    loadUnread();
  }, [loadUnread, pathname]);

  // ...and keep it fresh every 15 seconds (never, for people without chat).
  useInterval(loadUnread, isDeaf ? 15000 : null);

  // The badges the page passed in, plus the unread messages for Deaf users.
  const shownBadges = isDeaf ? { ...badges, messages: unreadMessages } : badges;

  const name = session?.user.name ?? '';
  const initial = name.trim().charAt(0).toUpperCase() || 'NM';

  // NEW: State for the mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dl-shell">
      {/* NEW: Mobile Toggle Button (Visible only on small screens) */}
      <button
        className="dl-mobile-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Sidebar"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* NEW: Overlay to close sidebar when clicking outside */}
      {isSidebarOpen && (
        <div className="dl-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Added dynamic class for mobile */}
      <aside className={`dl-sidebar ${isSidebarOpen ? 'dl-sidebar--open' : ''}`}>
        <img className="dl-logo" src={logo} alt="SignConnect VRI Platform" />
        {organisation && (
          <p className="dl-org" title={organisation}>
            {organisation}
          </p>
        )}
        <nav className="dl-nav" aria-label={navLabel}>
          {links.map(({ id, label, to, icon: Icon, end }) => {
            const count = shownBadges[id] ?? 0;
            return (
              <NavLink
                key={id}
                to={to}
                end={end}
                // Close sidebar on navigation for mobile
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => (isActive ? 'dl-link dl-link--active' : 'dl-link')}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
                {count > 0 && (
                  <span className="dl-count" aria-label={`${count} waiting`}>
                    {count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
        <NavLink to={accountTo} className="dl-account" onClick={() => setIsSidebarOpen(false)}>
          <span className="dl-avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="dl-account-text">
            <strong>{name}</strong>
            <small>{accountLabel}</small>
          </span>
        </NavLink>
      </aside>
      <main className="dl-main">
        <Outlet />
      </main>
    </div>
  );
}
