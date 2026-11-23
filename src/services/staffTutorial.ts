import { api } from './api';

/** One step of the staff tutorial. The content comes from the server (V2-065). */
export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  /** The `data-tour` mark of the part of the screen to highlight; null for a step on its own. */
  target: string | null;
}

export interface Tutorial {
  steps: TutorialStep[];
  /** The step the person is on, counting from 0. */
  step: number;
  completed: boolean;
  skipped: boolean;
  /** True while the tutorial should open by itself (not finished, not skipped). */
  show: boolean;
}

const URL = '/api/v1/institutions/me/tutorial/';

export const getTutorial = () => api<Tutorial>(URL);

/** Saves the step reached, or finishes, skips or restarts the tutorial. */
export const saveTutorial = (change: { step?: number; action?: 'complete' | 'skip' | 'restart' }) =>
  api<Tutorial>(URL, { method: 'PATCH', body: JSON.stringify(change) });
