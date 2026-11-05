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

    // Wait for the Continue button to appear, which signals the OTP step is ready
    const continueBtn = await screen.findByRole('button', { name: /continue/i });

    // Now find all the OTP input boxes
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(6);

    // Type the code into the 6 boxes
    for (let i = 0; i < 6; i++) {
      await userEvent.type(inputs[i], '1');
    }

    // Click Continue to go to the password step
    await userEvent.click(continueBtn);

    // STEP 3: The new password
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass#2026');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'NewPass#2026');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(confirm).toHaveBeenCalledWith('deaf@test.com', '111111', 'NewPass#2026');
    expect(await screen.findByText('deaf home')).toBeInTheDocument();
  });

  it('shows the API error when the code is wrong and does not sign in', async () => {
    vi.spyOn(authService, 'confirmRecovery').mockRejectedValue(
      new ApiError(400, 'Invalid or expired code. Request a new one.'),
    );
    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={[{ pathname: '/reset-password', state: { identifier: 'deaf@test.com' } }]}
        >
          <Routes>
            <Route path="/reset-password" element={<Resetpassword />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await screen.findByRole('button', { name: /continue/i });
    const inputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await userEvent.type(inputs[i], '0');
    }
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await userEvent.type(screen.getByLabelText('New password'), 'Whatever-1!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Whatever-1!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired code');
    expect(sessionStorage.getItem('vri.session')).toBeNull();
  });

  it('asks for a valid email or phone number before requesting a code', async () => {
    const request = vi.spyOn(authService, 'requestRecovery');
    renderFlow();
    await userEvent.type(screen.getByLabelText('Email or phone number'), '0772123456');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(screen.getByText(/start with your country code/i)).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it('accepts a phone number with a country code, sent without spaces', async () => {
    const request = vi.spyOn(authService, 'requestRecovery').mockResolvedValue({ detail: 'ok' });
    renderFlow();
    await userEvent.type(screen.getByLabelText('Email or phone number'), '+256 772 123 456');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(request).toHaveBeenCalledWith('+256772123456');
  });

  it('blocks resetting if the passwords do not match', async () => {
    const confirm = vi.spyOn(authService, 'confirmRecovery');
    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={[{ pathname: '/reset-password', state: { identifier: 'deaf@test.com' } }]}
        >
          <Routes>
            <Route path="/reset-password" element={<Resetpassword />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await screen.findByRole('button', { name: /continue/i });
    const inputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await userEvent.type(inputs[i], '1');
    }
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await userEvent.type(screen.getByLabelText('New password'), 'NewPass#2026');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Different#2026');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(screen.getAllByText('Passwords do not match.')[0]).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
  });
});
