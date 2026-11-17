import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../../services/community';
import {
  MAX_PHOTO_BYTES,
  formatWhen,
  initials,
  mergeMessages,
  photoProblem,
  previewOf,
} from './chatHelpers';
import { STICKERS, stickerFor } from './stickers';

const msg = (id: number, read = false): ChatMessage => ({
  id,
  body: `m${id}`,
  sticker: '',
  imageUrl: null,
  createdAt: '',
  mine: true,
  read,
});

describe('formatWhen', () => {
  const now = new Date(2026, 10, 14, 15, 0);

  it('shows the clock for today, Yesterday, then the date', () => {
    expect(formatWhen(new Date(2026, 10, 14, 9, 5).toISOString(), now)).toBe('9:05 AM');
    expect(formatWhen(new Date(2026, 10, 13, 23, 0).toISOString(), now)).toBe('Yesterday');
    expect(formatWhen(new Date(2026, 9, 28, 10, 0).toISOString(), now)).toBe('Oct 28');
  });

  it('shows nothing for a date it cannot read', () => {
    expect(formatWhen('nonsense', now)).toBe('');
  });
});

describe('mergeMessages', () => {
  it('adds new messages, keeps order, and takes the newer copy of a repeat', () => {
    const merged = mergeMessages([msg(3), msg(4)], [msg(4, true), msg(5)]);

    expect(merged.map((m) => m.id)).toEqual([3, 4, 5]);
    expect(merged[1].read).toBe(true);
  });

  it('keeps older messages that a newer page no longer includes', () => {
    expect(mergeMessages([msg(1), msg(2)], [msg(3)]).map((m) => m.id)).toEqual([1, 2, 3]);
  });
});

describe('initials', () => {
  it('takes the first letters of up to two names', () => {
    expect(initials('sarah nsubuga kato')).toBe('SN');
    expect(initials('')).toBe('');
  });
});

describe('previewOf', () => {
  it('shows the text, or the word Sticker for a sticker', () => {
    expect(previewOf(msg(1))).toBe('m1');
    expect(previewOf({ ...msg(2), body: '', sticker: 'heart' })).toBe('Sticker');
  });

  it("shows a photo's caption, or the word Photo when it has none", () => {
    const photo = { ...msg(3), imageUrl: '/p/' };
    expect(previewOf({ ...photo, body: 'Sunset' })).toBe('Sunset');
    expect(previewOf({ ...photo, body: '' })).toBe('Photo');
  });
});

describe('photoProblem', () => {
  it('accepts pictures up to the size limit and says why it refuses anything else', () => {
    expect(photoProblem({ type: 'image/jpeg', size: MAX_PHOTO_BYTES })).toBe('');
    expect(photoProblem({ type: 'application/pdf', size: 10 })).toMatch(/Choose a picture/);
    expect(photoProblem({ type: 'image/png', size: MAX_PHOTO_BYTES + 1 })).toMatch(/under 8 MB/);
  });
});

describe('stickers', () => {
  it('has unique ids and finds a sticker by id', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    expect(stickerFor('thumbs_up')?.label).toBe('Thumbs up');
    expect(stickerFor('nope')).toBeNull();
  });
});
