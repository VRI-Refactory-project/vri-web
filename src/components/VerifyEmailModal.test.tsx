import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthState } from '../features/auth/authContext';
import { VerifyEmailModal } from './VerifyEmailModal';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
afterEach(() => fetchMock.mockReset());

function renderModal(user: Record<string, unknown>) {
  const updateUser = vi.fn();
  const state = {
    session: {
      token: 't',
      refreshToken: 'r',
      user: { id: '1', name: 'A', role: 'interpreter', mustChangePassword: false, ...user },
    },
    updateUser,
  } as unknown as AuthState;
  render(
    <AuthContext.Provider value={state}>
      <VerifyEmailModal />
    </AuthContext.Provider>,
  );
  return updateUser;
}

describe('VerifyEmailModal', () => {
  it('stays hidden when the email is verified or missing', () => {
    renderModal({ email: 'a@b.com', emailVerified: true });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stays hidden for a phone-only account', () => {
    renderModal({ email: null, emailVerified: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks for a 6-digit code before calling the API', async () => {
    renderModal({ email: 'a@b.com', emailVerified: false });
    await userEvent.type(screen.getByLabelText(/6-digit code/i), '123');
    await userEvent.click(screen.getByRole('button', { name: /verify email/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/6-digit/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks the user verified when the code is accepted', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 1,
        full_name: 'A',
        phone_number: '1',
        email: 'a@b.com',
        role: 'interpreter',
        must_change_password: false,
        email_verified: true,
      }),
    });
    const updateUser = renderModal({ email: 'a@b.com', emailVerified: false });
    await userEvent.type(screen.getByLabelText(/6-digit code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /verify email/i }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ emailVerified: true }));
  });

  it('shows the API message for a wrong code', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ code: ['Invalid or expired code. Request a new one.'] }),
    });
    renderModal({ email: 'a@b.com', emailVerified: false });
    await userEvent.type(screen.getByLabelText(/6-digit code/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /verify email/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or expired/i);
  });
});
