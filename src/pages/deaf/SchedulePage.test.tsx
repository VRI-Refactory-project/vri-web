import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SchedulePage } from './SchedulePage';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const show = () =>
  render(
    <MemoryRouter>
      <SchedulePage />
    </MemoryRouter>,
  );

const fill = () => {
  const future = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: future } });
  fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:30' } });
  fireEvent.change(screen.getByLabelText('Location'), {
    target: { value: 'Northside Medical Center' },
  });
};

describe('SchedulePage', () => {
  it('asks for what is missing', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Save Session' }));
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(3);
  });

  it('does not pretend to save when scheduling is not live', () => {
    show();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save Session' }));
    expect(screen.getByText(/Scheduling is not live yet/)).toBeTruthy();
  });

  it('confirms in sample mode', () => {
    vi.stubEnv('VITE_MOCK_DEAF_EXTRAS', 'true');
    show();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save Session' }));
    expect(screen.getByText(/Session saved/)).toBeTruthy();
  });
});
