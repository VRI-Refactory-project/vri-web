import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstitutionProfilePage } from './InstitutionProfilePage';

const mocks = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  fetchDepartments: vi.fn(),
  updateProfile: vi.fn(),
  createDepartment: vi.fn(),
}));
vi.mock('../../services/institutions', () => ({
  fetchMyInstitutionProfile: mocks.fetchProfile,
  fetchMyDepartments: mocks.fetchDepartments,
  updateMyInstitutionProfile: mocks.updateProfile,
  createMyDepartment: mocks.createDepartment,
  renameMyDepartment: vi.fn(),
  deleteMyDepartment: vi.fn(),
}));

const saved = {
  name: 'Northside Medical Center',
  email: 'info@northside.example',
  phone: '+256772111000',
  type: 'HOSPITAL',
  description: 'A hospital.',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <InstitutionProfilePage />
    </MemoryRouter>,
  );

beforeEach(() => {
  mocks.fetchProfile.mockResolvedValue(saved);
  mocks.fetchDepartments.mockResolvedValue([{ id: '1', name: 'Casualty', active: true }]);
  mocks.updateProfile.mockReset();
  mocks.createDepartment.mockReset();
});

describe('InstitutionProfilePage', () => {
  it('opens in viewing mode: details disabled, no department controls', async () => {
    renderPage();
    expect(await screen.findByText('Viewing')).toBeInTheDocument();
    expect(screen.getByLabelText('Institution name')).toBeDisabled();
    expect(screen.getByLabelText('Institution name')).toHaveValue('Northside Medical Center');
    expect(screen.getByText('Casualty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add department' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('Edit profile unlocks the details and the department controls', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));

    expect(screen.getByText('Editing')).toBeInTheDocument();
    expect(screen.getByLabelText('Institution name')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Add department' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Casualty' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('saves the changes and goes back to viewing', async () => {
    mocks.updateProfile.mockResolvedValue({ ...saved, name: 'Northside Hospital' });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));

    const name = screen.getByLabelText('Institution name');
    await user.clear(name);
    await user.type(name, 'Northside Hospital');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mocks.updateProfile).toHaveBeenCalledWith({ ...saved, name: 'Northside Hospital' });
    expect(await screen.findByRole('status')).toHaveTextContent('Institution details saved.');
    expect(screen.getByText('Viewing')).toBeInTheDocument();
    expect(screen.getByLabelText('Institution name')).toBeDisabled();
    expect(screen.getByLabelText('Institution name')).toHaveValue('Northside Hospital');
  });

  it('cancel puts the saved details back without saving', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));
    await user.type(screen.getByLabelText('Institution name'), ' Extra');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mocks.updateProfile).not.toHaveBeenCalled();
    expect(screen.getByText('Viewing')).toBeInTheDocument();
    expect(screen.getByLabelText('Institution name')).toHaveValue('Northside Medical Center');
  });

  it('adds a department while editing', async () => {
    mocks.createDepartment.mockResolvedValue({ id: '2', name: 'Radiology', active: true });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));
    await user.click(screen.getByRole('button', { name: 'Add department' }));
    await user.type(screen.getByLabelText('New department name'), 'Radiology');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mocks.createDepartment).toHaveBeenCalledWith('Radiology');
    expect(await screen.findByText('Radiology')).toBeInTheDocument();
  });
});
