import { api } from '../../services/api';
import type { NotificationSettings } from './settings';

const PATH = '/api/v1/notifications/preferences/';

/** What the server sends and expects (snake_case, as Django names things). */
interface ApiPreferences {
  session_requests: boolean;
  session_reminders: boolean;
  product_updates: boolean;
}

const fromApi = (data: ApiPreferences): NotificationSettings => ({
  sessionRequests: data.session_requests,
  sessionReminders: data.session_reminders,
  productUpdates: data.product_updates,
});

/** The notification choices the signed-in person saved before (or the starting choices). */
export async function loadNotificationSettings(): Promise<NotificationSettings> {
  return fromApi(await api<ApiPreferences>(PATH));
}

/** Save the choices and return what the server now holds. */
export async function saveNotificationSettings(
  value: NotificationSettings,
): Promise<NotificationSettings> {
  const body: ApiPreferences = {
    session_requests: value.sessionRequests,
    session_reminders: value.sessionReminders,
    product_updates: value.productUpdates,
  };
  return fromApi(await api<ApiPreferences>(PATH, { method: 'PATCH', body: JSON.stringify(body) }));
}
