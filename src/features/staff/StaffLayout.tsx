import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { staffNavigation } from './navigation';

export function StaffLayout() {
  return (
    <DashboardLayout
      links={staffNavigation}
      navLabel="Institution staff"
      accountTo="/dashboard/staff/profile"
      accountLabel="View account"
    />
  );
}
