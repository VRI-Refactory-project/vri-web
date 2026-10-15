import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { AuthContext, type AuthState } from '../../features/auth/authContext';
import { ApiError } from '../../services/api';
import * as authService from '../../services/auth';
import { SignInPage } from './SignInPage';

function renderPage(entry: string | { pathname: string; state?: unknown } = '/sign-in') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/dashboard/interpreter" element={<p>interpreter home</p>} />
          <Route path="/dashboard/deaf" element={<p>deaf home</p>} />
          <Route path="/dashboard/interpreter/availability" element={<p>availability page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Email or phone number'), '+256772123456');
  await userEvent.type(screen.getByLabelText('Password'), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
}

describe('SignInPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('signs in and goes to the dashboard for the user role', async () => {
    vi.spyOn(authService, 'signIn').mockResolvedValue({
      token: 'a',
      refreshToken: 'r',
      user: { id: '1', name: 'Ruth', role: 'interpreter', mustChangePassword: false },
    });
    renderPage();
    await fillAndSubmit();
    expect(await screen.findByText('interpreter home')).toBeInTheDocument();
    expect(sessionStorage.getItem('vri.session')).toContain('"token":"a"');
  });

  it('shows the API error and stays on the page', async () => {
    vi.spyOn(authService, 'signIn').mockRejectedValue(new ApiError(401, 'Invalid credentials'));
    renderPage();
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(sessionStorage.getItem('vri.session')).toBeNull();
  });

  it('shows a generic message when the network fails', async () => {
    vi.spyOn(authService, 'signIn').mockRejectedValue(new TypeError('Failed to fetch'));
    renderPage();
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not sign you in/i);
  });

  it('sends the phone number without spaces or dashes', async () => {
    const spy = vi.spyOn(authService, 'signIn').mockResolvedValue({
      token: 'a',
      refreshToken: 'r',
      user: { id: '1', name: 'Ruth', role: 'interpreter', mustChangePassword: false },
    });
    renderPage();
    await userEvent.type(screen.getByLabelText('Email or phone number'), '+256 772-123 456');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(spy).toHaveBeenCalledWith('+256772123456', 'secret');
  });

  it('signs in with an email address', async () => {
    const spy = vi.spyOn(authService, 'signIn').mockResolvedValue({
      token: 'a',
      refreshToken: 'r',
      user: { id: '1', name: 'Ruth', role: 'interpreter', mustChangePassword: false },
    });
    renderPage();
    await userEvent.type(screen.getByLabelText('Email or phone number'), ' ruth@example.com ');
    await userEvent.type(screen.getByLabelText('Password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(spy).toHaveBeenCalledWith('ruth@example.com', 'x');
  });

  it('says what is missing and does not call the API', async () => {
    const spy = vi.spyOn(authService, 'signIn');
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(screen.getByText('Enter your email address or phone number.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('asks for a country code when the number starts with 0', async () => {
    const spy = vi.spyOn(authService, 'signIn');
    renderPage();
    await userEvent.type(screen.getByLabelText('Email or phone number'), '0772123456');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(screen.getByText(/start with your country code/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not apply password rules, so older short passwords still sign in', async () => {
    const spy = vi.spyOn(authService, 'signIn').mockResolvedValue({
      token: 'a',
      refreshToken: 'r',
      user: { id: '1', name: 'Ruth', role: 'interpreter', mustChangePassword: false },
    });
    renderPage();
    await userEvent.type(screen.getByLabelText('Email or phone number'), 'ruth@example.com');
    await userEvent.type(screen.getByLabelText('Password'), '123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(spy).toHaveBeenCalledWith('ruth@example.com', '123');
  });

  const interpreterSession = {
    token: 'a',
    refreshToken: 'r',
    user: { id: '1', name: 'Ruth', role: 'interpreter' as const, mustChangePassword: false },
  };

  it('takes someone who is already signed in straight to their dashboard', () => {
    sessionStorage.setItem('vri.session', JSON.stringify(interpreterSession));
    renderPage();
    expect(screen.getByText('interpreter home')).toBeInTheDocument();
  });

  it('brings them back to the page they were sent away from', async () => {
    vi.spyOn(authService, 'signIn').mockResolvedValue(interpreterSession);
    renderPage({ pathname: '/sign-in', state: { from: '/dashboard/interpreter/availability' } });
    await fillAndSubmit();
    expect(await screen.findByText('availability page')).toBeInTheDocument();
  });

  it('ignores a return page that belongs to another role', async () => {
    vi.spyOn(authService, 'signIn').mockResolvedValue(interpreterSession);
    renderPage({ pathname: '/sign-in', state: { from: '/dashboard/deaf' } });
    await fillAndSubmit();
    expect(await screen.findByText('interpreter home')).toBeInTheDocument();
  });

  it('says so when the session has ended', () => {
    const value: AuthState = {
      session: null,
      sessionExpired: true,
      selectedRole: null,
      selectRole: () => {},
      login: () => {},
      logout: () => {},
      updateUser: () => {},
    };
    render(
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={['/sign-in']}>
          <SignInPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/session has ended/i);
  });

  it('shows no session notice on a normal visit', () => {
    renderPage();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
