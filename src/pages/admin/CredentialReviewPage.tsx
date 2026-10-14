import { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  CheckCircle2,
  Check,
  Download,
  ExternalLink,
  ClipboardCheck,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import './CredentialReviewPage.css';
import { ConfirmDialog } from '../../components/ConfirmDialog';

import danielPhoto from '../../assets/interpreter3.png';

// ── MOCK DATA ─────────────────────────────────────────────
const applicant = {
  name: 'Daniel Brooks',
  role: 'Interpreter',
  status: 'Pending verification',
  email: 'daniel.brooks@gmail.com',
  phone: '+256 700 455 789',
  location: 'Kampala, Uganda',
  submittedDate: 'Sep 6, 2025',
  today: 'Today',
  reference: 'UGB-20291',
  avatar: danielPhoto,
};

const certificate = {
  fileName: 'RID_Certification.pdf',
  fileSize: 'PDF · 2.4 MB',
  uploadedDate: 'Sep 6, 2025',
};

const verificationProgress = [
  { label: 'Identity document', status: 'Completed', icon: CheckCircle2 },
  { label: 'Certification', status: 'Completed', icon: CheckCircle2 },
  { label: 'Profile information', status: 'In progress', icon: Clock },
  { label: 'Final decision', status: 'Not started', icon: Sparkles },
];

// ── PAGE ──────────────────────────────────────────────────
export function CredentialReviewPage() {
  const [approvedOpen, setApprovedOpen] = useState(false);
  const [rejectedOpen, setRejectedOpen] = useState(false);
  return (
    <>
      {/* Top bar */}
      <div className="crp-topbar">
        <div className="crp-search">
          <Search size={16} />
          <input placeholder="Search users by name, email, phone or ID..." />
        </div>

        <div className="crp-topbar-actions">
          <button className="crp-bell" aria-label="Notifications">
            <Bell size={20} />
            <span className="crp-bell-dot" />
          </button>

          <span className="crp-divider" />

          <button className="crp-user-menu">
            <span className="crp-avatar">MJ</span>
            <span className="crp-user-info">
              <strong>Maya Johnson</strong>
              <small>Admin</small>
            </span>
            <ChevronDown size={16} className="crp-chevron" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="crp-breadcrumb">
        <ArrowLeft size={14} />
        <span>Verifications</span>
        <span className="sep">/</span>
        <span className="current">Credential review</span>
      </div>

      {/* Page title */}
      <div className="crp-title-row">
        <div>
          <h1>Credential review</h1>
          <p>Review certificate, identification and interpreter details.</p>
        </div>
        <span className="crp-status-badge">
          <Clock size={14} /> Pending review
        </span>
      </div>

      {/* Grid */}
      <div className="crp-grid">
        {/* LEFT */}
        <div className="crp-col-main">
          <section className="crp-card">
            <h2>Certification document</h2>
            <div className="crp-doc-row">
              <div className="crp-doc-preview">
                <div className="crp-doc-preview-inner">
                  <span className="crp-doc-label">
                    CERTIFICATE OF
                    <br />
                    INTERPRETER REGISTRATION
                  </span>
                  <h3>INTERPRETER CERTIFICATE</h3>
                  <p className="crp-doc-name">Daniel Brooks</p>
                  <p className="crp-doc-detail">
                    ISSUED: September 30, 2021 · EXPIRES: September 20, 2026
                  </p>
                  <span className="crp-doc-watermark">VERIFIED</span>
                </div>
                <div className="crp-doc-pager">1 / 1</div>
              </div>

              <div className="crp-doc-file">
                <div className="crp-file-header">
                  <div className="crp-file-icon">PDF</div>
                  <div>
                    <strong>{certificate.fileName}</strong>
                    <small>{certificate.fileSize}</small>
                  </div>
                </div>
                <p className="crp-file-meta">
                  Uploaded {certificate.uploadedDate}
                  <br />
                  by Daniel Brooks
                </p>
                <button className="crp-btn crp-btn--primary">
                  <ExternalLink size={14} /> View document
                </button>
                <button className="crp-btn">
                  <Download size={14} /> Download
                </button>
                <button className="crp-btn">
                  <ExternalLink size={14} /> Open in new tab
                </button>
              </div>
            </div>
          </section>

          <section className="crp-card">
            <h2>
              <ClipboardCheck size={18} /> Certification information
            </h2>

            <div className="crp-info-grid">
              <InfoField label="Certification name" value="Interpreter Certification" />
              <InfoField label="Issue date" value="Jan 19, 2025" />
              <InfoField label="Certification ID" value="INTL-2025-00482" />
              <InfoField label="Expiry date" value="Jan 19, 2028" />
              <InfoField
                label="Issuing organization"
                value="Uganda Sign Language Interpreters Association"
              />
              <InfoField label="Document type" value="Professional" />
            </div>

            <div className="crp-review-note">
              <span>Document + manual review</span>
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <aside className="crp-col-side">
          <section className="crp-card crp-applicant">
            <div className="crp-applicant-head">
              <img src={applicant.avatar} alt={applicant.name} />
              <div>
                <h3>{applicant.name}</h3>
                <p>{applicant.role}</p>
                <span className="crp-pill">
                  <Clock size={12} /> {applicant.status}
                </span>
              </div>
            </div>

            <div className="crp-applicant-details">
              <DetailRow label="Email" value={applicant.email} />
              <DetailRow label="Phone" value={applicant.phone} />
              <DetailRow label="Location" value={applicant.location} />
              <DetailRow label="Submitted" value={applicant.submittedDate} />
              <DetailRow label="Last activity" value={applicant.today} />
              <DetailRow label="Reference" value={applicant.reference} />
            </div>
          </section>

          <section className="crp-card">
            <h3>Verification progress</h3>
            <ul className="crp-progress">
              {verificationProgress.map((step) => {
                const Icon = step.icon;
                const done = step.status === 'Completed';
                return (
                  <li key={step.label} className={done ? 'done' : ''}>
                    <Icon size={16} />
                    <span className="crp-progress-label">{step.label}</span>
                    <span
                      className={`crp-progress-status status-${step.status
                        .toLowerCase()
                        .replace(' ', '-')}`}
                    >
                      {step.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="crp-actions">
            <button className="crp-btn">Request changes</button>
            <button className="crp-btn crp-btn--danger" onClick={() => setRejectedOpen(true)}>
              <XCircle size={14} /> Reject
            </button>
            <button className="crp-btn crp-btn--success" onClick={() => setApprovedOpen(true)}>
              <Check size={14} /> Approve verification
            </button>
          </div>
        </aside>
      </div>

      {/* Approve confirmation modal */}
      <ConfirmDialog
        open={approvedOpen}
        variant="success"
        title="Approve interpreter"
        message="Everything is complete and your account is up to date."
        confirmLabel="Done"
        onConfirm={() => {
          setApprovedOpen(false);
          // TODO: call approve API here
        }}
        onClose={() => setApprovedOpen(false)}
      />

      <ConfirmDialog
        open={rejectedOpen}
        variant="danger"
        title="Reject interpreter"
        message="Your account has been rejected"
        confirmLabel="Done"
        withReason
        reasonPlaceholder="Reason for rejection"
        onConfirm={(reason) => {
          console.log('Rejection reason:', reason);
          // TODO: call reject API here
          setRejectedOpen(false);
        }}
        onClose={() => setRejectedOpen(false)}
      />
    </>
  );
}

// ── SMALL HELPERS ─────────────────────────────────────────
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="crp-info-field">
      <span className="crp-info-label">{label}</span>
      <span className="crp-info-value">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="crp-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
