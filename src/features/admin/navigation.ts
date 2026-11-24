// src/features/admin/navigation.ts
import {
  Home,
  Users,
  ShieldCheck,
  Building2,
  Video,
  BarChart3,
  Star,
  ScrollText,
  Settings,
} from 'lucide-react';
import type { NavItem } from '../../components/dashboard/DashboardLayout';

/**
 * Sidebar entries for the admin dashboard.
 * Order matches the design: Home, Users, Verifications, Institutions,
 * Sessions, Reports, Audit Logs, Settings.
 */
export const adminNavItems: NavItem[] = [
  { id: 'home', label: 'Home', to: '/dashboard/admin', icon: Home, end: true },
  { id: 'users', label: 'Users', to: '/dashboard/admin/users', icon: Users },
  {
    id: 'verifications',
    label: 'Verifications',
    to: '/dashboard/admin/verifications',
    icon: ShieldCheck,
  },
  {
    id: 'institutions',
    label: 'Institutions',
    to: '/dashboard/admin/institutions',
    icon: Building2,
  },
  { id: 'sessions', label: 'Sessions', to: '/dashboard/admin/sessions', icon: Video },
  {
    id: 'interpreter-performance',
    label: 'Interpreter performance',
    to: '/dashboard/admin/interpreter-performance',
    icon: Star,
  },
  { id: 'reports', label: 'Reports', to: '/dashboard/admin/reports', icon: BarChart3 },
  { id: 'audit-logs', label: 'Audit Logs', to: '/dashboard/admin/audit-logs', icon: ScrollText },
  { id: 'settings', label: 'Settings', to: '/dashboard/admin/settings', icon: Settings },
];
