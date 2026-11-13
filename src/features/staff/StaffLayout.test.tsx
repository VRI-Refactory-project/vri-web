import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffLayout } from './StaffLayout';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { name: 'Sarah Kimuli', role: 'institution' } } }),
}));

const institution = vi.hoisted(() => ({
  load: (() => Promise.resolve({ name: 'Northside Medical Center' })) as () => Promise<unknown>,
}));
vi.mock('../../services/institutionDashboard', () => ({
  getInstitutionOverview: () => institution.load(),
}));

beforeEach(() => {
  institution.load = () => Promise.resolve({ name: 'Northside Medical Center' });
});

describe('StaffLayout', () => {
  it('names the institution the staff member belongs to', async () => {
    render(
      <MemoryRouter>
        <StaffLayout />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Northside Medical Center')).toBeInTheDocument();
  });

  it('still opens when the institution cannot be loaded', async () => {
    institution.load = () => Promise.reject(new Error('offline'));
    render(
      <MemoryRouter>
        <StaffLayout />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('navigation', { name: 'Institution staff' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Northside Medical Center')).not.toBeInTheDocument();
  });
});
