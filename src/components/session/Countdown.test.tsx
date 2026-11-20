import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Countdown } from './Countdown';
import { RETURN_DELAY_MS, RETURN_SECONDS, ReturnCountdown } from './ReturnCountdown';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('Countdown', () => {
  it('counts down with the logo in the ring, and finishes once', () => {
    const onDone = vi.fn();
    render(<Countdown seconds={3} onDone={onDone} />);

    expect(screen.getByRole('timer')).toHaveAccessibleName('3 seconds left');
    expect(document.querySelector('.cd .logo-disc img')).toBeTruthy();

    wait(1000);
    expect(screen.getByRole('timer')).toHaveAccessibleName('2 seconds left');
    wait(2000);
    expect(screen.getByRole('timer')).toHaveAccessibleName('0 seconds left');
    expect(onDone).toHaveBeenCalledTimes(1);

    wait(5000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('ReturnCountdown (call ended)', () => {
  it('waits 5 seconds, then counts 10 and goes to the dashboard', () => {
    const onReturn = vi.fn();
    render(<ReturnCountdown onReturn={onReturn} />);

    wait(RETURN_DELAY_MS - 100);
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();

    wait(100);
    expect(screen.getByText('Returning to your dashboard')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveAccessibleName(`${RETURN_SECONDS} seconds left`);

    wait(RETURN_SECONDS * 1000);
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('stops when the person touches anything on the page', () => {
    const onReturn = vi.fn();
    render(<ReturnCountdown onReturn={onReturn} />);
    wait(RETURN_DELAY_MS + 2000);

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    wait(RETURN_SECONDS * 1000);
    expect(onReturn).not.toHaveBeenCalled();
  });

  it('never starts when the person is busy before it appears (say, giving stars)', () => {
    const onReturn = vi.fn();
    render(<ReturnCountdown onReturn={onReturn} />);

    fireEvent.keyDown(document.body, { key: 'Tab' });
    wait(RETURN_DELAY_MS + RETURN_SECONDS * 1000);

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(onReturn).not.toHaveBeenCalled();
  });

  it('stops with "Stay on this page"', () => {
    const onReturn = vi.fn();
    render(<ReturnCountdown onReturn={onReturn} />);
    wait(RETURN_DELAY_MS);

    fireEvent.click(screen.getByRole('button', { name: 'Stay on this page' }));
    wait(RETURN_SECONDS * 1000);

    expect(onReturn).not.toHaveBeenCalled();
  });
});
