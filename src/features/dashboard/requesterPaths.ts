import { useLocation } from 'react-router-dom';

/**
 * Where the screens for asking for an interpreter send the person. Deaf users and institution staff
 * share those screens; each stays inside their own dashboard. It reads the URL, so a screen needs no
 * extra prop and works the same in tests that render it at "/".
 */
export function useRequesterPaths() {
  const { pathname } = useLocation();
  const staff = pathname.startsWith('/dashboard/staff');
  return {
    /** The dashboard home. */
    home: staff ? '/dashboard/staff' : '/dashboard/deaf',
    /** Where Back goes from the schedule screen. */
    scheduleBack: staff ? '/dashboard/staff' : '/dashboard/deaf/sessions',
    /** The live-session screen for a request. */
    live: (id: string | number) => (staff ? `/live/institution/${id}` : `/live/deaf/${id}`),
  };
}
