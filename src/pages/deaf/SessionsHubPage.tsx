import { CalendarCheck, CheckCircle2, ChevronRight, Clock, FileText, History } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import './SessionsPages.css';

interface Card {
  title: string;
  text: string;
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  /** Cards without a page yet are shown but cannot be opened. */
  to?: string;
}

const CARDS: Card[] = [
  {
    title: 'Start session',
    text: 'Begin a new session with an available interpreter.',
    icon: CalendarCheck,
    to: '/dashboard/deaf/sessions/new',
  },
  {
    title: 'Schedule VRI session',
    text: 'Book a session for a later time.',
    icon: Clock,
    to: '/dashboard/deaf/schedule',
  },
  {
    title: 'Session details',
    text: 'View details of your current or past sessions.',
    icon: CheckCircle2,
  },
  {
    title: 'Session confirmation',
    text: 'Confirm your scheduled or completed sessions.',
    icon: FileText,
  },
  {
    title: 'Session history',
    text: 'View your past sessions and their details.',
    icon: History,
    to: '/dashboard/deaf/sessions/history',
  },
];

/** Where the Sessions sidebar item lands: everything about sessions, in one list. */
export function SessionsHubPage() {
  return (
    <div className="sh-page">
      <header className="sh-header">
        <h1>Sessions</h1>
        <p>Manage your session activities and connect with interpreters.</p>
      </header>
      <ul className="sh-cards">
        {CARDS.map(({ title, text, icon: Icon, to }) => {
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
