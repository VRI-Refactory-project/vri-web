import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/no_bg.png';
import backgroundImage from '../assets/background_image.png';
import { StepProgress } from './StepProgress';
import './AuthShell.css';

// The one frame every sign-up, sign-in and recovery screen sits in, so nothing jumps when a
// person moves between them: logo top-left, Back top-right, the step list on the left of the
// content card, the card in the middle. Pages only decide what goes inside the card.

interface AuthShellProps {
  children: ReactNode;
  /** The named steps of the flow (see features/registration/flows.ts). Leave out on screens that
   *  are not part of a sign-up flow, such as sign-in and recovery. */
  steps?: readonly string[];
  /** 1-based position of this screen in `steps`. */
  current?: number;
  /** Where Back goes. Use `onBack` instead when it needs code rather than a link. */
  backTo?: string;
  onBack?: () => void;
  /** `form` is a narrow card, `wide` fits the three role cards. */
  size?: 'form' | 'wide';
  /** Skip the white card when the content already draws its own cards. */
  bare?: boolean;
  logo?: string;
}

export function AuthShell({
  children,
  steps,
  current = 1,
  backTo,
  onBack,
  size = 'form',
  bare = false,
    logo: logoOverride,
}: AuthShellProps) {
  return (
    <div className="as-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <header className="as-header">
        <Link to="/" className="as-logo">
         <img src={logoOverride ?? logo} alt="SignConnect" />
        </Link>

        <div className="as-back-cell">
          {backTo ? (
            <Link to={backTo} className="as-back">
              <ArrowLeft size={16} /> Back
            </Link>
          ) : onBack ? (
            <button type="button" className="as-back" onClick={onBack}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : null}
        </div>
      </header>

      <main className={`as-main as-main--${size}`}>
        <div className="as-steps-slot">
          {steps && <StepProgress steps={steps} current={current} />}
        </div>
        {bare ? children : <div className="as-card">{children}</div>}
      </main>
    </div>
  );
}
