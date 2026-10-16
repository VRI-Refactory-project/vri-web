/*
 * Availability client for the interpreter schedule page (V2-004 / V2-021).
 *
 * The page works with one object: { weeklySchedule, exceptions, available }. The backend has
 * smaller endpoints (a week, a month of one-off dates, one day at a time, and the dashboard
 * switch), so this file translates between the two. Change URLs or field names here only.
 *
 *   GET   /api/v1/interpreters/me/availability/?week_start=YYYY-MM-DD   one week, Monday first
 *   GET   /api/v1/interpreters/me/availability/exceptions/?month=YYYY-MM  one-off dates
 *   PATCH /api/v1/interpreters/me/availability/days/<date>/              one day
 *   DELETE /api/v1/interpreters/me/availability/exceptions/<date>/       remove a one-off date
 *   GET|PATCH /api/v1/interpreters/me/availability/status/              the dashboard switch
 */
import { api } from './api';

const BASE = '/api/v1/interpreters/me/availability';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** "08:00:00" from the API becomes "08:00" for the page's time inputs. */
const hhmm = (t) => (t ? t.slice(0, 5) : undefined);

/** The next date (today or later) that falls on this weekday (0 = Monday). */
function nextDateFor(weekday, today = new Date()) {
  const todayWeekday = (today.getDay() + 6) % 7;
  return dateKey(addDays(today, (weekday - todayWeekday + 7) % 7));
}

// The one-off dates the page loaded last, so saving can tell which ones were removed.
let loadedExceptionDates = new Set();

export const interpreterApi = {
  /** Everything the page shows: the default week, one-off dates and the dashboard switch. */
  async getAvailability() {
    const today = new Date();
    const [status, week1, week2, ...months] = await Promise.all([
      api(`${BASE}/status/`),
      api(`${BASE}/?week_start=${dateKey(today)}`),
      api(`${BASE}/?week_start=${dateKey(addDays(today, 7))}`),
      ...[0, 1, 2].map((i) =>
        api(
          `${BASE}/exceptions/?month=${monthKey(new Date(today.getFullYear(), today.getMonth() + i, 1))}`,
        ),
      ),
    ]);

    // A day with a one-off change hides the normal hours for that weekday, so prefer a day from
    // the next week that is still on the default hours.
    const all = [...week1.days, ...week2.days];
    const weeklySchedule = DAY_NAMES.map((day, weekday) => {
      const matches = all.filter((d) => d.weekday === weekday);
      const entry = matches.find((d) => d.source === 'default') ?? matches[0];
      return {
        day,
        enabled: Boolean(entry?.is_available),
        start: hhmm(entry?.start_time),
        end: hhmm(entry?.end_time),
      };
    });

    const exceptions = months
      .flatMap((m) => m.exceptions)
      .map((e) => ({
        id: `exception-${e.date}`,
        date: e.date,
        unavailable: !e.is_available,
        ...(e.is_available ? { start: hhmm(e.start_time), end: hhmm(e.end_time) } : {}),
      }));

    loadedExceptionDates = new Set(exceptions.map((e) => e.date));
    return { weeklySchedule, exceptions, available: status.is_available };
  },

  /** Saves the default week and the one-off dates. Past dates are left as they are. */
  async updateAvailability({ weeklySchedule, exceptions }) {
    const today = dateKey(new Date());

    // 1. The default week: one request per weekday, applied from its next occurrence.
    await Promise.all(
      weeklySchedule.map((item) =>
        api(`${BASE}/days/${nextDateFor(DAY_NAMES.indexOf(item.day))}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            is_available: item.enabled,
            start_time: item.enabled ? item.start : null,
            end_time: item.enabled ? item.end : null,
            repeat_weekly: true,
          }),
        }),
      ),
    );

    // 2. One-off dates removed on the page.
    const keptDates = new Set(exceptions.map((e) => e.date));
    await Promise.all(
      [...loadedExceptionDates]
        .filter((d) => !keptDates.has(d) && d >= today)
        .map((d) => api(`${BASE}/exceptions/${d}/`, { method: 'DELETE' }).catch(() => undefined)),
    );

    // 3. One-off dates added or changed. Saving the default week above may have cleared one that
    //    sits on a weekday's next date, so every upcoming one is written again.
    await Promise.all(
      exceptions
        .filter((e) => e.date >= today)
        .map((e) =>
          api(`${BASE}/days/${e.date}/`, {
            method: 'PATCH',
            body: JSON.stringify({
              is_available: !e.unavailable,
              start_time: e.unavailable ? null : e.start,
              end_time: e.unavailable ? null : e.end,
              repeat_weekly: false,
            }),
          }),
        ),
    );

    loadedExceptionDates = new Set(exceptions.map((e) => e.date));
  },

  /** The dashboard switch. */
  updateLiveStatus(available) {
    return api(`${BASE}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: available }),
    });
  },
};
