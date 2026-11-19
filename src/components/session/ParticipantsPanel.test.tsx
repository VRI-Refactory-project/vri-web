import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ParticipantsPanel } from './ParticipantsPanel';

const people = [
  { id: 'self', name: 'Grace', self: true, cameraOff: false },
  { id: 'user-9', name: 'Amina Okafor', role: 'interpreter' as const, handRaised: true },
  { id: 'guest-3', name: 'Peter', role: 'guest' as const, cameraOff: true },
];

describe('ParticipantsPanel', () => {
  it('lists everyone with a count, marking you', () => {
    render(<ParticipantsPanel people={people} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Participants (3)' })).toBeInTheDocument();
    expect(screen.getByText(/Grace \(You\)/)).toBeInTheDocument();
    expect(screen.getByText('Amina Okafor')).toBeInTheDocument();
  });

  it('shows the tags, a raised hand and who has the camera off', () => {
    render(<ParticipantsPanel people={people} onClose={vi.fn()} />);

    expect(screen.getByText('Interpreter')).toBeInTheDocument();
    expect(screen.getByText('Hearing guest')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'hand raised' })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Camera off')).toHaveLength(1);
  });

  it('closes with the close button', () => {
    const onClose = vi.fn();
    render(<ParticipantsPanel people={people} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close participants' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('shows the tag for every role', () => {
    const everyone = [
      { id: 'a', name: 'A', role: 'deaf' as const },
      { id: 'b', name: 'B', role: 'institution' as const },
      { id: 'c', name: 'C', role: 'admin' as const },
    ];
    render(<ParticipantsPanel people={everyone} onClose={vi.fn()} />);

    expect(screen.getByText('Deaf user')).toBeInTheDocument();
    expect(screen.getByText('Institution')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('lets you edit your own name, and only your own', () => {
    const onRename = vi.fn();
    render(<ParticipantsPanel people={people} onClose={vi.fn()} onRename={onRename} />);

    expect(screen.getAllByRole('button', { name: 'Edit your name' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Edit your name' }));
    fireEvent.change(screen.getByLabelText('Edit your name in this call'), {
      target: { value: 'Grace M' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onRename).toHaveBeenCalledWith('Grace M');
  });

  it('shows no pencil when renaming is not offered', () => {
    render(<ParticipantsPanel people={people} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Edit your name' })).not.toBeInTheDocument();
  });

  it('asks before removing someone, and can be cancelled', () => {
    const onRemove = vi.fn();
    const withGuest = [{ id: 'guest-3', name: 'Peter', role: 'guest' as const, removable: true }];
    render(<ParticipantsPanel people={withGuest} onClose={vi.fn()} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Peter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Remove Peter' })).toBeInTheDocument();
  });

  it('removes the person once confirmed, and says so when it fails', async () => {
    const onRemove = vi.fn().mockRejectedValue(new Error('nope'));
    const withGuest = [{ id: 'guest-3', name: 'Peter', role: 'guest' as const, removable: true }];
    render(<ParticipantsPanel people={withGuest} onClose={vi.fn()} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Peter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove Peter' }));

    expect(onRemove).toHaveBeenCalledWith('guest-3');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Could not remove Peter'),
    );
  });
});
