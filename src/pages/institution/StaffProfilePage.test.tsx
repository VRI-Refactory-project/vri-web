import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { ApiError } from '../../services/api';
import * as staffService from '../../services/staff';
import type { StaffMember } from '../../services/staff';
import { StaffProfilePage } from './StaffProfilePage';

const sarah: StaffMember = {
  id: '12',
  userId: '31',
  name: 'Sarah Nakato',
  initials: 'SN',
  email: 'sarah@mulago.example',
  phone: '+256772111000',
  department: 'Healthcare',
  role: 'Staff',
  status: 'Active',
  lastLogin: '2026-10-19T08:00:00Z',
};

// Signed in as Grace (user id 7), the institution admin.
function signInAsGrace() {
  sessionStorage.setItem(
    'vri.session',
    JSON.stringify({
      token: 't',
      refreshToken: 'r',
      user: { id: '7', name: 'Grace', role: 'institution', mustChangePassword: false },
    }),
  );
}

const renderPage = (id = '12') =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[`/dashboard/institution/staff/${id}`]}>
        <Routes>
          <Route path="/dashboard/institution/staff/:id" element={<StaffProfilePage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('StaffProfilePage', () => {
  beforeEach(signInAsGrace);
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('loads the staff member from the URL and shows their details', async () => {
    const spy = vi.spyOn(staffService, 'getStaff').mockResolvedValue(sarah);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Sarah Nakato' })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith('12');
    expect(screen.getByText('sarah@mulago.example')).toBeInTheDocument();
    expect(screen.getByLabelText('Department')).toHaveValue('Healthcare');
  });

  it('saves name, department and role changes', async () => {
    vi.spyOn(staffService, 'getStaff').mockResolvedValue(sarah);
    const update = vi
      .spyOn(staffService, 'updateStaff')
      .mockResolvedValue({ ...sarah, role: 'Admin', department: 'Reception' });
    renderPage();
    await screen.findByRole('heading', { name: 'Sarah Nakato' });
    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Reception');
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'Admin');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith('12', {
      fullName: 'Sarah Nakato',
      department: 'Reception',
      role: 'Admin',
    });
  });

  it('shows the backend’s reason when a change is refused', async () => {
    vi.spyOn(staffService, 'getStaff').mockResolvedValue(sarah);
    vi.spyOn(staffService, 'updateStaff').mockRejectedValue(
      new ApiError(400, 'Your institution must keep at least one active administrator.'),
    );
    renderPage();
    await screen.findByRole('heading', { name: 'Sarah Nakato' });
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least one active administrator/);
  });

  it('asks for confirmation, then revokes access', async () => {
    vi.spyOn(staffService, 'getStaff').mockResolvedValue(sarah);
    const revoke = vi
      .spyOn(staffService, 'revokeStaff')
      .mockResolvedValue({ ...sarah, status: 'Inactive' });
    renderPage();
    await screen.findByRole('heading', { name: 'Sarah Nakato' });
    await userEvent.click(screen.getByRole('button', { name: 'Revoke access' }));
    expect(revoke).not.toHaveBeenCalled();
    expect(screen.getByText(/signed out straight away/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, revoke access' }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('12'));
    expect(await screen.findByRole('button', { name: 'Reinstate access' })).toBeInTheDocument();
  });

  it('cancelling the confirmation does not revoke', async () => {
    vi.spyOn(staffService, 'getStaff').mockResolvedValue(sarah);
    const revoke = vi.spyOn(staffService, 'revokeStaff');
    renderPage();
    await screen.findByRole('heading', { name: 'Sarah Nakato' });
    await userEvent.click(screen.getByRole('button', { name: 'Revoke access' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(revoke).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Revoke access' })).toBeInTheDocument();
  });

  it('reinstates a revoked staff member', async () => {
    vi.spyOn(staffService, 'getStaff').mockResolvedValue({ ...sarah, status: 'Inactive' });
    const reinstate = vi.spyOn(staffService, 'reinstateStaff').mockResolvedValue(sarah);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Reinstate access' }));
    await waitFor(() => expect(reinstate).toHaveBeenCalledWith('12'));
    expect(await screen.findByRole('button', { name: 'Revoke access' })).toBeInTheDocument();
  });

  it('does not offer to revoke your own account', async () => {
    vi.spyOn(staffService, 'getStaff').mockResolvedValue({ ...sarah, userId: '7', name: 'Grace' });
    renderPage();
    expect(await screen.findByText(/This is your own account/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revoke access' })).not.toBeInTheDocument();
  });

  it('shows an error when the staff member cannot be loaded', async () => {
    vi.spyOn(staffService, 'getStaff').mockRejectedValue(new ApiError(404, 'Not found.'));
    renderPage('999');
    expect(await screen.findByRole('alert')).toHaveTextContent('Not found.');
  });
});
