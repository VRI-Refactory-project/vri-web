import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import logo from '../../assets/no_background_logo.png';
import backgroundImage from '../../assets/background_image.png';
import './CreateAccountPage.css';

// V2-001 / V2-002: Create account page (Step 2 of 3).
// Reached from /get-started via /register/deaf.
// Background photo, centered card, email/phone toggle, password reveal.

export function CreateAccountPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="ca-page"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Link to="/" className="ca-logo">
        <img src={logo} alt="SignConnect" />
      </Link>

      <Link to="/get-started" className="ca-back">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="ca-card">
        <h1 className="ca-title">Create your account</h1>
        <p className="ca-subtitle">
          Watch the video for help in sign language.
        </p>

        <div className="ca-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`ca-tab ${method === 'email' ? 'active' : ''}`}
            onClick={() => setMethod('email')}
          >
            <Mail size={16} /> Email
          </button>
          <button
            type="button"
            role="tab"
            className={`ca-tab ${method === 'phone' ? 'active' : ''}`}
            onClick={() => setMethod('phone')}
          >
            <Phone size={16} /> Phone
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: wire to API later
            navigate('/register/deaf/verify');
          }}
        >
          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-email">
              {method === 'email' ? 'Email address' : 'Phone number'}
            </label>
            <div className="ca-input-wrap">
              <span className="ca-input-icon">
                {method === 'email' ? <Mail size={16} /> : <Phone size={16} />}
              </span>
              <input
                id="ca-email"
                className="ca-input"
                type={method === 'email' ? 'email' : 'tel'}
                placeholder={method === 'email' ? 'name@example.com' : '+256 700 000 000'}
                autoComplete={method === 'email' ? 'email' : 'tel'}
              />
            </div>
          </div>

          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-password">
              Password
            </label>
            <div className="ca-input-wrap">
              <span className="ca-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="ca-password"
                className="ca-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="ca-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="ca-terms">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="/terms">Terms</a> and{' '}
              <a href="/privacy">Privacy Policy</a>
            </span>
          </label>

          <button type="submit" className="ca-submit">
            Create account <ChevronRight size={18} />
          </button>
        </form>

        <p className="ca-footer">
          Have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      </div>

      <div className="ca-welcome">
        <div className="ca-welcome-text">
          Welcome! I'll walk you through creating your account, one step at a time.
        </div>
      </div>

      <div className="ca-step">
        <div className="ca-progress">
          <span className="ca-progress-segment active" />
          <span className="ca-progress-segment active" />
          <span className="ca-progress-segment" />
        </div>
        <p className="ca-step-text">Step 2 of 3</p>
      </div>
    </div>
  );
}