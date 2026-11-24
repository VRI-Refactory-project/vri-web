import {
  Home,
  Users,
  Video,
  BarChart3,
  Settings,
  Building2,
  UserRound,
  CircleHelp,
} from 'lucide-react';
import type { NavItem } from '../../components/dashboard/DashboardLayout';
export const institutionNavigation: NavItem[] = [
  { id: 'home', label: 'Dashboard', to: '/dashboard/institution', icon: Home, end: true },
  { id: 'staff', label: 'Staff', to: '/dashboard/institution/staff', icon: Users },
  { id: 'sessions', label: 'Sessions', to: '/dashboard/institution/sessions', icon: Video },
  { id: 'analytics', label: 'Analytics', to: '/dashboard/institution/analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', to: '/dashboard/institution/settings', icon: Settings },
  {
    id: 'profile',
    label: 'Institution Profile',
    to: '/dashboard/institution/profile',
    icon: Building2,
  },
  {
    id: 'my-profile',
    label: 'My Profile',
    to: '/dashboard/institution/my-profile',
    icon: UserRound,
  },
  {
    id: 'help',
    label: 'Help & Support',
    to: '/dashboard/institution/help',
    icon: CircleHelp,
  },
];
