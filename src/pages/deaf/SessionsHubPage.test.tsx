import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SessionsHubPage } from './SessionsHubPage';

afterEach(cleanup);

describe('SessionsHubPage', () => {
  it('links the cards that have a page and marks the rest as coming soon', () => {
    render(
      <MemoryRouter>
        <SessionsHubPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Start session/ }).getAttribute('href')).toBe(
      '/dashboard/deaf/sessions/new',
    );
    expect(screen.getByRole('link', { name: /Session history/ }).getAttribute('href')).toBe(
      '/dashboard/deaf/sessions/history',
    );
    expect(screen.getAllByText('Soon')).toHaveLength(2);
  });
});
