import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Call } from '../../features/session/useCall';
import { ALONE_MS, ANSWER_SECONDS } from './AloneCheck';
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

const mainTile = () => within(document.querySelector('.ls-main') as HTMLElement);
const sideTiles = () => within(document.querySelector('.ls-side') as HTMLElement);

// jsdom has no MediaStream; the screen only hands it to the video element.
const sharedScreen = {} as MediaStream;

// A Deaf user's call with the interpreter and a hearing guest.
const interpreted = [
  { id: 'guest-3', name: 'Peter', role: 'guest', stream: null, cameraOff: true },
  { id: 'u9', name: 'Amina Okafor', role: 'interpreter', stream: null, cameraOff: true },
];

describe('CallScreen', () => {
  it('spotlights the interpreter for the Deaf user without being asked', () => {
    const call = fakeCall({ selfRole: 'deaf', others: interpreted });
    render(<CallScreen call={call} selfName="Shadia" onLeave={vi.fn()} />);

    expect(mainTile().getByLabelText('Amina Okafor')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Shadia')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Peter')).toBeInTheDocument();
    // The screen chose it, so there is nothing to unpin.
    expect(
      screen.queryByRole('button', { name: /spotlight from Amina Okafor/ }),
    ).not.toBeInTheDocument();
  });

  it('spotlights the Deaf user for the interpreter', () => {
    const call = fakeCall({
      selfRole: 'interpreter',
      others: [
        { id: 'guest-3', name: 'Peter', role: 'guest', stream: null, cameraOff: true },
        { id: 'u2', name: 'Shadia', role: 'deaf', stream: null, cameraOff: true },
      ],
    });
    render(<CallScreen call={call} selfName="Amina Okafor" onLeave={vi.fn()} />);

    expect(mainTile().getByLabelText('Shadia')).toBeInTheDocument();
  });

  it('fills the screen with you when you are alone: no empty tile, just a waiting note', () => {
    render(<CallScreen call={fakeCall({ others: [] })} selfName="Shadia" onLeave={vi.fn()} />);

    expect(mainTile().getByLabelText('Shadia')).toBeInTheDocument();
    expect(mainTile().getByText(/waiting for others/i)).toBeInTheDocument();
    expect(document.querySelector('.ls-side')).toBeNull();
  });

  it('spotlights a shared screen for everyone', () => {
    const others = [
      ...interpreted,
      {
        id: 'guest-3#screen',
        name: 'Peter’s screen',
        stream: null,
        cameraOff: false,
        screen: true,
      },
    ];
    render(
      <CallScreen
        call={fakeCall({ selfRole: 'deaf', others })}
        selfName="Shadia"
        onLeave={vi.fn()}
      />,
    );

    expect(mainTile().getByLabelText('Peter’s screen')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();
  });

  it('shows the person sharing what they share, big, with a bar to stop presenting', async () => {
    const toggleShare = vi.fn();
    const call = fakeCall({
      selfRole: 'deaf',
      others: interpreted,
      sharing: true,
      selfScreen: sharedScreen,
      toggleShare,
    });
    render(<CallScreen call={call} selfName="Shadia" onLeave={vi.fn()} />);

    expect(mainTile().getByLabelText('Your screen')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Shadia')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();
    expect(screen.getByText(/you’re presenting your screen/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Stop presenting' }));
    expect(toggleShare).toHaveBeenCalledTimes(1);
  });

  it('shows no presenting bar and no screen tile while you are not sharing', () => {
    render(
      <CallScreen
        call={fakeCall({ selfRole: 'deaf', others: interpreted })}
        selfName="Shadia"
        onLeave={vi.fn()}
      />,
    );

    expect(screen.queryByText(/you’re presenting/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Your screen')).not.toBeInTheDocument();
  });

  it('does not count your shared screen as a person in the call', async () => {
    const call = fakeCall({
      selfRole: 'deaf',
      others: interpreted,
      sharing: true,
      selfScreen: sharedScreen,
    });
    render(<CallScreen call={call} selfName="Shadia" onLeave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Participants/ }));

    const panel = within(screen.getByLabelText('Participants'));
    expect(panel.queryByText('Your screen')).not.toBeInTheDocument();
    expect(panel.getByText(/Shadia \(You\)/)).toBeInTheDocument();
  });

  describe('"Are you still there?"', () => {
    afterEach(() => vi.useRealTimers());
    const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

    it('asks after 5 minutes alone, and closes the call when nobody answers', () => {
      vi.useFakeTimers();
      const onAloneTimeout = vi.fn();
      render(
        <CallScreen
          call={fakeCall({ others: [] })}
          selfName="S"
          onLeave={vi.fn()}
          onAloneTimeout={onAloneTimeout}
        />,
      );

      wait(ALONE_MS - 1000);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      wait(1000);
      expect(screen.getByRole('alertdialog', { name: 'Are you still there?' })).toHaveTextContent(
        'You’ll leave the call',
      );

      wait(ANSWER_SECONDS * 1000);
      expect(onAloneTimeout).toHaveBeenCalledTimes(1);
    });

    it('starts again from 5 minutes when the person answers', () => {
      vi.useFakeTimers();
      const onAloneTimeout = vi.fn();
      render(
        <CallScreen
          call={fakeCall({ others: [] })}
          selfName="S"
          onLeave={vi.fn()}
          onEnd={vi.fn()}
          onAloneTimeout={onAloneTimeout}
        />,
      );
      wait(ALONE_MS);
      // The Deaf user is told the session itself will end.
      expect(screen.getByRole('alertdialog')).toHaveTextContent('The session will end');

      fireEvent.click(screen.getByRole('button', { name: 'I’m still here' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      wait(ALONE_MS - 1000);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(onAloneTimeout).not.toHaveBeenCalled();
      wait(1000);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('never asks while someone else is in the call, and resets when they arrive', () => {
      vi.useFakeTimers();
      const alone = fakeCall({ others: [] });
      const { rerender } = render(<CallScreen call={alone} selfName="S" onLeave={vi.fn()} />);
      wait(ALONE_MS - 1000);

      rerender(<CallScreen call={fakeCall()} selfName="S" onLeave={vi.fn()} />);
      wait(ALONE_MS * 2);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      // They leave again: a fresh 5 minutes, not the 1 second that was left.
      rerender(<CallScreen call={alone} selfName="S" onLeave={vi.fn()} />);
      wait(1000);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('leaves the call by default when no timeout action is given (guests)', () => {
      vi.useFakeTimers();
      const onLeave = vi.fn();
      render(<CallScreen call={fakeCall({ others: [] })} selfName="S" onLeave={onLeave} />);

      wait(ALONE_MS);
      wait(ANSWER_SECONDS * 1000);
      expect(onLeave).toHaveBeenCalledTimes(1);
    });
  });

  it('lets you pin someone else, and goes back to its own choice when you unpin', async () => {
    const call = fakeCall({ selfRole: 'deaf', others: interpreted });
    render(<CallScreen call={call} selfName="Shadia" onLeave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Spotlight Shadia' }));
    expect(mainTile().getByLabelText('Shadia')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Amina Okafor')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove spotlight from Shadia' }));
    expect(mainTile().getByLabelText('Amina Okafor')).toBeInTheDocument();
    expect(sideTiles().getByLabelText('Shadia')).toBeInTheDocument();
  });

  it('goes back to its own choice when the pinned person leaves', async () => {
    const call = fakeCall({ selfRole: 'deaf', others: interpreted });
    const { rerender } = render(<CallScreen call={call} selfName="Shadia" onLeave={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Spotlight Peter' }));
    expect(mainTile().getByLabelText('Peter')).toBeInTheDocument();

    const left = fakeCall({ selfRole: 'deaf', others: [interpreted[1]] });
    rerender(<CallScreen call={left} selfName="Shadia" onLeave={vi.fn()} />);

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

describe('picture-in-picture (staying on the call in other tabs)', () => {
  /** A stand-in for Chrome's floating window: a real second document the call can be drawn in. */
  function fakePipWindow() {
    const doc = document.implementation.createHTMLDocument('pip');
    const listeners: Record<string, () => void> = {};
    const win = {
      document: doc,
      close: vi.fn(() => listeners.pagehide?.()),
      addEventListener: (type: string, fn: () => void) => (listeners[type] = fn),
    };
    const api = {
      window: null as unknown,
      requestWindow: vi.fn(async () => {
        api.window = win;
        return win;
      }),
    };
    vi.stubGlobal('documentPictureInPicture', api);
    return { api, win, doc, pagehide: () => listeners.pagehide?.() };
  }

  afterEach(() => vi.unstubAllGlobals());

  const deafCall = (overrides = {}) =>
    fakeCall({
      selfRole: 'deaf',
      others: [
        { id: 'u9', name: 'Amina Okafor', role: 'interpreter', stream: null, cameraOff: true },
      ],
      ...overrides,
    });

  it('has no Pop out button where the browser cannot float a call (Firefox)', () => {
    render(<CallScreen call={deafCall()} selfName="Shadia" onLeave={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /pop out/i })).not.toBeInTheDocument();
  });

  it('pops the big tile out with Mute, Video and Leave, and they work from there', async () => {
    const pip = fakePipWindow();
    const toggleMic = vi.fn();
    const toggleCam = vi.fn();
    const onLeave = vi.fn();
    render(
      <CallScreen call={deafCall({ toggleMic, toggleCam })} selfName="Shadia" onLeave={onLeave} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pop out' }));

    expect(pip.api.requestWindow).toHaveBeenCalledTimes(1);
    const floating = within(pip.doc.body);
    // The interpreter is the big tile for the Deaf user, so that is what floats.
    expect(floating.getByLabelText('Amina Okafor')).toBeTruthy();
    // It plays no sound of its own: the call screen already does.
    expect((pip.doc.querySelector('video') as HTMLVideoElement).muted).toBe(true);

    // The stand-in document has no window of its own, which role lookups and fireEvent need.
    const button = (label: string) =>
      pip.doc.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
    act(() => button('Mute').click());
    act(() => button('Stop video').click());
    act(() => button('Leave call').click());
    expect(toggleMic).toHaveBeenCalledTimes(1);
    expect(toggleCam).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Pop in' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('goes back to normal when the floating window is closed', async () => {
    const pip = fakePipWindow();
    render(<CallScreen call={deafCall()} selfName="Shadia" onLeave={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pop out' }));

    act(() => pip.pagehide());

    // jest-dom's matchers only know the main document, so the floating one is checked directly.
    expect(pip.doc.body.innerHTML).toBe('');
    expect(screen.getByRole('button', { name: 'Pop out' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('closes the floating window when the call screen goes (leaving the call)', async () => {
    const pip = fakePipWindow();
    const { unmount } = render(
      <CallScreen call={deafCall()} selfName="Shadia" onLeave={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Pop out' }));

    unmount();

    expect(pip.win.close).toHaveBeenCalled();
  });

  it('asks Chrome to open it by itself when the person switches tabs', () => {
    fakePipWindow();
    const setActionHandler = vi.fn();
    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: { setActionHandler },
    });
    const { unmount } = render(
      <CallScreen call={deafCall()} selfName="Shadia" onLeave={vi.fn()} />,
    );

    expect(setActionHandler).toHaveBeenCalledWith('enterpictureinpicture', expect.any(Function));
    unmount();
    expect(setActionHandler).toHaveBeenLastCalledWith('enterpictureinpicture', null);
    // @ts-expect-error -- jsdom has no mediaSession; take the stand-in away again.
    delete navigator.mediaSession;
  });

  it('floats just the video where that is all the browser can do (Safari)', async () => {
    Object.defineProperty(document, 'pictureInPictureEnabled', { configurable: true, value: true });
    const requestPictureInPicture = vi.fn().mockResolvedValue(undefined);
    HTMLVideoElement.prototype.requestPictureInPicture = requestPictureInPicture;
    const call = deafCall({
      others: [
        {
          id: 'u9',
          name: 'Amina Okafor',
          role: 'interpreter',
          stream: {} as MediaStream,
          cameraOff: false,
        },
      ],
    });
    render(<CallScreen call={call} selfName="Shadia" onLeave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Pop out' }));

    expect(requestPictureInPicture).toHaveBeenCalledTimes(1);
    expect(requestPictureInPicture.mock.contexts[0]).toBe(document.querySelector('.ls-main video'));
    // @ts-expect-error -- undo the stand-ins for the other tests.
    delete document.pictureInPictureEnabled;
    // @ts-expect-error -- as above.
    delete HTMLVideoElement.prototype.requestPictureInPicture;
  });
});
