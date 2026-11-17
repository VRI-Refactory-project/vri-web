/**
 * The stickers people can send in a chat. The API only knows the ids (see apps/community/stickers.py
 * in vri-api), so every id here must also be listed there. A sticker is drawn as a large emoji.
 */
export interface Sticker {
  id: string;
  emoji: string;
  label: string;
}

export const STICKERS: Sticker[] = [
  { id: 'hello', emoji: '👋', label: 'Hello' },
  { id: 'love_you', emoji: '🤟', label: 'I love you' },
  { id: 'thumbs_up', emoji: '👍', label: 'Thumbs up' },
  { id: 'ok', emoji: '👌', label: 'OK' },
  { id: 'clap', emoji: '👏', label: 'Well done' },
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'smile', emoji: '😊', label: 'Smile' },
  { id: 'laugh', emoji: '😂', label: 'Laughing' },
  { id: 'wow', emoji: '😮', label: 'Wow' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { id: 'thanks', emoji: '🙏', label: 'Thank you' },
  { id: 'strong', emoji: '💪', label: 'Strong' },
  { id: 'party', emoji: '🎉', label: 'Celebrate' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
];

/** The sticker with this id, or null for an id this version of the app does not know. */
export const stickerFor = (id: string): Sticker | null =>
  STICKERS.find((sticker) => sticker.id === id) ?? null;
