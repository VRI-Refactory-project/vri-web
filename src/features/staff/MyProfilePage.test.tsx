import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import { MyProfilePage } from './MyProfilePage';

const mocks = vi.hoisted(() => ({
  account: (() => Promise.resolve({})) as () => Promise<unknown>,
  institution: (() => Promise.resolve({})) as () => Promise<unknown>,
  updateMyProfile: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock('../../services/auth', () => ({ getMyAccount: () => mocks.account() }));
vi.mock('../../services/institutionDashboard', () => ({
  getInstitutionOverview: () => mocks.institution(),
}));
vi.mock('../../services/staff', () => ({ updateMyProfile: mocks.updateMyProfile }));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ updateUser: mocks.updateUser }) }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyProfilePage />
    </MemoryRouter>,
  );

const openEditor = async () => {
  const user = userEvent.setup();
  renderPage();
  await user.click(await screen.findByRole('button', { name: 'Edit' }));
  return user;
};

beforeEach(() => {
  mocks.account = () =>
    Promise.resolve({
      name: 'Sarah Kimuli',
      email: 'sarah@northside.example',
      emailVerified: true,
      phone: '+256772111000',
    });
  mocks.institution = () =>
    Promise.resolve({
      name: 'Northside Medical Center',
      role: 'STAFF',
      staff: { total: 3, active: 3, revoked: 0 },
    });
  mocks.updateMyProfile.mockReset();
  mocks.updateUser.mockReset();
});

describe('MyProfilePage', () => {
  it('shows the staff member and their institution', async () => {
    renderPage();
    expect(await screen.findByText('sarah@northside.example')).toBeInTheDocument();
    expect(screen.getByText('+256772111000')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(await screen.findAllByText('Northside Medical Center')).not.toHaveLength(0);
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  it('still shows the person when the institution cannot be loaded', async () => {
    mocks.institution = () => Promise.reject(new Error('offline'));
    renderPage();
    expect(await screen.findByText('+256772111000')).toBeInTheDocument();
    expect(screen.queryByText('Northside Medical Center')).not.toBeInTheDocument();
  });

  it('shows an error when the profile cannot be loaded', async () => {
    mocks.account = () => Promise.reject(new Error('down'));
    renderPage();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('saves a new name and updates the name in the sidebar', async () => {
    mocks.updateMyProfile.mockResolvedValue({
      name: 'Sarah Kimuli Okello',
      phone: '+256772111000',
    });
    const user = await openEditor();

    const name = screen.getByLabelText('Full name');
    await user.clear(name);
    await user.type(name, 'Sarah Kimuli Okello');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mocks.updateMyProfile).toHaveBeenCalledWith({
      fullName: 'Sarah Kimuli Okello',
      phone: '+256772111000',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Your details have been saved.');
    expect(screen.getAllByText('Sarah Kimuli Okello')).not.toHaveLength(0);
    expect(mocks.updateUser).toHaveBeenCalledWith({ name: 'Sarah Kimuli Okello' });
  });

  it('does not send an invalid name', async () => {
    const user = await openEditor();

    const name = screen.getByLabelText('Full name');
    await user.clear(name);
    await user.type(name, '12345');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mocks.updateMyProfile).not.toHaveBeenCalled();
    expect(
      screen.getByText('Use letters, spaces, hyphens and apostrophes only.'),
    ).toBeInTheDocument();
  });

  it('shows the server message under the phone field', async () => {
    mocks.updateMyProfile.mockRejectedValue(
      new ApiError(400, 'Bad request', {
        phone_number: ['An account with this phone number already exists.'],
      }),
    );
    const user = await openEditor();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('An account with this phone number already exists.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('cancel puts the details back without saving', async () => {
    const user = await openEditor();

    await user.type(screen.getByLabelText('Full name'), ' Extra');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mocks.updateMyProfile).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument();
    expect(screen.getAllByText('Sarah Kimuli')).not.toHaveLength(0);
  });
});
