import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { downloadMessageFile, type ChatFile as ChatFileData } from '../../services/community';
import { formatSize } from './chatHelpers';

/** A document from a chat: its name and size, and a button that saves it to the device. */
export function ChatFile({ file }: { file: ChatFileData }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await downloadMessageFile(file);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cm-file">
      <FileText size={28} aria-hidden />
      <span className="cm-file-text">
        <strong>{file.name}</strong>
        <small>{failed ? 'Could not download. Try again.' : formatSize(file.size)}</small>
      </span>
      <button
        type="button"
        className="cm-file-save"
        aria-label={`Download ${file.name}`}
        disabled={busy}
        onClick={() => void save()}
      >
        <Download size={18} aria-hidden />
      </button>
    </div>
  );
}
