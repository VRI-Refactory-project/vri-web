import { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationsCard } from '../../components/interpreter/settings/NotificationsCard';
import { PreferencesCard } from '../../components/interpreter/settings/PreferencesCard';
import { PrivacyCard } from '../../components/interpreter/settings/PrivacyCard';
import { SecurityCard } from '../../components/interpreter/settings/SecurityCard';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import {
  loadNotificationSettings,
  saveNotificationSettings,
} from '../../features/interpreter/notificationSettings';
import { describeError } from '../../services/api';
import {
  DEFAULT_SETTINGS,
  sameSettings,
  type InterpreterSettings,
  type SettingsGroup,
} from '../../features/interpreter/settings';
import './SettingsPage.css';

/** Settings for interpreters. The page owns the settings; each card shows its group and reports changes. */
export function InterpreterSettingsPage() {
  const navigate = useNavigate();
  // `saved` is the last saved state, `settings` what is on screen. They differ while there are changes.
  const [saved, setSaved] = useState<InterpreterSettings>(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState<InterpreterSettings>(DEFAULT_SETTINGS);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Show the notification choices the person saved before. If they cannot be loaded, the page
  // simply starts from the defaults.
  useEffect(() => {
    let cancelled = false;
    loadNotificationSettings().then(
      (notifications) => {
        if (cancelled) return;
        setSaved((current) => ({ ...current, notifications }));
        setSettings((current) => ({ ...current, notifications }));
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const hasChanges = !sameSettings(settings, saved);

  function updateGroup<G extends SettingsGroup>(group: G, value: InterpreterSettings[G]) {
    setSettings((current) => ({ ...current, [group]: value }));
    setJustSaved(false);
    setSaveError(null);
  }

  const discardChanges = () => setSettings(saved);

  // Only the notification choices are saved on the server so far. Privacy and account preferences
  // are kept until the page is reloaded; when their endpoints exist, save them here too.
  async function savePreferences() {
    setSaving(true);
    setSaveError(null);
    try {
      const notifications = await saveNotificationSettings(settings.notifications);
      const next = { ...settings, notifications };
      setSaved(next);
      setSettings(next);
      setJustSaved(true);
    } catch (err) {
      setSaveError(describeError(err));
    } finally {
      setSaving(false);
    }
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

      <footer className="is-actions">
        {saveError && (
          <p className="is-notice is-notice--error" role="alert">
            {saveError}
          </p>
        )}
        {justSaved && (
          <p className="is-notice" role="status">
            Preferences saved.
          </p>
        )}
        <button type="button" className="is-button" onClick={discardChanges} disabled={!hasChanges}>
          Discard changes
        </button>
        <button
          type="button"
          className="is-button is-button--primary"
          onClick={() => void savePreferences()}
          disabled={!hasChanges || saving}
        >
          <Check size={18} aria-hidden="true" />
          Save preferences
        </button>
      </footer>
    </div>
  );
}
