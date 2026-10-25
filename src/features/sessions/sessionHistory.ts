import type { HistoryItem, HistoryStatus } from '../../services/mySessions';

export const STATUS_LABEL: Record<HistoryStatus, string> = {
  waiting: 'Waiting',
  matched: 'Matched',
  cancelled: 'Cancelled',
  missed: 'Missed',
};

export type StatusFilter = 'all' | HistoryStatus;

/** The row title: who the interpreter was, or what happened if nobody took it. */
export function titleFor(item: HistoryItem): string {
  if (item.interpreterName) return item.interpreterName;
  if (item.status === 'waiting') return 'Looking for an interpreter';
  return 'No interpreter';
}

/** Search by interpreter name or status word, and filter by status. */
export function filterSessions(items: HistoryItem[], search: string, status: StatusFilter) {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    if (status !== 'all' && item.status !== status) return false;
    if (!q) return true;
    return (
      titleFor(item).toLowerCase().includes(q) ||
      STATUS_LABEL[item.status].toLowerCase().includes(q)
    );
  });
}

const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** "Today, 2:10 PM", "Yesterday, 9:40 AM" or "Sep 18, 11:05 AM". */
export function formatWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (days === 0) return `Today, ${time(d)}`;
  if (days === 1) return `Yesterday, ${time(d)}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time(d)}`;
}
