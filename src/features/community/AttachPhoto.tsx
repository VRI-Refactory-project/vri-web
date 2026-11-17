import { Camera, Image as ImageIcon } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';

interface Props {
  onPick: (file: File) => void;
  disabled?: boolean;
}

/**
 * Two ways to add a photo: take one (opens the camera on a phone; on a computer it is the same as
 * choosing a file) or choose one from the device.
 */
export function AttachPhoto({ onPick, disabled }: Props) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  const picked = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear it so choosing the same file again still counts as a change.
    e.target.value = '';
    if (file) onPick(file);
  };

  return (
    <>
      <button
        type="button"
        className="cm-attach"
        aria-label="Take a photo"
        disabled={disabled}
        onClick={() => camera.current?.click()}
      >
        <Camera size={20} aria-hidden />
      </button>
      <button
        type="button"
        className="cm-attach"
        aria-label="Choose a photo"
        disabled={disabled}
        onClick={() => gallery.current?.click()}
      >
        <ImageIcon size={20} aria-hidden />
      </button>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        aria-label="Take a photo input"
        data-testid="camera-input"
        onChange={picked}
      />
      <input
        ref={gallery}
        type="file"
        accept="image/*"
        hidden
        aria-label="Choose a photo input"
        data-testid="gallery-input"
        onChange={picked}
      />
    </>
  );
}
