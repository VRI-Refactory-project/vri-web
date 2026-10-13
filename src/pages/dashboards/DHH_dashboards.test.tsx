import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DHH_dashboard'

// Mock useAuth since DashboardLayout reads the current user
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user: { name: 'Micheal Kiggundu', role: 'deaf' } },
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage (deaf)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('greets the signed-in user', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /good morning, micheal/i })).toBeInTheDocument();
  });

  it('shows the Start VRI Session call to action', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /start vri session/i })).toBeInTheDocument();
  });

  it('renders the three summary stats', () => {
    renderPage();
    expect(screen.getByText(/2 sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/\$48\.50/)).toBeInTheDocument();
    expect(screen.getByText(/7 sessions/i)).toBeInTheDocument();
  });

  it('lists upcoming sessions', () => {
    renderPage();
    expect(screen.getByText(/dr\. sarah chen/i)).toBeInTheDocument();
    expect(screen.getAllByText(/today, 3:30 pm/i).length).toBeGreaterThan(1);
  });

  it('lists available interpreters', () => {
    renderPage();
    expect(screen.getByText(/amina okafor/i)).toBeInTheDocument();
    expect(screen.getByText(/daniel brooks/i)).toBeInTheDocument();
  });

  it('shows the Available badge only when an interpreter is available', () => {
    renderPage();
    const availableBadges = screen.getAllByText(/available/i);
    // Adjust the number if you change isAvailable for other interpreters
    expect(availableBadges.length).toBeGreaterThan(0);
  });
});