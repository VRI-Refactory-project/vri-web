import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import './StaffAccountCreatedPage.css';

export function StaffAccountCreatedPage() {
  const location = useLocation();
  const state = (location.state as { name?: string } | null) ?? {};
  const name = state.name ?? 'The new staff member';

  return (
    <>
      {/* Back link at the top */}
      <Link to="/dashboard/institution/staff" className="sac-back">
        ← Back
      </Link>

      {/* Confirmation card */}
      <div className="sac-card">
        <div className="sac-icon-wrap" aria-hidden="true">
          <Check size={22} strokeWidth={3} />
        </div>

        <h1 className="sac-title">Staff account created</h1>

        <p className="sac-subtitle">
          {name}’s account has been created and an invite email has been sent to their work address.
        </p>

        <Link to="/dashboard/institution/staff/new" className="sac-btn sac-btn--primary">
          Add another staff member
        </Link>

        <Link to="/dashboard/institution/staff" className="sac-btn sac-btn--outline">
          Back to staff list
        </Link>
      </div>
    </>
  );
}
