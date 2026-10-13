import { Clock, Home, MessageSquare, Settings, User, Video, Wallet } from 'lucide-react';
import type { NavItem } from '../../components/dashboard/DashboardLayout';

export const INTERPRETER_BASE = '/dashboard/interpreter';

/**
 * Sidebar for interpreters. Edit `label` to reword an entry; keep `id` stable.
 * Other roles get their own list in features/<role>/navigation.ts.
 */
export const INTERPRETER_NAV: NavItem[] = [
  { id: 'home', label: 'Home', to: INTERPRETER_BASE, icon: Home, end: true },
  { id: 'requests', label: 'Requests', to: `${INTERPRETER_BASE}/requests`, icon: MessageSquare },
  { id: 'sessions', label: 'Sessions', to: `${INTERPRETER_BASE}/sessions`, icon: Video },
  {
    id: 'availability',
    label: 'Availability',
    to: `${INTERPRETER_BASE}/availability`,
    icon: Clock,
  },
  { id: 'wallet', label: 'Wallet', to: `${INTERPRETER_BASE}/wallet`, icon: Wallet },
  { id: 'profile', label: 'Profile', to: `${INTERPRETER_BASE}/profile`, icon: User },
  { id: 'settings', label: 'Settings', to: `${INTERPRETER_BASE}/settings`, icon: Settings },
];
