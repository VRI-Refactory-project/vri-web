import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionConfirmationPage } from './SessionConfirmationPage';

vi.mock('../../services/mySessions', () => ({ getMySessions: vi.fn() }));
import { getMySessions } from '../../services/mySessions';

afterEach(cleanup);

const show = () =>
  render(
    <MemoryRouter>
      <SessionConfirmationPage />
    </MemoryRouter>,
  );

const base = { emergency: false, createdAt: '2026-10-01T10:00:00' };

describe('SessionConfirmationPage', () => {
  it('lets the person connect when an interpreter has accepted', async () => {
    vi.mocked(getMySessions).mockResolvedValue([
      { ...base, id: '7', status: 'matched', interpreterName: 'Amina' },
    ]);
    show();
    expect(await screen.findByText('Amina is ready')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Connect now' }).getAttribute('href')).toBe(
      '/live/deaf/7',
    );
  });

  it('sends the person back to the request while it is still waiting', async () => {
    vi.mocked(getMySessions).mockResolvedValue([
      { ...base, id: '8', status: 'waiting', interpreterName: null },
    ]);
    show();
    expect(await screen.findByText('Still looking for an interpreter')).toBeTruthy();
  });

  it('says so when there is nothing to confirm', async () => {
    vi.mocked(getMySessions).mockResolvedValue([
      { ...base, id: '9', status: 'cancelled', interpreterName: null },
    ]);
    show();
    expect(await screen.findByText('Nothing to confirm')).toBeTruthy();
  });
});
