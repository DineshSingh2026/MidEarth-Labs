const TARGET = "https://chandu-dev.tailae0280.ts.net/";

/**
 * The page's only interactive element. Rendered as an anchor, not a button
 * with a redirect handler, so middle-click and cmd-click behave.
 * Both instances on the page are this component with no props — there is
 * no variant, and no way for the two to drift apart.
 */
export default function LaunchButton() {
  return (
    <span className="cta-enter">
      <a className="cta t-cta" href={TARGET} target="_blank" rel="noopener noreferrer">
        <span className="cta-mark" aria-hidden="true">
          ✦
        </span>
        LAUNCH AGENT
      </a>
    </span>
  );
}
