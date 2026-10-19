import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../../services/api';
import * as staffService from '../../services/staff';
import { CreateStaffAccountPage } from './CreateStaffAccountPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/institution/staff/new']}>
      <Routes>
        <Route path="/dashboard/institution/staff/new" element={<CreateStaffAccountPage />} />
        <Route path="/dashboard/institution/staff/created" element={<p>account created</p>} />
      </Routes>
    </MemoryRouter>,
  );

async function fillIn() {
  await userEvent.type(screen.getByLabelText('Full name'), 'Sarah Nakato');
  await userEvent.type(screen.getByLabelText('Work email'), 'sarah@mulago.example');
  await userEvent.type(screen.getByLabelText('Phone number'), '772111000');
  await userEvent.selectOptions(screen.getByLabelText('Department'), 'Healthcare');
  await userEvent.selectOptions(screen.getByLabelText('Role'), 'Staff');
}

describe('CreateStaffAccountPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('offers only the backend’s roles, Staff and Admin', () => {
    renderPage();
    const options = Array.from(screen.getByLabelText('Role').querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    expect(options).toEqual(['Select role', 'Staff', 'Admin']);
  });

  it('requires a phone number', async () => {
    const spy = vi.spyOn(staffService, 'createStaff');
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('Enter your phone number.')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('creates the account and shows the confirmation page', async () => {
    const spy = vi.spyOn(staffService, 'createStaff').mockResolvedValue({} as never);
    renderPage();
    await fillIn();
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText('account created')).toBeInTheDocument());
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Sarah Nakato',
        email: 'sarah@mulago.example',
        department: 'Healthcare',
        role: 'Staff',
        phone: expect.stringMatching(/^\+\d+772111000$/),
      }),
    );
  });

  it('shows the backend’s reason when the account cannot be created', async () => {
    vi.spyOn(staffService, 'createStaff').mockRejectedValue(
      new ApiError(400, 'An account with this phone number already exists.'),
    );
    renderPage();
    await fillIn();
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this phone number already exists.',
    );
    expect(screen.queryByText('account created')).not.toBeInTheDocument();
  });
});
