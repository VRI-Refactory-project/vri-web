import { Link } from 'react-router-dom';

// NEW-02: sign-in, then open the role-specific dashboard. Link to recovery (V2-008).
export function SignInPage() {
  return (
    <main className="page">
      <h1>Sign in</h1>
      <p>Sign-in form: story NEW-02.</p>
      <Link to="/recover">Lost access?</Link>
    </main>
  );
}
