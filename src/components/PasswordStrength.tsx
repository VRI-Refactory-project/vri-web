import { Check } from 'lucide-react';
import { PASSWORD_RULES, getPasswordStrength } from '../lib/validation';
import './PasswordStrength.css';

interface Props {
  password: string;
}

/**
 * The strength bars and the requirement ticks that sit under a "new password" box.
 * Shows nothing until a password has been typed. The rules come from lib/validation, so what
 * turns green here is exactly what validatePassword checks on submit.
 */
export function PasswordStrength({ password }: Props) {
  if (!password) return null;
  const { score, label } = getPasswordStrength(password);

  return (
    <>
      <div className="pw-strength">
        <div className="pw-strength-head">
          <span>Password Strength</span>
          <span className={`pw-strength-label pw-s${score}`}>{label}</span>
        </div>
        <div className="pw-bars" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={i <= score ? `pw-bar pw-bar--on pw-s${score}` : 'pw-bar'} />
          ))}
        </div>
      </div>

      <div className="pw-rules">
        <p className="pw-rules-title">Password Requirements</p>
        {PASSWORD_RULES.map((rule) => (
          <div key={rule.id} className={rule.test(password) ? 'pw-rule pw-rule--ok' : 'pw-rule'}>
            <Check size={14} />
            {rule.label}
          </div>
        ))}
      </div>
    </>
  );
}
