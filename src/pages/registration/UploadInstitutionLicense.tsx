import { useRef, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChevronRight } from 'lucide-react';
import { AuthShell } from '../../components/AuthShell';
import { FLOWS } from '../../features/registration/flows';
import { describeError } from '../../services/api';
import { uploadInstitutionLicense } from '../../services/registration';
import './AuthPages.css';

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
      // CHANGED: Backend expects 'document' and 'document_type'
      formData.append('document', file);
      formData.append('document_type', licenseType);
      formData.append('issuing_authority', issuingAuthority);

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
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#382c77',
            margin: '0 0 8px',
            textAlign: 'center',
          }}
        >
          Upload your license
        </h1>
        <p
          style={{ color: '#6b6785', fontSize: '0.9rem', margin: '0 0 24px', textAlign: 'center' }}
        >
          Upload your institution's operating license or accreditation for verification.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Institution Document</label>
            <div
              style={{
                border: dragging ? '2px dashed #382c77' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                backgroundColor: dragging ? '#f3f0ff' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <Upload size={32} color="#382c77" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#1e293b' }}>
                {file ? file.name : 'Click to browse or drag and drop'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                PDF, JPG, or PNG (Max 10MB)
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf, .jpg, .jpeg, .png"
                style={{ display: 'none' }}
                onChange={(e) => accept(e.target.files?.[0])}
              />
            </div>
            {fileError && (
              <p className="field-error" style={{ marginTop: '8px' }} role="alert">
                {fileError}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="license-type">Document type *</label>
            <select
              id="license-type"
              className="form-input"
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
            >
              <option value="BUSINESS_LICENSE">Business Operating License</option>
              <option value="HOSPITAL_ACCREDITATION">Hospital Accreditation</option>
              <option value="GOV_APPROVAL">Government Approval</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="issuing-authority">Issuing authority *</label>
            <input
              id="issuing-authority"
              type="text"
              className="form-input"
              placeholder="e.g., Ministry of Health, URSB"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '16px' }}
            disabled={submitting}
          >
            {submitting ? 'Uploading...' : 'Submit for Review'} <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </AuthShell>
  );
};
