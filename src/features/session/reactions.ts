/**
 * The reactions people can send in a call. Add a line here and it shows up in the More menu.
 * Every one has a word, which is shown beside the emoji and read by screen readers. The last two
 * are for asking the interpreter or a speaker to adjust, without interrupting them.
 */
export const REACTIONS = [
  { emoji: '👍', label: 'thumbs up' },
  { emoji: '👏', label: 'clapping' },
  { emoji: '❤️', label: 'heart' },
  { emoji: '😂', label: 'laughing' },
  { emoji: '😮', label: 'surprised' },
  { emoji: '🙏', label: 'thank you' },
  { emoji: '🤟', label: 'love you' },
  { emoji: '🙌', label: 'celebrating' },
  { emoji: '👋', label: 'waving' },
  { emoji: '✅', label: 'yes' },
  { emoji: '❌', label: 'no' },
  { emoji: '❓', label: 'I have a question' },
  { emoji: '🐢', label: 'please slow down' },
  { emoji: '🔁', label: 'please repeat' },
] as const;

/** One reaction shown on the screen for a few seconds. */
export interface Reaction {
  id: string;
  from: string;
  emoji: string;
  /** The words beside the emoji: "clapping", or "raised their hand". */
  label: string;
}

/** How long a reaction stays on the screen. */
export const REACTION_MS = 4000;

export function findReaction(emoji: unknown) {
  return REACTIONS.find((r) => r.emoji === emoji);
}
