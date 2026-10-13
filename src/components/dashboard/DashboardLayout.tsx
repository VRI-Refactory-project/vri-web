import { NavLink, Outlet } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import logo from '../../assets/no_bg.png';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLayout.css';

/** One sidebar entry. Each role defines its own list (see features/<role>/navigation.ts). */
export interface NavItem {
  /** Stable key, used to attach badges. Does not change when the label is reworded. */
  id: string;
  /** The words shown in the sidebar. Free to differ per role. */
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match the path exactly (use for the Home entry). */
  end?: boolean;
}

interface Props {
  links: NavItem[];
  /** Accessible name of the navigation landmark, e.g. "Interpreter". */
  navLabel: string;
  /** Small counts shown on an entry, keyed by NavItem.id. Zero or missing hides the badge. */
  badges?: Record<string, number>;
  /** Where the account block at the bottom leads. */
  accountTo: string;
  /** Text under the user's name. */
  accountLabel?: string;
}

/** Sidebar and page frame shared by the role dashboards. */
export function DashboardLayout({
  links,
  navLabel,
  badges = {},
  accountTo,
  accountLabel = 'View account',
}: Props) {
  const { session } = useAuth();
  const name = session?.user.name ?? '';
  const initial = name.trim().charAt(0).toUpperCase() || 'MK';

  return (
    <div className="dl-shell">
      <aside className="dl-sidebar">
        <img className="dl-logo" src={logo} alt="SignConnect VRI Platform" />
        <nav className="dl-nav" aria-label={navLabel}>
          {links.map(({ id, label, to, icon: Icon, end }) => {
            const count = badges[id] ?? 0;
            return (
              <NavLink
                key={id}
                to={to}
                end={end}
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
        <NavLink to={accountTo} className="dl-account">
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
