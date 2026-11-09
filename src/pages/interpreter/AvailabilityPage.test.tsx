import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvailabilityPage } from './AvailabilityPage';
import { AvailabilitySaveError, interpreterApi } from '../../services/interpreterApi';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { name: 'Sarah N' } } }),
}));

vi.mock('../../services/interpreterApi', () => {
  class AvailabilitySaveError extends Error {
    savedCount: number;
    failedDates: string[];
    failedRemovals: string[];
    constructor(init: { savedCount: number; failedDates: string[]; failedRemovals: string[] }) {
      super('Some availability changes could not be saved.');
      this.savedCount = init.savedCount;
      this.failedDates = init.failedDates;
      this.failedRemovals = init.failedRemovals;
    }
  }
  return {
    AvailabilitySaveError,
    interpreterApi: {
      getAvailability: vi.fn(),
      updateAvailability: vi.fn(),
      updateLiveStatus: vi.fn(),
    },
  };
});

const mocked = vi.mocked(interpreterApi);

// Fixed date: 1 November 2026, so the calendar opens on November and past dates are known.
const NOW = new Date(2026, 10, 1, 9, 0, 0);

const dayButton = (label: RegExp | string) => screen.findByRole('button', { name: label });

async function renderPage(exceptions: unknown[] = []) {
  mocked.getAvailability.mockResolvedValue({
    weeklySchedule: [],
    exceptions: exceptions as never,
    available: true,
  });
  render(<AvailabilityPage />);
  // Wait for the saved data to load before interacting with the calendar.
  await waitFor(() => expect(mocked.getAvailability).toHaveBeenCalled());
  await screen.findByRole('button', { name: /^24 November 2026/ });
}

describe('AvailabilityPage date range on the calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('selects a range with two clicks, highlights the days in between and shows its length', async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    await renderPage();

    await user.click(await dayButton(/^24 November 2026/));
    await user.click(await dayButton(/^27 November 2026/));

    expect(screen.getByText('24 Nov – 27 Nov (4 days)')).toBeInTheDocument();
    expect(await dayButton(/^25 November 2026/)).toHaveClass('av-cal-day--in-range');
    expect(await dayButton(/^24 November 2026/)).toHaveClass('av-cal-day--range-edge');
  });

  it('sorts a range picked backwards and clears it', async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    await renderPage();

    await user.click(await dayButton(/^27 November 2026/));
    await user.click(await dayButton(/^24 November 2026/));
    expect(screen.getByText('24 Nov – 27 Nov (4 days)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText(/days\)$/)).not.toBeInTheDocument();
  });

  it('asks for confirmation before replacing existing exceptions, then adds the range', async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    await renderPage([{ id: 'exception-2026-11-25', date: '2026-11-25', unavailable: true }]);

    await user.click(await dayButton(/^24 November 2026/));
    await user.click(await dayButton(/^27 November 2026/));
    await user.click(screen.getByRole('button', { name: /add exception for a date/i }));

    const modal = screen.getByRole('dialog');
    await user.click(within(modal).getByRole('button', { name: /^save$/i }));

    expect(within(modal).getByRole('alert')).toHaveTextContent('will be replaced: 25 Nov.');

    await user.click(within(modal).getByRole('button', { name: 'Replace and add' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('4 days added locally.');
  });
});

describe('AvailabilityPage partial save', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the dates that failed and does not show the success message', async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    await renderPage();

    mocked.updateAvailability.mockRejectedValue(
      new AvailabilitySaveError({
        savedCount: 3,
        failedDates: ['2026-11-25'],
        failedRemovals: [],
      }),
    );

    // Add a range locally, then save it.
    await user.click(await dayButton(/^24 November 2026/));
    await user.click(await dayButton(/^27 November 2026/));
    await user.click(screen.getByRole('button', { name: /add exception for a date/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^save$/i }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('These dates could not be saved: 25 Nov.');
    expect(alert).toHaveTextContent('3 exception date(s) were saved.');
    expect(screen.queryByText('Your weekly availability has been saved.')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the normal success message when every save works', async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    await renderPage();

    mocked.updateAvailability.mockResolvedValue(undefined);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your weekly availability has been saved.',
    );
  });
});
