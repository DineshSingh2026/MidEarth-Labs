import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

/**
 * Fixed, so the hero keeps its full viewport height and the background field
 * runs behind it uninterrupted. The scrim and blur live on a pseudo-element
 * that overhangs the header and masks out at its lower edge, so content
 * scrolling under stays dimmed without a hard seam across the page.
 */
export default function SiteHeader() {
  return (
    <header className="site-header rise" style={{ animationDelay: "300ms" }}>
      <div className="site-header-inner">
        <a className="brand" href="/" aria-label="MidEarth Labs, home">
          <Logo height={30} priority />
        </a>

        <div className="header-actions">
          <nav aria-label="Primary">
            <a className="nav-link" href="#integrations">
              Integrations
            </a>
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
