import { Link, useNavigate } from 'react-router-dom';
import { User, Video, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import interpreter from '../../assets/interpreter5.jpg';
import interpreter2 from '../../assets/interpreter2.png';
import logoIcon from '../../assets/logo-icon.png';
import logoWord from '../../assets/logo-wordmark.png';
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
        {/* The icon and the word are separate images, so the icon can be bigger than the word. */}
        <Link to="/" className="landing-logo" aria-label="SignConnect home">
          <img src={logoIcon} alt="" className="landing-logo-icon" />
          <img src={logoWord} alt="" className="landing-logo-word" />
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
          <span className="landing-badge">
            <ShieldCheck size={16} aria-hidden="true" />
            Secure Video Interpreting
          </span>

          <h1 className="landing-title">
            Inclusive Communication.
            <br /> Anytime , Anywhere
          </h1>

          <p className="landing-subtitle">
            Connect instantly with certified sign language interpreters, or schedule
            ahead.SignConnect ensures everyone is heard.
          </p>

          <button className="landing-cta" onClick={() => navigate('/get-started')}>
            Get Started
            <ArrowRight size={22} aria-hidden="true" />
          </button>

          <p className="landing-subtitle">Your partner, where you meet</p>

          <ul className="landing-features">
            <li>
              <span className="landing-feature-icon">
                <User size={16} aria-hidden="true" />
              </span>
              Verified Interpreters
            </li>
            <li>
              <span className="landing-feature-icon">
                <Video size={16} aria-hidden="true" />
              </span>
              HD Video
            </li>
            <li>
              <span className="landing-feature-icon">
                <Lock size={16} aria-hidden="true" />
              </span>
              Secure Sessions
            </li>
          </ul>
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
              <div className="landing-pip">
                <img src={interpreter2} alt="Remote user preview" />
              </div>
              <div className="landing-status-pill">
                <span className="landing-status-dot" aria-hidden="true" />
                Interpreter available now
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
