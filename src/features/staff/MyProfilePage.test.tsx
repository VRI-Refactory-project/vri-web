import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyProfilePage } from './MyProfilePage';

const mocks = vi.hoisted(() => ({
  account: (() => Promise.resolve({})) as () => Promise<unknown>,
  institution: (() => Promise.resolve({})) as () => Promise<unknown>,
}));
vi.mock('../../services/auth', () => ({ getMyAccount: () => mocks.account() }));
vi.mock('../../services/institutionDashboard', () => ({
  getInstitutionOverview: () => mocks.institution(),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyProfilePage />
    </MemoryRouter>,
  );

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
});
