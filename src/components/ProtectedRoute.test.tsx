import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import type { AuthSession } from '../types';
import { ProtectedRoute } from './ProtectedRoute';

function SignInStub() {
  const state = useLocation().state as { from?: string } | null;
  return <p>sign in page, came from {state?.from ?? 'nowhere'}</p>;
}

function renderAt(session: AuthSession | null) {
  sessionStorage.clear();
  if (session) sessionStorage.setItem('vri.session', JSON.stringify(session));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard/interpreter']}>
        <Routes>
          <Route path="/" element={<p>landing</p>} />
          <Route path="/sign-in" element={<SignInStub />} />
          <Route element={<ProtectedRoute allow={['interpreter']} />}>
            <Route path="/dashboard/interpreter" element={<p>interpreter home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const sessionFor = (role: AuthSession['user']['role']): AuthSession => ({
  token: 't',
  refreshToken: 'r',
  user: { id: '1', name: 'X', role, mustChangePassword: false },
});

describe('ProtectedRoute', () => {
  afterEach(() => sessionStorage.clear());

  it('sends signed-out visitors to sign in', () => {
    renderAt(null);
    expect(screen.getByText(/sign in page/)).toBeInTheDocument();
  });

  it('remembers the page a signed-out visitor was heading to', () => {
    renderAt(null);
    expect(screen.getByText('sign in page, came from /dashboard/interpreter')).toBeInTheDocument();
  });

  it('sends the wrong role home', () => {
    renderAt(sessionFor('deaf'));
    expect(screen.getByText('landing')).toBeInTheDocument();
  });

  it('lets the right role in using a restored session', () => {
    renderAt(sessionFor('interpreter'));
    expect(screen.getByText('interpreter home')).toBeInTheDocument();
  });
});
