// src/features/admin/AdminLayout.tsx
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { adminNavItems } from './navigation';
import { fetchAdminSummary } from '../../services/admin';
import { getAdminSupportRequests } from '../../services/support';

export function AdminLayout() {
  const [pending, setPending] = useState(0);
  const [openSupport, setOpenSupport] = useState(0);

  useEffect(() => {
    fetchAdminSummary()
      .then((s) => setPending(s.pendingVerifications))
      .catch(() => setPending(0));
  }, []);

  useEffect(() => {
    const refresh = () => {
      getAdminSupportRequests(1, 1, 'OPEN')
        .then((page) => setOpenSupport(page.count))
        .catch(() => setOpenSupport(0));
    };
    refresh();
    window.addEventListener('support-requests-updated', refresh);
    return () => window.removeEventListener('support-requests-updated', refresh);
  }, []);

  return (
    <DashboardLayout
      links={adminNavItems}
      navLabel="Admin"
      badges={{ verifications: pending, more: openSupport, 'support-requests': openSupport }}
      accountTo="/dashboard/admin/settings"
      accountLabel="View account"
    />
  );
}
