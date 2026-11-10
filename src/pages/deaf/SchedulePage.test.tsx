import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SchedulePage } from './SchedulePage';
import { api } from '../../services/api';

// Mock the API module so we don't hit the real backend during tests
vi.mock('../../services/api', () => ({
  api: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
  fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText('Session Type'), { target: { value: 'medical' } });
};

describe('SchedulePage', () => {
  it('asks for what is missing', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Save Session' }));
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(3);
  });

  it('shows an error message when the API call fails', async () => {
    // Simulate the backend returning an error
    vi.mocked(api).mockRejectedValueOnce(new Error('Network error'));

    show();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save Session' }));

    await waitFor(() => {
      expect(screen.getByText(/We could not save your session/)).toBeTruthy();
    });
  });

  it('confirms successfully when the API call succeeds', async () => {
    // Simulate the backend returning a successful response
    vi.mocked(api).mockResolvedValueOnce({});

    show();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save Session' }));

    await waitFor(() => {
      expect(screen.getByText(/Session saved successfully/)).toBeTruthy();
    });
  });
});
