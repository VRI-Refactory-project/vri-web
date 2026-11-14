import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInterval } from './useInterval';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useInterval', () => {
  it('calls the latest callback on every tick and stops when unmounted', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: first },
    });

    vi.advanceTimersByTime(1000);
    rerender({ cb: second });
    vi.advanceTimersByTime(2000);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    unmount();
    vi.advanceTimersByTime(5000);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('does nothing while paused', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));

    vi.advanceTimersByTime(10_000);

    expect(callback).not.toHaveBeenCalled();
  });
});
