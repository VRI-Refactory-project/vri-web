import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectRow } from './SelectRow';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

describe('SelectRow', () => {
  it('is a dropdown named by its label, showing the current choice', () => {
    render(<SelectRow label="Appearance" value="dark" options={OPTIONS} onChange={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Appearance' })).toHaveValue('dark');
  });

  it('reports the chosen option', async () => {
    const onChange = vi.fn();
    render(<SelectRow label="Appearance" value="light" options={OPTIONS} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Appearance' }), 'Dark');

    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
