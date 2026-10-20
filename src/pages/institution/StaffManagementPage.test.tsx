import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../services/api';
import * as staffService from '../../services/staff';
import type { StaffMember } from '../../services/staff';
import { StaffManagementPage } from './StaffManagementPage';

const person = (overrides: Partial<StaffMember>): StaffMember => ({
  id: '1',
  userId: '101',
  name: 'Maggie Nanduga',
  initials: 'MN',
  email: 'maggie@mulago.example',
  phone: '+256772111000',
  department: 'Healthcare',
  role: 'Staff',
  status: 'Active',
  lastLogin: null,
  ...overrides,
});

const STAFF = [
  person({ id: '1' }),
  person({
    id: '2',
    name: 'Michael Reed',
    email: 'michael@mulago.example',
    department: 'Reception',
  }),
  person({ id: '3', name: 'Priya Shah', email: 'priya@mulago.example', status: 'Invitation Sent' }),
  person({ id: '4', name: 'James Otieno', email: 'james@mulago.example', status: 'Inactive' }),
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <StaffManagementPage />
    </MemoryRouter>,
  );

describe('StaffManagementPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the real staff list and the summary counts', async () => {
    vi.spyOn(staffService, 'listStaff').mockResolvedValue(STAFF);
    renderPage();
    expect(await screen.findByText('Michael Reed')).toBeInTheDocument();
    expect(screen.getByText('4 Staff Members')).toBeInTheDocument();
    expect(screen.getByText(/2 active · 1 invitations pending · 1 inactive/)).toBeInTheDocument();
  });

  it('searches by name or email', async () => {
    vi.spyOn(staffService, 'listStaff').mockResolvedValue(STAFF);
    renderPage();
    await screen.findByText('Michael Reed');
    await userEvent.type(screen.getByLabelText('Search staff by name or email'), 'priya@');
    expect(screen.getByText('Priya Shah')).toBeInTheDocument();
    expect(screen.queryByText('Michael Reed')).not.toBeInTheDocument();
  });

  it('filters by department and status', async () => {
    vi.spyOn(staffService, 'listStaff').mockResolvedValue(STAFF);
    renderPage();
    await screen.findByText('Michael Reed');
    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Reception');
    expect(screen.getByText('Michael Reed')).toBeInTheDocument();
    expect(screen.queryByText('Maggie Nanduga')).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Department'), '');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Inactive');
    expect(screen.getByText('James Otieno')).toBeInTheDocument();
    expect(screen.queryByText('Priya Shah')).not.toBeInTheDocument();
  });

  it('shows the backend’s message when the list cannot be loaded', async () => {
    vi.spyOn(staffService, 'listStaff').mockRejectedValue(
      new ApiError(403, 'Only your institution’s administrators can manage staff accounts.'),
    );
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/administrators can manage staff/);
  });

  it('says when there are no staff yet', async () => {
    vi.spyOn(staffService, 'listStaff').mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/No staff accounts yet/)).toBeInTheDocument();
  });
});
