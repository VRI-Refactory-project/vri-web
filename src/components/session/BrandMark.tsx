import logo from '../../assets/logo-icon.png';
import './BrandMark.css';

/** The SignConnect logo and name, shown at the top-left of every session screen. */
export function BrandMark() {
  return (
    <span className="ls-brand">
      <img className="ls-brand__logo" src={logo} alt="" />
      SignConnect
    </span>
  );
}

/**
 * The SignConnect logo on a white disc, where the app used to show a video camera (the Join and
 * Connect buttons, the Connect card, the "looking for an interpreter" circle). The disc keeps the
 * purple logo visible on purple. Decoration only: the words next to it say what it is.
 */
export function LogoDisc({ size = 26 }: { size?: number }) {
  return (
    <span className="logo-disc" style={{ width: size, height: size }} aria-hidden="true">
      <img src={logo} alt="" />
    </span>
  );
}
