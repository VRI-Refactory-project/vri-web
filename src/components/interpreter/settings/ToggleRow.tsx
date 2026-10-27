import { useId } from 'react';
import './settings.css';

interface ToggleRowProps {
  title: string;
  description: string;
  on: boolean;
  onToggle: () => void;
}

/** One setting with an on/off switch. Screen readers announce it as "<title>, switch, on/off". */
export function ToggleRow({ title, description, on, onToggle }: ToggleRowProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div className="is-row">
      <div className="is-row-text">
        <strong id={titleId}>{title}</strong>
        <span id={descriptionId}>{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="is-switch"
        onClick={onToggle}
      >
        <span className="is-switch-knob" aria-hidden="true" />
      </button>
    </div>
  );
}
