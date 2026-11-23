import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import { getInstitutionSession, type InstitutionSession } from '../../services/institutionSessions';
import { InstitutionSessionDetailPage } from './InstitutionSessionDetailPage';

// A plain function behind the spy for the failing load: the test runner reports any rejected
// promise a spy returns, even one the page handles (see StaffDashboardPage.test.tsx).
const failing = vi.hoisted(() => ({ error: null as Error | null }));
vi.mock('../../services/institutionSessions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/institutionSessions')>();
  const spy = vi.fn();
  return {
    ...actual,
    getInstitutionSession: Object.assign(
      (id: string) => (failing.error ? Promise.reject(failing.error) : spy(id)),
      spy,
    ),
  };
});

const SESSION: InstitutionSession = {
  id: 7,
  staff: { id: 3, name: 'Grace Achieng', department: 'Maternity' },
  channel: 'booked',
  interpreter_name: 'Moses Interpreter',
  specialisation_required: 'MEDICAL',
  priority: 'EMERGENCY',
  status: 'COMPLETED',
  display_status: 'COMPLETED',
  created_at: '2026-11-16T10:05:00Z',
  assigned_at: '2026-11-16T10:06:00Z',
  ended_at: '2026-11-16T11:11:00Z',
  duration_minutes: 65,
};

const show = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/institution/sessions/7']}>
      <Routes>
        <Route
          path="/dashboard/institution/sessions/:id"
          element={<InstitutionSessionDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

const fact = (label: string) => screen.getByText(label).nextElementSibling;

beforeEach(() => {
  vi.mocked(getInstitutionSession).mockReset();
  failing.error = null;
});

describe('InstitutionSessionDetailPage (V2-030)', () => {
  it('shows the session’s duration, interpreter and the rest of its details', async () => {
    vi.mocked(getInstitutionSession).mockResolvedValue(SESSION);
    show();

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Session on');
    expect(getInstitutionSession).toHaveBeenCalledWith('7');
    expect(fact('Duration')).toHaveTextContent('1 h 5 min');
    expect(fact('Interpreter')).toHaveTextContent('Moses Interpreter');
    expect(fact('Staff member')).toHaveTextContent('Grace Achieng');
    expect(fact('Staff member')).toHaveTextContent('Maternity');
    expect(fact('Channel')).toHaveTextContent('Booked');
    expect(fact('Session type')).toHaveTextContent('Medical');
    expect(fact('Session type')).toHaveTextContent('Emergency');
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows only metadata, and says what was said is never kept', async () => {
    vi.mocked(getInstitutionSession).mockResolvedValue(SESSION);
    show();
    await screen.findByRole('heading', { level: 1 });

    const labels = Array.from(document.querySelectorAll('dt')).map((dt) => dt.textContent);
    expect(labels).toEqual([
      'Staff member',
      'Interpreter',
      'Channel',
      'Session type',
      'Requested',
      'Interpreter joined',
      'Ended',
      'Duration',
    ]);
    expect(
      screen.getByText(/What was said in the session is never stored or shown/),
    ).toBeInTheDocument();
  });

  it('says it cannot be found when the session is not one the person may see', async () => {
    failing.error = new ApiError(404, 'Not found.');
    show();

    expect(await screen.findByRole('alert')).toHaveTextContent('This session could not be found.');
  });

  it('links back to all sessions', async () => {
    vi.mocked(getInstitutionSession).mockResolvedValue(SESSION);
    show();

    expect(await screen.findByRole('link', { name: /All sessions/ })).toHaveAttribute(
      'href',
      '/dashboard/institution/sessions',
    );
  });
});
