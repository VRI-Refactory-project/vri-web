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

/** What a conversation list shows for a message: its text, or a word for a sticker or photo. */
export const previewOf = (message: ChatMessage): string =>
  message.sticker
    ? 'Sticker'
    : message.body || (message.imageUrl ? 'Photo' : message.file ? message.file.name : '');

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/** Why this file cannot be sent as a photo, or '' when it can. */
export function photoProblem(file: { type: string; size: number }): string {
  if (!file.type.startsWith('image/')) return 'Choose a picture (JPG, PNG, WebP or GIF).';
  if (file.size > MAX_PHOTO_BYTES) return 'That photo is too large. Choose one under 8 MB.';
  return '';
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** What the file picker offers; the server checks the real contents again. */
export const FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
export const FILE_ACCEPT = FILE_EXTENSIONS.map((e) => `.${e}`).join(',');

/** Why this file cannot be sent as a document, or '' when it can. */
export function fileProblem(file: { name: string; size: number }): string {
  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (!FILE_EXTENSIONS.includes(extension))
    return 'That kind of file is not allowed. Use PDF, Word, Excel, PowerPoint, TXT or CSV.';
  if (file.size === 0) return 'That file is empty.';
  if (file.size > MAX_FILE_BYTES) return 'That file is too large. Choose one under 10 MB.';
  return '';
}

/** A size people can read: "850 B", "12 KB", "3.4 MB". */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
