import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api';
import { getInterpreterProfile } from '../../services/availableInterpreters';
import { InterpreterProfileModal } from './InterpreterProfileModal';

vi.mock('../../services/availableInterpreters', () => ({ getInterpreterProfile: vi.fn() }));

const profile = {
  id: 4,
  name: 'Amina Okafor',
  signLanguages: ['Ugandan Sign Language'],
  specialisation: 'Medical',
  photoUrl: null,
  availableNow: true,
};

describe('InterpreterProfileModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows the interpreter and whether they are available now', async () => {
    vi.mocked(getInterpreterProfile).mockResolvedValue(profile);
    render(<InterpreterProfileModal interpreterId={4} onClose={() => {}} />);

    expect(await screen.findByRole('heading', { name: 'Amina Okafor' })).toBeInTheDocument();
    expect(getInterpreterProfile).toHaveBeenCalledWith(4);
    expect(screen.getByText('Available now')).toBeInTheDocument();
    expect(screen.getByText(/Ugandan Sign Language/)).toBeInTheDocument();
    expect(screen.getByText(/Medical/)).toBeInTheDocument();
    expect(screen.getByText('AO')).toBeInTheDocument();
  });

  it('says when the interpreter is not available', async () => {
    vi.mocked(getInterpreterProfile).mockResolvedValue({ ...profile, availableNow: false });
    render(<InterpreterProfileModal interpreterId={4} onClose={() => {}} />);

    expect(await screen.findByText('Not available right now')).toBeInTheDocument();
  });

  it('shows their photo when they have one', async () => {
    vi.mocked(getInterpreterProfile).mockResolvedValue({
      ...profile,
      photoUrl: 'http://api.test/api/v1/auth/photos/abc/',
    });
    render(<InterpreterProfileModal interpreterId={4} onClose={() => {}} />);

    expect(await screen.findByRole('img', { name: 'Amina Okafor' })).toHaveAttribute(
      'src',
      'http://api.test/api/v1/auth/photos/abc/',
    );
  });

  it('shows the reason when the profile cannot be opened', async () => {
    vi.mocked(getInterpreterProfile).mockRejectedValue(new ApiError(404, 'Not found.'));
    render(<InterpreterProfileModal interpreterId={4} onClose={() => {}} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Not found.');
  });

  it('closes from the Close button', async () => {
    vi.mocked(getInterpreterProfile).mockResolvedValue(profile);
    const onClose = vi.fn();
    render(<InterpreterProfileModal interpreterId={4} onClose={onClose} />);
    await screen.findByRole('heading', { name: 'Amina Okafor' });

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
