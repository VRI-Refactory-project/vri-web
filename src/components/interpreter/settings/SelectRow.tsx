import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import './settings.css';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SelectRowProps<T extends string> {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
}

/** One setting chosen from a list: a label on the left, a dropdown on the right. */
export function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectRowProps<T>) {
  const id = useId();

  const handleChange = (chosen: string) => {
    // Only values from `options` can be chosen, so look the option up instead of trusting the string.
    const option = options.find((o) => o.value === chosen);
    if (option) onChange(option.value);
  };

  return (
    <div className="is-row">
      <label className="is-select-label" htmlFor={id}>
        {label}
      </label>
      <span className="is-select">
        <select id={id} value={value} onChange={(event) => handleChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} aria-hidden="true" />
      </span>
    </div>
  );
}
