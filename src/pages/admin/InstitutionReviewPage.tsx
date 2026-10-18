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
  fetchInstitutions,
  updateInstitutionStatus,
  type Institution,
  type InstitutionStatus,
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
  deactivated: 'Deactivated',
};

type ConfirmAction = 'approve' | 'reject' | 'request-changes';

export function InstitutionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInstitutions()
      .then((list) => {
        if (cancelled) return;
        const found = list.find((i) => i.id === id);
        if (!found) setLoadError('Institution not found.');
        else setInstitution(found);
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
        const updated = await updateInstitutionStatus(institution.id, 'approve');
        setInstitution(updated);
        setNotice(`${updated.name} approved successfully.`);
      } else if (confirmAction === 'reject') {
        const updated = await updateInstitutionStatus(institution.id, 'deactivate');
        setInstitution(updated);
        setNotice(`${updated.name} rejected.`);
      } else {
        setNotice('Change request sent to the institution.');
      }
      setConfirmAction(null);
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
                  <span className="ir-sector-pill">{institution.sector} Institution</span>
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
                    <li>
                      <MapPin size={14} /> Kampala, Uganda
                    </li>
                  </ul>
                </div>
              </div>

              <div className="ir-document">
                <div className="ir-doc-head">
                  <FileText size={22} />
                  <div>
                    <strong>Institution_registration.pdf</strong>
                    <small>2.1MB · PDF</small>
                  </div>
                </div>
                <small className="ir-doc-meta">
                  Uploaded: {formatDate(institution.createdAt)} · By: {institution.createdBy}
                </small>
                <div className="ir-doc-actions">
                  <button type="button" className="ir-btn ir-btn--primary" disabled>
                    <Eye size={15} /> View documents
                  </button>
                  <button type="button" className="ir-btn ir-btn--ghost" disabled>
                    <Download size={15} /> Download
                  </button>
                  <button type="button" className="ir-btn ir-btn--ghost" disabled>
                    <ExternalLink size={15} /> Open in new tab
                  </button>
                </div>
              </div>
            </div>

            <div className="ir-meta-row">
              <div>
                <small>Registration number</small>
                <strong>{institution.registrationNumber}</strong>
              </div>
              <div>
                <small>Founded date</small>
                <strong>{formatDate(institution.createdAt)}</strong>
              </div>
              <div>
                <small>Institution type</small>
                <strong>{institution.sector}</strong>
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
                value="Grace Nansubuga"
              />
              <DetailItem
                icon={<FileText size={14} />}
                label="Registration number"
                value={institution.registrationNumber}
              />
              <DetailItem
                icon={<Mail size={14} />}
                label="Email address"
                value={institution.email || '—'}
              />
              <DetailItem
                icon={<Building2 size={14} />}
                label="Institution type"
                value={institution.sector}
              />
              <DetailItem
                icon={<Phone size={14} />}
                label="Phone number"
                value={institution.phone || '—'}
              />
              <DetailItem
                icon={<MapPin size={14} />}
                label="Address"
                value="Plot 12, Nakasero Road, Kampala, Uganda"
              />
              <DetailItem icon={<Globe size={14} />} label="Website" value="www.kampaladcs.org" />
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
                <strong className="ir-contact-name">Grace Nansubuga</strong>
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
              <li>
                <MapPin size={14} /> Kampala, Uganda
              </li>
            </ul>
            <div className="ir-contact-foot">
              <div>
                <small>Registration date</small>
                <strong>{formatDate(institution.createdAt)}</strong>
              </div>
              <div>
                <small>Last active</small>
                <strong>Today</strong>
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
              <li className="is-done">
                <CheckCircle2 size={16} />
                <span>Institution details</span>
                <small>Completed</small>
              </li>
              <li className="is-done">
                <CheckCircle2 size={16} />
                <span>Documents</span>
                <small>Completed</small>
              </li>
              <li className="is-current">
                <Clock3 size={16} />
                <span>Verification checks</span>
                <small>In progress</small>
              </li>
              <li>
                <Circle size={16} />
                <span>Approval decision</span>
                <small>Not started</small>
              </li>
            </ul>
          </section>

          {/* Actions */}
          <div className="ir-actions">
            <button
              type="button"
              className="ir-btn ir-btn--ghost ir-btn--action"
              onClick={() => setConfirmAction('request-changes')}
            >
              <AlertCircle size={15} /> Request changes
            </button>
            <button
              type="button"
              className="ir-btn ir-btn--danger ir-btn--action"
              onClick={() => setConfirmAction('reject')}
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
            }
          }}
          onConfirm={() => void confirm()}
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

interface ConfirmDialogProps {
  action: ConfirmAction;
  institution: Institution;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  action,
  institution,
  saving,
  error,
  onCancel,
  onConfirm,
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
      title: 'Reject this institution?',
      description:
        'The institution will be deactivated and cannot access the platform. This can be reversed later.',
      button: 'Reject institution',
      danger: true,
    },
    'request-changes': {
      title: 'Request changes?',
      description:
        'The institution will be notified to update their details before submitting again.',
      button: 'Send request',
      danger: false,
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
