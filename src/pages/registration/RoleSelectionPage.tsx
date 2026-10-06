import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Hand, Ear, Home, Play, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { SelectableRole } from '../../types';
import logo from '../../assets/logo.jpeg';
import './RoleSelectionPage.css';

// V2-066: select role, store it locally, route to the matching registration form.

type RoleCard = {
  role: SelectableRole;
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  features: string[];
};

const CARDS: RoleCard[] = [
  {
    role: 'deaf',
    icon: <Hand size={20} />,
    badge: 'Watch in sign',
    title: "I'm Deaf or Hard of Hearing",
    description: 'Get an interpreter on video whenever you need one.',
    features: ['Free Deaf to Deaf chat', 'On-demand interpreted calls'],
  },
  {
    role: 'interpreter',
    icon: <Ear size={20} />,
    badge: 'Watch in sign',
    title: "I'm an Interpreter",
    description:
      'Provide professional sign-language interpretation and connect with people who need you.',
    features: ['Manage interpretation requests', 'Set your availability'],
  },
  {
    role: 'institution',
    icon: <Home size={20} />,
    badge: 'Watch in sign',
    title: 'I represent an Institution',
    description:
      'Make communication more accessible for your organisation, staff, students or clients.',
    features: [
      'Manage multiple users',
      'Request interpreters for your organisation',
    ],
  },
];

export function RoleSelectionPage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (role: SelectableRole) => {
    selectRole(role);
    navigate(`/register/${role}`);
  };

  return (
    <div className="rs-page">
      <header className="rs-header">
        <Link to="/" className="rs-logo">
          <img src={logo} alt="SignConnect" />
        </Link>
        <Link to="/" className="rs-back">
          <ArrowLeft size={16} /> Back
        </Link>
      </header>

      <main className="rs-main">
        <h1 className="rs-title">Who's joining SignConnect?</h1>
        <p className="rs-subtitle">
          Pick the one that fits you best. You can add another one later.
        </p>

        <div className="rs-cards">
          {CARDS.map((card) => (
            <button
  key={card.role}
  className="rs-card"
  onClick={() => handleSelect(card.role)}
  aria-label={card.title}
>
              <div className="rs-card-top">
                <span className="rs-card-icon">{card.icon}</span>
                <span className="rs-card-badge">
                  <Play size={10} /> {card.badge}
                </span>
              </div>
              <h2 className="rs-card-title">{card.title}</h2>
              <p className="rs-card-desc">{card.description}</p>
              <ul className="rs-card-features">
                {card.features.map((f) => (
                  <li key={f}>
                    <Check size={12} strokeWidth={3} /> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="rs-progress">
          <span className="rs-progress-segment active" />
          <span className="rs-progress-segment" />
          <span className="rs-progress-segment" />
        </div>
        <p className="rs-step">Step 1 of 3</p>
      </main>
    </div>
  );
}