import { useRef, useState, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/no_background_logo.png';
import { StepProgress } from '../../components/StepProgress';
import {
  stageCertificates,
  stagedCertificates,
} from '../../features/registration/stagedCertificates';
import {
  CERTIFICATE_TYPES,
  validateEntry,
  validateFile,
  type CertificateEntry,
  type EntryErrors,
} from './certificateValidation';
import backgroundImage from '../../assets/background_image.png';
import './UploadCertificationsPage.css';
import './PhotoBackground.css';

let nextId = 1;
const newEntry = (): CertificateEntry => ({ id: nextId++, file: null, type: '', organisation: '' });

interface CertificateFormProps {
  entry: CertificateEntry;
  index: number;
  errors: EntryErrors;
  canRemove: boolean;
  onChange: (patch: Partial<CertificateEntry>) => void;
  onRemove: () => void;
}

function CertificateForm({
  entry,
  index,
  errors,
  canRemove,
  onChange,
  onRemove,
}: CertificateFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string>();
  const shownFileError = fileError ?? errors.file;
  const suffix = `${entry.id}`;

  const accept = (file: File | undefined) => {
    if (!file) return;
    const error = validateFile(file);
    setFileError(error);
    onChange({ file: error ? null : file });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  return (
    <fieldset className="cert-card">
      <legend className="visually-hidden">Certificate {index + 1}</legend>

      <div
        className={`dropzone${dragging ? ' dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span className="dropzone__icon" aria-hidden="true">
          ⬆
        </span>
        <p className="dropzone__title">Upload certificate</p>
        {entry.file ? (
          <p className="dropzone__file">{entry.file.name}</p>
        ) : (
          <>
            <p className="dropzone__hint">Drag and drop your file here</p>
            <p className="dropzone__hint">or</p>
          </>
        )}
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => inputRef.current?.click()}
        >
          {entry.file ? 'Replace file' : 'Browse files'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="visually-hidden"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          aria-label={`Certificate file ${index + 1}`}
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <p className="dropzone__limits">PDF, JPG or PNG, 10 MB max</p>
        {shownFileError && (
          <p className="field-error" role="alert">
            {shownFileError}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`type-${suffix}`}>Certificate type *</label>
        <select
          id={`type-${suffix}`}
          value={entry.type}
          aria-invalid={Boolean(errors.type)}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="">Select certificate type...</option>
          {CERTIFICATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="field-error" role="alert">
            {errors.type}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`org-${suffix}`}>Issuing organisation *</label>
        <input
          id={`org-${suffix}`}
          type="text"
          placeholder="Enter organisation name..."
          value={entry.organisation}
          aria-invalid={Boolean(errors.organisation)}
          onChange={(e) => onChange({ organisation: e.target.value })}
        />
        {errors.organisation && (
          <p className="field-error" role="alert">
            {errors.organisation}
          </p>
        )}
      </div>

      {canRemove && (
        <button type="button" className="link-btn" onClick={onRemove}>
          Remove this certificate
        </button>
      )}
    </fieldset>
  );
}

// V2-003: interpreter registration, step 2 of 3. Collects the certificates; they are uploaded
// after the account is created on the next step.
export function UploadCertificationsPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<CertificateEntry[]>(() => {
    const kept = stagedCertificates();
    return kept.length > 0 ? kept : [newEntry()];
  });
  const [errors, setErrors] = useState<Record<number, EntryErrors>>({});
  const update = (id: number, patch: Partial<CertificateEntry>) => {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setErrors((prev) => ({ ...prev, [id]: {} }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const found: Record<number, EntryErrors> = {};
    entries.forEach((entry) => {
      const entryErrors = validateEntry(entry);
      if (Object.keys(entryErrors).length > 0) found[entry.id] = entryErrors;
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Nothing is uploaded yet: the account does not exist. The next page creates it and then
    // uploads these files (see CreateAccountPage).
    stageCertificates(entries);
    navigate('/register/interpreter/account');
  };

  return (
    <main className="cert-page photo-bg" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <header className="cert-page__brand">
        <Link to="/">
          <img src={logo} alt="SignConnect" />
        </Link>
      </header>
      <form className="cert-page__content" onSubmit={onSubmit} noValidate>
        <h1>Verify your certifications</h1>
        <p className="cert-page__subtitle">
          Upload your interpreting certifications so we can verify your eligibility to provide
          services on VRI.
        </p>

        {entries.map((entry, index) => (
          <CertificateForm
            key={entry.id}
            entry={entry}
            index={index}
            errors={errors[entry.id] ?? {}}
            canRemove={entries.length > 1}
            onChange={(patch) => update(entry.id, patch)}
            onRemove={() => setEntries((list) => list.filter((x) => x.id !== entry.id))}
          />
        ))}

        <button
          type="button"
          className="link-btn link-btn--add"
          onClick={() => setEntries((list) => [...list, newEntry()])}
        >
          + Add another certificate
        </button>

        <button type="submit" className="btn btn--primary">
          Continue
        </button>

        <StepProgress current={2} total={3} />
      </form>
    </main>
  );
}
