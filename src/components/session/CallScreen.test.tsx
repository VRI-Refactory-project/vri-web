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
    reactions: [],
    handRaised: false,
    toggleHand: vi.fn(),
    react: vi.fn(),
    ...overrides,
  } as unknown as Call;
}

const gridTiles = () => within(document.querySelector('.ls-grid') as HTMLElement);
const mainTile = () => within(document.querySelector('.ls-main') as HTMLElement);
const sideTiles = () => within(document.querySelector('.ls-side') as HTMLElement);

describe('CallScreen', () => {
  it('shows all participants in a horizontal grid by default', () => {
    render(<CallScreen call={fakeCall()} selfName="Shadia" onLeave={vi.fn()} />);

    const grid = document.querySelector('.ls-grid');

    expect(grid).toBeInTheDocument();
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    });

    expect(gridTiles().getByLabelText('Shadia')).toBeInTheDocument();
    expect(gridTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();
    expect(gridTiles().getByLabelText('Ivan Koreta')).toBeInTheDocument();
  });

  it('shows only you when you are alone, with a waiting note', () => {
    render(<CallScreen call={fakeCall({ others: [] })} selfName="Shadia" onLeave={vi.fn()} />);

    expect(gridTiles().getByLabelText('Shadia')).toBeInTheDocument();
    expect(screen.getByText(/waiting for others/i)).toBeInTheDocument();
  });

  it('keeps a shared screen in the participant grid by default', () => {
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

    expect(gridTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();
    expect(gridTiles().getByLabelText('Amina Okafor’s screen')).toBeInTheDocument();
  });

  it('spotlights the tile the person picks, and returns to the grid when picked again', async () => {
    render(<CallScreen call={fakeCall()} selfName="Shadia" onLeave={vi.fn()} />);

    // Initially, everyone is in the grid.
    expect(gridTiles().getByLabelText('Shadia')).toBeInTheDocument();
    expect(gridTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();
    expect(gridTiles().getByLabelText('Ivan Koreta')).toBeInTheDocument();

    // Select Ivan.
    await userEvent.click(screen.getByRole('button', { name: 'Spotlight Ivan Koreta' }));

    expect(mainTile().getByLabelText('Ivan Koreta')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Shadia')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();

    // Remove spotlight.
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove spotlight from Ivan Koreta' }),
    );

    expect(gridTiles().getByLabelText('Shadia')).toBeInTheDocument();
    expect(gridTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();
    expect(gridTiles().getByLabelText('Ivan Koreta')).toBeInTheDocument();
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
    expect(document.querySelector('.ls-profile__email')).toHaveTextContent('Shadia Nalubega');
    expect(document.querySelector('.ls-profile__photo')).toBeInTheDocument();
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

  it('opens the participants list from More, with the tags, and closes the chat', async () => {
    const openChat = vi.fn();
    const call = fakeCall({
      selfRole: 'guest',
      others: [
        { id: 'u9', name: 'Amina Okafor', role: 'interpreter', stream: null, cameraOff: true },
      ],
      openChat,
    });
    render(<CallScreen call={call} selfName="Peter" onLeave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Participants/ }));

    const panel = within(screen.getByLabelText('Participants'));
    expect(panel.getByText(/Peter \(You\)/)).toBeInTheDocument();
    expect(panel.getByText('Interpreter')).toBeInTheDocument();
    expect(openChat).toHaveBeenCalledWith(false);
  });

  it('shows a hand on the tile of someone who raised one', () => {
    const call = fakeCall({
      others: [{ id: 'u9', name: 'Amina Okafor', stream: null, cameraOff: true, handRaised: true }],
    });
    render(<CallScreen call={call} selfName="S" onLeave={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'Amina Okafor has a hand raised' })).toBeInTheDocument();
  });

  it('shows reactions on the screen, with words for screen readers', () => {
    const call = fakeCall({
      reactions: [{ id: 'r1', from: 'Amina Okafor', emoji: '👏', label: 'clapping' }],
    });
    render(<CallScreen call={call} selfName="S" onLeave={vi.fn()} />);

    expect(document.querySelector('.ls-reactions')).toHaveTextContent('Amina Okafor');
    expect(screen.getByText('clapping')).toBeInTheDocument();
  });

  it('sends the reaction and the raised hand picked in More', async () => {
    const react = vi.fn();
    const toggleHand = vi.fn();
    render(<CallScreen call={fakeCall({ react, toggleHand })} selfName="S" onLeave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Send heart' }));
    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: /Raise hand/ }));

    expect(react).toHaveBeenCalledWith('❤️');
    expect(toggleHand).toHaveBeenCalledTimes(1);
  });

  it('shows a red LIVE bubble in the top bar', () => {
    render(<CallScreen call={fakeCall()} selfName="S" onLeave={vi.fn()} />);

    expect(document.querySelector('.ls-live')).toHaveTextContent('LIVE');
  });

  it('makes Leave red for people who cannot end the call, and plain for the one who can', () => {
    const { rerender } = render(<CallScreen call={fakeCall()} selfName="S" onLeave={vi.fn()} />);
    expect(screen.getByRole('button', { name: /leave call/i })).toHaveClass('cc__btn--end');

    rerender(<CallScreen call={fakeCall()} selfName="S" onLeave={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByRole('button', { name: /leave call/i })).not.toHaveClass('cc__btn--end');
  });

  it('lets the Deaf user remove a hearing guest from the list, but nobody else', async () => {
    const onRemoveGuest = vi.fn().mockResolvedValue(undefined);
    const others = [
      { id: 'user-9', name: 'Amina Okafor', stream: null, cameraOff: true },
      { id: 'guest-12', name: 'Peter', role: 'guest', stream: null, cameraOff: true },
    ];
    render(
      <CallScreen
        call={fakeCall({ others })}
        selfName="S"
        onLeave={vi.fn()}
        onRemoveGuest={onRemoveGuest}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Participants/ }));

    expect(screen.queryByRole('button', { name: 'Remove Amina Okafor' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Peter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Yes, remove Peter' }));

    expect(onRemoveGuest).toHaveBeenCalledWith(12);
  });

  it('gives nobody a Remove button when the viewer may not remove anyone', async () => {
    const others = [
      { id: 'guest-12', name: 'Peter', role: 'guest', stream: null, cameraOff: true },
    ];
    render(<CallScreen call={fakeCall({ others })} selfName="S" onLeave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Participants/ }));

    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
  });
});
