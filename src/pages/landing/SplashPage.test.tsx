import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPLASH_DURATION_MS, SplashPage } from './SplashPage';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

describe('SplashPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows only the logo and name', () => {
    render(<SplashPage />);

    expect(screen.getByRole('img', { name: 'SignConnect' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('moves on to the landing page by itself', () => {
    render(<SplashPage />);

    expect(navigate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SPLASH_DURATION_MS);
    });

    expect(navigate).toHaveBeenCalledWith('/landing', { replace: true });
  });

  it('does not navigate after it has been closed', () => {
    const { unmount } = render(<SplashPage />);
    unmount();
    act(() => {
      vi.advanceTimersByTime(SPLASH_DURATION_MS);
    });

    expect(navigate).not.toHaveBeenCalled();
  });
});
