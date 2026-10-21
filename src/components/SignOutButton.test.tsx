import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignOutButton } from './SignOutButton';

const logout = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ logout }),
}));

describe('SignOutButton', () => {
  beforeEach(() => logout.mockClear());

  it('signs the person out and goes to the sign-in page', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/profile']}>
        <Routes>
          <Route path="/sign-in" element={<p>sign in page</p>} />
          <Route path="/dashboard/profile" element={<SignOutButton />} />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('sign in page')).toBeInTheDocument();
  });
});
