import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it, afterEach } from 'vitest';
import { SessionStatusBanner } from './SessionStatusBanner';

afterEach(cleanup);

describe('SessionStatusBanner', () => {
  it('shows the waiting label while queued', () => {
    render(<SessionStatusBanner state="QUEUED" />);
    expect(screen.getByText('Waiting for an interpreter')).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('names the interpreter while connecting', () => {
    render(<SessionStatusBanner state="CONNECTING" interpreterName="Sarah" />);
    expect(screen.getByText('Connecting with Sarah')).toBeTruthy();
  });

  it('shows connected', () => {
    render(<SessionStatusBanner state="ACTIVE" />);
    expect(screen.getByText('Connected')).toBeTruthy();
  });

  it('shows a different message for each way a session can end', () => {
    const { rerender } = render(<SessionStatusBanner state="COMPLETED" />);
    expect(screen.getByText('Session ended')).toBeTruthy();
    rerender(<SessionStatusBanner state="CANCELLED" />);
    expect(screen.getByText('Request cancelled')).toBeTruthy();
    rerender(<SessionStatusBanner state="FAILED" />);
    expect(screen.getByText('We could not connect you')).toBeTruthy();
  });

  it('announces a failure as an alert', () => {
    render(<SessionStatusBanner state="FAILED" />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
