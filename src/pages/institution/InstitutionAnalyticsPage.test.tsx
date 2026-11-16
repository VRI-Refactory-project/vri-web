import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InstitutionUsage, UsageFilters } from '../../services/institutionUsage';
import { InstitutionAnalyticsPage } from './InstitutionAnalyticsPage';

// Plain functions, not spies, for anything that may reject: the test runner reports a rejected
// promise a spy returns even when the page handles it.
const mocks = vi.hoisted(() => ({
  usage: (() => Promise.resolve({})) as (filters: UsageFilters) => Promise<unknown>,
  calls: [] as UsageFilters[],
  apiBlob: vi.fn(),
}));
vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  apiBlob: mocks.apiBlob,
}));
vi.mock('../../services/institutionUsage', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getInstitutionUsage: (filters: UsageFilters) => {
    mocks.calls.push(filters);
    return mocks.usage(filters);
  },
}));
vi.mock('../../services/staff', () => ({
  listStaff: () =>
    Promise.resolve([
      { id: '7', name: 'Grace Achieng', department: 'Maternity' },
      { id: '8', name: 'Dr Sarah Nakato', department: 'Emergency' },
    ]),
}));

const USAGE: InstitutionUsage = {
  sessions: 4,
  previousPeriodSessions: 2,
  completed: 3,
  completionRate: 75,
  totalMinutes: 125,
  avgDurationMinutes: 42,
  byType: [
    { key: 'GENERAL', label: 'General', count: 1 },
    { key: 'MEDICAL', label: 'Medical', count: 3 },
    { key: 'LEGAL', label: 'Legal', count: 0 },
  ],
  byOutcome: [
    { key: 'COMPLETED', label: 'Completed', count: 3 },
    { key: 'CANCELLED', label: 'Cancelled', count: 1 },
  ],
  byDepartment: [{ key: 'Maternity', label: 'Maternity', count: 4 }],
  overTime: [
    { date: '2026-11-08', count: 0 },
    { date: '2026-11-09', count: 4 },
  ],
  staff: { total: 5, usedVri: 2, notUsed: 3 },
};

beforeEach(() => {
  mocks.usage = () => Promise.resolve(USAGE);
  mocks.calls = [];
});

const lastCall = () => mocks.calls[mocks.calls.length - 1];

describe('InstitutionAnalyticsPage', () => {
  it('shows the usage for the last 7 days', async () => {
    render(<InstitutionAnalyticsPage />);

    const summary = await screen.findByRole('region', { name: 'Summary' });
    expect(within(summary).getByText('+100% vs last period')).toBeInTheDocument();
    expect(within(summary).getByText('75% completion rate')).toBeInTheDocument();
    expect(within(summary).getByText('2h 05m')).toBeInTheDocument();
    expect(within(summary).getByText('of 5 total staff')).toBeInTheDocument();
    expect(screen.getByText('Last 7 days · 4 sessions total')).toBeInTheDocument();
    expect(screen.getByText('Medical')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Have not used VRI').previousSibling).toHaveTextContent('3');

    const { from, to } = lastCall();
    expect((Date.parse(to) - Date.parse(from)) / 86_400_000 + 1).toBe(7);
  });

  it('loads again for the chosen staff member, department and period', async () => {
    const user = userEvent.setup();
    render(<InstitutionAnalyticsPage />);
    await screen.findByRole('option', { name: 'Grace Achieng' });

    await user.selectOptions(screen.getByLabelText('Staff member'), '7');
    expect(lastCall()).toMatchObject({ staff: '7', department: '' });

    await user.selectOptions(screen.getByLabelText('Department'), 'Emergency');
    expect(lastCall()).toMatchObject({ staff: '7', department: 'Emergency' });

    await user.selectOptions(screen.getByLabelText('Period'), 'custom');
    const from = screen.getByLabelText('From');
    await user.clear(from);
    await user.type(from, '2026-11-01');
    expect(lastCall()).toMatchObject({ from: '2026-11-01' });
  });

  it('asks for a valid custom range instead of loading', async () => {
    const user = userEvent.setup();
    render(<InstitutionAnalyticsPage />);
    await screen.findByRole('region', { name: 'Summary' });

    await user.selectOptions(screen.getByLabelText('Period'), 'custom');
    const calls = mocks.calls.length;
    await user.clear(screen.getByLabelText('From'));
    await user.type(screen.getByLabelText('From'), '2099-01-01');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a start date on or before the end date.',
    );
    expect(mocks.calls).toHaveLength(calls);
  });

  it('groups the chart by week', async () => {
    const user = userEvent.setup();
    render(<InstitutionAnalyticsPage />);
    const chart = await screen.findByRole('region', { name: 'Sessions over time' });

    await user.click(within(chart).getByRole('button', { name: 'Weekly' }));

    expect(within(chart).getByRole('button', { name: 'Weekly' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(chart).getByText('8 Nov')).toBeInTheDocument();
  });

  it('explains an empty result instead of showing only zeros', async () => {
    mocks.usage = () => Promise.resolve({ ...USAGE, sessions: 0 });
    render(<InstitutionAnalyticsPage />);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'No sessions match these filters in this period. Try a longer period.',
    );
  });

  // Catherine Nawagirwa's export test (from dev), kept when V2-029 replaced the page's data loading.
  it('calls the PDF export endpoint when Export report is clicked', async () => {
    const user = userEvent.setup();
    const pdfBlob = new Blob(['PDF content'], { type: 'application/pdf' });
    mocks.apiBlob.mockResolvedValue(pdfBlob);
    const createObjectURL = vi.fn(() => 'blob:test-pdf');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<InstitutionAnalyticsPage />);
    await user.click(screen.getByRole('button', { name: /export report/i }));

    expect(mocks.apiBlob).toHaveBeenCalledWith('/api/v1/dashboard/institution/export/');
    expect(createObjectURL).toHaveBeenCalledWith(pdfBlob);
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('shows an error when the usage cannot be loaded', async () => {
    mocks.usage = () => Promise.reject(new Error('offline'));
    render(<InstitutionAnalyticsPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
