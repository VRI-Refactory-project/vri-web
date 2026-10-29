import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import './settings.css';

interface SettingsCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

/** The frame every card on the Settings page shares: icon, title, description, then its settings. */
export function SettingsCard({ icon: Icon, title, description, children }: SettingsCardProps) {
  const titleId = useId();

  return (
    <section className="is-card" aria-labelledby={titleId}>
      <div className="is-card-head">
        <span className="is-card-icon">
          <Icon size={26} aria-hidden="true" />
        </span>
        <div>
          <h2 id={titleId}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
