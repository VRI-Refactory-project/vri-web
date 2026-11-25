// src/pages/admin/InstitutionReviewPage.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  approveInstitution,
  fetchInstitution,
  institutionSectorLabel,
  rejectInstitution,
  type Institution,
  type InstitutionStatus,
  type VerificationStage,
} from '../../services/institutions';
import { describeError } from '../../services/api';
import './InstitutionReviewPage.css';

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

const STATUS_LABEL: Record<InstitutionStatus, string> = {
  approved: 'Approved',
  pending: 'Pending review',
  rejected: 'Rejected',
  deactivated: 'Deactivated',
};

type ConfirmAction = 'approve' | 'reject';

export function InstitutionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchInstitution(id ?? '')
      .then((found) => {
        if (cancelled) return;
        setInstitution(found);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(describeError(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(t);
  }, [notice]);

  async function confirm() {
    if (!institution || !confirmAction) return;
    setSaving(true);
    setActionError('');

    try {
      if (confirmAction === 'approve') {
        const updated = await approveInstitution(institution.id);
        setInstitution(updated);
        setNotice(`${updated.name} approved successfully.`);
      } else {
        if (!rejectionReason.trim()) {
          setActionError('Enter a reason for rejecting this application.');
          setSaving(false);
          return;
        }
        const updated = await rejectInstitution(institution.id, rejectionReason.trim());
        setInstitution(updated);
        setNotice(`${updated.name} application rejected.`);
      }
      setConfirmAction(null);
      setRejectionReason('');
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ir-page">
        <p className="ir-empty">Loading institution…</p>
      </div>
    );
  }

  if (loadError || !institution) {
    return (
      <div className="ir-page">
        <div className="ir-error" role="alert">
          <AlertCircle size={18} />
          <span>{loadError || 'Institution not found.'}</span>
        </div>
        <Link className="ir-back" to="/dashboard/admin/institutions">
          Back to institutions
        </Link>
      </div>
    );
  }

  return (
    <div className="ir-page">
      {notice && (
        <div className="ir-toast" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="ir-breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard/admin/institutions">Institutions</Link>
        <ChevronRight size={14} />
        <span>{institution.name}</span>
      </nav>

      {/* Header */}
      <header className="ir-header">
        <div>
          <h1>Institution review</h1>
          <p>
            Review institution details, verify information and approve or reject the institution.
          </p>
        </div>
        <span className={`ir-status ir-status--${institution.status}`}>
          <Clock3 size={14} />
          {STATUS_LABEL[institution.status]}
        </span>
      </header>

      <div className="ir-grid">
        {/* Left column */}
        <div className="ir-left">
          {/* Institution information */}
          <section className="ir-card">
            <h2 className="ir-card-title">Institution information</h2>

            <div className="ir-info-row">
              <div className="ir-info-main">
                <div className="ir-building-icon">
                  <Building2 size={26} />
                </div>
                <div>
                  <h3 className="ir-institution-name">{institution.name}</h3>
                  <span className="ir-sector-pill">
                    {institutionSectorLabel(institution.sector, institution.sectorOther)}
                  </span>
                  <ul className="ir-contact-list">
                    {institution.email && (
                      <li>
                        <Mail size={14} /> {institution.email}
                      </li>
                    )}
                    {institution.phone && (
                      <li>
                        <Phone size={14} /> {institution.phone}
                      </li>
                    )}
                    {institution.address && (
                      <li>
                        <MapPin size={14} /> {institution.address}
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="ir-document">
                <div className="ir-doc-head">
                  <FileText size={22} />
                  <div>
                    <strong>
                      {institution.documents.length
                        ? `${institution.documents.length} document${institution.documents.length === 1 ? '' : 's'} uploaded`
                        : 'No document uploaded'}
                    </strong>
                    <small>
                      {institution.documents.length
                        ? 'Submitted for review'
                        : 'No submitted documents'}
                    </small>
                  </div>
                </div>
                {institution.documents.map((document) => (
                  <div className="ir-document-item" key={document.id}>
                    <div>
                      <strong>{document.name}</strong>
                      <small>
                        {[
                          document.type,
                          document.issuingAuthority,
                          document.uploadedAt && `Uploaded ${formatDate(document.uploadedAt)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Submitted document'}
                      </small>
                    </div>
                    <div className="ir-doc-actions">
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ir-btn ir-btn--primary"
                      >
                        <Eye size={15} /> View document
                      </a>
                      <a href={document.url} download className="ir-btn ir-btn--ghost">
                        <Download size={15} /> Download
                      </a>
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ir-btn ir-btn--ghost"
                      >
                        <ExternalLink size={15} /> Open in new tab
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ir-meta-row">
              <div>
                <small>Registration number</small>
                <strong>{institution.registrationNumber || 'Not provided'}</strong>
              </div>
              <div>
                <small>Founded date</small>
                <strong>
                  {institution.foundedDate ? formatDate(institution.foundedDate) : 'Not provided'}
                </strong>
              </div>
              <div>
                <small>Institution type</small>
                <strong>
                  {institutionSectorLabel(institution.sector, institution.sectorOther)}
                </strong>
              </div>
            </div>
          </section>

          {/* Institution details */}
          <section className="ir-card">
            <h2 className="ir-card-title">Institution details</h2>
            <div className="ir-details-grid">
              <DetailItem
                icon={<Building2 size={14} />}
                label="Institution name"
                value={institution.name}
              />
              <DetailItem
                icon={<User size={14} />}
                label="Contact person"
                value={institution.contactName || 'Not provided'}
              />
              <DetailItem
                icon={<FileText size={14} />}
                label="Registration number"
                value={institution.registrationNumber || 'Not provided'}
              />
              <DetailItem
                icon={<Mail size={14} />}
                label="Email address"
                value={institution.email || 'Not provided'}
              />
              <DetailItem
                icon={<Building2 size={14} />}
                label="Institution type"
                value={institutionSectorLabel(institution.sector, institution.sectorOther)}
              />
              <DetailItem
                icon={<Phone size={14} />}
                label="Phone number"
                value={institution.phone || 'Not provided'}
              />
              <DetailItem
                icon={<MapPin size={14} />}
                label="Address"
                value={institution.address || 'Not provided'}
              />
              <DetailItem
                icon={<Globe size={14} />}
                label="Website"
                value={institution.website || 'Not provided'}
              />
              {institution.description && (
                <DetailItem
                  icon={<FileText size={14} />}
                  label="Description"
                  value={institution.description}
                />
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <aside className="ir-right">
          {/* Contact person */}
          <section className="ir-card">
            <div className="ir-contact-head">
              <div className="ir-avatar-lg">{institution.name.charAt(0).toUpperCase()}</div>
              <div>
                <strong className="ir-contact-name">
                  {institution.contactName || 'Institution contact'}
                </strong>
                <small>Institution contact</small>
                <span className={`ir-status ir-status--${institution.status}`}>
                  <Clock3 size={12} /> {STATUS_LABEL[institution.status]}
                </span>
              </div>
            </div>
            <ul className="ir-contact-list ir-contact-list--roomy">
              {institution.email && (
                <li>
                  <Mail size={14} /> {institution.email}
                </li>
              )}
              {institution.phone && (
                <li>
                  <Phone size={14} /> {institution.phone}
                </li>
              )}
              {institution.address && (
                <li>
                  <MapPin size={14} /> {institution.address}
                </li>
              )}
            </ul>
            <div className="ir-contact-foot">
              <div>
                <small>Registration date</small>
                <strong>{formatDate(institution.createdAt)}</strong>
              </div>
              <div>
                <small>Last active</small>
                <strong>
                  {institution.lastActive ? formatDate(institution.lastActive) : 'Not recorded'}
                </strong>
              </div>
              <div>
                <small>Institution ID</small>
                <strong>{institution.id}</strong>
              </div>
            </div>
          </section>

          {/* Verification progress */}
          <section className="ir-card">
            <h2 className="ir-card-title">Verification progress</h2>
            <ul className="ir-progress">
              <ProgressItem
                stage={institution.verificationProgress.institutionDetails}
                label="Institution details"
              />
              <ProgressItem stage={institution.verificationProgress.documents} label="Documents" />
              <ProgressItem
                stage={institution.verificationProgress.verificationChecks}
                label="Verification checks"
              />
              <ProgressItem
                stage={institution.verificationProgress.approvalDecision}
                label="Approval decision"
              />
            </ul>
          </section>

          {/* Actions */}
          {institution.status === 'pending' && (
            <div className="ir-actions">
              <button
                type="button"
                className="ir-btn ir-btn--danger ir-btn--action"
                onClick={() => {
                  setRejectionReason('');
                  setActionError('');
                  setConfirmAction('reject');
                }}
              >
                <AlertCircle size={15} /> Reject
              </button>
              <button
                type="button"
                className="ir-btn ir-btn--primary ir-btn--action"
                onClick={() => setConfirmAction('approve')}
              >
                <ShieldCheck size={15} /> Approve institution
              </button>
            </div>
          )}
        </aside>
      </div>

      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          institution={institution}
          saving={saving}
          error={actionError}
          onCancel={() => {
            if (!saving) {
              setConfirmAction(null);
              setActionError('');
              setRejectionReason('');
            }
          }}
          onConfirm={() => void confirm()}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
        />
      )}
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="ir-detail">
      <span className="ir-detail-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ProgressItem({ stage, label }: { stage: VerificationStage; label: string }) {
  const Icon = stage === 'completed' ? CheckCircle2 : stage === 'in_progress' ? Clock3 : Circle;
  const labelText =
    stage === 'completed' ? 'Completed' : stage === 'in_progress' ? 'In progress' : 'Not started';
  const className = stage === 'completed' ? 'is-done' : stage === 'in_progress' ? 'is-current' : '';
  return (
    <li className={className}>
      <Icon size={16} />
      <span>{label}</span>
      <small>{labelText}</small>
    </li>
  );
}

interface ConfirmDialogProps {
  action: ConfirmAction;
  institution: Institution;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
}

function ConfirmDialog({
  action,
  institution,
  saving,
  error,
  onCancel,
  onConfirm,
  rejectionReason,
  onRejectionReasonChange,
}: ConfirmDialogProps) {
  const config = {
    approve: {
      title: 'Approve this institution?',
      description:
        'The institution will get full platform access. Make sure their registration details have been verified.',
      button: 'Approve institution',
      danger: false,
    },
    reject: {
      title: 'Reject this application?',
      description:
        'Provide a reason. We will email the institution with the reason and invite them to apply again.',
      button: 'Reject application',
      danger: true,
    },
  }[action];

  return (
    <div
      className="ir-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div className="ir-modal" role="alertdialog" aria-modal="true">
        <div className={`ir-modal-icon ${config.danger ? 'is-danger' : ''}`}>
          {config.danger ? <AlertCircle size={26} /> : <ShieldCheck size={26} />}
        </div>
        <h2>{config.title}</h2>
        <p>{config.description}</p>
        <div className="ir-modal-institution">
          <Building2 size={16} />
          <div>
            <strong>{institution.name}</strong>
            <small>{institution.registrationNumber}</small>
          </div>
        </div>
        {action === 'reject' && (
          <label className="ir-rejection-reason">
            Rejection reason
            <textarea
              rows={4}
              maxLength={2000}
              value={rejectionReason}
              onChange={(event) => onRejectionReasonChange(event.target.value)}
              placeholder="Explain what needs to be corrected before applying again."
              required
            />
          </label>
        )}
        {error && (
          <div className="ir-modal-error">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <div className="ir-modal-actions">
          <button
            type="button"
            className="ir-btn ir-btn--ghost"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`ir-btn ${config.danger ? 'ir-btn--danger' : 'ir-btn--primary'}`}
            disabled={saving}
            onClick={onConfirm}
          >
            {saving ? 'Processing…' : config.button}
          </button>
        </div>
      </div>
    </div>
  );
}
