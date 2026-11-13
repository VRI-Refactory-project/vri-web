import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffDashboardPage } from './StaffDashboardPage';
import type { HistoryItem } from '../../services/mySessions';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user: { name: 'Sarah Kimuli', role: 'institution' } },
  }),
}));

// A plain function, not a spy: the test runner reports any rejected promise a spy returns, even one
// the page handles, and one test here needs the list to fail to load.
const source = vi.hoisted(() => ({
  load: (() => Promise.resolve([])) as () => Promise<unknown>,
}));
vi.mock('../../services/mySessions', () => ({
  getMySessions: () => source.load(),
}));

// The institution's name comes from a second call. A plain function again, for the same reason.
const institution = vi.hoisted(() => ({
  load: (() =>
    Promise.resolve({
      name: 'Northside Medical Center',
    })) as () => Promise<unknown>,
}));
vi.mock('../../services/institutionDashboard', () => ({
  getInstitutionOverview: () => institution.load(),
}));

const item = (over: Partial<HistoryItem>): HistoryItem => ({
  id: '1',
  status: 'completed',
  interpreterName: 'Amina Okafor',
  emergency: false,
  createdAt: '2026-10-01T10:00:00Z',
  ...over,
});

function renderPage() {
  render(
    <MemoryRouter>
      <StaffDashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  source.load = () => Promise.resolve([]);
  institution.load = () => Promise.resolve({ name: 'Northside Medical Center' });
});

describe('StaffDashboardPage', () => {
  it('greets the staff member by first name and offers to start a session', async () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Sarah$/);
    expect(screen.getByRole('link', { name: 'Start Session' })).toHaveAttribute(
      'href',
      '/dashboard/staff/start-session',
    );
    expect(await screen.findByText('No active session')).toBeInTheDocument();
    expect(screen.getByText('You have no sessions yet.')).toBeInTheDocument();
  });

  it('shows which institution the staff member belongs to', async () => {
    renderPage();
    expect(await screen.findByText('Northside Medical Center')).toBeInTheDocument();
  });

  it('opens without the institution name when it cannot be loaded', async () => {
    institution.load = () => Promise.reject(new Error('offline'));
    renderPage();
    expect(await screen.findByText('No active session')).toBeInTheDocument();
    expect(screen.queryByText('Northside Medical Center')).not.toBeInTheDocument();
  });

  it('lists the three latest sessions with who answered and how they ended', async () => {
    source.load = () =>
      Promise.resolve([
        item({ id: '1', status: 'completed', interpreterName: 'Amina Okafor' }),
        item({ id: '2', status: 'missed', interpreterName: null }),
        item({ id: '3', status: 'completed', interpreterName: 'Grace Lee' }),
        item({
          id: '4',
          status: 'completed',
          interpreterName: 'Fourth Person',
        }),
      ]);
    renderPage();
    expect(await screen.findByText('Amina Okafor')).toBeInTheDocument();
    expect(screen.getByText('Grace Lee')).toBeInTheDocument();
    expect(screen.queryByText('Fourth Person')).not.toBeInTheDocument();
    expect(screen.getAllByText('Completed')).toHaveLength(2);
    expect(screen.getByText('Missed')).toBeInTheDocument();
  });

  it('shows a request that is still looking as the active session', async () => {
    source.load = () => Promise.resolve([item({ status: 'waiting', interpreterName: null })]);
    renderPage();
    const active = await screen.findByRole('region', {
      name: 'Active session',
    });
    expect(await within(active).findByText('Looking for an interpreter')).toBeInTheDocument();
    expect(screen.queryByText('No active session')).not.toBeInTheDocument();
  });

  it('still opens when the sessions cannot be loaded', async () => {
    source.load = () => Promise.reject(new Error('offline'));
    renderPage();
    expect(await screen.findByText('You have no sessions yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Session' })).toBeInTheDocument();
  });

  it('opens a session’s details from the recent list', async () => {
    source.load = () => Promise.resolve([item({ id: '7', interpreterName: 'Amina Okafor' })]);
    renderPage();
    const row = await screen.findByRole('link', { name: /Amina Okafor/ });
    expect(row).toHaveAttribute('href', '/dashboard/staff/sessions/7');
  });

  it('opens the details of the session that is still looking', async () => {
    source.load = () =>
      Promise.resolve([item({ id: '9', status: 'waiting', interpreterName: null })]);
    renderPage();
    const active = await screen.findByRole('region', {
      name: 'Active session',
    });
    const link = await within(active).findByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard/staff/sessions/9');
  });

  it('shows the calendar with the month and today picked', async () => {
    renderPage();
    const calendar = screen.getByRole('region', { name: 'Calendar' });
    expect(within(calendar).getByRole('button', { name: 'Next month' })).toBeInTheDocument();
    expect(within(calendar).getByText('No sessions this day.')).toBeInTheDocument();
    expect(await screen.findByText('No active session')).toBeInTheDocument();
  });
});
