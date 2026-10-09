import { useState } from 'react'; // <-- Added useState
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { SelectableRole } from '../../types';

import logo from '../../assets/no_background_logo.png';
import deafUserImg from '../../assets/deafuser2.png';
import interpreterImg from '../../assets/interpreter4.png';
import institutionImg from '../../assets/institution.png';

import './RoleSelectionPage.css';

type RoleCard = {
  role: SelectableRole;
  title: string;
  description: string;
  image: string;
};

const CARDS: RoleCard[] = [
  {
    role: 'deaf',
    title: 'Deaf or Hard of Hearing',
    description: 'Get an interpreter on video whenever you need one.',
    image: deafUserImg,
  },
  {
    role: 'interpreter',
    title: 'Interpreter',
    description:
      'Provide professional sign-language interpretation and connect with people who need you.',
    image: interpreterImg,
  },
  {
    role: 'institution',
    title: 'Institution',
    description:
      'Make communication more accessible for your organisation, staff, students or clients.',
    image: institutionImg,
  },
];

export function RoleSelectionPage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  // Track which card is currently selected
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);

  const handleSelect = (role: SelectableRole) => {
    setSelectedRole(role); // Highlight the card immediately
    selectRole(role);

    // Small delay so the user sees the card "come forward" before navigating
    setTimeout(() => {
      navigate(`/register/${role}`);
    }, 150);
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
              // Add the 'selected' class if this is the active card
              className={`rs-card ${selectedRole === card.role ? 'selected' : ''}`}
              onClick={() => handleSelect(card.role)}
              aria-label={card.title}
            >
              <img src={card.image} alt="" className="rs-card-bg-image" />

              <div className="rs-card-text-overlay">
                <h2 className="rs-card-title">{card.title}</h2>
                <p className="rs-card-desc">{card.description}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
