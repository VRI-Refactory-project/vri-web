import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInstitutionOverview } from './institutionDashboard';

vi.mock('./api', () => ({ api: vi.fn() }));
import { api } from './api';

beforeEach(() => vi.mocked(api).mockReset());

describe('getInstitutionOverview', () => {
  it('reads the institution name, the role and the staff counts', async () => {
    vi.mocked(api).mockResolvedValue({
      user: { id: 1 },
      institution: { id: 3, organisation_name: 'Northside Medical Center', status: 'approved' },
      institutional_role: 'STAFF',
      staff_summary: { total: 12, active: 10, revoked: 2 },
    });
    expect(await getInstitutionOverview()).toEqual({
      name: 'Northside Medical Center',
      role: 'STAFF',
      staff: { total: 12, active: 10, revoked: 2 },
    });
    expect(api).toHaveBeenCalledWith('/api/v1/dashboard/institution/');
  });
});
