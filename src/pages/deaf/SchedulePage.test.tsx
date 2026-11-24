import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SchedulePage } from './SchedulePage';
import { api, ApiError } from '../../services/api';

// Mock the API module so we don't hit the real backend during tests
vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/api')>()),
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

  it('sends one booking however many times Save is pressed', async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api).mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));

    show();
    fill();
    const save = screen.getByRole('button', { name: 'Save Session' });
    fireEvent.click(save);
    fireEvent.click(save);
    fireEvent.click(save);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled());
    expect(api).toHaveBeenCalledTimes(1);

    finish({});
    await waitFor(() => expect(screen.getByText(/Session saved successfully/)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Save Session' })).not.toBeDisabled();
  });

  it('tells the person when they already have a session at that time', async () => {
    vi.mocked(api).mockRejectedValueOnce(
      new ApiError(400, 'You already have a session booked at that time.', {
        time: ['You already have a session booked at that time.'],
      }),
    );

    show();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save Session' }));

    await waitFor(() =>
      expect(screen.getByText('You already have a session booked at that time.')).toBeTruthy(),
    );
  });
});
