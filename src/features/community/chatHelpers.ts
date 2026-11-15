import type { ChatMessage } from '../../services/community';

/** A time for a message or conversation: the clock today, "Yesterday", or the date. */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Joins a fresh page of messages onto the ones already shown: no repeats, oldest first. */
export function mergeMessages(shown: ChatMessage[], fresh: ChatMessage[]): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  for (const message of [...shown, ...fresh]) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
