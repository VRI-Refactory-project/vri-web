/**
 * The interpreter's Settings page: what each setting is and where it starts.
 *
 * The page is static for now: nothing is saved until the settings endpoint exists, so every visit
 * starts from DEFAULT_SETTINGS. When the endpoint arrives, loading and saving go in a service file
 * and these types stay the same.
 */

export interface NotificationSettings {
  sessionRequests: boolean;
  sessionReminders: boolean;
  productUpdates: boolean;
}

export interface PrivacySettings {
  /** Clients can find and view the interpreter's profile. */
  profileVisible: boolean;
  /** Clients can see when the interpreter is available. */
  availabilityVisible: boolean;
}

export type Appearance = 'system' | 'light' | 'dark';

export interface PreferenceSettings {
  /** Language of the interface. English is the only one the app has for now. */
  language: string;
  /** An IANA time zone, e.g. "Africa/Kampala". */
  timeZone: string;
  appearance: Appearance;
}

/** Every setting on the page, one group per card. */
export interface InterpreterSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  preferences: PreferenceSettings;
}

export type SettingsGroup = keyof InterpreterSettings;

export const DEFAULT_SETTINGS: InterpreterSettings = {
  notifications: {
    sessionRequests: true,
    sessionReminders: true,
    productUpdates: false,
  },
  privacy: {
    profileVisible: true,
    availabilityVisible: true,
  },
  preferences: {
    language: 'en',
    timeZone: 'Africa/Kampala',
    appearance: 'system',
  },
};
