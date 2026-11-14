import { initials } from './chatHelpers';

interface Props {
  name: string;
  photoUrl: string | null;
  size?: number;
}

/** A person's picture, or their initials when they have none. */
export function Avatar({ name, photoUrl, size = 44 }: Props) {
  const style = { width: size, height: size };
  return photoUrl ? (
    <img className="cm-avatar" style={style} src={photoUrl} alt="" />
  ) : (
    <span className="cm-avatar cm-avatar--initials" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
