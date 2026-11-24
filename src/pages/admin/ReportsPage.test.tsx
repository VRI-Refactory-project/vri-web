import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchResponseTimesReport,
  fetchUsageReport,
  type ResponseTimesReport,
  type UsageReport,
} from '../../services/adminReports';
import { ReportsPage } from './ReportsPage';

vi.mock('../../services/adminReports', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/adminReports')>()),
  fetchUsageReport: vi.fn(),
  fetchResponseTimesReport: vi.fn(),
}));

const usage: UsageReport = {
  rangeDays: 30,
  summary: { requests: 12, sessions: 9, completed: 7, cancelled: 2, failed: 1, emergency: 3 },
  byDay: [
    { date: '2026-11-24', requests: 5, sessions: 4 },
    { date: '2026-11-25', requests: 7, sessions: 5 },
  ],
  bySpecialisation: [
    { specialisation: 'MEDICAL', count: 8 },
    { specialisation: 'GENERAL', count: 4 },
  ],
  byStatus: [{ status: 'COMPLETED', count: 7 }],
};

const times: ResponseTimesReport = {
  rangeDays: 30,
  summary: {
    requests: 12,
    answered: 9,
    abandoned: 2,
    failed: 1,
    matchedByFallback: 1,
    avgSecondsToAccept: 135,
    avgSecondsInQueue: 20,
  },
  peakHours: Array.from({ length: 24 }, (_, hour) => ({ hour, requests: hour === 9 ? 4 : 0 })),
  offers: { total: 10, accepted: 6, declined: 2, expired: 2, acceptanceRatePercent: 60 },
};

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchUsageReport).mockReset().mockResolvedValue(usage);
    vi.mocked(fetchResponseTimesReport).mockReset().mockResolvedValue(times);
  });

  it('shows the usage report for the last 30 days first', async () => {
    render(<ReportsPage />);

    expect(await screen.findByText('Requests per day')).toBeInTheDocument();
    expect(fetchUsageReport).toHaveBeenCalledWith(30);
    expect(screen.getByText('Medical')).toBeInTheDocument();
    expect(screen.getByText('Completed', { selector: '.reports-stat__label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeEnabled();
  });

  it('shows the response times report on its tab', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText('Requests per day');

    await user.click(screen.getByRole('tab', { name: 'Response times' }));

    expect(await screen.findByText('Busiest hours')).toBeInTheDocument();
    expect(fetchResponseTimesReport).toHaveBeenCalledWith(30);
    expect(screen.getByText('2m 15s')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('loads the report again when another period is chosen', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText('Requests per day');

    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));

    await waitFor(() => expect(fetchUsageReport).toHaveBeenCalledWith(7));
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows an error and keeps export off when the report cannot load', async () => {
    vi.mocked(fetchUsageReport).mockRejectedValue(new Error('network down'));
    render(<ReportsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the report');
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });
});
