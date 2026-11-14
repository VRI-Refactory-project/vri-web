import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getInstitutionOverview } from '../../services/institutionDashboard';
import { staffNavigation } from './navigation';

export function StaffLayout() {
  // Every staff page shows which institution the account belongs to.
  const [organisation, setOrganisation] = useState('');

  useEffect(() => {
    let cancelled = false;
    getInstitutionOverview().then(
      (overview) => !cancelled && setOrganisation(overview.name),
      () => undefined, // a nicety: the pages work without the name
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardLayout
      links={staffNavigation}
      navLabel="Institution staff"
      accountTo="/dashboard/staff/profile"
      accountLabel="View account"
      organisation={organisation}
    />
  );
}
