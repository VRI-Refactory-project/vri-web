import { Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { STICKERS } from './stickers';

interface Props {
  onPick: (stickerId: string) => void;
  disabled?: boolean;
}

/** A button that opens a small panel of stickers; picking one sends it. */
export function StickerPicker({ onPick, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div className="cm-stickers" ref={box}>
      <button
        type="button"
        className="cm-sticker-toggle"
        aria-label="Stickers"
        aria-expanded={open}
        aria-haspopup="true"
        disabled={disabled}
        onClick={() => setOpen((now) => !now)}
      >
        <Smile size={20} aria-hidden />
      </button>
      {open && (
        <div className="cm-sticker-panel" role="group" aria-label="Choose a sticker">
          {STICKERS.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              aria-label={sticker.label}
              onClick={() => {
                setOpen(false);
                onPick(sticker.id);
              }}
            >
              <span aria-hidden>{sticker.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
