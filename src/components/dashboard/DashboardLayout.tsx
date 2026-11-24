import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getConversations } from '../../services/community';
import { useInterval } from '../../features/community/useInterval';
import { ChevronDown, Menu, X, type LucideIcon } from 'lucide-react';
import logo from '../../assets/no_bg.png';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLayout.css';

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  children?: NavItem[];
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
  const [moreOpen, setMoreOpen] = useState(() =>
    links.some((item) => item.children?.some((child) => pathname === child.to)),
  );

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
          {links.map(({ id, label, to, icon: Icon, end, children }) => {
            const count = shownBadges[id] ?? 0;
            if (children) {
              const childIsActive = children.some(
                (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
              );
              const expanded = moreOpen;
              return (
                <div className="dl-nav-group" key={id}>
                  <button
                    type="button"
                    className={`dl-link dl-more-button${childIsActive ? ' dl-link--active' : ''}`}
                    aria-expanded={expanded}
                    onClick={() => setMoreOpen((open) => !open)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{label}</span>
                    {count > 0 && !expanded && (
                      <span className="dl-count" aria-label={`${count} open support requests`}>
                        {count}
                      </span>
                    )}
                    <ChevronDown
                      className={
                        expanded ? 'dl-more-chevron dl-more-chevron--open' : 'dl-more-chevron'
                      }
                      size={16}
                      aria-hidden="true"
                    />
                  </button>
                  {expanded && (
                    <div className="dl-nav-submenu">
                      {children.map((child) => {
                        const ChildIcon = child.icon;
                        const childCount = shownBadges[child.id] ?? 0;
                        return (
                          <NavLink
                            key={child.id}
                            to={child.to}
                            onClick={() => {
                              setMoreOpen(true);
                              setIsSidebarOpen(false);
                            }}
                            className={({ isActive }) =>
                              isActive
                                ? 'dl-link dl-link--sub dl-link--active'
                                : 'dl-link dl-link--sub'
                            }
                          >
                            <ChildIcon size={16} aria-hidden="true" />
                            <span>{child.label}</span>
                            {childCount > 0 && (
                              <span
                                className="dl-count"
                                aria-label={`${childCount} open support requests`}
                              >
                                {childCount}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink
                key={id}
                to={to}
                end={end}
                // What the staff tutorial points at (V2-065).
                data-tour={id}
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
