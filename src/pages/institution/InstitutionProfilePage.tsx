import { User, Mail, Phone, Building2, Briefcase, Pencil } from 'lucide-react';
import './InstitutionProfilePage.css';

// Mock data based on your screenshot.
// In the future, you can replace this with `const { session } = useAuth();`
const MOCK_PROFILE = {
  name: 'Sarah Kimuli',
  role: 'ER Nurse',
  institution: 'Northside Medical Center',
  email: 'sarah.kimuli@northsidemedical.org',
  phone: '+256 700 123 456',
  status: 'Active',
  initials: 'SK',
};

export function InstitutionProfilePage() {
  return (
    <div className="profile-page">
      {/* Top Header */}
      <header className="profile-header">
        <div>
          <h1>Profile</h1>
          <p>View and update your personal information.</p>
        </div>
        <button className="edit-profile-btn">
          <Pencil size={16} /> Edit Profile
        </button>
      </header>

      {/* Hero Profile Card */}
      <section className="profile-hero-card">
        <div className="profile-avatar-large">{MOCK_PROFILE.initials}</div>
        <div className="profile-hero-info">
          <h2>{MOCK_PROFILE.name}</h2>
          <p>
            {MOCK_PROFILE.role} · {MOCK_PROFILE.institution}
          </p>
          <span className="status-badge-active">{MOCK_PROFILE.status}</span>
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
              <span className="detail-value">{MOCK_PROFILE.name}</span>
            </div>
          </div>

          {/* Email */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Mail size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">EMAIL</span>
              <span className="detail-value">{MOCK_PROFILE.email}</span>
            </div>
          </div>

          {/* Phone */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Phone size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">PHONE</span>
              <span className="detail-value">{MOCK_PROFILE.phone}</span>
            </div>
          </div>

          {/* Institution */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Building2 size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">INSTITUTION</span>
              <span className="detail-value">{MOCK_PROFILE.institution}</span>
            </div>
          </div>

          {/* Role */}
          <div className="profile-detail-row">
            <div className="profile-icon-wrap">
              <Briefcase size={18} />
            </div>
            <div className="profile-detail-text">
              <span className="detail-label">ROLE</span>
              <span className="detail-value">{MOCK_PROFILE.role}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
