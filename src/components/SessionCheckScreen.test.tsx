import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_CHECK_DELAY_MS, SessionCheckScreen } from './SessionCheckScreen';

describe('SessionCheckScreen', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows nothing during the first 300 ms', () => {
    render(<SessionCheckScreen />);
    act(() => {
      vi.advanceTimersByTime(SESSION_CHECK_DELAY_MS - 1);
    });
    expect(screen.queryByText('Checking your session…')).toBeNull();
  });

  it('shows the logo and spinner after the delay', () => {
    const { container } = render(<SessionCheckScreen />);
    act(() => {
      vi.advanceTimersByTime(SESSION_CHECK_DELAY_MS);
    });
    expect(screen.getByText('Checking your session…')).toBeTruthy();
    expect(container.querySelector('.session-check-spinner')).not.toBeNull();
    expect(container.querySelector('.session-check-logo')).not.toBeNull();
  });
});
