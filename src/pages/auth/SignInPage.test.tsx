import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { ApiError } from '../../services/api';
import * as authService from '../../services/auth';
import { SignInPage } from './SignInPage';

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/sign-in']}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/dashboard/interpreter" element={<p>interpreter home</p>} />
          <Route path="/dashboard/deaf" element={<p>deaf home</p>} />
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
});
