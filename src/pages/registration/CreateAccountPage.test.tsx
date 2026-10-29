import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { ApiError } from '../../services/api';
import * as registration from '../../services/registration';
import type { AuthSession } from '../../types';
import { CreateAccountPage } from './CreateAccountPage';

const session = (role: 'deaf' | 'interpreter'): AuthSession => ({
  token: 't',
  refreshToken: 'r',
  user: { id: '1', name: 'Amina', role, mustChangePassword: false },
});

function renderPage(role: 'deaf' | 'interpreter' = 'deaf') {
  const path = role === 'deaf' ? '/register/deaf' : '/register/interpreter';
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={<CreateAccountPage role={role} />} />
          <Route path="/get-started" element={<p>role selection</p>} />
          <Route path="/sign-in" element={<p>sign in page</p>} />
          <Route path="/register/welcome" element={<p>welcome step</p>} />
          <Route path="/register/interpreter/certifications" element={<p>upload certificates</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const fill = async (labels: Record<string, string>) => {
  for (const [label, value] of Object.entries(labels)) {
    await userEvent.type(screen.getByLabelText(label), value);
  }
};

describe('CreateAccountPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('asks a deaf user for name, phone, email and password only', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Specialisation')).not.toBeInTheDocument();
  });

  it('stops the phone number at the longest length for the country', async () => {
    renderPage();
    const phone = screen.getByLabelText('Phone number') as HTMLInputElement;
    await userEvent.type(phone, '7721234567890123');
    expect(phone.value.replace(/\s/g, '')).toBe('772123456');
  });

  it('toggles the password field between masked and visible', async () => {
    renderPage();
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    await userEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(passwordInput.type).toBe('text');
  });

  it('registers a deaf user, signs them in and moves to the welcome step', async () => {
    const spy = vi.spyOn(registration, 'registerDeaf').mockResolvedValue(session('deaf'));
    renderPage();
    await fill({
      'First name': 'Catherine',
      'Last name': 'Nawagirwa',
      'Phone number': '772123456',
      'Email address': 'catherine@example.com',
      Password: 'Secret-pass-1',
      'Confirm password': 'Secret-pass-1',
    });
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText('welcome step')).toBeInTheDocument());
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Catherine Nawagirwa',
        phone: '+256772123456',
        email: 'catherine@example.com',
        password: 'Secret-pass-1',
      }),
    );
  });

  it('shows the server message when registration fails', async () => {
    vi.spyOn(registration, 'registerDeaf').mockRejectedValue(
      new ApiError(400, 'A user with this phone number already exists.'),
    );
    renderPage();
    await fill({
      'First name': 'Catherine',
      'Last name': 'Nawagirwa',
      'Phone number': '772123456',
      'Email address': 'catherine@example.com',
      Password: 'Secret-pass-1',
      'Confirm password': 'Secret-pass-1',
    });
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });

  it('blocks submission without a name, phone, email or password', async () => {
    const spy = vi.spyOn(registration, 'registerDeaf');
    renderPage();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('Enter your first name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your last name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your phone number.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter a password.')).toBeInTheDocument();
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('never lets letters into the phone field', async () => {
    renderPage();
    const phone = screen.getByLabelText('Phone number') as HTMLInputElement;
    await userEvent.type(phone, 'jjjj772abc123');
    expect(phone.value.replace(/\s/g, '')).toBe('772123');
  });

  it('offers a country picker with flags and changes the calling code with it', async () => {
    renderPage();

    const country = screen.getByLabelText('Country') as HTMLSelectElement;
    const phone = screen.getByLabelText('Phone number') as HTMLInputElement;

    expect(country.value).toBe('UG');

    // The calling code belongs to the country selector, not the input.
    expect(phone.value).toBe('');
    expect(document.querySelector('.country-picker__calling-code')?.textContent).toBe('+256');

    await userEvent.selectOptions(country, 'KE');

    expect(country.value).toBe('KE');
    expect(document.querySelector('.country-picker__calling-code')?.textContent).toBe('+254');
    expect(phone.value).toBe('');
  });

  it('says a number is too short for the country chosen', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Phone number'), '77');
    await userEvent.tab();
    expect(screen.getByText(/too short or too long/i)).toBeInTheDocument();
  });

  it('rejects an email that is only numbers', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Email address'), '12345');
    await userEvent.tab();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('requires the terms to be accepted', async () => {
    const spy = vi.spyOn(registration, 'registerDeaf');
    renderPage();
    await fill({
      'First name': 'Catherine',
      'Last name': 'Nawagirwa',
      'Phone number': '772123456',
      'Email address': 'catherine@example.com',
      Password: 'Secret-pass-1',
      'Confirm password': 'Secret-pass-1',
    });
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/accept the terms/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  describe('password', () => {
    it('hides the strength meter until the person starts typing', async () => {
      renderPage();
      expect(screen.queryByText('Password Strength')).not.toBeInTheDocument();
      await userEvent.type(screen.getByLabelText('Password'), 'a');
      expect(screen.getByText('Password Strength')).toBeInTheDocument();
    });

    it('turns each requirement green as it is met', async () => {
      renderPage();
      const password = screen.getByLabelText('Password');

      await userEvent.type(password, 'abcdefgh');
      expect(screen.getByText('At least 8 characters')).toHaveClass('pw-rule--ok');
      expect(screen.getByText('One uppercase letter')).not.toHaveClass('pw-rule--ok');

      await userEvent.type(password, 'A');
      expect(screen.getByText('One uppercase letter')).toHaveClass('pw-rule--ok');
      expect(screen.getByText('One number & special character')).not.toHaveClass('pw-rule--ok');

      await userEvent.type(password, '1!');
      expect(screen.getByText('One number & special character')).toHaveClass('pw-rule--ok');
    });

    it('shows the strength of the password as it is typed', async () => {
      renderPage();
      const password = screen.getByLabelText('Password');

      await userEvent.type(password, 'abc');
      expect(screen.getByText('Weak')).toBeInTheDocument();

      await userEvent.type(password, 'DEFg1!');
      expect(screen.getByText('Good')).toBeInTheDocument();

      await userEvent.type(password, 'xyz');
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('says when the two passwords do not match', async () => {
      renderPage();
      await fill({ Password: 'Secret-pass-1', 'Confirm password': 'Secret-pass-2' });
      await userEvent.tab();
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('blocks submission when a password rule is not met', async () => {
      const spy = vi.spyOn(registration, 'registerDeaf');
      renderPage();
      await fill({
        'First name': 'Catherine',
        'Last name': 'Nawagirwa',
        'Phone number': '772123456',
        'Email address': 'catherine@example.com',
        Password: 'secret-pass-1',
        'Confirm password': 'secret-pass-1',
      });
      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText('Add one uppercase letter.')).toBeInTheDocument();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('interpreter', () => {
    it('requires an email', async () => {
      const spy = vi.spyOn(registration, 'registerInterpreter');
      renderPage('interpreter');
      await fill({
        'First name': 'Catherine',
        'Last name': 'Nawagirwa',
        'Phone number': '772123456',
        Password: 'Secret-pass-1',
        'Confirm password': 'Secret-pass-1',
      });
      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
      expect(spy).not.toHaveBeenCalled();
    });

    it('registers, then moves on to uploading certificates', async () => {
      const register = vi
        .spyOn(registration, 'registerInterpreter')
        .mockResolvedValue(session('interpreter'));
      renderPage('interpreter');
      await fill({
        'First name': 'Catherine',
        'Last name': 'Nawagirwa',
        'Phone number': '772123456',
        'Email address': 'j@x.org',
        Password: 'Secret-pass-1',
        'Confirm password': 'Secret-pass-1',
      });

      //  NEW LOGIC: Open the custom dropdown and select "Medical"
      await userEvent.click(screen.getByText('Select specialisation(s)...'));
      await userEvent.click(screen.getByText('Medical / health'));

      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => expect(screen.getByText('upload certificates')).toBeInTheDocument());

      // Added expectation for the specialisation string
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+256772123456',
          specialisations: ['MEDICAL'],
        }),
      );
    });
  });
});
