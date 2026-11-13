import logo from '../../assets/logo-icon.png';

/** The SignConnect logo and name, shown at the top-left of every session screen. */
export function BrandMark() {
  return (
    <span className="ls-brand">
      <img className="ls-brand__logo" src={logo} alt="" />
      SignConnect
    </span>
  );
}
