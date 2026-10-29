import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import PhoneInput from 'react-phone-number-input';
import { getCountryCallingCode } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import './PhoneField.css';

interface CountryOption {
  value?: string;
  label: string;
}

interface CountrySelectProps {
  name?: string;
  value?: string;
  onChange: (value?: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  options: CountryOption[];
  iconComponent: ComponentType<{ country?: string }>;
  disabled?: boolean;
  readOnly?: boolean;
  tabIndex?: number | string;
  className?: string;
}

function getCallingCode(country?: string): string {
  if (!country || country === 'ZZ') return '';

  try {
    return `+${getCountryCallingCode(country as CountryCode)}`;
  } catch {
    return '';
  }
}

function SearchableCountrySelect({
  value,
  onChange,
  onFocus,
  onBlur,
  options,
  iconComponent: CountryIcon,
  disabled,
  readOnly,
  tabIndex,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);

  const filteredOptions = options.filter((option) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    const label = option.label.toLowerCase();
    const code = getCallingCode(option.value);

    return label.includes(query) || code.includes(query);
  });

  useEffect(() => {
    if (!open) return;

    searchRef.current?.focus();

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    setSearch('');
  };

  const chooseCountry = (country?: string) => {
    onChange(country);
    closeMenu();
  };

  return (
    <div
      ref={containerRef}
      className={`country-picker ${className ?? ''}`}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          onBlur?.();
        }
      }}
    >
      <select
        aria-label="Country"
        className="country-picker__native"
        value={value ?? ''}
        disabled={disabled}
        tabIndex={-1}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        {options.map((option, index) => (
          <option key={`${option.value ?? 'international'}-${index}`} value={option.value ?? ''}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="country-picker__trigger"
        aria-label={`Country: ${selected?.label ?? 'International'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled || readOnly}
        tabIndex={typeof tabIndex === 'number' ? tabIndex : undefined}
        onFocus={onFocus}
        onClick={() => {
          if (disabled || readOnly) return;
          setOpen((previous) => !previous);
          setSearch('');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') closeMenu();
        }}
      >
        <CountryIcon country={value} />
        <span className="country-picker__calling-code">{getCallingCode(value) || 'Intl.'}</span>
        <span className="country-picker__arrow" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="country-picker__menu">
          <input
            ref={searchRef}
            type="search"
            className="country-picker__search"
            aria-label="Search countries or calling codes"
            placeholder="Search country or +256"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeMenu();
            }}
          />

          <div className="country-picker__options" role="listbox" aria-label="Countries">
            {filteredOptions.map((option, index) => (
              <button
                key={`${option.value ?? 'international'}-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className="country-picker__option"
                onClick={() => chooseCountry(option.value)}
              >
                <CountryIcon country={option.value} />
                <span className="country-picker__option-name">{option.label}</span>
                <span className="country-picker__option-code">{getCallingCode(option.value)}</span>
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <p className="country-picker__empty">No countries found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PhoneFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
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
      withCountryCallingCode={false}
      countryCallingCodeEditable={false}
      limitMaxLength
      defaultCountry={defaultCountry as CountryCode}
      value={value || undefined}
      onChange={(v) => onChange(v ?? '')}
      onBlur={onBlur}
      disabled={disabled}
      className={invalid ? 'phone-field phone-field--error' : 'phone-field'}
      countrySelectComponent={SearchableCountrySelect}
      countrySelectProps={{ 'aria-label': 'Country' }}
      numberInputProps={{
        id,
        autoComplete: 'tel-national',
        'aria-invalid': invalid ? true : undefined,
        'aria-describedby': errorId,
      }}
    />
  );
}
