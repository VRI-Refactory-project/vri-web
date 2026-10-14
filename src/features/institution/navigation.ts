import { Home, Users, Video, BarChart3, Settings } from 'lucide-react';
import type { NavItem } from '../../components/dashboard/DashboardLayout';

export const institutionNavigation: NavItem[] = [
  { id: 'home', label: 'Dashboard', to: '/dashboard/institution', icon: Home, end: true },
  { id: 'staff', label: 'Staff', to: '/dashboard/institution/staff', icon: Users },
  { id: 'sessions', label: 'Sessions', to: '/dashboard/institution/sessions', icon: Video },
  { id: 'analytics', label: 'Analytics', to: '/dashboard/institution/analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', to: '/dashboard/institution/settings', icon: Settings },
];
// import {
//   LayoutDashboard,
//   ChartNoAxesColumnIncreasing,
// } from 'lucide-react';

// export const institutionNavItems: NavItem[] = [
//   {
//     id: 'dashboard',
//     label: 'Dashboard',
//     to: '/dashboard/institution',
//     icon: LayoutDashboard,
//     end: true,
//   },
//   {
//     id: 'staff',
//     label: 'Staff',
//     to: '/dashboard/institution/staff',
//     icon: Users,
//   },
//   {
//     id: 'sessions',
//     label: 'Sessions',
//     to: '/dashboard/institution/sessions',
//     icon: Video,
//   },
//   {
//     id: 'analytics',
//     label: 'Analytics',
//     to: '/dashboard/institution/analytics',
//     icon: ChartNoAxesColumnIncreasing,
//   },
//   {
//     id: 'settings',
//     label: 'Settings',
//     to: '/dashboard/institution/settings',
//     icon: Settings,
//   },
// ];
