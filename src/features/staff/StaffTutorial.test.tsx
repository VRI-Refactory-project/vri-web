import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTutorial, saveTutorial, type Tutorial } from '../../services/staffTutorial';
import { StaffTutorial } from './StaffTutorial';
import { placeCard } from './tutorialPlacement';

vi.mock('../../services/staffTutorial', () => ({
  getTutorial: vi.fn(),
  saveTutorial: vi.fn(),
}));

const STEPS: Tutorial['steps'] = [
  { id: 'welcome', title: 'Welcome to SignConnect', body: 'A short tour.', target: null },
  { id: 'start-session', title: 'Start a session', body: 'Press start.', target: 'start-session' },
  { id: 'help', title: 'Help is always here', body: 'Replay from Help.', target: 'help' },
];

const tutorial = (over: Partial<Tutorial> = {}): Tutorial => ({
  steps: STEPS,
  step: 0,
  completed: false,
  skipped: false,
  show: true,
  ...over,
});

/** The tutorial on a page that has the parts it points at. */
function showPage() {
  return render(
    <div>
      <a data-tour="help" href="/help">
        Help & Support
      </a>
      <div data-tour="start-session">Start Interpreter Session</div>
      <StaffTutorial />
    </div>,
  );
}

beforeEach(() => {
  vi.mocked(getTutorial).mockReset();
  vi.mocked(saveTutorial).mockReset().mockResolvedValue(tutorial());
});

describe('StaffTutorial (V2-065)', () => {
  it('opens by itself the first time, one step at a time', async () => {
    vi.mocked(getTutorial).mockResolvedValue(tutorial());
    showPage();

    const card = await screen.findByRole('dialog', { name: 'Welcome to SignConnect' });
    expect(card).toHaveTextContent('Step 1 of 3');
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('does not open once finished or skipped', async () => {
    vi.mocked(getTutorial).mockResolvedValue(tutorial({ show: false, completed: true }));
    showPage();

    await Promise.resolve();
    await Promise.resolve();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('carries on from the step the person reached last time', async () => {
    vi.mocked(getTutorial).mockResolvedValue(tutorial({ step: 1 }));
    showPage();

    expect(await screen.findByRole('dialog', { name: 'Start a session' })).toHaveTextContent(
      'Step 2 of 3',
    );
  });

  it('moves on and back, saving each step it reaches', async () => {
    vi.mocked(getTutorial).mockResolvedValue(tutorial());
    showPage();
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'Start a session' })).toBeInTheDocument();
    expect(saveTutorial).toHaveBeenLastCalledWith({ step: 1 });

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('dialog', { name: 'Welcome to SignConnect' })).toBeInTheDocument();
    expect(saveTutorial).toHaveBeenLastCalledWith({ step: 0 });
  });

  it('finishes on the last step and closes', async () => {
    vi.mocked(getTutorial).mockResolvedValue(tutorial({ step: 2 }));
    showPage();
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saveTutorial).toHaveBeenCalledWith({ step: 2, action: 'complete' });
  });

  it('can be skipped, with the button or the Escape key', async () => {
    vi.mocked(getTutorial).mockResolvedValue(tutorial());
    const { unmount } = showPage();
    await screen.findByRole('dialog');
    await userEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saveTutorial).toHaveBeenCalledWith({ step: 0, action: 'skip' });
    unmount();

    vi.mocked(saveTutorial).mockClear();
    showPage();
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saveTutorial).toHaveBeenCalledWith({ step: 0, action: 'skip' });
  });

  it('puts the focus on Next, so the keyboard can walk through it', async () => {
    vi.mocked(getTutorial).mockResolvedValue(tutorial());
    showPage();

    expect(await screen.findByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('never gets in the way when it cannot be loaded', async () => {
    vi.mocked(getTutorial).mockImplementation(() => new Promise(() => {}));
    showPage();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Start Interpreter Session')).toBeInTheDocument();
  });
});

describe('placeCard: the whole card always stays on screen', () => {
  const CARD = { width: 340, height: 330 };
  const screenOf = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  };

  it('goes to the right of a sidebar link', () => {
    screenOf(1400, 900);
    expect(placeCard({ top: 300, left: 20, width: 250, height: 44 }, CARD)).toEqual({
      top: 300,
      left: 286,
    });
  });

  it('goes above a wide card near the bottom of the screen (the cut-off case)', () => {
    screenOf(1400, 900);
    const booked = { top: 460, left: 830, width: 950, height: 200 };
    const at = placeCard(booked, CARD)!;
    expect(at.top + CARD.height).toBeLessThanOrEqual(900 - 16);
    expect(at.top).toBe(460 - 16 - 330);
  });

  it('goes below when there is room under it', () => {
    screenOf(1400, 900);
    expect(placeCard({ top: 100, left: 830, width: 950, height: 120 }, CARD)).toEqual({
      top: 236,
      left: 830,
    });
  });

  it('sits in the middle when it fits nowhere beside the highlight', () => {
    screenOf(800, 500);
    expect(placeCard({ top: 60, left: 20, width: 760, height: 380 }, CARD)).toBeNull();
  });
});
