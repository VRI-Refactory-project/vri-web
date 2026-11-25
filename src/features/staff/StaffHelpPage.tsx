import { PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { describeError } from '../../services/api';
import { saveTutorial } from '../../services/staffTutorial';
import { HelpSupportPage } from '../support/HelpSupportPage';
import './StaffPages.css';

/** Starts the first-sign-in tutorial again from the first step, on the dashboard (V2-065). */
function ReplayTutorial() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const replay = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveTutorial({ action: 'restart' });
      navigate('/dashboard/staff');
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  };

  return (
    <section className="sp-card" aria-labelledby="sh-tour">
      <h2 id="sh-tour">New to SignConnect?</h2>
      <p>A one-minute tour shows where everything is on your dashboard.</p>
      {error && <p role="alert">{error}</p>}
      <button type="button" className="sh-tour-btn" onClick={() => void replay()} disabled={busy}>
        <PlayCircle size={18} aria-hidden="true" /> Take the tour again
      </button>
    </section>
  );
}

export function StaffHelpPage() {
  return <HelpSupportPage audience="institution_staff" extraContent={<ReplayTutorial />} />;
}
