import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';

const messages = [{ id: '1', from: 'Amina', text: 'Hello', mine: false, at: 0 }];

const renderChat = () =>
  render(<ChatPanel messages={messages} onSend={vi.fn()} onClose={vi.fn()} />);
const panel = () => screen.getByLabelText('Chat') as HTMLElement;

afterEach(() => localStorage.clear());

describe('ChatPanel text size', () => {
  it('starts large', () => {
    renderChat();
    expect(panel().style.getPropertyValue('--chat-size')).toBe('1.25rem');
  });

  it('gets bigger and smaller with the buttons', () => {
    renderChat();
    fireEvent.click(screen.getByRole('button', { name: 'Larger text' }));
    expect(panel().style.getPropertyValue('--chat-size')).toBe('1.5rem');
    fireEvent.click(screen.getByRole('button', { name: 'Smaller text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Smaller text' }));
    expect(panel().style.getPropertyValue('--chat-size')).toBe('1rem');
    expect(screen.getByRole('button', { name: 'Smaller text' })).toBeDisabled();
  });

  it('remembers the size next time', () => {
    const { unmount } = renderChat();
    fireEvent.click(screen.getByRole('button', { name: 'Larger text' }));
    unmount();
    renderChat();
    expect(panel().style.getPropertyValue('--chat-size')).toBe('1.5rem');
  });
});
