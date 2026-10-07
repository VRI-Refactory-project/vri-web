import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { ApiError } from '../../services/api';
import * as authService from '../../services/auth';
import { Forgotpassword } from './Forgotpassword';
import { Resetpassword } from './Resetpassword';

function renderFlow() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<Forgotpassword />} />
          <Route path="/reset-password" element={<Resetpassword />} />
          <Route path="/dashboard/deaf" element={<p>deaf home</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('account recovery pages (V2-008)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('requests a code, carries the identifier to the reset page, then signs the user in', async () => {
    const request = vi.spyOn(authService, 'requestRecovery').mockResolvedValue({ detail: 'ok' });
    const confirm = vi.spyOn(authService, 'confirmRecovery').mockResolvedValue({
      token: 'a',
      refreshToken: 'r',
      user: { id: '1', name: 'Amina', role: 'deaf', mustChangePassword: false },
    });
    renderFlow();

    await userEvent.type(screen.getByLabelText('Email or phone number'), 'deaf@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(request).toHaveBeenCalledWith('deaf@test.com');

    // Wait for something only the reset page has, then check it already knows who is resetting.
    const code = await screen.findByLabelText('6-digit code');
    expect(screen.getByLabelText('Email or phone number')).toHaveValue('deaf@test.com');
    await userEvent.type(code, '123456');
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass#2026');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(confirm).toHaveBeenCalledWith('deaf@test.com', '123456', 'NewPass#2026');
    expect(await screen.findByText('deaf home')).toBeInTheDocument();
  });

  it('shows the API error when the code is wrong and does not sign in', async () => {
    vi.spyOn(authService, 'confirmRecovery').mockRejectedValue(
      new ApiError(400, 'Invalid or expired code. Request a new one.'),
    );
    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={[{ pathname: '/reset-password', state: { identifier: 'x' } }]}
        >
          <Routes>
            <Route path="/reset-password" element={<Resetpassword />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    await userEvent.type(screen.getByLabelText('6-digit code'), '000000');
    await userEvent.type(screen.getByLabelText('New password'), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired code');
    expect(sessionStorage.getItem('vri.session')).toBeNull();
  });
});
