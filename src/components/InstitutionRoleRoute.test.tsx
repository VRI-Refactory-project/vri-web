import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { InstitutionRoleRoute } from './InstitutionRoleRoute';
import type { InstitutionRole } from '../types';

let institutionRole: InstitutionRole | null | undefined;
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { role: 'institution', institutionRole } } }),
}));

function renderAt(allow: InstitutionRole) {
  render(
    <MemoryRouter initialEntries={['/here']}>
      <Routes>
        <Route element={<InstitutionRoleRoute allow={allow} />}>
          <Route path="/here" element={<p>inside</p>} />
        </Route>
        <Route path="/dashboard/staff" element={<p>staff home</p>} />
        <Route path="/dashboard/institution" element={<p>admin home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InstitutionRoleRoute', () => {
  it('lets an admin into the admin area', () => {
    institutionRole = 'ADMIN';
    renderAt('ADMIN');
    expect(screen.getByText('inside')).toBeInTheDocument();
  });

  it('treats a missing institution role as admin', () => {
    institutionRole = undefined;
    renderAt('ADMIN');
    expect(screen.getByText('inside')).toBeInTheDocument();
  });

  it('sends staff away from the admin area to their own dashboard', () => {
    institutionRole = 'STAFF';
    renderAt('ADMIN');
    expect(screen.getByText('staff home')).toBeInTheDocument();
  });

  it('sends an admin away from the staff area to the admin dashboard', () => {
    institutionRole = 'ADMIN';
    renderAt('STAFF');
    expect(screen.getByText('admin home')).toBeInTheDocument();
  });
});
