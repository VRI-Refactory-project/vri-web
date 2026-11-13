import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { StaffHelpPage } from './StaffHelpPage';

describe('StaffHelpPage', () => {
  it('lists the questions and links to sessions', () => {
    render(
      <MemoryRouter>
        <StaffHelpPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('How do I start a call with an interpreter?')).toBeInTheDocument();
    expect(screen.getAllByRole('group').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'href',
      '/dashboard/staff/sessions',
    );
  });
});
