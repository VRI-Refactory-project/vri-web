import { Link, useNavigate } from 'react-router-dom';
import { User, Video, Lock, ArrowRight } from 'lucide-react';
import interpreter from '../../assets/interpreter5.jpg';
import logo from '../../assets/no_bg.png';
import './LandingPage.css';

// Landing page: public marketing entry point.
// "Get Started" and "Sign Up" both lead into role selection at /get-started.

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Decorative light sweep: starts at the bottom centre and curves up to the right, behind the photo. */}
      <svg
        className="landing-sweep"
        viewBox="0 0 1673 940"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sweepFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="0.8" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="sweepBlur" x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
          <filter id="lineBlur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>
        <path
          d="M520 990 C820 900 1120 890 1380 790 S1620 660 1730 600 L1730 1000 Z"
          fill="#e2d6ff"
          fillOpacity="0.45"
          filter="url(#sweepBlur)"
        />
        <path
          d="M560 945 C860 880 1150 860 1400 770 S1620 680 1720 630"
          fill="none"
          stroke="url(#sweepFade)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#lineBlur)"
        />
        <path
          d="M1460 140 C1560 108 1640 112 1710 138"
          fill="none"
          stroke="#c4b5fd"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <header className="landing-header">
        <Link to="/" className="landing-logo" aria-label="SignConnect home">
          <img src={logo} alt="SignConnect" className="landing-logo-img" />
        </Link>
        <nav className="landing-nav" aria-label="Main">
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
          <h1 className="landing-title">
            Communication
            <br /> Anytime, Anywhere
          </h1>

          <p className="landing-subtitle">
            Break down language barriers with instant access to certified sign language interpreters
            on demand. SignConnect ensures everyone is heard.
          </p>

          <p className="landing-subtitle">Your partner, where you meet</p>

          <ul className="landing-features">
            <li>
              <span className="landing-feature-icon">
                <User size={20} />
              </span>
              Verified Interpreters
            </li>
            <li>
              <span className="landing-feature-icon">
                <Video size={20} />
              </span>
              HD Video
            </li>
            <li>
              <span className="landing-feature-icon">
                <Lock size={20} />
              </span>
              Secure Sessions
            </li>
          </ul>

          <button className="landing-cta" onClick={() => navigate('/get-started')}>
            Get Started
            <ArrowRight size={28} />
          </button>
        </div>

        <div className="landing-hero-right">
          {/* Two soft white layers behind the frame make the glow around the photo. */}
          <div className="landing-halo landing-halo-wide" aria-hidden="true" />
          <div className="landing-halo landing-halo-close" aria-hidden="true" />

          <div className="landing-frame">
            <div className="landing-photo">
              <img
                className="landing-hero-image"
                src={interpreter}
                alt="Sign language interpreter"
              />
              <div className="landing-status-pill">Interpreter available now</div>
              <p className="landing-caption">Session in progress - inclusive meeting</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
