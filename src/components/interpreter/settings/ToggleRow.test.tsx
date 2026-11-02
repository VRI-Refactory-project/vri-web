import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToggleRow } from './ToggleRow';

const renderRow = (on: boolean, onToggle = vi.fn()) =>
  render(
    <ToggleRow
      title="Session requests"
      description="Get notified when a new session request is sent to you."
      on={on}
      onToggle={onToggle}
    />,
  );

describe('ToggleRow', () => {
  it('is a switch named by its title and described by its description', () => {
    renderRow(true);

    const toggle = screen.getByRole('switch', { name: 'Session requests' });
    expect(toggle).toHaveAccessibleDescription(
      'Get notified when a new session request is sent to you.',
    );
  });

  it('says whether it is on or off', () => {
    const { unmount } = renderRow(true);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    unmount();

    renderRow(false);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('shows an optional badge beside the switch', () => {
    render(
      <ToggleRow
        title="Profile visibility"
        description="Let clients find and view your profile."
        on
        onToggle={vi.fn()}
        badge={<span>Visible to clients</span>}
      />,
    );

    expect(screen.getByText('Visible to clients')).toBeInTheDocument();
  });

  it('reports a click', async () => {
    const onToggle = vi.fn();
    renderRow(false, onToggle);

    await userEvent.click(screen.getByRole('switch'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
