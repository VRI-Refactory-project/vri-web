import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionDetailsPage } from './SessionDetailsPage';

vi.mock('../../services/mySessions', () => ({ getMySession: vi.fn() }));
import { getMySession } from '../../services/mySessions';

afterEach(cleanup);

const show = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/deaf/sessions/5']}>
      <Routes>
        <Route path="/dashboard/deaf/sessions/:id" element={<SessionDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('SessionDetailsPage', () => {
  it('shows who, what kind and how it ended up', async () => {
    vi.mocked(getMySession).mockResolvedValue({
      id: '5',
      status: 'matched',
      interpreterName: 'Amina Okafor',
      emergency: true,
      createdAt: '2026-10-01T10:00:00',
      languages: 'Ugandan Sign Language',
      specialisation: 'MEDICAL',
      description: 'Clinic visit',
      matchedAt: '2026-10-01T10:02:00',
    });
    show();
    expect(await screen.findByText('Amina Okafor')).toBeTruthy();
    expect(screen.getByText('Emergency VRI')).toBeTruthy();
    expect(screen.getByText('Medical')).toBeTruthy();
    expect(screen.getByText('Matched')).toBeTruthy();
    expect(screen.getByText('Clinic visit')).toBeTruthy();
    expect(getMySession).toHaveBeenCalledWith('5');
  });

  it('goes back to the page it was given', async () => {
    vi.mocked(getMySession).mockResolvedValue({
      id: '5',
      status: 'completed',
      interpreterName: null,
      emergency: false,
      createdAt: '2026-10-01T10:00:00',
      languages: '',
      specialisation: 'GENERAL',
      description: '',
      matchedAt: null,
    });
    render(
      <MemoryRouter initialEntries={['/dashboard/staff/sessions/5']}>
        <Routes>
          <Route
            path="/dashboard/staff/sessions/:id"
            element={<SessionDetailsPage backTo="/dashboard/staff" />}
          />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText('No interpreter yet');
    expect(screen.getByRole('link', { name: /Back/ }).getAttribute('href')).toBe(
      '/dashboard/staff',
    );
  });

  it('shows an error when the session cannot be loaded', async () => {
    vi.mocked(getMySession).mockRejectedValue(new Error('gone'));
    show();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });
});
