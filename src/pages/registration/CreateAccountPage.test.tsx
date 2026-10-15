import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import {
  clearStagedCertificates,
  stageCertificates,
} from '../../features/registration/stagedCertificates';
import { ApiError } from '../../services/api';
import * as certifications from '../../services/certifications';
import * as registration from '../../services/registration';
import type { AuthSession } from '../../types';
import { CreateAccountPage } from './CreateAccountPage';

const session = (role: 'deaf' | 'interpreter'): AuthSession => ({
  token: 't',
  refreshToken: 'r',
  user: { id: '1', name: 'Amina', role, mustChangePassword: false },
});

function renderPage(role: 'deaf' | 'interpreter' = 'deaf') {
  const path = role === 'deaf' ? '/register/deaf' : '/register/interpreter/account';
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={<CreateAccountPage role={role} />} />
          <Route path="/get-started" element={<p>role selection</p>} />
          <Route path="/sign-in" element={<p>sign in page</p>} />
          <Route path="/register/welcome" element={<p>welcome step</p>} />
          <Route path="/register/interpreter" element={<p>choose certificates</p>} />
          <Route path="/register/pending" element={<p>pending review</p>} />
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
    clearStagedCertificates();
    sessionStorage.clear();
  });

  it('asks a deaf user for name, phone, optional email and password only', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address (optional)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Specialisation')).not.toBeInTheDocument();
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
      'Phone number': '+256772123456',
      Password: 'secret-pass-1',
    });
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText('welcome step')).toBeInTheDocument());
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Catherine Nawagirwa', phone: '+256772123456', password: 'secret-pass-1' }),
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
      'Phone number': '+256772123456',
      Password: 'secret-pass-1',
    });
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });



  it('never lets letters into the phone field', async () => {
    renderPage();
    const phone = screen.getByLabelText('Phone number') as HTMLInputElement;
    await userEvent.type(phone, 'jjjj+256abc772');
    expect(phone.value).toBe('+256772');
    await userEvent.clear(phone);
    await userEvent.type(phone, '+256 772');
    expect(phone.value).toBe('+256 772');
  });

  it('asks for a country code when the number starts with 0', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Phone number'), '0772123456');
    await userEvent.tab();
    expect(screen.getByText(/start with your country code/i)).toBeInTheDocument();
  });

  it('rejects an email that is only numbers', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Email address (optional)'), '12345');
    await userEvent.tab();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('requires the terms to be accepted', async () => {
    const spy = vi.spyOn(registration, 'registerDeaf');
    renderPage();
    await fill({
      'First name': 'Catherine',
      'Last name': 'Nawagirwa',
      'Phone number': '+256772123456',
      Password: 'secret-pass-1',
    });
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/accept the terms/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends an interpreter who has chosen no certificates back to that step', () => {
    renderPage('interpreter');
    expect(screen.getByText('choose certificates')).toBeInTheDocument();
  });

  describe('interpreter', () => {
    const staged = () =>
      stageCertificates([
        {
          id: 1,
          file: new File(['x'], 'a.pdf', { type: 'application/pdf' }),
          type: 'Other',
          organisation: 'UNAD',
        },
      ]);

    it('requires an email', async () => {
      staged();
      const spy = vi.spyOn(registration, 'registerInterpreter');
      renderPage('interpreter');
      await fill({
         'First name': 'Catherine',
         'Last name': 'Nawagirwa',
        'Phone number': '+256772123456',
        Password: 'secret-pass-1',
      });
      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
      expect(spy).not.toHaveBeenCalled();
    });

    it('registers, uploads the staged certificates, then shows the pending page', async () => {
      staged();
      vi.spyOn(registration, 'registerInterpreter').mockResolvedValue(session('interpreter'));
      const upload = vi
        .spyOn(certifications, 'uploadCertificate')
        .mockResolvedValue({} as certifications.CertificationDocument);
      renderPage('interpreter');
      await fill({
        'First name': 'Catherine',
        'Last name': 'Nawagirwa',
        'Phone number': '+256772123456',
        'Email address': 'j@x.org',
        Password: 'secret-pass-1',
      });
      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      await waitFor(() => expect(screen.getByText('pending review')).toBeInTheDocument());
      expect(upload).toHaveBeenCalledTimes(1);
    });

    it('keeps the account and retries only the upload when it fails', async () => {
      staged();
      const register = vi
        .spyOn(registration, 'registerInterpreter')
        .mockResolvedValue(session('interpreter'));
      const upload = vi
        .spyOn(certifications, 'uploadCertificate')
        .mockRejectedValueOnce(new ApiError(500, 'Server error'))
        .mockResolvedValue({} as certifications.CertificationDocument);
      renderPage('interpreter');
      await fill({
        'First name': 'Catherine',
        'Last name': 'Nawagirwa',
        'Phone number': '+256772123456',
        'Email address': 'j@x.org',
        Password: 'secret-pass-1',
      });
      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Your account was created');
      await userEvent.click(screen.getByRole('button', { name: /try upload again/i }));
      await waitFor(() => expect(screen.getByText('pending review')).toBeInTheDocument());
      expect(register).toHaveBeenCalledTimes(1);
      expect(upload).toHaveBeenCalledTimes(2);
    });
  });
});
