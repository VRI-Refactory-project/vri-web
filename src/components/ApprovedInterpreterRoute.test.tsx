import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../services/api';
import * as api from '../services/api';
import { ApprovedInterpreterRoute } from './ApprovedInterpreterRoute';

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/interpreter']}>
      <Routes>
        <Route path="/register/pending" element={<p>pending review</p>} />
        <Route element={<ApprovedInterpreterRoute />}>
          <Route path="/dashboard/interpreter" element={<p>interpreter home</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

const statusIs = (verification_status: string) =>
  vi.spyOn(api, 'api').mockResolvedValue({ verification_status } as never);

describe('ApprovedInterpreterRoute', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lets an approved interpreter in', async () => {
    statusIs('APPROVED');
    renderGuard();
    expect(await screen.findByText('interpreter home')).toBeInTheDocument();
  });

  it.each(['INACTIVE', 'REJECTED', 'DEACTIVATED'])(
    'keeps a %s interpreter on the review page',
    async (status) => {
      statusIs(status);
      renderGuard();
      expect(await screen.findByText('pending review')).toBeInTheDocument();
    },
  );

  it('does not open the dashboard when the status cannot be checked', async () => {
    vi.spyOn(api, 'api').mockRejectedValue(new ApiError(500, 'Server error'));
    renderGuard();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not check');
    expect(screen.queryByText('interpreter home')).not.toBeInTheDocument();
  });
});
