import { useState } from 'react';
import { Lock } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SettingsCard } from './SettingsCard';

/**
 * Password only for now. Two-factor authentication and "last changed" come later, once the
 * backend supports them.
 */
export function SecurityCard() {
  const [changing, setChanging] = useState(false);
  const [notice, setNotice] = useState('');

  return (
    <SettingsCard icon={Lock} title="Security" description="Keep your account safe and secure.">
      <div className="is-row">
        <div className="is-row-text">
          <strong>Password</strong>
          <span>Change the password you sign in with.</span>
        </div>
        <button
          type="button"
          className="is-button"
          onClick={() => {
            setNotice('');
            setChanging(true);
          }}
        >
          <Lock size={16} aria-hidden="true" />
          Change password
        </button>
      </div>

      {notice && (
        <p className="is-notice" role="status">
          {notice}
        </p>
      )}

      {changing && (
        <ChangePasswordModal
          onClose={() => setChanging(false)}
          onChanged={() => {
            setChanging(false);
            setNotice('Password changed. Your other devices have been signed out.');
          }}
        />
      )}
    </SettingsCard>
  );
}
