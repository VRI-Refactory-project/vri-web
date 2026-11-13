import { ChevronLeft, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../pages/deaf/SessionsPages.css';
import './StaffPages.css';

/** Chat is built for Deaf users first, so staff see where it will appear. */
export function StaffChatPage() {
  return (
    <div className="sh-page">
      <Link to="/dashboard/staff" className="sh-back">
        <ChevronLeft size={18} aria-hidden /> Back
      </Link>
      <header className="sh-header">
        <h1>Chat</h1>
        <p>Messages with interpreters and support.</p>
      </header>
      <section className="sp-empty" aria-label="Chat">
        <span className="sh-card-icon">
          <MessageSquare size={22} aria-hidden />
        </span>
        <strong>Chat is not available for staff yet</strong>
        <span>Your conversations will show up here as soon as chat opens for institutions.</span>
      </section>
    </div>
  );
}
