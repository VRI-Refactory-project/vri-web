import { SlidersHorizontal } from 'lucide-react';
import type { Appearance, PreferenceSettings } from '../../../features/interpreter/settings';
import { SelectRow, type SelectOption } from './SelectRow';
import { SettingsCard } from './SettingsCard';

interface PreferencesCardProps {
  value: PreferenceSettings;
  onChange: (next: PreferenceSettings) => void;
}

// English is the only language the app has; more get added here as translations arrive.
const LANGUAGES: SelectOption[] = [{ value: 'en', label: 'English' }];

// East Africa first, since that is where interpreters work, then a few common others.
const TIME_ZONES: SelectOption[] = [
  { value: 'Africa/Kampala', label: '(UTC+03:00) Kampala' },
  { value: 'Africa/Nairobi', label: '(UTC+03:00) Nairobi' },
  { value: 'Africa/Dar_es_Salaam', label: '(UTC+03:00) Dar es Salaam' },
  { value: 'Africa/Kigali', label: '(UTC+02:00) Kigali' },
  { value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' },
  { value: 'Europe/London', label: '(UTC+00:00) London' },
];

const APPEARANCES: SelectOption<Appearance>[] = [
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function PreferencesCard({ value, onChange }: PreferencesCardProps) {
  return (
    <SettingsCard
      icon={SlidersHorizontal}
      title="Account preferences"
      description="Set your preferred settings."
    >
      <SelectRow
        label="Language"
        value={value.language}
        options={LANGUAGES}
        onChange={(language) => onChange({ ...value, language })}
      />
      <SelectRow
        label="Time zone"
        value={value.timeZone}
        options={TIME_ZONES}
        onChange={(timeZone) => onChange({ ...value, timeZone })}
      />
      <SelectRow
        label="Appearance"
        value={value.appearance}
        options={APPEARANCES}
        onChange={(appearance) => onChange({ ...value, appearance })}
      />
    </SettingsCard>
  );
}
