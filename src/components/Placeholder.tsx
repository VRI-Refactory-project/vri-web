import './Placeholder.css';

export function Placeholder({ title, story }: { title: string; story: string }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p>
        Not built yet. Story <strong>{story}</strong>.
      </p>
    </main>
  );
}
