import { Home, Video, MessageSquare, User, Settings, CircleHelp } from 'lucide-react';
import type { NavItem } from '../../components/dashboard/DashboardLayout';

/** Sidebar for institution staff (Figma: signconnect-staff-*). */
export const staffNavigation: NavItem[] = [
  { id: 'home', label: 'Dashboard', to: '/dashboard/staff', icon: Home, end: true },
  { id: 'sessions', label: 'Sessions', to: '/dashboard/staff/sessions', icon: Video },
  { id: 'chat', label: 'Chat', to: '/dashboard/staff/chat', icon: MessageSquare },
  { id: 'profile', label: 'Profile', to: '/dashboard/staff/profile', icon: User },
  { id: 'settings', label: 'Settings', to: '/dashboard/staff/settings', icon: Settings },
  { id: 'help', label: 'Help & Support', to: '/dashboard/staff/help', icon: CircleHelp },
];
