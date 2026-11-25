import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FieldError } from '../../FieldError';
import { Modal } from '../../Modal';
import { useAuth } from '../../../hooks/useAuth';
import { collectErrors, validatePassword, validatePasswordPresent } from '../../../lib/validation';
import { useFieldErrors } from '../../../lib/useFieldErrors';
import { describeError } from '../../../services/api';
import { changePassword } from '../../../services/auth';
import './settings.css';

type Field = 'current' | 'next' | 'confirm';

const FIELD_ORDER: readonly Field[] = ['current', 'next', 'confirm'];

const LABELS: Record<Field, string> = {
  current: 'Current password',
  next: 'New password',
  confirm: 'Confirm new password',
};

const AUTOCOMPLETE: Record<Field, string> = {
  current: 'current-password',
  next: 'new-password',
  confirm: 'new-password',
};

interface ChangePasswordModalProps {
  onClose: () => void;
  /** Called after the password has been changed and the new session stored. */
  onChanged: () => void;
}

export function ChangePasswordModal({ onClose, onChanged }: ChangePasswordModalProps) {
  const { login } = useAuth();

  const [values, setValues] = useState<Record<Field, string>>({
    current: '',
    next: '',
    confirm: '',
  });

  const [visible, setVisible] = useState<Record<Field, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const errors = collectErrors<Field>({
    current: validatePasswordPresent(values.current),
    next: validatePassword(values.next),
    confirm: values.confirm === values.next ? undefined : 'The passwords do not match.',
  });

  const { shown, check, fieldProps } = useFieldErrors(
    errors,
    FIELD_ORDER,
    (name) => `is-pw-${name}`,
  );

  const toggleVisibility = (name: Field) => {
    setVisible((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!check()) return;

    setSubmitting(true);

    try {
      login(await changePassword(values.current, values.next));
      onChanged();
    } catch (err) {
      setFormError(describeError(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Change password" onClose={submitting ? undefined : onClose}>
      <form className="is-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <h2 className="is-form-title">Change password</h2>

        <p className="is-form-hint">
          You'll stay signed in here. Your other devices will be signed out.
        </p>

        {formError && (
          <p className="is-form-error" role="alert">
            {formError}
          </p>
        )}

        {FIELD_ORDER.map((name) => {
          const { className: fieldClassName, ...otherFieldProps } = fieldProps(name);

          return (
            <div className="is-form-field" key={name}>
              <label htmlFor={`is-pw-${name}`}>{LABELS[name]}</label>

              <div className="is-password-input-wrap">
                <input
                  className={`is-password-input ${fieldClassName ?? ''}`}
                  type={visible[name] ? 'text' : 'password'}
                  autoComplete={AUTOCOMPLETE[name]}
                  value={values[name]}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      [name]: event.target.value,
                    }))
                  }
                  {...otherFieldProps}
                />

                <button
                  type="button"
                  className="is-password-toggle"
                  onClick={() => toggleVisibility(name)}
                  disabled={submitting}
                  aria-label={visible[name] ? `Hide ${LABELS[name]}` : `Show ${LABELS[name]}`}
                  aria-pressed={visible[name]}
                >
                  {visible[name] ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>

              <FieldError id={`is-pw-${name}`} message={shown(name)} />
            </div>
          );
        })}

        <div className="is-form-actions">
          <button type="button" className="is-button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>

          <button type="submit" className="is-button is-button--primary" disabled={submitting}>
            {submitting ? 'Changing…' : 'Change password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
