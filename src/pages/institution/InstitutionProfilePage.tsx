import { User, Mail, Phone, Building2, Briefcase, Pencil } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './InstitutionProfilePage.css';

export function InstitutionProfilePage() {
  const { session } = useAuth();

  // Get the real user data from the auth session
  const userName = session?.user?.name || 'Loading...';
  const userEmail = session?.user?.email || 'No email provided';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  // These will eventually come from your backend API
  const profileData = {
    role: '—',
    institution: '—',
    phone: '—',
    status: 'Active',
  };

  return (
    <div className="profile-page">
      {/* Top Header */}
      <header className="profile-header">
        <div className="profile-header-text">
          <h1>Profile</h1>
          <p>View and update your personal information.</p>
        </div>
        <button className="edit-profile-btn">
          <Pencil size={16} /> Edit Profile
        </button>
      </header>

      {/* Hero Profile Card */}
      <section className="profile-hero-card">
        <div className="profile-avatar-large">{initials || 'U'}</div>
        <div className="profile-hero-info">
          <h2>{userName}</h2>
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
              <span className="detail-value">{userName}</span>
            </div>
          </div>

          {/* Email */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Mail size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">EMAIL</span>
              <span className="detail-value">{userEmail}</span>
            </div>
          </div>

          {/* Phone */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Phone size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">PHONE</span>
              <span className="detail-value">{profileData.phone}</span>
            </div>
          </div>

          {/* Institution */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Building2 size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">INSTITUTION</span>
              <span className="detail-value">{profileData.institution}</span>
            </div>
          </div>

          {/* Role */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Briefcase size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">ROLE</span>
              <span className="detail-value">{profileData.role}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
