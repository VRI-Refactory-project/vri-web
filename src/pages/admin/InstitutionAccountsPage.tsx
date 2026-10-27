import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleMinus,
  Clock3,
  GraduationCap,
  Landmark,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
  Phone,
  Mail,
  Church,
  Factory,
  BriefcaseBusiness,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  createInstitution,
  fetchInstitutions,
  updateInstitution,
  updateInstitutionStatus,
  type Institution,
  type InstitutionForm,
  type InstitutionStatus,
  type InstitutionSector,
} from '../../services/institutions';
import { describeError } from '../../services/api';
import './InstitutionAccountsPage.css';

const PAGE_SIZE = 8;

const SECTORS: InstitutionSector[] = [
  'Healthcare',
  'Education',
  'Government',
  'Legal',
  'Religious',
  'Security',
  'Manufacturing',
  'Finance',
  'Other',
];

const EMPTY_FORM: InstitutionForm = {
  name: '',
  registrationNumber: '',
  sector: 'Other',
  email: '',
  phone: '',
  sectorOther: '',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function SectorIcon({ sector }: { sector: InstitutionSector }) {
  const common = { size: 19, strokeWidth: 2 };

  switch (sector) {
    case 'Healthcare':
      return <Building2 {...common} />;
    case 'Education':
      return <GraduationCap {...common} />;
    case 'Government':
    case 'Finance':
      return <Landmark {...common} />;
    case 'Legal':
      return <BriefcaseBusiness {...common} />;
    case 'Religious':
      return <Church {...common} />;
    case 'Security':
      return <ShieldCheck {...common} />;
    case 'Manufacturing':
      return <Factory {...common} />;
    default:
      return <Building2 {...common} />;
  }
}

function StatusBadge({ status }: { status: InstitutionStatus }) {
  const labels: Record<InstitutionStatus, string> = {
    approved: 'Approved',
    pending: 'Pending',
    deactivated: 'Deactivated',
  };

  return (
    <span className={`ia-status ia-status--${status}`}>
      {status === 'approved' && <CheckCircle2 size={13} />}
      {status === 'pending' && <Clock3 size={13} />}
      {status === 'deactivated' && <CircleMinus size={13} />}
      {labels[status]}
    </span>
  );
}

interface InstitutionModalProps {
  mode: 'create' | 'edit';
  institution: Institution | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (form: InstitutionForm) => void;
}

function InstitutionModal({
  mode,
  institution,
  saving,
  error,
  onClose,
  onSave,
}: InstitutionModalProps) {
  const [form, setForm] = useState<InstitutionForm>(
    institution
      ? {
          name: institution.name,
          registrationNumber: institution.registrationNumber,
          sector: institution.sector,
          email: institution.email,
          phone: institution.phone,
          sectorOther: '',
        }
      : { ...EMPTY_FORM },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof InstitutionForm>(field: K, value: InstitutionForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Institution name is required';
    if (!form.registrationNumber.trim()) e.registrationNumber = 'Registration number is required';
    if (form.sector === 'Other' && !form.sectorOther?.trim()) {
      e.sectorOther = 'Please specify the sector';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Please enter a valid email address';
    }
    if (form.phone.trim() && !/^[+0-9 ()-]{7,}$/.test(form.phone.trim())) {
      e.phone = 'Please enter a valid phone number';
    }
    return e;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onSave({
      name: form.name.trim(),
      registrationNumber: form.registrationNumber.trim(),
      sector: form.sector,
      email: form.email.trim(),
      phone: form.phone.trim(),
      ...(form.sector === 'Other' ? { sectorOther: form.sectorOther?.trim() ?? '' } : {}),
    });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  return (
    <div
      className="ia-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        className="ia-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ia-modal-title"
      >
        <header className="ia-modal__header">
          <div className="ia-modal__heading-icon">
            <Building2 size={22} />
          </div>

          <div className="ia-modal__heading-copy">
            <h2 id="ia-modal-title">
              {mode === 'edit' ? 'Edit institution details' : 'Add institution'}
            </h2>
            <p>
              {mode === 'edit'
                ? 'Update the organisation information stored on SignConnect.'
                : 'Register an organisation for administrator review.'}
            </p>
          </div>

          <button
            className="ia-icon-button"
            type="button"
            aria-label="Close dialog"
            disabled={saving}
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <form onSubmit={submit} noValidate>
          <div className="ia-modal__body">
            <div className={`ia-form-field ${errors.name ? 'ia-form-field--invalid' : ''}`}>
              <label htmlFor="ia-name">Institution name *</label>
              <input
                id="ia-name"
                autoFocus
                maxLength={160}
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="e.g. Mulago Hospital"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'ia-name-error' : undefined}
              />
              {errors.name && (
                <p className="ia-field-error" id="ia-name-error">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="ia-form-grid">
              <div
                className={`ia-form-field ${errors.registrationNumber ? 'ia-form-field--invalid' : ''}`}
              >
                <label htmlFor="ia-reg">Registration number *</label>
                <input
                  id="ia-reg"
                  maxLength={100}
                  value={form.registrationNumber}
                  onChange={(event) => updateField('registrationNumber', event.target.value)}
                  placeholder="e.g. INST-001"
                  aria-invalid={errors.registrationNumber ? true : undefined}
                  aria-describedby={errors.registrationNumber ? 'ia-reg-error' : undefined}
                />
                {errors.registrationNumber && (
                  <p className="ia-field-error" id="ia-reg-error">
                    {errors.registrationNumber}
                  </p>
                )}
              </div>

              <div
                className={`ia-form-field ${form.sector === 'Other' && errors.sectorOther ? 'ia-form-field--invalid' : ''}`}
              >
                <label htmlFor={form.sector === 'Other' ? 'ia-sector-other' : 'ia-sector'}>
                  Sector *
                </label>

                {form.sector === 'Other' ? (
                  <div className="ia-sector-input-wrap">
                    <input
                      id="ia-sector-other"
                      autoFocus
                      maxLength={120}
                      value={form.sectorOther ?? ''}
                      onChange={(event) => updateField('sectorOther', event.target.value)}
                      placeholder="Please specify the sector"
                      aria-invalid={errors.sectorOther ? true : undefined}
                      aria-describedby={errors.sectorOther ? 'ia-sector-other-error' : undefined}
                    />
                    <button
                      type="button"
                      className="ia-sector-drop-btn"
                      aria-label="Pick sector from list"
                      onClick={() => {
                        updateField('sector', 'Healthcare');
                        updateField('sectorOther', '');
                      }}
                    >
                      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                        <path
                          d="M5 8l5 5 5-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <select
                    id="ia-sector"
                    value={form.sector}
                    onChange={(event) =>
                      updateField('sector', event.target.value as InstitutionSector)
                    }
                  >
                    {SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                )}

                {form.sector === 'Other' && errors.sectorOther && (
                  <p className="ia-field-error" id="ia-sector-other-error">
                    {errors.sectorOther}
                  </p>
                )}
              </div>
            </div>

            <div className={`ia-form-field ${errors.email ? 'ia-form-field--invalid' : ''}`}>
              <label htmlFor="ia-email">Official email address</label>
              <div className="ia-input-with-icon">
                <Mail size={16} />
                <input
                  id="ia-email"
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="admin@institution.go.ug"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'ia-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p className="ia-field-error" id="ia-email-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className={`ia-form-field ${errors.phone ? 'ia-form-field--invalid' : ''}`}>
              <label htmlFor="ia-phone">Contact telephone</label>
              <div className="ia-input-with-icon">
                <Phone size={16} />
                <input
                  id="ia-phone"
                  type="tel"
                  maxLength={40}
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="+256 700 000000"
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={errors.phone ? 'ia-phone-error' : undefined}
                />
              </div>
              {errors.phone && (
                <p className="ia-field-error" id="ia-phone-error">
                  {errors.phone}
                </p>
              )}
            </div>

            {mode === 'edit' && institution && (
              <div className="ia-modal__record-info">
                <span>Account status</span>
                <StatusBadge status={institution.status} />
                <span className="ia-modal__record-note">
                  Change the account status from the institution table.
                </span>
              </div>
            )}

            {error && (
              <div className="ia-inline-error" role="alert">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <footer className="ia-modal__footer">
            <button
              className="ia-button ia-button--secondary"
              type="button"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="ia-button ia-button--primary" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw size={16} className="ia-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check size={17} />
                  {mode === 'edit' ? 'Save Changes' : 'Create Institution'}
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

interface ConfirmDialogProps {
  institution: Institution;
  action: 'deactivate' | 'activate' | 'approve';
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  institution,
  action,
  saving,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const config = {
    deactivate: {
      title: 'Deactivate this institution?',
      description:
        'The organisation will lose its active platform access. You can reactivate it later.',
      button: 'Deactivate account',
    },
    activate: {
      title: 'Reactivate this institution?',
      description:
        'This will restore the organisation’s active account status. Confirm that it should regain access.',
      button: 'Activate account',
    },
    approve: {
      title: 'Approve this institution?',
      description:
        'This organisation will be marked as approved. Ensure its registration details have been reviewed.',
      button: 'Approve institution',
    },
  }[action];

  return (
    <div
      className="ia-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onCancel();
      }}
    >
      <section
        className="ia-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ia-confirm-title"
      >
        <div className={`ia-confirm-dialog__icon ia-confirm-dialog__icon--${action}`}>
          {action === 'deactivate' ? (
            <CircleMinus size={25} />
          ) : action === 'approve' ? (
            <ShieldCheck size={25} />
          ) : (
            <CheckCircle2 size={25} />
          )}
        </div>

        <h2 id="ia-confirm-title">{config.title}</h2>
        <p>{config.description}</p>

        <div className="ia-confirm-dialog__institution">
          <Building2 size={18} />
          <div>
            <strong>{institution.name}</strong>
            <span>{institution.registrationNumber}</span>
          </div>
        </div>

        {error && (
          <div className="ia-inline-error" role="alert">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        <div className="ia-confirm-dialog__actions">
          <button
            className="ia-button ia-button--secondary"
            type="button"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className={`ia-button ${
              action === 'deactivate' ? 'ia-button--danger' : 'ia-button--primary'
            }`}
            type="button"
            disabled={saving}
            onClick={onConfirm}
          >
            {saving ? 'Processing…' : config.button}
          </button>
        </div>
      </section>
    </div>
  );
}

export function InstitutionAccountsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InstitutionStatus>('all');
  const [sectorFilter, setSectorFilter] = useState<'all' | InstitutionSector>('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Institution | null>(null);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'activate' | 'approve' | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const loadInstitutions = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const records = await fetchInstitutions();
      setInstitutions(records);
    } catch (error) {
      setLoadError(describeError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadInitialInstitutions = async () => {
      try {
        const records = await fetchInstitutions();
        if (!cancelled) {
          setInstitutions(records);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(describeError(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void loadInitialInstitutions();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(
    () => ({
      all: institutions.length,
      approved: institutions.filter((item) => item.status === 'approved').length,
      pending: institutions.filter((item) => item.status === 'pending').length,
      deactivated: institutions.filter((item) => item.status === 'deactivated').length,
    }),
    [institutions],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return institutions.filter((item) => {
      const matchesSearch =
        !query ||
        [item.name, item.registrationNumber, item.sector, item.email, item.phone].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSector = sectorFilter === 'all' || item.sector === sectorFilter;
      return matchesSearch && matchesStatus && matchesSector;
    });
  }, [institutions, search, statusFilter, sectorFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleInstitutions = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openEdit(institution: Institution) {
    setSelected(institution);
    setActionError('');
    setModal('edit');
  }

  function openConfirm(institution: Institution, action: 'deactivate' | 'activate' | 'approve') {
    setSelected(institution);
    setConfirmAction(action);
    setActionError('');
  }

  async function saveInstitution(form: InstitutionForm) {
    setSaving(true);
    setActionError('');
    try {
      if (modal === 'edit' && selected) {
        const updated = await updateInstitution(selected.id, form);
        setInstitutions((current) =>
          current.map((item) => (item.id === selected.id ? updated : item)),
        );
        setNotice(`${updated.name} was updated successfully.`);
      } else {
        const created = await createInstitution(form);
        setInstitutions((current) => [created, ...current]);
        setNotice(`${created.name} was added and is pending approval.`);
      }
      setModal(null);
      setSelected(null);
    } catch (error) {
      setActionError(describeError(error));
    } finally {
      setSaving(false);
    }
  }

  async function confirmStatusChange() {
    if (!selected || !confirmAction) return;
    setSaving(true);
    setActionError('');
    try {
      const updated = await updateInstitutionStatus(selected.id, confirmAction);
      setInstitutions((current) =>
        current.map((item) => (item.id === selected.id ? updated : item)),
      );
      const verb =
        confirmAction === 'deactivate'
          ? 'deactivated'
          : confirmAction === 'activate'
            ? 'activated'
            : 'approved';
      setNotice(`${updated.name} was ${verb} successfully.`);
      setConfirmAction(null);
      setSelected(null);
    } catch (error) {
      setActionError(describeError(error));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <main className="ia-page">
      <header className="ia-page__header">
        <div>
          <div className="ia-eyebrow">ADMINISTRATION / ORGANISATIONS</div>
          <h1>Institutional Accounts</h1>
          <p>
            Approve, edit, and deactivate institutional accounts to oversee which organisations have
            access to the platform and under what terms.
          </p>
        </div>

        <button
          className="ia-button ia-button--primary ia-add-button"
          type="button"
          onClick={() => {
            setSelected(null);
            setActionError('');
            setModal('create');
          }}
        >
          <Plus size={18} />
          Add Institution
        </button>
      </header>

      {notice && (
        <div className="ia-toast" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="ia-stats" aria-label="Institution account summary">
        <article className="ia-stat-card">
          <div className="ia-stat-card__icon ia-stat-card__icon--purple">
            <Landmark size={22} />
          </div>
          <div className="ia-stat-card__content">
            <span>Total Institutions</span>
            <strong>{loading ? '—' : totals.all}</strong>
            <small>Registered organisations</small>
          </div>
        </article>

        <article className="ia-stat-card">
          <div className="ia-stat-card__icon ia-stat-card__icon--green">
            <CheckCircle2 size={23} />
          </div>
          <div className="ia-stat-card__content">
            <span>Approved</span>
            <strong>{loading ? '—' : totals.approved}</strong>
            <small>Active and approved accounts</small>
          </div>
        </article>

        <article className="ia-stat-card">
          <div className="ia-stat-card__icon ia-stat-card__icon--amber">
            <Clock3 size={23} />
          </div>
          <div className="ia-stat-card__content">
            <span>Pending Approval</span>
            <strong>{loading ? '—' : totals.pending}</strong>
            <small>Awaiting administrator review</small>
          </div>
        </article>

        <article className="ia-stat-card">
          <div className="ia-stat-card__icon ia-stat-card__icon--red">
            <CircleMinus size={23} />
          </div>
          <div className="ia-stat-card__content">
            <span>Deactivated</span>
            <strong>{loading ? '—' : totals.deactivated}</strong>
            <small>Accounts with access revoked</small>
          </div>
        </article>
      </section>

      <section className="ia-panel">
        <div className="ia-panel__header">
          <div>
            <h2>Institutional Accounts</h2>
            <p>Manage, approve, edit and deactivate institutional accounts</p>
          </div>
          <span className="ia-panel__count">{totals.pending} pending</span>
        </div>

        <div className="ia-toolbar">
          <label className="ia-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by institution, email or registration number…"
              aria-label="Search institutions"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
              >
                <X size={16} />
              </button>
            )}
          </label>

          <select
            className="ia-select"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'all' | InstitutionStatus);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="deactivated">Deactivated</option>
          </select>

          <select
            className="ia-select"
            value={sectorFilter}
            onChange={(event) => {
              setSectorFilter(event.target.value as 'all' | InstitutionSector);
              setPage(1);
            }}
            aria-label="Filter by sector"
          >
            <option value="all">All Sectors</option>
            {SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>

          <button
            className={`ia-button ia-button--filter ${showFilters ? 'is-active' : ''}`}
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={17} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="ia-filter-drawer">
            <span>Quick status:</span>
            {(['all', 'pending', 'approved', 'deactivated'] as const).map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? 'is-selected' : ''}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
              >
                {status === 'all'
                  ? 'All accounts'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <button
              className="ia-filter-reset"
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSectorFilter('all');
                setSearch('');
                setPage(1);
              }}
            >
              Reset filters
            </button>
          </div>
        )}

        {loadError && (
          <div className="ia-error-banner" role="alert">
            <AlertCircle size={19} />
            <div>
              <strong>Could not load institution accounts</strong>
              <p>{loadError}</p>
            </div>
            <button
              className="ia-button ia-button--secondary"
              type="button"
              onClick={() => void loadInstitutions()}
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        <div className="ia-table-wrap">
          <table className="ia-table">
            <thead>
              <tr>
                <th className="ia-col-name">Institution Name</th>
                <th>Sector</th>
                <th>Contact Info</th>
                <th>Status</th>
                <th>Created</th>
                <th className="ia-col-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="ia-table-message">
                    <RefreshCw className="ia-spin" size={20} />
                    Loading institution accounts…
                  </td>
                </tr>
              ) : visibleInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ia-table-message">
                    <Building2 size={24} />
                    <strong>No institutions found</strong>
                    <span>Try another search or adjust the filters.</span>
                  </td>
                </tr>
              ) : (
                visibleInstitutions.map((institution) => (
                  <tr key={institution.id}>
                    <td>
                      <div className="ia-institution-cell">
                        <div className="ia-institution-cell__icon">
                          <SectorIcon sector={institution.sector} />
                        </div>
                        <div className="ia-institution-cell__text">
                          <Link
                            to={`/dashboard/admin/institutions/${institution.id}`}
                            className="ia-institution-link"
                          >
                            <strong>{institution.name}</strong>
                          </Link>
                          <span>Reg. No: {institution.registrationNumber}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="ia-sector-label">{institution.sector}</span>
                    </td>

                    <td>
                      <div className="ia-contact-cell">
                        {institution.email && (
                          <span>
                            <Mail size={13} /> {institution.email}
                          </span>
                        )}
                        {institution.phone && (
                          <span>
                            <Phone size={13} /> {institution.phone}
                          </span>
                        )}
                        {!institution.email && !institution.phone && <span>—</span>}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={institution.status} />
                    </td>

                    <td>
                      <div className="ia-created-cell">
                        <span>{formatDate(institution.createdAt)}</span>
                        <small>{institution.createdBy || 'System'}</small>
                      </div>
                    </td>

                    <td>
                      <div className="ia-row-actions">
                        <button
                          type="button"
                          className="ia-row-action ia-row-action--edit"
                          onClick={() => openEdit(institution)}
                          aria-label={`Edit ${institution.name}`}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        {institution.status === 'pending' ? (
                          <button
                            type="button"
                            className="ia-row-action ia-row-action--approve"
                            onClick={() => openConfirm(institution, 'approve')}
                          >
                            <Check size={15} />
                            Approve
                          </button>
                        ) : institution.status === 'deactivated' ? (
                          <button
                            type="button"
                            className="ia-row-action ia-row-action--approve"
                            onClick={() => openConfirm(institution, 'activate')}
                          >
                            <Check size={15} />
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ia-row-action ia-row-action--danger"
                            onClick={() => openConfirm(institution, 'deactivate')}
                          >
                            <CircleMinus size={14} />
                            Deactivate
                          </button>
                        )}

                        <button
                          className="ia-icon-button ia-row-more ia-row-delete"
                          type="button"
                          title="Delete (coming soon)"
                          aria-label={`Delete ${institution.name} (coming soon)`}
                          disabled
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="ia-table-footer">
          <span>
            {filtered.length === 0
              ? 'Showing 0 institutions'
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                  page * PAGE_SIZE,
                  filtered.length,
                )} of ${filtered.length} institutions`}
          </span>

          <nav className="ia-pagination" aria-label="Institution table pages">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={17} />
            </button>

            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .filter(
                (number) =>
                  pageCount <= 5 ||
                  number === 1 ||
                  number === pageCount ||
                  Math.abs(number - page) <= 1,
              )
              .map((number, index, numbers) => (
                <span className="ia-pagination__item" key={number}>
                  {index > 0 && number - numbers[index - 1] > 1 && <span>…</span>}
                  <button
                    type="button"
                    className={page === number ? 'is-current' : ''}
                    aria-current={page === number ? 'page' : undefined}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                </span>
              ))}

            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              <ChevronRight size={17} />
            </button>
          </nav>
        </footer>
      </section>

      {modal && (
        <InstitutionModal
          mode={modal}
          institution={selected}
          saving={saving}
          error={actionError}
          onClose={() => {
            if (!saving) {
              setModal(null);
              setSelected(null);
              setActionError('');
            }
          }}
          onSave={(form) => void saveInstitution(form)}
        />
      )}

      {confirmAction && selected && (
        <ConfirmDialog
          institution={selected}
          action={confirmAction}
          saving={saving}
          error={actionError}
          onCancel={() => {
            if (!saving) {
              setConfirmAction(null);
              setSelected(null);
              setActionError('');
            }
          }}
          onConfirm={() => void confirmStatusChange()}
        />
      )}
    </main>
  );
}

export default InstitutionAccountsPage;
