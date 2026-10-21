/** Pages a signed-in person can be on without being signed out when they press the browser's Back. */
const KEEP = [
  '/verify-email',
  '/register/interpreter/certifications',
  '/register/welcome',
  '/register/pending',
  '/offline',
];

export function staysSignedIn(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/') || KEEP.includes(pathname);
}

/** A full page load, so nothing from the dashboard is left on screen or in the history entry. */
export function redirectToSignIn() {
  window.location.replace('/sign-in');
}
