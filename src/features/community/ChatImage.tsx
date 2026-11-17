import { useEffect, useState } from 'react';
import { getMessageImage } from '../../services/community';

interface Props {
  /** The photo's path from the API. */
  path: string;
  alt: string;
}

/** A photo from a chat. It opens full size in a new tab when clicked. Give it a `key` of its path. */
export function ChatImage({ path, alt }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMessageImage(path).then(
      (url) => !cancelled && setSrc(url),
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (failed) return <p className="cm-photo cm-photo--missing">This photo could not be loaded.</p>;
  if (!src)
    return <div className="cm-photo cm-photo--loading" role="status" aria-label="Loading photo" />;
  return (
    <a
      className="cm-photo"
      href={src}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open photo: ${alt}`}
    >
      <img src={src} alt={alt} />
    </a>
  );
}
