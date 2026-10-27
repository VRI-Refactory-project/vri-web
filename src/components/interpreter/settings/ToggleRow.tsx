import { useId, type ReactNode } from 'react';
import './settings.css';

interface ToggleRowProps {
  title: string;
  description: string;
  on: boolean;
  onToggle: () => void;
  /** Optional label shown beside the switch, e.g. a pill saying what the current choice means. */
  badge?: ReactNode;
}

/** One setting with an on/off switch. Screen readers announce it as "<title>, switch, on/off". */
export function ToggleRow({ title, description, on, onToggle, badge }: ToggleRowProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div className="is-row">
      <div className="is-row-text">
        <strong id={titleId}>{title}</strong>
        <span id={descriptionId}>{description}</span>
      </div>
      <div className="is-row-controls">
        {badge}
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
    </div>
  );
}
