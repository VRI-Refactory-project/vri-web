import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CallControls } from './CallControls';
import { ChatPanel } from './ChatPanel';

afterEach(cleanup);

const base = {
  micOn: true,
  camOn: true,
  onToggleMic: vi.fn(),
  onToggleCam: vi.fn(),
  onEnd: vi.fn(),
};

describe('CallControls', () => {
  it('lists the microphones, marks the one in use and switches to the one picked', async () => {
    const onPickDevice = vi.fn();
    render(
      <CallControls
        {...base}
        mics={[
          { id: 'a', label: 'Laptop microphone' },
          { id: 'b', label: 'Headset' },
        ]}
        selectedMic="a"
        onPickDevice={onPickDevice}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /choose microphone/i }));
    expect(screen.getByRole('menuitemradio', { name: 'Laptop microphone' })).toBeChecked();
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Headset' }));

    expect(onPickDevice).toHaveBeenCalledWith('audio', 'b');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('only offers Share Screen and Chat when the screen gives them a handler', () => {
    const { rerender } = render(<CallControls {...base} onLeave={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /share screen/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^chat$/i })).not.toBeInTheDocument();

    rerender(<CallControls {...base} onShareScreen={vi.fn()} onToggleChat={vi.fn()} />);
    expect(screen.getByRole('button', { name: /share screen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^chat$/i })).toBeInTheDocument();
  });

  it('says "Stop Sharing" while sharing and counts unread chat messages', () => {
    render(
      <CallControls {...base} onShareScreen={vi.fn()} sharing onToggleChat={vi.fn()} unread={3} />,
    );

    expect(screen.getByRole('button', { name: /stop sharing/i })).toBeInTheDocument();
    expect(screen.getByLabelText('3 unread messages')).toBeInTheDocument();
  });

  it('keeps the lobby preview to just the mic and camera buttons', () => {
    render(<CallControls {...base} lobby onToggleChat={vi.fn()} onShareScreen={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /chat/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /share screen/i })).not.toBeInTheDocument();
  });
});

describe('ChatPanel', () => {
  it('shows the messages and sends what is typed, then clears the box', async () => {
    const onSend = vi.fn();
    render(
      <ChatPanel
        messages={[
          { id: '1', from: 'Amina Okafor', text: 'Hello', mine: false, at: 1 },
          { id: '2', from: 'You', text: 'Hi Amina', mine: true, at: 2 },
        ]}
        onSend={onSend}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Message'), 'Thanks{enter}');

    expect(onSend).toHaveBeenCalledWith('Thanks');
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('can be closed', async () => {
    const onClose = vi.fn();
    render(<ChatPanel messages={[]} onSend={vi.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /close chat/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
