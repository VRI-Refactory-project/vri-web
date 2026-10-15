import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../features/auth/authContext';
import type { AuthSession } from '../../types';
import { CredentialReviewPage } from './CredentialReviewPage';
import { VerificationsPage } from './VerificationsPage';

const session: AuthSession = {
  token: 't',
  refreshToken: 'r',
  user: { id: '9', name: 'Admin User', role: 'admin', mustChangePassword: false },
};

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
afterEach(() => fetchMock.mockReset());

const reply = (ok: boolean, status: number, body: unknown) => ({
  ok,
  status,
  statusText: 'x',
  json: async () => body,
});

const row = {
  id: 4,
  user_id: 11,
  full_name: 'Grace Atim',
  phone_number: '+256700000001',
  email: 'grace@example.com',
  verification_status: 'INACTIVE',
  specialisation: null,
  certification_count: 1,
  created_at: '2026-10-10T08:00:00Z',
};

const detail = {
  ...row,
  is_available: false,
  certifications: [
    {
      id: 7,
      document_name: 'cert.pdf',
      certificate_type: 'Professional',
      issuing_organisation: 'USLIA',
      uploaded_at: '2026-10-10T08:05:00Z',
      rejection_reason: '',
      file_url: 'http://api/x/',
    },
  ],
  decisions: [],
};

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/dashboard/admin/verifications', element: <VerificationsPage /> },
      { path: '/dashboard/admin/verifications/:id', element: <CredentialReviewPage /> },
    ],
    { initialEntries: [path] },
  );
  return render(
    <AuthContext.Provider
      value={{
        session,
        selectedRole: null,
        selectRole: () => {},
        login: () => {},
        logout: () => {},
        updateUser: () => {},
      }}
    >
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

describe('VerificationsPage', () => {
  it('lists pending interpreters from the API with a link to review each', async () => {
    fetchMock.mockResolvedValue(reply(true, 200, [row]));
    renderAt('/dashboard/admin/verifications');
    expect(await screen.findByText('Grace Atim')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute(
      'href',
      '/dashboard/admin/verifications/4',
    );
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/manage/interpreters/?status=INACTIVE');
  });

  it('asks for the chosen status when a filter is clicked', async () => {
    fetchMock.mockResolvedValue(reply(true, 200, []));
    renderAt('/dashboard/admin/verifications');
    expect(await screen.findByText('No interpreters here.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Approved' }));
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('?status=APPROVED'));
  });

  it('shows the API message when the list cannot be loaded', async () => {
    fetchMock.mockResolvedValue(reply(false, 403, { detail: 'Not allowed.' }));
    renderAt('/dashboard/admin/verifications');
    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed.');
  });
});

describe('CredentialReviewPage', () => {
  it('approves the interpreter through the API and shows the new status', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? reply(true, 200, { ...detail, verification_status: 'APPROVED' })
        : reply(true, 200, detail),
    );
    renderAt('/dashboard/admin/verifications/4');
    expect(await screen.findByText('cert.pdf')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^Approve$/ }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(post?.[0]).toContain('/api/v1/manage/interpreters/4/approve/');
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
  });

  it('needs a reason to reject and sends it', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? reply(true, 200, { ...detail, verification_status: 'REJECTED' })
        : reply(true, 200, detail),
    );
    renderAt('/dashboard/admin/verifications/4');
    await screen.findByText('cert.pdf');
    await userEvent.click(screen.getByRole('button', { name: /^Reject$/ }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please give a reason.');
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
    await userEvent.type(within(dialog).getByPlaceholderText('Reason'), 'Certificate expired');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(post?.[1].body)).toEqual({ reason: 'Certificate expired' });
  });

  it('keeps the dialog open and shows the API message when approval is refused', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? reply(false, 400, { detail: 'Upload a certificate first.' })
        : reply(true, 200, detail),
    );
    renderAt('/dashboard/admin/verifications/4');
    await screen.findByText('cert.pdf');
    await userEvent.click(screen.getByRole('button', { name: /^Approve$/ }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Upload a certificate first.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
