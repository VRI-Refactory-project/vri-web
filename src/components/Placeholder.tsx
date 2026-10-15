import './Placeholder.css';

interface Props {
  title: string;
  /** Kept so existing routes still compile; it is no longer shown. */
  story?: string;
  /** Replaces the default text, for pages like "not found". */
  message?: string;
}

export function Placeholder({ title, message = 'This page is not built yet.' }: Props) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p>{message}</p>
    </main>
  );
}
