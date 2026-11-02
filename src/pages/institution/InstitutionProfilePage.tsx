import { useState } from 'react';
import { User, Mail, Phone, Building2, Briefcase, Pencil, X, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './InstitutionProfilePage.css';

export function InstitutionProfilePage() {
  const { session } = useAuth();

  // 1. State to manage the data
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '—',
    institution: '—',
    role: '—',
    status: 'Active',
  });

  // 2. State to toggle Edit Mode
  const [isEditing, setIsEditing] = useState(false);

  // 3. State to hold the temporary data while editing
  const [editForm, setEditForm] = useState(profileData);

  // Get initials dynamically
  const initials = profileData.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  // 4. Handle Save
  const handleSave = () => {
    // Here you would normally make an API call to update the backend
    // await api('/api/v1/users/profile/', { method: 'PATCH', body: JSON.stringify(editForm) });

    setProfileData(editForm); // Update the view
    setIsEditing(false); // Exit edit mode
  };

  // 5. Handle Cancel
  const handleCancel = () => {
    setEditForm(profileData); // Reset form back to original data
    setIsEditing(false); // Exit edit mode
  };

  return (
    <div className="profile-page">
      {/* Top Header */}
      <header className="profile-header">
        <div className="profile-header-text">
          <h1>Profile</h1>
          <p>View and update your personal information.</p>
        </div>

        {/* Show Edit button only if NOT editing */}
        {!isEditing && (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            <Pencil size={16} /> Edit Profile
          </button>
        )}
      </header>

      {/* Hero Profile Card */}
      <section className="profile-hero-card">
        <div className="profile-avatar-large">{initials || 'U'}</div>
        <div className="profile-hero-info">
          <h2>{profileData.name || 'Loading...'}</h2>
          <p>
            {profileData.role} · {profileData.institution}
          </p>
          <span className="status-badge-active">{profileData.status}</span>
        </div>
      </section>

      {/* Details Card */}
      <section className="profile-details-card">
        <h3 className="profile-details-title">Personal information</h3>

        <div className="profile-details-list">
          {/* Full Name */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <User size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">FULL NAME</span>
              {isEditing ? (
                <input
                  className="profile-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              ) : (
                <span className="detail-value">{profileData.name || '—'}</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Mail size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">EMAIL</span>
              {isEditing ? (
                <input
                  className="profile-input"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              ) : (
                <span className="detail-value">{profileData.email || '—'}</span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Phone size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">PHONE</span>
              {isEditing ? (
                <input
                  className="profile-input"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+256..."
                />
              ) : (
                <span className="detail-value">{profileData.phone || '—'}</span>
              )}
            </div>
          </div>

          {/* Institution */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Building2 size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">INSTITUTION</span>
              {isEditing ? (
                <input
                  className="profile-input"
                  value={editForm.institution}
                  onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                />
              ) : (
                <span className="detail-value">{profileData.institution || '—'}</span>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Briefcase size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">ROLE</span>
              {isEditing ? (
                <input
                  className="profile-input"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                />
              ) : (
                <span className="detail-value">{profileData.role || '—'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Show Save/Cancel buttons only if editing */}
        {isEditing && (
          <div className="profile-edit-actions">
            <button className="btn-cancel" onClick={handleCancel}>
              <X size={16} /> Cancel
            </button>
            <button className="btn-save" onClick={handleSave}>
              <Check size={16} /> Save Changes
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
