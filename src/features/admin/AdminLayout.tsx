// src/features/admin/AdminLayout.tsx
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { adminNavItems } from './navigation';
import { fetchAdminSummary } from '../../services/admin';

export function AdminLayout() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    fetchAdminSummary()
      .then((s) => setPending(s.pendingVerifications))
      .catch(() => setPending(0));
  }, []);

  return (
    <DashboardLayout
      links={adminNavItems}
      navLabel="Admin"
      badges={{ verifications: pending }}
      accountTo="/dashboard/admin/settings"
      accountLabel="View account"
    />
  );
}