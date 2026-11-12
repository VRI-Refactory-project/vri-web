import type { HistoryItem } from '../../services/mySessions';

const SPECIALISATION: Record<string, string> = {
  GENERAL: 'General',
  MEDICAL: 'Medical',
  LEGAL: 'Legal',
};

export const specialisationLabel = (code: string) => SPECIALISATION[code] ?? 'General';

export const sessionType = (emergency: boolean) => (emergency ? 'Emergency VRI' : 'Immediate VRI');

/** What a person still has to act on: the newest request that is waiting or matched. */
export function latestConfirmable(items: HistoryItem[]): HistoryItem | null {
  const open = items.filter((i) => i.status === 'matched' || i.status === 'waiting');
  if (open.length === 0) return null;
  return [...open].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

/** "Thursday, September 24, at 10:30 AM" for the scheduled-session confirmation. */
export function longWhen(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const at = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day}, at ${at}`;
}
