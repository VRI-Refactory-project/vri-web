import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Call } from '../../features/session/useCall';
import { CallScreen } from './CallScreen';

afterEach(cleanup);

/** The parts of a call the screen reads, with sensible defaults. */
function fakeCall(overrides: Partial<Record<string, unknown>> = {}): Call {
  return {
    mode: { video: true, audio: true },
    media: {
      stream: null,
      camOn: true,
      micOn: true,
      mics: [],
      cams: [],
      selectedMic: null,
      selectedCam: null,
    },
    others: [
      { id: 'u9', name: 'Amina Okafor', stream: null, cameraOff: true, quality: 'good' },
      { id: 'u10', name: 'Ivan Koreta', stream: null, cameraOff: true, quality: 'poor' },
    ],
    messages: [],
    chatOpen: false,
    unread: 0,
    sharing: false,
    selfQuality: 'excellent',
    quality: 'auto',
    seconds: 65,
    error: null,
    accessNotice: null,
    toggleMic: vi.fn(),
    toggleCam: vi.fn(),
    toggleShare: vi.fn(),
    pickDevice: vi.fn(),
    pickQuality: vi.fn(),
    openChat: vi.fn(),
    sendChat: vi.fn(),
    ...overrides,
  } as unknown as Call;
}

const mainTile = () => within(document.querySelector('.ls-main') as HTMLElement);
const sideTiles = () => within(document.querySelector('.ls-side') as HTMLElement);

describe('CallScreen', () => {
  it('makes the other person the big tile and puts you beside them', () => {
    render(<CallScreen call={fakeCall()} selfName="Shadia" onLeave={vi.fn()} />);

    expect(mainTile().getByLabelText('Amina Okafor')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Shadia')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Ivan Koreta')).toBeInTheDocument();
  });

  it('shows only you when you are alone, with a waiting note', () => {
    render(<CallScreen call={fakeCall({ others: [] })} selfName="Shadia" onLeave={vi.fn()} />);

    expect(mainTile().getByLabelText('Shadia')).toBeInTheDocument();
    expect(screen.getByText(/waiting for others/i)).toBeInTheDocument();
  });

  it('puts a shared screen in the big tile', () => {
    const others = [
      { id: 'u9', name: 'Amina Okafor', stream: null, cameraOff: true },
      {
        id: 'u9#screen',
        name: 'Amina Okafor’s screen',
        stream: null,
        cameraOff: false,
        screen: true,
      },
    ];
    render(<CallScreen call={fakeCall({ others })} selfName="Shadia" onLeave={vi.fn()} />);

    expect(mainTile().getByLabelText('Amina Okafor’s screen')).toBeInTheDocument();
  });

  it('spotlights the tile the person picks, and goes back when it is picked again', async () => {
    render(<CallScreen call={fakeCall()} selfName="Shadia" onLeave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Spotlight Ivan Koreta' }));
    expect(mainTile().getByLabelText('Ivan Koreta')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove spotlight from Ivan Koreta' }),
    );
    expect(mainTile().getByLabelText('Amina Okafor')).toBeInTheDocument();
  });

  it('shows connection bars on each tile, including your own', () => {
    render(<CallScreen call={fakeCall()} selfName="Shadia" onLeave={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'Connection: good' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Connection: poor' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Connection: excellent' })).toBeInTheDocument();
  });

  it('shows the logo name, the timer and the signed-in person’s email top-right', () => {
    render(
      <CallScreen
        call={fakeCall()}
        selfName="Shadia Nalubega"
        selfEmail="shadia@example.com"
        onLeave={vi.fn()}
      />,
    );

    expect(screen.getByText('SignConnect')).toBeInTheDocument();
    expect(screen.getByLabelText('Call length')).toHaveTextContent('1:05');
    expect(screen.getByText('shadia@example.com')).toBeInTheDocument();
  });

  it('shows no profile for a guest, who has no account', () => {
    render(<CallScreen call={fakeCall()} selfName="Hearing guest" onLeave={vi.fn()} />);

    expect(document.querySelector('.ls-profile')).toBeNull();
  });

  it('gives End Call only to the person allowed to end it, and Quality and Chat to everyone', () => {
    const { rerender } = render(<CallScreen call={fakeCall()} selfName="S" onLeave={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /end call/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quality/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^chat$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share screen/i })).toBeInTheDocument();

    rerender(<CallScreen call={fakeCall()} selfName="S" onLeave={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByRole('button', { name: /end call/i })).toBeInTheDocument();
  });
});
