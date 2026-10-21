import { useEffect, useState } from 'react';
import { describeError } from '../../services/api';
import {
  getInterpreterProfile,
  type InterpreterPublicProfile,
} from '../../services/availableInterpreters';
import { Modal } from '../../components/Modal';

interface Props {
  interpreterId: number;
  onClose: () => void;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** An interpreter's public profile, opened from the Deaf dashboard. Shows no contact details. */
export function InterpreterProfileModal({ interpreterId, onClose }: Props) {
  const [profile, setProfile] = useState<InterpreterPublicProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getInterpreterProfile(interpreterId).then(
      (data) => {
        if (!cancelled) setProfile(data);
      },
      (err) => {
        if (!cancelled) setError(describeError(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [interpreterId]);

  return (
    <Modal title="Interpreter profile" onClose={onClose}>
      {error && (
        <p className="modal__text" role="alert">
          {error}
        </p>
      )}
      {!profile && !error && <p className="modal__text">Loading…</p>}
      {profile && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name}
                style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#e5e7eb',
                  color: '#374151',
                  fontSize: 32,
                  fontWeight: 600,
                }}
              >
                {initials(profile.name)}
              </div>
            )}
          </div>
          <h2 className="modal__title">{profile.name}</h2>
          <p className="modal__text">
            {profile.availableNow ? 'Available now' : 'Not available right now'}
          </p>
          <p className="modal__text">
            <strong>Sign languages:</strong>{' '}
            {profile.signLanguages.length > 0 ? profile.signLanguages.join(', ') : 'Not listed'}
            <br />
            <strong>Specialisation:</strong> {profile.specialisation}
          </p>
        </>
      )}
      <button className="modal__primary" type="button" onClick={onClose}>
        Close
      </button>
    </Modal>
  );
}
