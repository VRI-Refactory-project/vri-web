import { Paperclip } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import { FILE_ACCEPT } from './chatHelpers';

interface Props {
  onPick: (file: File) => void;
  disabled?: boolean;
}

/** A paperclip that chooses a document (PDF, Word, Excel, PowerPoint, TXT or CSV) to send. */
export function AttachFile({ onPick, disabled }: Props) {
  const input = useRef<HTMLInputElement>(null);

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
        aria-label="Attach a file"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        <Paperclip size={20} aria-hidden />
      </button>
      <input
        ref={input}
        type="file"
        accept={FILE_ACCEPT}
        hidden
        aria-label="Attach a file input"
        data-testid="file-input"
        onChange={picked}
      />
    </>
  );
}
