import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { describeError } from '../../services/api';
import { getMyAccount, type MyAccount } from '../../services/auth';
import {
  getInstitutionOverview,
  type InstitutionOverview,
} from '../../services/institutionDashboard';
import '../../pages/deaf/SessionsPages.css';
import './StaffPages.css';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** The signed-in staff member's own details, and the institution they belong to. */
export function MyProfilePage() {
  const [account, setAccount] = useState<MyAccount | null>(null);
  const [institution, setInstitution] = useState<InstitutionOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMyAccount().then(
      (value) => !cancelled && setAccount(value),
      (err) => !cancelled && setError(describeError(err)),
    );
    getInstitutionOverview().then(
      (value) => !cancelled && setInstitution(value),
      () => undefined, // the institution is extra detail: the page works without it
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="sh-page">
      <header className="sh-header">
        <h1>Profile</h1>
        <p>Your details on SignConnect.</p>
      </header>

      {error && (
        <p className="sh-alert" role="alert">
          {error}
        </p>
      )}
      {!error && !account && <p className="sh-note">Loading your profile…</p>}

      {account && (
        <section className="sp-card" aria-label="Your details">
          <div className="sp-hero">
            <span className="sp-avatar" aria-hidden="true">
              {initials(account.name)}
            </span>
            <div>
              <strong>{account.name}</strong>
              <span>{institution ? institution.name : 'Institution staff'}</span>
            </div>
          </div>
          <dl className="sp-rows">
            <div>
              <dt>Full name</dt>
              <dd>{account.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {account.email ?? 'None on this account'}
                {account.email && (
                  <span className={account.emailVerified ? 'sp-badge' : 'sp-badge sp-badge--warn'}>
                    {account.emailVerified ? 'Verified' : 'Not verified'}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{account.phone}</dd>
            </div>
            {institution && (
              <>
                <div>
                  <dt>Institution</dt>
                  <dd>{institution.name}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{institution.role === 'ADMIN' ? 'Administrator' : 'Staff'}</dd>
                </div>
              </>
            )}
          </dl>
          <p>
            To change your name or phone number, ask your institution’s administrator. You can
            change your password in <Link to="/dashboard/staff/settings">Settings</Link>.
          </p>
        </section>
      )}
    </div>
  );
}
