import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationsCard } from '../../components/interpreter/settings/NotificationsCard';
import { PreferencesCard } from '../../components/interpreter/settings/PreferencesCard';
import { PrivacyCard } from '../../components/interpreter/settings/PrivacyCard';
import { SecurityCard } from '../../components/interpreter/settings/SecurityCard';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import {
  DEFAULT_SETTINGS,
  type InterpreterSettings,
  type SettingsGroup,
} from '../../features/interpreter/settings';
import './SettingsPage.css';

/** Settings for interpreters. The page owns the settings; each card shows its group and reports changes. */
export function InterpreterSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<InterpreterSettings>(DEFAULT_SETTINGS);

  function updateGroup<G extends SettingsGroup>(group: G, value: InterpreterSettings[G]) {
    setSettings((current) => ({ ...current, [group]: value }));
  }

  return (
    <div className="is-page">
      <header className="is-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account preferences and security.</p>
        </div>

        <button type="button" className="is-back" onClick={() => navigate(INTERPRETER_BASE)}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </header>

      <div className="is-grid">
        <NotificationsCard
          value={settings.notifications}
          onChange={(value) => updateGroup('notifications', value)}
        />
        <PrivacyCard value={settings.privacy} onChange={(value) => updateGroup('privacy', value)} />
        <SecurityCard />
        <PreferencesCard
          value={settings.preferences}
          onChange={(value) => updateGroup('preferences', value)}
        />
      </div>
    </div>
  );
}
