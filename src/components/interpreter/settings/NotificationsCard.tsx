import { Bell } from 'lucide-react';
import type { NotificationSettings } from '../../../features/interpreter/settings';
import { SettingsCard } from './SettingsCard';
import { ToggleRow } from './ToggleRow';

interface NotificationsCardProps {
  value: NotificationSettings;
  onChange: (next: NotificationSettings) => void;
}

const ROWS: { key: keyof NotificationSettings; title: string; description: string }[] = [
  {
    key: 'sessionRequests',
    title: 'Session requests',
    description: 'Get notified when a new session request is sent to you.',
  },
  {
    key: 'sessionReminders',
    title: 'Session reminders',
    description: 'Receive reminders about upcoming sessions.',
  },
  {
    key: 'productUpdates',
    title: 'Product updates',
    description: 'Get notified about new features and updates.',
  },
];

export function NotificationsCard({ value, onChange }: NotificationsCardProps) {
  return (
    <SettingsCard
      icon={Bell}
      title="Notifications"
      description="Choose what notifications you want to receive."
    >
      {ROWS.map(({ key, title, description }) => (
        <ToggleRow
          key={key}
          title={title}
          description={description}
          on={value[key]}
          onToggle={() => onChange({ ...value, [key]: !value[key] })}
        />
      ))}
    </SettingsCard>
  );
}
