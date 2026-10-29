import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, ChevronRight, FileText, X } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { FLOWS } from '../../features/registration/flows';
import { describeError } from '../../services/api';
import { uploadInstitutionLicense } from '../../services/registration';

export const UploadInstitutionLicense = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [licenseType, setLicenseType] = useState('BUSINESS_LICENSE');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(selected.type)) {
        setError('Invalid format. Please upload PDF, JPG, or PNG. Word and ZIP files are blocked.');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum size is 10MB.');
        return;
      }
      setFile(selected);
      setError(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please upload a document.');
    if (!issuingAuthority.trim()) return setError('Please enter the issuing authority.');

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
    <AuthLayout
      title="Upload your license"
      subtitle="Upload your institution's operating license or accreditation for verification."
      backTo="/get-started"
      steps={FLOWS.institution}
      current={3}
    >
      <form onSubmit={handleSubmit} className="inst-form">
        <div className="form-group">
          <label>Institution Document</label>
          {!file ? (
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <UploadCloud size={32} color="#382c77" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#1e293b' }}>
                Click to browse or drag and drop
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                PDF, JPG, or PNG (Max 10MB)
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".pdf, .jpg, .jpeg, .png"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={24} color="#382c77" />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Document type *</label>
          <select
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
          <label>Issuing authority *</label>
          <input
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
    </AuthLayout>
  );
};
