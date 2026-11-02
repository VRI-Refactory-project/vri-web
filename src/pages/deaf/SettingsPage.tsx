import { Accessibility, ChevronRight, CircleHelp, User } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import './SessionsPages.css';

interface Item {
  title: string;
  text: string;
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  to?: string;
}

const ITEMS: Item[] = [
  {
    title: 'Profile',
    text: 'Your name, photo and contact details.',
    icon: User,
    to: '/dashboard/deaf/profile',
  },
  {
    title: 'Accessibility & Preferences',
    text: 'Captions, alerts, contrast and text size.',
    icon: Accessibility,
    to: '/dashboard/deaf/accessibility',
  },
  { title: 'Help & Support', text: 'Get help using SignConnect.', icon: CircleHelp },
];

export function SettingsPage() {
  return (
    <div className="sh-page">
      <header className="sh-header">
        <h1>Settings</h1>
        <p>Manage your account and how SignConnect works for you.</p>
      </header>
      <ul className="sh-cards">
        {ITEMS.map(({ title, text, icon: Icon, to }) => {
          const body = (
            <>
              <span className="sh-card-icon">
                <Icon size={22} aria-hidden />
              </span>
              <span className="sh-card-text">
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
              {to ? <ChevronRight size={18} aria-hidden /> : <span className="sh-soon">Soon</span>}
            </>
          );
          return (
            <li key={title}>
              {to ? (
                <Link to={to} className="sh-card">
                  {body}
                </Link>
              ) : (
                <div className="sh-card sh-card--off" aria-disabled="true">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
