import { useState } from 'react';
import {
  applyPreferences,
  loadPreferences,
  savePreferences,
  SIGN_LANGUAGES,
  TEXT_SIZES,
  type Preferences,
  type TextSize,
} from '../../features/accessibility/preferences';
import './AccessibilityPage.css';

const SIZE_LABEL: Record<TextSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };

function Row({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ac-row">
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      {children}
    </div>
  );
}

function Switch({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`ac-switch${checked ? ' ac-switch--on' : ''}`}
      onClick={onToggle}
    >
      <span />
    </button>
  );
}

/** Accessibility and preferences for the Deaf user. Saved on this device and applied at once. */
export function AccessibilityPage() {
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);

  const change = (patch: Partial<Preferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePreferences(next);
    applyPreferences(next);
  };

  return (
    <div className="ac-page">
      <header>
        <h1>Accessibility &amp; Preferences</h1>
        <p>Personalize how SignConnect communicates with you during VRI sessions.</p>
      </header>

      <h2>Communication</h2>
      <section className="ac-card">
        <Row
          title="Preferred sign language"
          text="Primary sign language used for interpreter matching"
        >
          <select
            className="ac-select"
            aria-label="Preferred sign language"
            value={prefs.signLanguage}
            onChange={(e) => change({ signLanguage: e.target.value })}
          >
            {SIGN_LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Row>
      </section>

      <h2>During VRI sessions</h2>
      <section className="ac-card">
        <Row
          title="Captions"
          text="Show real-time automated text captions during live VRI sessions"
        >
          <Switch
            checked={prefs.captions}
            label="Captions"
            onToggle={() => change({ captions: !prefs.captions })}
          />
        </Row>
        <Row
          title="Visual alerts"
          text="Display prominent visual cues for incoming calls, system status, and interpreter connection"
        >
          <Switch
            checked={prefs.visualAlerts}
            label="Visual alerts"
            onToggle={() => change({ visualAlerts: !prefs.visualAlerts })}
          />
        </Row>
        <Row
          title="Vibration alerts"
          text="Trigger haptic feedback on supported devices for session notifications"
        >
          <Switch
            checked={prefs.vibrationAlerts}
            label="Vibration alerts"
            onToggle={() => change({ vibrationAlerts: !prefs.vibrationAlerts })}
          />
        </Row>
      </section>

      <h2>Visual accessibility</h2>
      <section className="ac-card">
        <Row
          title="High contrast"
          text="Increase contrast between text, borders, and video background controls"
        >
          <Switch
            checked={prefs.highContrast}
            label="High contrast"
            onToggle={() => change({ highContrast: !prefs.highContrast })}
          />
        </Row>
        <Row
          title="Text size"
          text="Adjust font sizing across captions and call control interfaces"
        >
          <select
            className="ac-select"
            aria-label="Text size"
            value={prefs.textSize}
            onChange={(e) => change({ textSize: e.target.value as TextSize })}
          >
            {TEXT_SIZES.map((s) => (
              <option key={s} value={s}>
                {SIZE_LABEL[s]}
              </option>
            ))}
          </select>
        </Row>
      </section>
    </div>
  );
}
