import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './PhoneField.css';

// One phone box for every sign-up form: a country picker with flags and the calling code, then
// the number. The value handed back is E.164 (+256772123456), which is what the API stores, or ''
// while nothing has been typed. Pages keep using validatePhoneNumber from lib/validation.

interface PhoneFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  /** Id of the error message, so screen readers announce it with the field. */
  errorId?: string;
  invalid?: boolean;
  defaultCountry?: string;
}

export function PhoneField({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  errorId,
  invalid,
  defaultCountry = 'UG',
}: PhoneFieldProps) {
  return (
    <PhoneInput
      international
      withCountryCallingCode
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry as never}
      value={value || undefined}
      onChange={(v) => onChange(v ?? '')}
      onBlur={onBlur}
      disabled={disabled}
      className={invalid ? 'phone-field phone-field--error' : 'phone-field'}
      countrySelectProps={{ 'aria-label': 'Country' }}
      numberInputProps={{
        id,
        autoComplete: 'tel',
        'aria-invalid': invalid ? true : undefined,
        'aria-describedby': errorId,
      }}
    />
  );
}
