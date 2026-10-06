import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CreateAccountPage } from './CreateAccountPage';

describe('CreateAccountPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/register/deaf']}>
        <Routes>
          <Route path="/register/deaf" element={<CreateAccountPage />} />
          <Route path="/get-started" element={<p>role selection</p>} />
          <Route path="/sign-in" element={<p>sign in page</p>} />
        </Routes>
      </MemoryRouter>,
    );

  it('renders the "Create your account" heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });

  it('switches from Email to Phone tab when Phone is clicked', async () => {
    renderPage();

    const emailTab = screen.getByRole('tab', { name: /email/i });
    const phoneTab = screen.getByRole('tab', { name: /phone/i });

    expect(emailTab).toHaveClass('active');
    expect(phoneTab).not.toHaveClass('active');

    await userEvent.click(phoneTab);

    expect(phoneTab).toHaveClass('active');
    expect(emailTab).not.toHaveClass('active');
  });

  it('toggles the password field between masked and visible', async () => {
    renderPage();

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    await userEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(passwordInput.type).toBe('text');

    await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput.type).toBe('password');
  });

  it('navigates to /sign-in when Sign in is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('link', { name: /sign in/i }));
    expect(screen.getByText('sign in page')).toBeInTheDocument();
  });
});
