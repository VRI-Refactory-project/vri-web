import './accessibility.css';

export type TextSize = 'small' | 'medium' | 'large';

export interface Preferences {
  /** The sign language used to match interpreters. */
  signLanguage: string;
  captions: boolean;
  visualAlerts: boolean;
  vibrationAlerts: boolean;
  highContrast: boolean;
  textSize: TextSize;
}

export const DEFAULTS: Preferences = {
  signLanguage: 'Ugandan Sign Language',
  captions: true,
  visualAlerts: true,
  vibrationAlerts: false,
  highContrast: false,
  textSize: 'medium',
};

export const TEXT_SIZES: TextSize[] = ['small', 'medium', 'large'];
export const SIGN_LANGUAGES = [
  'Ugandan Sign Language',
  'American Sign Language',
  'International Sign',
];

const KEY = 'vri.accessibility';

/** Saved on this device. A storage that is blocked just means the defaults are used. */
export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Partial<Preferences>;
    return {
      ...DEFAULTS,
      ...saved,
      textSize: TEXT_SIZES.includes(saved.textSize as TextSize)
        ? (saved.textSize as TextSize)
        : DEFAULTS.textSize,
    };
  } catch {
    return DEFAULTS;
  }
}

export function savePreferences(prefs: Preferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // not saved this time; the page still shows what was chosen
  }
}

/** Puts the contrast and text size on the whole page. */
export function applyPreferences(prefs: Preferences, root: HTMLElement = document.documentElement) {
  root.dataset.contrast = prefs.highContrast ? 'high' : 'normal';
  root.dataset.textSize = prefs.textSize;
}

/** Call once when the app starts, so the choices apply before the page is opened. */
export const applyStoredPreferences = () => applyPreferences(loadPreferences());
