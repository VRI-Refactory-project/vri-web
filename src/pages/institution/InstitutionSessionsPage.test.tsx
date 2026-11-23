import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  listInstitutionSessions,
  type InstitutionSession,
} from '../../services/institutionSessions';
import { InstitutionSessionsPage } from './InstitutionSessionsPage';

// A plain function behind the spy for the failing load: the test runner reports any rejected
// promise a spy returns, even one the page handles (see StaffDashboardPage.test.tsx).
const failing = vi.hoisted(() => ({ error: null as Error | null }));
vi.mock('../../services/institutionSessions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/institutionSessions')>();
  const spy = vi.fn();
  return {
    ...actual,
    listInstitutionSessions: Object.assign(
      (...args: Parameters<typeof actual.listInstitutionSessions>) =>
        failing.error ? Promise.reject(failing.error) : spy(...args),
      spy,
    ),
  };
});

const session = (over: Partial<InstitutionSession> = {}): InstitutionSession => ({
  id: 7,
  staff: { id: 3, name: 'Grace Achieng', department: 'Maternity' },
  channel: 'on_demand',
  interpreter_name: 'Moses Interpreter',
  specialisation_required: 'MEDICAL',
  priority: 'NORMAL',
  status: 'COMPLETED',
  display_status: 'COMPLETED',
  created_at: '2026-11-16T10:05:00Z',
  assigned_at: '2026-11-16T10:06:00Z',
  ended_at: '2026-11-16T10:31:00Z',
  duration_minutes: 25,
  ...over,
});

const show = (props = {}) =>
  render(
    <MemoryRouter>
      <InstitutionSessionsPage {...props} />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.mocked(listInstitutionSessions).mockReset();
  failing.error = null;
});

describe('InstitutionSessionsPage (V2-030 session history)', () => {
  it('lists past sessions with date, staff, channel, duration, interpreter and outcome', async () => {
    vi.mocked(listInstitutionSessions).mockResolvedValue([
      session(),
      session({
        id: 8,
        channel: 'booked',
        staff: { id: 4, name: 'Dr Sarah Nakato', department: '' },
      }),
    ]);
    show();

    const list = await screen.findByRole('list', { name: 'Past sessions' });
    expect(listInstitutionSessions).toHaveBeenCalledWith('history');
    const rows = within(list).getAllByRole('link');
    expect(rows[0]).toHaveTextContent('Grace Achieng');
    expect(rows[0]).toHaveTextContent('Maternity');
    expect(rows[0]).toHaveTextContent('On demand');
    expect(rows[0]).toHaveTextContent('25 min');
    expect(rows[0]).toHaveTextContent('Moses Interpreter');
    expect(rows[0]).toHaveTextContent('Completed');
    expect(rows[1]).toHaveTextContent('Booked');
  });

  it('opens a session’s details from its row', async () => {
    vi.mocked(listInstitutionSessions).mockResolvedValue([session()]);
    show();

    expect(await screen.findByRole('link', { name: /Grace Achieng/ })).toHaveAttribute(
      'href',
      '/dashboard/institution/sessions/7',
    );
  });

  it('switches to the sessions happening now', async () => {
    vi.mocked(listInstitutionSessions).mockResolvedValue([]);
    show();
    expect(await screen.findByText('No past sessions yet.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Active' }));

    expect(listInstitutionSessions).toHaveBeenLastCalledWith('active');
    expect(await screen.findByText('No sessions are running right now.')).toBeInTheDocument();
  });

  it('searches by staff member, department or interpreter', async () => {
    vi.mocked(listInstitutionSessions).mockResolvedValue([
      session(),
      session({ id: 8, staff: { id: 4, name: 'Dr Sarah Nakato', department: 'Emergency' } }),
    ]);
    show();
    await screen.findByRole('list', { name: 'Past sessions' });

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search sessions' }), 'emerg');

    expect(screen.queryByText('Grace Achieng')).not.toBeInTheDocument();
    expect(screen.getByText('Dr Sarah Nakato')).toBeInTheDocument();
  });

  it('says that what was said is never stored or shown', async () => {
    vi.mocked(listInstitutionSessions).mockResolvedValue([]);
    show();

    expect(await screen.findByText(/What was said is never stored or shown/)).toBeInTheDocument();
  });

  it('shows the server’s message when the list cannot load', async () => {
    failing.error = new Error('Network down');
    show();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('gives a staff member their own list, without a staff column, opening their own details', async () => {
    vi.mocked(listInstitutionSessions).mockResolvedValue([session()]);
    show({ scope: 'mine', detailsBase: '/dashboard/staff/sessions' });

    const row = await screen.findByRole('link');
    expect(row).not.toHaveTextContent('Grace Achieng');
    expect(row).toHaveTextContent('Moses Interpreter');
    expect(row).toHaveAttribute('href', '/dashboard/staff/sessions/7');
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Search by interpreter');
  });
});
