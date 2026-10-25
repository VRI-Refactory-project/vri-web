import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SettingsPage } from './SettingsPage';

afterEach(cleanup);

describe('SettingsPage', () => {
  it('links to the profile and accessibility pages', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Profile/ }).getAttribute('href')).toBe(
      '/dashboard/deaf/profile',
    );
    expect(screen.getByRole('link', { name: /Accessibility/ }).getAttribute('href')).toBe(
      '/dashboard/deaf/accessibility',
    );
    expect(screen.getAllByText('Soon')).toHaveLength(1);
  });
});
