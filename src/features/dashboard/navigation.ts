import { Home, Video, MessageSquare, Wallet, User, Settings } from 'lucide-react';
import type { NavItem } from '../../components/dashboard/DashboardLayout';

export const deafNavigation: NavItem[] = [
  { id: 'home', label: 'Home', to: '/dashboard/deaf', icon: Home, end: true },
  { id: 'sessions', label: 'Sessions', to: '/dashboard/deaf/sessions', icon: Video },
  { id: 'messages', label: 'Messages', to: '/dashboard/deaf/messages', icon: MessageSquare },
  { id: 'wallet', label: 'Wallet', to: '/dashboard/deaf/wallet', icon: Wallet },
  { id: 'profile', label: 'Profile', to: '/dashboard/deaf/profile', icon: User },
  { id: 'settings', label: 'Settings', to: '/dashboard/deaf/settings', icon: Settings },
];