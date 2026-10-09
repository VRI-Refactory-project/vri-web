import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Check, Video, Lock } from 'lucide-react';
import interpreter from '../../assets/interpreter.jpeg';
import interpreter2 from '../../assets/interpreter2.png';
import logo from '../../assets/no_bg.png';
import './LandingPage.css';

// Landing page: public marketing entry point.
// "Get Started" and "Sign Up" both lead into role selection at /get-started.

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          <img src={logo} alt="SignConnect" className="landing-logo-img" />
        </Link>
        <nav className="landing-nav">
          <Link to="/sign-in" className="landing-login">
            Login
          </Link>
          <button className="landing-signup" onClick={() => navigate('/get-started')}>
            Sign Up
          </button>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-left">
          <span className="landing-badge">
            <ShieldCheck size={14} />
            Secure video interpreting
          </span>

          <h1 className="landing-title">SignConnect</h1>

          <p className="landing-subtitle">
            Connect instantly with certified sign-language interpreters, or schedule ahead.
          </p>

          <button className="landing-cta" onClick={() => navigate('/get-started')}>
            Get Started →
          </button>

          <ul className="landing-features">
            <li>
              <Check size={14} strokeWidth={3} /> Verified interpreters
            </li>
            <li>
              <Video size={14} /> HD video
            </li>
            <li>
              <Lock size={14} /> Secure sessions
            </li>
          </ul>
        </div>

        <div className="landing-hero-right">
          <img className="landing-hero-image" src={interpreter} alt="Sign language interpreter" />
          <div className="landing-pip">
            <img src={interpreter2} alt="Remote user preview" />
          </div>
          <div className="landing-status-pill">
            <span className="landing-status-dot" />
            Interpreter available now
          </div>
        </div>
      </section>
    </div>
  );
}
