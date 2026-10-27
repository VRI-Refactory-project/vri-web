import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { InterpreterSettingsPage } from './SettingsPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/interpreter/settings']}>
      <Routes>
        <Route path="/dashboard/interpreter/settings" element={<InterpreterSettingsPage />} />
        <Route path="/dashboard/interpreter" element={<p>interpreter home</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('InterpreterSettingsPage', () => {
  it('shows the heading and subheading', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Manage your account preferences and security.')).toBeInTheDocument();
  });

  it('goes back to the dashboard home', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('interpreter home')).toBeInTheDocument();
  });

  it('shows the notifications card with the switches set as in the design', () => {
    renderPage();

    expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Session requests' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Session reminders' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Product updates' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('turns one notification on and off without touching the others', async () => {
    renderPage();
    const productUpdates = screen.getByRole('switch', { name: 'Product updates' });

    await userEvent.click(productUpdates);
    expect(productUpdates).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Session requests' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await userEvent.click(productUpdates);
    expect(productUpdates).toHaveAttribute('aria-checked', 'false');
  });
});
