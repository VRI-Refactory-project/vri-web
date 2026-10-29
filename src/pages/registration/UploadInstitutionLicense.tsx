import { useRef, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { AuthShell } from '../../components/AuthShell';
import { FLOWS } from '../../features/registration/flows';
import { describeError } from '../../services/api';
import { uploadInstitutionLicense } from '../../services/registration';
import './UploadCertificationsPage.css'; // Reusing the exact same CSS as the interpreter page

export const UploadInstitutionLicense = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [licenseType, setLicenseType] = useState('BUSINESS_LICENSE');
  const [issuingAuthority, setIssuingAuthority] = useState('');

  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // Replicating the interpreter's file validation exactly
  const accept = (selected: File | undefined) => {
    if (!selected) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selected.type)) {
      setFileError('Invalid format. Please upload PDF, JPG, or PNG.');
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFileError('File is too large. Maximum size is 10MB.');
      setFile(null);
      return;
    }

    setFileError(undefined);
    setFile(selected);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Upload your license document.');
    if (!issuingAuthority.trim()) return setError('Enter the issuing authority.');

    setSubmitting(true);
    setError(undefined);
    try {
      const formData = new FormData();
      formData.append('license', file);
      formData.append('licenseType', licenseType);
      formData.append('issuingAuthority', issuingAuthority);

      await uploadInstitutionLicense(formData);
      navigate('/register/pending', { replace: true });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell steps={FLOWS.institution} current={3}>
      <form className="cert-page__content" onSubmit={handleSubmit} noValidate>
        <h1>Upload your license</h1>
        <p className="cert-page__subtitle">
          Upload your institution's operating license or accreditation for verification.
        </p>

        <fieldset className="cert-card">
          <legend className="visually-hidden">Institution License</legend>

          {/* Exact same dropzone structure as the interpreter page */}
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
              <Upload size={20} />
            </span>
            <p className="dropzone__title">Upload license document</p>

            {file ? (
              <p className="dropzone__file">{file.name}</p>
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
              {file ? 'Replace file' : 'Browse files'}
            </button>

            <input
              ref={inputRef}
              type="file"
              className="visually-hidden"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => accept(e.target.files?.[0])}
            />

            <p className="dropzone__limits">PDF, JPG or PNG, 10 MB max</p>

            {fileError && (
              <p className="field-error" role="alert">
                {fileError}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="license-type">Document type *</label>
            <select
              id="license-type"
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
            >
              <option value="BUSINESS_LICENSE">Business Operating License</option>
              <option value="HOSPITAL_ACCREDITATION">Hospital Accreditation</option>
              <option value="GOV_APPROVAL">Government Approval</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="issuing-authority">Issuing authority *</label>
            <input
              id="issuing-authority"
              type="text"
              placeholder="e.g., Ministry of Health, URSB"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
            />
          </div>
        </fieldset>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Uploading...' : 'Submit for Review'}
        </button>
      </form>
    </AuthShell>
  );
};
