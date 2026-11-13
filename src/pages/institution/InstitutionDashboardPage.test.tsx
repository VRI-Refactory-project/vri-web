import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstitutionDashboardPage } from './InstitutionDashboardPage';

// A plain function, not a spy: the test runner reports any rejected promise a spy returns, even one
// the page handles.
const overview = vi.hoisted(() => ({
  load: (() => Promise.resolve({})) as () => Promise<unknown>,
}));
vi.mock('../../services/institutionDashboard', () => ({
  getInstitutionOverview: () => overview.load(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <InstitutionDashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  overview.load = () =>
    Promise.resolve({
      name: 'Northside Medical Center',
      role: 'ADMIN',
      staff: { total: 12, active: 10, revoked: 2 },
    });
});

describe('InstitutionDashboardPage', () => {
  it('shows the institution and its real staff numbers', async () => {
    renderPage();
    expect(await screen.findByText(/Northside Medical Center/)).toBeInTheDocument();
    const staff = screen.getByText('Staff', { selector: '.id-kpi-label' }).closest('article');
    expect(staff).toHaveTextContent('12');
    expect(staff).toHaveTextContent('10 active');
    expect(screen.getByText('2 staff accounts with access revoked')).toBeInTheDocument();
  });

  it('still opens, with zeros, when the numbers cannot be loaded', async () => {
    overview.load = () => Promise.reject(new Error('offline'));
    renderPage();
    expect(await screen.findByText('0 staff accounts with access revoked')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Institution dashboard' })).toBeInTheDocument();
  });
});
