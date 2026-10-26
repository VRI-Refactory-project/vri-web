import { useState } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import './InstitutionSettingsPage.css';

export function InstitutionSettingsPage() {
  // State for toggles
  const [notifications, setNotifications] = useState({
    sessionUpdates: true,
    chat: true,
    sessionRequests: true,
    system: false,
  });

  const [twoFactor, setTwoFactor] = useState(false);
  
  // State to show the success banner
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Manage your notifications, security and account preferences.</p>
      </header>

      {/* Success Banner */}
      {showSuccess && (
        <div className="success-banner">
          <CheckCircle2 size={18} className="success-icon" />
          <span>Your changes have been saved.</span>
        </div>
      )}

      {/* 1. Notifications Section */}
      <section className="settings-card">
        <div className="settings-card-header">
          <h2>Notifications</h2>
          <p>Choose what you want to be notified about.</p>
        </div>
        
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>Session updates</h3>
              <p>Get notified when a session starts, ends or drops.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.sessionUpdates} 
                onChange={() => toggleNotification('sessionUpdates')} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h3>Chat</h3>
              <p>Get notified about new chat messages.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.chat} 
                onChange={() => toggleNotification('chat')} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h3>Session requests</h3>
              <p>Get notified when an interpreter is scheduled for you.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.sessionRequests} 
                onChange={() => toggleNotification('sessionRequests')} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h3>System notifications</h3>
              <p>Product updates and maintenance notices.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.system} 
                onChange={() => toggleNotification('system')} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </section>

      {/* 2. Communication Preferences */}
      <section className="settings-card">
        <div className="settings-card-header">
          <h2>Communication preferences</h2>
          <p>Set how SignConnect communicates with you.</p>
        </div>
        
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>Preferred language</h3>
              <p>Used for notifications and interface text.</p>
            </div>
            <select className="settings-select" defaultValue="en">
              <option value="en">English</option>
              <option value="ug">Ugandan Sign Language</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. Security */}
      <section className="settings-card">
        <div className="settings-card-header">
          <h2>Security</h2>
          <p>Manage how your account is protected.</p>
        </div>
        
        <div className="settings-list">
          <div className="settings-item clickable" onClick={() => alert('Change password modal here')}>
            <div className="settings-item-info">
              <h3>Change password</h3>
              <p>Update the password used to sign in.</p>
            </div>
            <ChevronRight size={20} className="text-muted" />
          </div>
        </div>
      </section>

      {/* 4. Account */}
      <section className="settings-card">
        <div className="settings-card-header">
          <h2>Account</h2>
          <p>Manage your session on this device.</p>
        </div>
        
        <div className="settings-list">
          <div className="settings-item clickable" onClick={() => alert('Sign out logic here')}>
            <div className="settings-item-info text-danger">
              <h3>Sign out</h3>
              <p>Sign out of SignConnect on this device.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}