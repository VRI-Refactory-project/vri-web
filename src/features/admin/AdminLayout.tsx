// src/features/admin/AdminLayout.tsx
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { adminNavItems } from './navigation';

/**
 * Admin dashboard frame. Wraps every /dashboard/admin/* page with the
 * shared sidebar + main layout. Badge counts are added here as the
 * backing data hooks land (e.g. interpreters awaiting verification).
 */
export function AdminLayout() {
  return (
    <DashboardLayout
      links={adminNavItems}
      navLabel="Admin"
      accountTo="/dashboard/admin/settings"
      accountLabel="View account"
    />
  );
}