import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import * as registration from '../../services/registration';
import { SignUpInstitution } from './SignUpInstitution';

const renderPage = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register/institution']}>
        <Routes>
          <Route path="/register/institution" element={<SignUpInstitution />} />
          {/* CHANGED: Route to /verify-email instead of /register/pending */}
          <Route path="/verify-email" element={<p>verify email page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

const okSession = {
  token: 't',
  refreshToken: 'r',
  user: { id: '2', name: 'Dr Okello', role: 'institution' as const, mustChangePassword: false },
};

describe('SignUpInstitution', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('disables the submit button until the terms are agreed to', async () => {
    renderPage();
    const submitButton = screen.getByRole('button', { name: /submit registration/i });
    expect(submitButton).toBeDisabled();

    // The checkbox doesn't have a label text linked to it in the same way, so we find it by role
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(submitButton).not.toBeDisabled();
  });

  it('shows what is missing next to each field before submitting', async () => {
    const spy = vi.spyOn(registration, 'registerInstitution');
    renderPage();

    // NEW: Check the box so the button becomes enabled
    await userEvent.click(screen.getByRole('checkbox'));

    await userEvent.click(screen.getByRole('button', { name: /submit registration/i }));
    expect(screen.getByText('Enter the institution name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your full name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your phone number.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter a password.')).toBeInTheDocument();
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('offers a country picker for the phone number', () => {
    renderPage();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
  });

  it('rejects a work email that is only numbers', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Work email'), '12345');
    await userEvent.tab();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('asks what the institution is only when "Other" is chosen', async () => {
    const spy = vi.spyOn(registration, 'registerInstitution');
    renderPage();
    expect(screen.queryByLabelText('Please specify the type')).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Institution type'), 'OTHER');
    expect(screen.getByLabelText('Please specify the type')).toBeInTheDocument();

    // NEW: Check the box so the button becomes enabled
    await userEvent.click(screen.getByRole('checkbox'));

    await userEvent.click(screen.getByRole('button', { name: /submit registration/i }));
    expect(screen.getByText('Tell us what kind of institution this is.')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows the strength meter and turns each requirement green as it is met', async () => {
    renderPage();
    expect(screen.queryByText('Password Strength')).not.toBeInTheDocument();
    const password = screen.getByLabelText('Password');

    await userEvent.type(password, 'abcdefgh');
    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toHaveClass('pw-rule--ok');
    expect(screen.getByText('One uppercase letter')).not.toHaveClass('pw-rule--ok');

    await userEvent.type(password, 'A1!');
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toHaveClass('pw-rule--ok');
    expect(screen.getByText('One number & special character')).toHaveClass('pw-rule--ok');
  });

  it('says when the two passwords do not match', async () => {
    const spy = vi.spyOn(registration, 'registerInstitution');
    renderPage();
    await userEvent.type(screen.getByLabelText('Password'), 'Secret-pass-1');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Secret-pass-2');
    await userEvent.tab();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('registers the institution and goes to the verify email page', async () => {
    const spy = vi.spyOn(registration, 'registerInstitution').mockResolvedValue(okSession);
    renderPage();
    await userEvent.type(screen.getByLabelText('Institution name'), 'Mulago');
    await userEvent.selectOptions(screen.getByLabelText('Institution type'), 'COURT');
    await userEvent.type(screen.getByLabelText('Your full name'), 'Dr Okello');
    await userEvent.type(screen.getByLabelText('Phone number'), '772123456');
    await userEvent.type(screen.getByLabelText('Work email'), 'a@mulago.org');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret-pass-1');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Secret-pass-1');

    // NEW: Check the box so the button becomes enabled
    await userEvent.click(screen.getByRole('checkbox'));

    await userEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    // CHANGED: Look for the verify email page instead of pending review
    await waitFor(() => expect(screen.getByText('verify email page')).toBeInTheDocument());

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ organisationName: 'Mulago', organisationType: 'COURT' }),
    );
    // The confirmation box is for the person only: it must never reach the API.
    expect(spy.mock.calls[0][0]).not.toHaveProperty('confirmPassword');
  });

  it('sends what "Other" means along with the registration', async () => {
    const spy = vi.spyOn(registration, 'registerInstitution').mockResolvedValue(okSession);
    renderPage();
    await userEvent.type(screen.getByLabelText('Institution name'), 'Hill School');
    await userEvent.selectOptions(screen.getByLabelText('Institution type'), 'OTHER');
    await userEvent.type(screen.getByLabelText('Please specify the type'), 'School for the Deaf');
    await userEvent.type(screen.getByLabelText('Your full name'), 'Dr Okello');
    await userEvent.type(screen.getByLabelText('Phone number'), '772123456');
    await userEvent.type(screen.getByLabelText('Work email'), 'a@school.org');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret-pass-1');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Secret-pass-1');

    // NEW: Check the box so the button becomes enabled
    await userEvent.click(screen.getByRole('checkbox'));

    await userEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    // CHANGED: Look for the verify email page instead of pending review
    await waitFor(() => expect(screen.getByText('verify email page')).toBeInTheDocument());

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationType: 'OTHER',
        organisationTypeOther: 'School for the Deaf',
      }),
    );
  });
});
