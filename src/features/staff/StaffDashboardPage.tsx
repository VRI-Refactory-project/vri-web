import { useAuth } from '../../hooks/useAuth';

/** Placeholder until the dashboard from Figma (signconnect-staff-dashboard) is built. */
export function StaffDashboardPage() {
  const { session } = useAuth();
  const first = session?.user.name.trim().split(/\s+/)[0] ?? '';
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Welcome, {first}</h1>
    </main>
  );
}
