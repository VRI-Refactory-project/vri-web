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

/** Every setting on the page, one group per card. */
export interface InterpreterSettings {
  notifications: NotificationSettings;
}

export type SettingsGroup = keyof InterpreterSettings;

export const DEFAULT_SETTINGS: InterpreterSettings = {
  notifications: {
    sessionRequests: true,
    sessionReminders: true,
    productUpdates: false,
  },
};
