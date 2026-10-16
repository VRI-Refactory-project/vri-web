import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Clock, Download, ExternalLink, ClipboardCheck, XCircle } from 'lucide-react';
import './CredentialReviewPage.css';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { describeError } from '../../services/api';
import {
  certificateBlobUrl,
  decideInterpreter,
  getInterpreter,
  type Certificate,
  type Decide,
  type InterpreterDetail,
  type VerificationStatus,
} from '../../services/adminInterpreters';

const STATUS_LABEL: Record<VerificationStatus, string> = {
  INACTIVE: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEACTIVATED: 'Deactivated',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** What each decision asks the admin, and whether it needs a written reason. */
const DIALOGS: Record<
  Decide,
  { title: string; message: string; label: string; variant: 'success' | 'danger'; reason: boolean }
> = {
  approve: {
    title: 'Approve interpreter',
    message: 'They will be able to switch on availability and receive requests.',
    label: 'Approve',
    variant: 'success',
    reason: false,
  },
  reject: {
    title: 'Reject interpreter',
    message: 'Tell the interpreter why. This is emailed to them.',
    label: 'Reject',
    variant: 'danger',
    reason: true,
  },
  deactivate: {
    title: 'Deactivate interpreter',
    message: 'They stop receiving new requests straight away. A reason is required.',
    label: 'Deactivate',
    variant: 'danger',
    reason: true,
  },
  reactivate: {
    title: 'Reactivate interpreter',
    message: 'They return to Approved and can switch availability on again.',
    label: 'Reactivate',
    variant: 'success',
    reason: false,
  },
};

/** The decisions an admin can take from each status (V2-045). */
const ACTIONS: Record<VerificationStatus, Decide[]> = {
  INACTIVE: ['reject', 'approve'],
  REJECTED: ['approve'],
  APPROVED: ['deactivate'],
  DEACTIVATED: ['reactivate'],
};

// ── PAGE ──────────────────────────────────────────────────
export function CredentialReviewPage() {
  const { id = '' } = useParams();
  const { session } = useAuth();
  const [detail, setDetail] = useState<InterpreterDetail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [pending, setPending] = useState<Decide | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getInterpreter(id).then(
      (d) => {
        if (!cancelled) setDetail(d);
      },
      (err: unknown) => {
        if (!cancelled) setLoadError(describeError(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  const close = useCallback(() => {
    setPending(null);
    setActionError('');
  }, []);

  const confirm = async (reason = '') => {
    if (!pending) return;
    if (DIALOGS[pending].reason && !reason.trim()) {
      setActionError('Please give a reason.');
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      setDetail(await decideInterpreter(id, pending, reason.trim()));
      setPending(null);
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const openCertificate = async (cert: Certificate, download: boolean) => {
    setFileError('');
    try {
      const url = await certificateBlobUrl(cert.fileUrl, session?.token ?? '');
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = cert.documentName;
        a.click();
      } else {
        window.open(url, '_blank', 'noopener');
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setFileError('Could not open that certificate. Try again.');
    }
  };

  if (loadError) {
    return (
      <div className="crp-title-row">
        <p role="alert">{loadError}</p>
        <Link to="/dashboard/admin/verifications">Back to verifications</Link>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="crp-title-row">
        <p role="status">Loading…</p>
      </div>
    );
  }

  const dialog = pending ? DIALOGS[pending] : null;

  return (
    <>
      {/* Breadcrumb */}
      <div className="crp-breadcrumb">
        <Link to="/dashboard/admin/verifications">Verifications</Link>
        <span className="sep">/</span>
        <span className="current">Credential review</span>
      </div>

      {/* Page title */}
      <div className="crp-title-row">
        <div>
          <h1>Credential review</h1>
          <p>Review the certificates and details of {detail.fullName}.</p>
        </div>
        <span className="crp-status-badge">
          <Clock size={14} /> {STATUS_LABEL[detail.status]}
        </span>
      </div>

      <div className="crp-grid">
        {/* LEFT */}
        <div className="crp-col-main">
          <section className="crp-card">
            <h2>
              <ClipboardCheck size={18} /> Certificates ({detail.certificates.length})
            </h2>
            {fileError && (
              <p role="alert" className="crp-review-note">
                {fileError}
              </p>
            )}
            {detail.certificates.length === 0 ? (
              <p>
                No certificate has been uploaded yet. An interpreter cannot be approved without one.
              </p>
            ) : (
              detail.certificates.map((c) => (
                <div key={c.id} className="crp-doc-file">
                  <div className="crp-file-header">
                    <div className="crp-file-icon">PDF</div>
                    <div>
                      <strong>{c.documentName}</strong>
                      <small>
                        {c.certificateType} · {c.issuingOrganisation}
                      </small>
                    </div>
                  </div>
                  <p className="crp-file-meta">Uploaded {formatDate(c.uploadedAt)}</p>
                  {c.rejectionReason && (
                    <p className="crp-file-meta">Rejected: {c.rejectionReason}</p>
                  )}
                  <button
                    type="button"
                    className="crp-btn crp-btn--primary"
                    onClick={() => void openCertificate(c, false)}
                  >
                    <ExternalLink size={14} /> View document
                  </button>
                  <button
                    type="button"
                    className="crp-btn"
                    onClick={() => void openCertificate(c, true)}
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              ))
            )}
          </section>

          <section className="crp-card">
            <h2>Decision history</h2>
            {detail.decisions.length === 0 ? (
              <p>No decisions yet.</p>
            ) : (
              <ul className="crp-progress">
                {detail.decisions.map((d) => (
                  <li key={d.id}>
                    <span className="crp-progress-label">
                      {d.action} by {d.adminName}
                      {d.reason ? `: ${d.reason}` : ''}
                    </span>
                    <span className="crp-progress-status">{formatDate(d.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <aside className="crp-col-side">
          <section className="crp-card crp-applicant">
            <div className="crp-applicant-head">
              <span className="crp-avatar" aria-hidden="true">
                {detail.fullName.trim().charAt(0).toUpperCase() || '?'}
              </span>
              <div>
                <h3>{detail.fullName}</h3>
                <p>Interpreter</p>
                <span className="crp-pill">
                  <Clock size={12} /> {STATUS_LABEL[detail.status]}
                </span>
              </div>
            </div>

            <div className="crp-applicant-details">
              <DetailRow label="Email" value={detail.email || 'Not given'} />
              <DetailRow label="Phone" value={detail.phoneNumber} />
              <DetailRow label="Specialisation" value={detail.specialisation || 'Not given'} />
              <DetailRow label="Registered" value={formatDate(detail.createdAt)} />
            </div>
          </section>

          <div className="crp-actions">
            {ACTIONS[detail.status].map((action) => (
              <button
                key={action}
                type="button"
                className={
                  DIALOGS[action].variant === 'danger'
                    ? 'crp-btn crp-btn--danger'
                    : 'crp-btn crp-btn--success'
                }
                onClick={() => setPending(action)}
              >
                {DIALOGS[action].variant === 'danger' ? <XCircle size={14} /> : <Check size={14} />}{' '}
                {DIALOGS[action].label}
              </button>
            ))}
          </div>
        </aside>
      </div>

      {dialog && (
        <ConfirmDialog
          open
          variant={dialog.variant}
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.label}
          withReason={dialog.reason}
          reasonPlaceholder="Reason"
          error={actionError}
          busy={busy}
          onConfirm={(reason) => void confirm(reason)}
          onClose={close}
        />
      )}
    </>
  );
}

// ── SMALL HELPERS ─────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="crp-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
