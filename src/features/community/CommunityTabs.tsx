import { NavLink } from 'react-router-dom';
import './Community.css';

export const MESSAGES_PATH = '/dashboard/deaf/messages';
export const COMMUNITY_PATH = '/dashboard/deaf/messages/community';

/** Switches between your conversations and finding people. */
export function CommunityTabs() {
  return (
    <nav className="cm-tabs" aria-label="Chat sections">
      <NavLink to={MESSAGES_PATH} end>
        Messages
      </NavLink>
      <NavLink to={COMMUNITY_PATH}>Community</NavLink>
    </nav>
  );
}
