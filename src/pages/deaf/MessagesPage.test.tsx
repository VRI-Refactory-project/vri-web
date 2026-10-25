import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MessagesPage } from './MessagesPage';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('MessagesPage', () => {
  it('says messaging is not live when there are no conversations', async () => {
    render(<MessagesPage />);
    expect(await screen.findByText(/Messaging is not live yet/)).toBeTruthy();
  });

  it('opens a conversation and sends a message when sample data is on', async () => {
    vi.stubEnv('VITE_MOCK_DEAF_EXTRAS', 'true');
    render(<MessagesPage />);
    expect(await screen.findByText('Confirming our session tomorrow at 9:00 AM.')).toBeTruthy();
    const send = screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Write a message'), {
      target: { value: 'See you soon' },
    });
    fireEvent.click(send);
    expect(screen.getAllByText('See you soon').length).toBeGreaterThan(0);
  });

  it('searches the conversation list', async () => {
    vi.stubEnv('VITE_MOCK_DEAF_EXTRAS', 'true');
    render(<MessagesPage />);
    await screen.findByRole('button', { name: /Amina Okafor/ });
    fireEvent.change(screen.getByLabelText('Search conversations'), {
      target: { value: 'support' },
    });
    expect(screen.queryByRole('button', { name: /Amina Okafor/ })).toBeNull();
    expect(screen.getByRole('button', { name: /SignConnect Support/ })).toBeTruthy();
  });
});
