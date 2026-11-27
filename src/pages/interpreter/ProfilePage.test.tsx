import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './ProfilePage';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getStats: vi.fn(),
  updateProfile: vi.fn(),
}));
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { name: 'Amina Okafor' } } }),
}));
vi.mock('../../components/SignOutButton', () => ({ SignOutButton: () => null }));
vi.mock('../../services/photos', () => ({
  getMyPhoto: () => Promise.resolve(null),
  uploadMyPhoto: vi.fn(),
  removeMyPhoto: vi.fn(),
}));
vi.mock('../../services/interpreterProfile', () => ({
  getInterpreterProfile: mocks.getProfile,
  getMyInterpreterProfileStats: mocks.getStats,
  updateInterpreterProfile: mocks.updateProfile,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );

beforeEach(() => {
  mocks.getProfile.mockResolvedValue({ yearsExperience: 4 });
  mocks.getStats.mockResolvedValue({ average_rating: 4.5, completed_sessions: 12 });
  mocks.updateProfile.mockReset();
});

describe('interpreter ProfilePage', () => {
  it('opens in viewing mode with the fields disabled', async () => {
    renderPage();
    expect(await screen.findByText('Viewing')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('4')).toBeDisabled();
    expect(screen.getByLabelText('Full name')).toBeDisabled();
    expect(screen.getByText('12 completed sessions')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('editing unlocks the fields and saves the years of experience', async () => {
    mocks.updateProfile.mockResolvedValue({ yearsExperience: 6 });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));

    expect(screen.getByText('Editing')).toBeInTheDocument();
    const years = screen.getByLabelText('Years of interpreting experience');
    expect(years).toBeEnabled();
    await user.clear(years);
    await user.type(years, '6');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mocks.updateProfile).toHaveBeenCalledWith({ yearsExperience: 6 });
    expect(await screen.findByText('Viewing')).toBeInTheDocument();
    expect(screen.getByLabelText('Years of interpreting experience')).toBeDisabled();
  });

  it('cancel puts the saved years back', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));
    const years = screen.getByLabelText('Years of interpreting experience');
    await user.clear(years);
    await user.type(years, '9');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mocks.updateProfile).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Years of interpreting experience')).toHaveValue(4);
  });
});
