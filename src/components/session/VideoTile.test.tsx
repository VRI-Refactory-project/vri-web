import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VideoTile } from './VideoTile';

describe('VideoTile names and tags', () => {
  it('shows the Interpreter tag under the name', () => {
    render(<VideoTile name="Amina Okafor" role="interpreter" />);
    expect(screen.getByText('Interpreter')).toBeInTheDocument();
  });

  it('shows the Hearing guest tag under the name', () => {
    render(<VideoTile name="Peter" role="guest" />);
    expect(screen.getByText('Hearing guest')).toBeInTheDocument();
  });

  it('shows no tag for everyone else', () => {
    render(<VideoTile name="Sam" />);
    expect(screen.queryByText('Interpreter')).not.toBeInTheDocument();
    expect(screen.queryByText('Hearing guest')).not.toBeInTheDocument();
  });

  it('offers no rename button on other people’s tiles', () => {
    render(<VideoTile name="Sam" />);
    expect(screen.queryByRole('button', { name: 'Rename yourself' })).not.toBeInTheDocument();
  });

  it('lets you rename yourself and keeps your tag', () => {
    const onRename = vi.fn();
    render(<VideoTile name="Guest 1" role="guest" onRename={onRename} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename yourself' }));
    fireEvent.change(screen.getByLabelText('Your name in this call'), {
      target: { value: 'Peter' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onRename).toHaveBeenCalledWith('Peter');
    expect(screen.getByText('Hearing guest')).toBeInTheDocument();
  });

  it('does not save an empty name', () => {
    const onRename = vi.fn();
    render(<VideoTile name="Sam" onRename={onRename} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename yourself' }));
    fireEvent.change(screen.getByLabelText('Your name in this call'), { target: { value: '  ' } });

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(onRename).not.toHaveBeenCalled();
  });
});
