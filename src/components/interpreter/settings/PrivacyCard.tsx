import { CalendarDays, CalendarOff, Eye, EyeOff, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { PrivacySettings } from '../../../features/interpreter/settings';
import { SettingsCard } from './SettingsCard';
import { ToggleRow } from './ToggleRow';

interface PrivacyCardProps {
  value: PrivacySettings;
  onChange: (next: PrivacySettings) => void;
}

interface Pill {
  icon: LucideIcon;
  label: string;
}

const ROWS: {
  key: keyof PrivacySettings;
  title: string;
  description: string;
  /** What the pill beside the switch says, when the setting is on and when it is off. */
  pill: { on: Pill; off: Pill };
}[] = [
  {
    key: 'profileVisible',
    title: 'Profile visibility',
    description: 'Let clients find and view your profile.',
    pill: {
      on: { icon: Eye, label: 'Visible to clients' },
      off: { icon: EyeOff, label: 'Hidden from clients' },
    },
  },
  {
    key: 'availabilityVisible',
    title: 'Availability status',
    description: 'Show your availability to clients.',
    pill: {
      on: { icon: CalendarDays, label: "Show when I'm available" },
      off: { icon: CalendarOff, label: 'Availability hidden' },
    },
  },
];

/** The switch already tells screen readers on/off, so the pill is only shown, not read out again. */
function StatusPill({ icon: Icon, label }: Pill) {
  return (
    <span className="is-pill" aria-hidden="true">
      <Icon size={16} />
      {label}
    </span>
  );
}

export function PrivacyCard({ value, onChange }: PrivacyCardProps) {
  return (
    <SettingsCard
      icon={ShieldCheck}
      title="Privacy"
      description="Control who can see your information and when you're visible."
    >
      {ROWS.map(({ key, title, description, pill }) => (
        <ToggleRow
          key={key}
          title={title}
          description={description}
          on={value[key]}
          onToggle={() => onChange({ ...value, [key]: !value[key] })}
          badge={<StatusPill {...(value[key] ? pill.on : pill.off)} />}
        />
      ))}
    </SettingsCard>
  );
}
