import Logo from "./Logo";

/** Statically prerendered, so this is the year of the last build. */
const YEAR = new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer id="site-footer" className="site-footer">
      <div className="site-footer-inner">
        <a className="brand" href="/" aria-label="MidEarth Labs, home">
          <Logo height={34} />
        </a>

        <p className="footer-note">
          Autonomous agents, your infrastructure, one chat.
        </p>

        <p className="footer-legal">© {YEAR} MidEarth Labs. All rights reserved.</p>
      </div>
    </footer>
  );
}
