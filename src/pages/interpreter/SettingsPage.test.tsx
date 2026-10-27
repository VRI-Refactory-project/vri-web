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

  it('shows the privacy card with both settings on', () => {
    renderPage();

    expect(screen.getByRole('region', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Profile visibility' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Availability status' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByText('Visible to clients')).toBeInTheDocument();
    expect(screen.getByText("Show when I'm available")).toBeInTheDocument();
  });

  it('shows the security card', () => {
    renderPage();

    expect(screen.getByRole('region', { name: 'Security' })).toBeInTheDocument();
  });

  it('shows the account preferences with the design defaults', () => {
    renderPage();

    expect(screen.getByRole('region', { name: 'Account preferences' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveDisplayValue('English');
    expect(screen.getByRole('combobox', { name: 'Time zone' })).toHaveDisplayValue(
      '(UTC+03:00) Kampala',
    );
    expect(screen.getByRole('combobox', { name: 'Appearance' })).toHaveDisplayValue(
      'System default',
    );
  });

  it('changes a preference', async () => {
    renderPage();
    const appearance = screen.getByRole('combobox', { name: 'Appearance' });

    await userEvent.selectOptions(appearance, 'Dark');

    expect(appearance).toHaveDisplayValue('Dark');
  });

  it('has nothing to save or discard until something changes', async () => {
    renderPage();
    const discard = screen.getByRole('button', { name: 'Discard changes' });
    const save = screen.getByRole('button', { name: 'Save preferences' });
    expect(discard).toBeDisabled();
    expect(save).toBeDisabled();

    await userEvent.click(screen.getByRole('switch', { name: 'Product updates' }));

    expect(discard).toBeEnabled();
    expect(save).toBeEnabled();
  });

  it('discards changes back to the last saved settings', async () => {
    renderPage();
    const productUpdates = screen.getByRole('switch', { name: 'Product updates' });
    const appearance = screen.getByRole('combobox', { name: 'Appearance' });
    await userEvent.click(productUpdates);
    await userEvent.selectOptions(appearance, 'Dark');

    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(productUpdates).toHaveAttribute('aria-checked', 'false');
    expect(appearance).toHaveDisplayValue('System default');
    expect(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled();
  });

  it('saves the changes and confirms', async () => {
    renderPage();
    const productUpdates = screen.getByRole('switch', { name: 'Product updates' });
    await userEvent.click(productUpdates);

    await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(screen.getByRole('status')).toHaveTextContent('Preferences saved.');
    expect(productUpdates).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled();
  });

  it('discards only what changed since the last save', async () => {
    renderPage();
    const productUpdates = screen.getByRole('switch', { name: 'Product updates' });
    await userEvent.click(productUpdates);
    await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

    await userEvent.click(screen.getByRole('switch', { name: 'Session reminders' }));
    expect(screen.queryByText('Preferences saved.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(productUpdates).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Session reminders' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('changes the privacy pill when its switch is turned off', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('switch', { name: 'Profile visibility' }));
    expect(screen.getByText('Hidden from clients')).toBeInTheDocument();
    expect(screen.queryByText('Visible to clients')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Availability status' }));
    expect(screen.getByText('Availability hidden')).toBeInTheDocument();
  });
});
