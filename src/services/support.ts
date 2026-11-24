import { api } from './api';

export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface SupportRequest {
  id: number;
  subject: string;
  category: string;
  message: string;
  status: SupportStatus;
  admin_response: string;
  created_at: string;
  updated_at: string;
  requester: {
    id: number;
    name: string;
    role: string;
    institution_name: string | null;
    institution_role?: string | null;
  };
}

export interface SupportRequestPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: SupportRequest[];
}

export async function submitSupportRequest(input: {
  subject: string;
  category: string;
  message: string;
}) {
  return api<{ id: number; status: SupportStatus; created_at: string }>(
    '/api/v1/support/requests/',
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export async function getAdminSupportRequests(
  page = 1,
  pageSize = 20,
  status?: SupportStatus | 'ALL',
) {
  const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (status && status !== 'ALL') query.set('status', status);
  return api<SupportRequestPage>(`/api/v1/dashboard/admin/support-requests/?${query}`);
}

export async function updateAdminSupportRequest(
  id: number,
  input: { status: SupportStatus; admin_response: string },
) {
  return api<SupportRequest>(`/api/v1/dashboard/admin/support-requests/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
