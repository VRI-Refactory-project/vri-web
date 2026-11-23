import { useId, useState, type FormEvent } from 'react';
import { NETWORKS, type MoneyRequest, type Network } from '../../services/wallet';
import './MoneyForm.css';

interface Props {
  /** What the button says, e.g. "Add money". */
  submitLabel: string;
  /** Why this is safe, or what happens next, shown under the fields. */
  hint?: string;
  /** Stops a second press while the first is still being sent. */
  busy: boolean;
  /** The server's reason for refusing, shown above the button. */
  error?: string;
  onSubmit(request: MoneyRequest): void;
}

/** An amount, a mobile money network and, if it is not the person's own, a phone number. */
export function MoneyForm({ submitLabel, hint, busy, error, onSubmit }: Props) {
  const id = useId();
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState<Network>('MTN');
  const [phone, setPhone] = useState('');
  const [problem, setProblem] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setProblem('Enter a whole number of shillings, for example 20000.');
      return;
    }
    setProblem('');
    onSubmit({ amount: value, network, phone });
  };

  const shown = problem || error;

  return (
    <form className="mf" onSubmit={submit} noValidate>
      <label htmlFor={`${id}-amount`}>Amount (UGX)</label>
      <input
        id={`${id}-amount`}
        inputMode="numeric"
        placeholder="20000"
        value={amount}
        disabled={busy}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
      />

      <label htmlFor={`${id}-network`}>Mobile money network</label>
      <select
        id={`${id}-network`}
        value={network}
        disabled={busy}
        onChange={(e) => setNetwork(e.target.value as Network)}
      >
        {NETWORKS.map((n) => (
          <option key={n.id} value={n.id}>
            {n.label}
          </option>
        ))}
      </select>

      <label htmlFor={`${id}-phone`}>Phone number (optional)</label>
      <input
        id={`${id}-phone`}
        type="tel"
        autoComplete="tel"
        placeholder="Leave empty to use the number on your account"
        value={phone}
        disabled={busy}
        onChange={(e) => setPhone(e.target.value)}
      />

      {hint && <p className="mf-hint">{hint}</p>}
      {shown && (
        <p className="mf-error" role="alert">
          {shown}
        </p>
      )}
      <button type="submit" className="mf-submit" disabled={busy}>
        {busy ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}
