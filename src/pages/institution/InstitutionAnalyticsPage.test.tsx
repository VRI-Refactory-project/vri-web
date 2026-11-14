import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InstitutionAnalyticsPage } from './InstitutionAnalyticsPage';
import { getInstitutionDashboardData } from '../../services/institutionDashboard';
import { apiBlob, describeError } from '../../services/api';

vi.mock('../../services/institutionDashboard', () => ({
  getInstitutionDashboardData: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  apiBlob: vi.fn(),
  describeError: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : 'Something went wrong',
  ),
}));

const mockDashboardData = {
  institutionName: 'Northside Medical Center',
  staff: {
    total: 12,
    active: 10,
    revoked: 2,
  },
  sessions: {
    totalRequests: 100,
    pendingRequests: 15,
    completedRequests: 60,
    cancelledRequests: 8,
    failedRequests: 7,
    totalVideoSessions: 75,
    waitingVideoSessions: 5,
    connectingVideoSessions: 3,
    connectedVideoSessions: 10,
    endedVideoSessions: 50,
    failedVideoSessions: 7,
    averageCallDurationSeconds: 300,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('InstitutionAnalyticsPage', () => {
  it('shows loading indicators while dashboard data is being fetched', () => {
    vi.mocked(getInstitutionDashboardData).mockReturnValue(new Promise(() => {}));

    render(<InstitutionAnalyticsPage />);

    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('displays institution analytics after successfully loading data', async () => {
    vi.mocked(getInstitutionDashboardData).mockResolvedValue(mockDashboardData);

    render(<InstitutionAnalyticsPage />);

    expect(await screen.findByText('Northside Medical Center')).toBeInTheDocument();

    expect(screen.getByText('75')).toBeInTheDocument();

    expect(screen.getAllByText('60').length).toBe(2);

    expect(screen.getAllByText('15').length).toBe(2);

    expect(screen.getByText('5.0 min')).toBeInTheDocument();
    expect(screen.getByText('60.0% completion rate')).toBeInTheDocument();

    expect(screen.getAllByText('10', { selector: '.metric-value' })).toHaveLength(2);
  });

  it('displays an error when dashboard data fails to load', async () => {
    vi.mocked(getInstitutionDashboardData).mockRejectedValue(new Error('Failed to load dashboard'));

    render(<InstitutionAnalyticsPage />);

    expect(
      await screen.findByText('Unable to load institution analytics: Failed to load dashboard'),
    ).toBeInTheDocument();

    expect(describeError).toHaveBeenCalled();
  });

  it('calls the PDF export endpoint when Export report is clicked', async () => {
    vi.mocked(getInstitutionDashboardData).mockResolvedValue(mockDashboardData);

    const pdfBlob = new Blob(['PDF content'], {
      type: 'application/pdf',
    });

    vi.mocked(apiBlob).mockResolvedValue(pdfBlob);

    const createObjectURL = vi.fn(() => 'blob:test-pdf');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<InstitutionAnalyticsPage />);

    fireEvent.click(screen.getByRole('button', { name: /export report/i }));

    await waitFor(() => {
      expect(apiBlob).toHaveBeenCalledWith('/api/v1/dashboard/institution/export/');
    });

    expect(createObjectURL).toHaveBeenCalledWith(pdfBlob);
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
