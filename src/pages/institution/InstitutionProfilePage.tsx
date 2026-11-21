
import { useEffect, useState } from 'react';
import {
  Building2,
  Pencil,
  X,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchMyInstitutionAccount,
  updateMyInstitutionAccount,
  type MyInstitutionAccount,
  type OrganisationType,
} from '../../services/institutions';
import { ApiError } from '../../services/api';
import './InstitutionProfilePage.css';

const ORGANISATION_TYPES: { value: OrganisationType; label: string }[] = [
  { value: 'HOSPITAL', label: 'Hospital / health facility' },
  { value: 'COURT', label: 'Court / legal' },
  { value: 'GOVERNMENT', label: 'Government office' },
  { value: 'SCHOOL', label: 'School or Institution' },
  { value: 'POLICE', label: 'Police Station' },
  { value: 'CHURCH', label: 'Church' },
  { value: 'OTHER', label: 'Other' },
];

const EMPTY_PROFILE: MyInstitutionAccount = {
  organisation_name: '',
  organisation_type: 'SCHOOL',
  organisation_type_other: '',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function InstitutionProfilePage() {
  const [profile, setProfile] = useState<MyInstitutionAccount>(EMPTY_PROFILE);
  const [editForm, setEditForm] = useState<MyInstitutionAccount>(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setError('');

        const data = await fetchMyInstitutionAccount();

        if (active) {
          setProfile(data);
          setEditForm(data);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const initials = profile.organisation_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  const selectedType = ORGANISATION_TYPES.find(
    (type) => type.value === profile.organisation_type,
  );

  function handleEdit() {
    setEditForm({ ...profile });
    setError('');
    setSuccess('');
    setIsEditing(true);
  }

  function handleCancel() {
    setEditForm({ ...profile });
    setError('');
    setIsEditing(false);
  }

  async function handleSave() {
    setError('');
    setSuccess('');

    if (!editForm.organisation_name.trim()) {
      setError('Organisation name is required.');
      return;
    }

    if (
      editForm.organisation_type === 'OTHER' &&
      !editForm.organisation_type_other.trim()
    ) {
      setError('Please specify the type of organisation.');
      return;
    }

    try {
      setIsSaving(true);

      const response = await updateMyInstitutionAccount({
        organisation_name: editForm.organisation_name.trim(),
        organisation_type: editForm.organisation_type,
        organisation_type_other:
          editForm.organisation_type === 'OTHER'
            ? editForm.organisation_type_other.trim()
            : '',
      });

      setProfile(response.updated_data);
      setEditForm(response.updated_data);
      setIsEditing(false);
      setSuccess(response.message || 'Institution profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="profile-page profile-loading">
        <Loader2 className="spin" size={24} />
        <p>Loading institution profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-header-text">
          <h1>Institution Profile</h1>
          <p>View and update your organisation's information.</p>
        </div>

        {!isEditing && (
          <button className="edit-profile-btn" onClick={handleEdit}>
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </header>

      {error && (
        <div className="profile-message profile-error" role="alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="profile-message profile-success" role="status">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <section className="profile-hero-card">
        <div className="profile-avatar-large">
          {initials || <Building2 size={30} />}
        </div>

        <div className="profile-hero-info">
          <h2>{profile.organisation_name || 'Institution'}</h2>
          <p>
            {selectedType?.label || profile.organisation_type}
            {profile.organisation_type === 'OTHER' &&
              profile.organisation_type_other &&
              ` · ${profile.organisation_type_other}`}
          </p>
        </div>
      </section>

      <section className="profile-details-card">
        <h3 className="profile-details-title">Organisation information</h3>

        <div className="profile-details-list">
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Building2 size={18} />
            </div>

            <div className="profile-detail-text">
              <span className="detail-label">ORGANISATION NAME</span>

              {isEditing ? (
                <input
                  className="profile-input"
                  value={editForm.organisation_name}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      organisation_name: event.target.value,
                    })
                  }
                  maxLength={200}
                  required
                />
              ) : (
                <span className="detail-value">
                  {profile.organisation_name || '—'}
                </span>
              )}
            </div>
          </div>

          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Building2 size={18} />
            </div>

            <div className="profile-detail-text">
              <span className="detail-label">ORGANISATION TYPE</span>

              {isEditing ? (
                <select
                  className="profile-input"
                  value={editForm.organisation_type}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      organisation_type: event.target.value as OrganisationType,
                      organisation_type_other: '',
                    })
                  }
                >
                  {ORGANISATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="detail-value">
                  {selectedType?.label || profile.organisation_type}
                </span>
              )}
            </div>
          </div>

          {editForm.organisation_type === 'OTHER' && (
            <div className="profile-detail-row">
              <div className="profile-icon-wrap">
                <Building2 size={18} />
              </div>

              <div className="profile-detail-text">
                <span className="detail-label">SPECIFY ORGANISATION TYPE</span>

                {isEditing ? (
                  <input
                    className="profile-input"
                    value={editForm.organisation_type_other}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        organisation_type_other: event.target.value,
                      })
                    }
                    maxLength={100}
                    placeholder="Enter organisation type"
                    required
                  />
                ) : (
                  <span className="detail-value">
                    {profile.organisation_type_other || '—'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="profile-edit-actions">
            <button
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X size={16} />
              Cancel
            </button>

            <button
              className="btn-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="spin" size={16} />
              ) : (
                <Check size={16} />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

