import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { institutionNavigation } from './navigation';

export function InstitutionLayout() {
  return (
    <DashboardLayout
      links={institutionNavigation}
      navLabel="Institution"
      accountTo="/dashboard/institution/settings"
      accountLabel="View account"
    />
  );
}