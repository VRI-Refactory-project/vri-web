import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveTutorial } from '../../services/staffTutorial';
import { StaffHelpPage } from './StaffHelpPage';

vi.mock('../../services/staffTutorial', () => ({ saveTutorial: vi.fn() }));

const show = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/staff/help']}>
      <Routes>
        <Route path="/dashboard/staff/help" element={<StaffHelpPage />} />
        <Route path="/dashboard/staff" element={<p>Staff dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => vi.mocked(saveTutorial).mockReset());

describe('StaffHelpPage', () => {
  it('lists the questions and links to sessions', () => {
    show();
    expect(screen.getByText('How do I start a call with an interpreter?')).toBeInTheDocument();
    expect(screen.getAllByRole('group').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'href',
      '/dashboard/staff/sessions',
    );
  });

  it('starts the tutorial again from the first step, on the dashboard (V2-065)', async () => {
    vi.mocked(saveTutorial).mockResolvedValue({
      steps: [],
      step: 0,
      completed: false,
      skipped: false,
      show: true,
    });
    show();

    await userEvent.click(screen.getByRole('button', { name: /Take the tour again/ }));

    expect(saveTutorial).toHaveBeenCalledWith({ action: 'restart' });
    expect(await screen.findByText('Staff dashboard')).toBeInTheDocument();
  });
});
