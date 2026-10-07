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
          <Route path="/register/pending" element={<p>pending review</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('SignUpInstitution', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('asks for every field before submitting', async () => {
    const spy = vi.spyOn(registration, 'registerInstitution');
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /submit registration/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Fill in every field');
    expect(spy).not.toHaveBeenCalled();
  });

  it('registers the institution and shows the pending page', async () => {
    const spy = vi.spyOn(registration, 'registerInstitution').mockResolvedValue({
      token: 't',
      refreshToken: 'r',
      user: { id: '2', name: 'Dr Okello', role: 'institution', mustChangePassword: false },
    });
    renderPage();
    await userEvent.type(screen.getByLabelText('Institution name'), 'Mulago');
    await userEvent.selectOptions(screen.getByLabelText('Institution type'), 'COURT');
    await userEvent.type(screen.getByLabelText('Your full name'), 'Dr Okello');
    await userEvent.type(screen.getByLabelText('Phone number'), '0772123456');
    await userEvent.type(screen.getByLabelText('Work email'), 'a@mulago.org');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass-1');
    await userEvent.click(screen.getByRole('button', { name: /submit registration/i }));
    await waitFor(() => expect(screen.getByText('pending review')).toBeInTheDocument());
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ organisationName: 'Mulago', organisationType: 'COURT' }),
    );
  });
});
