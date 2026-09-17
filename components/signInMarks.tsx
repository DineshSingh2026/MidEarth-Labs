import { BRANDS } from "./brandMarks";

/*
  Marks for the sign-in card. Google, Microsoft and the wallets are drawn here
  rather than vendored by scripts/gen-brand-marks.mjs: simple-icons carries no
  Microsoft or MetaMask mark, and its Coinbase and OKX entries are wordmarks,
  which turn to mush at 20px. GitHub reuses the directory's vendored path.

  Every mark is decorative — the button beside it carries the name.
*/

type MarkProps = { size?: number };

const svgProps = (size: number, viewBox: string) => ({
  viewBox,
  width: size,
  height: size,
  "aria-hidden": true,
  focusable: false,
});

export function GoogleMark({ size = 20 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 48 48")}>
      <path
        fill="#FBBC05"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#EA4335"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#4285F4"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

export function MicrosoftMark({ size = 20 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 21 21")}>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

/** Near-black brand, so it takes the text colour and flips with the theme. */
export function GitHubMark({ size = 20 }: MarkProps) {
  const b = BRANDS["GitHub"];
  return (
    <svg {...svgProps(size, b.viewBox)}>
      {b.paths.map((p, i) => (
        <path key={i} d={p.d} fill="currentColor" />
      ))}
    </svg>
  );
}

export function WalletMark({ size = 20 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 24 24")}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5.5 4A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 18.5 8H18V5a1 1 0 0 0-1-1H5.5zm0 2H16v2H5.5a1 1 0 0 1 0-2zM16.5 12.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"
      />
    </svg>
  );
}

/** A reduced fox head: two ears, the face, the pale muzzle and the eyes. */
export function MetaMaskMark({ size = 24 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 32 32")}>
      <path fill="#E2761B" d="M2.5 2.5 13.4 10 6 15.6zM29.5 2.5 18.6 10 26 15.6z" />
      <path
        fill="#F6851B"
        d="M6 15.6 13.4 10h5.2l7.4 5.6 1.3 6.2-4.6 6.6L16 29.6l-6.7-1.2-4.6-6.6z"
      />
      <path fill="#E4761B" d="M4.7 21.8 6 15.6l4.4 3.6zM27.3 21.8 26 15.6l-4.4 3.6z" />
      <path fill="#D7C1B3" d="M12.6 22.4h6.8l2.3 5.8L16 29.6l-5.7-1.4z" />
      <path fill="#233447" d="M9.6 16.8l3.6 1.1-2.4 2.3zM22.4 16.8l-3.6 1.1 2.4 2.3zM14.6 24.4h2.8L16 26.2z" />
    </svg>
  );
}

export function CoinbaseMark({ size = 24 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 32 32")}>
      <circle cx="16" cy="16" r="15" fill="#0052FF" />
      <circle cx="16" cy="16" r="10" fill="#FFFFFF" />
      <rect x="12.5" y="12.5" width="7" height="7" rx="1.2" fill="#0052FF" />
    </svg>
  );
}

/** The five-square checker; drawn in the text colour so it holds on dark. */
export function OkxMark({ size = 24 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 30 30")}>
      <g fill="currentColor">
        <rect x="3" y="3" width="8" height="8" rx="0.6" />
        <rect x="19" y="3" width="8" height="8" rx="0.6" />
        <rect x="11" y="11" width="8" height="8" rx="0.6" />
        <rect x="3" y="19" width="8" height="8" rx="0.6" />
        <rect x="19" y="19" width="8" height="8" rx="0.6" />
      </g>
    </svg>
  );
}

/* ── UI glyphs ───────────────────────────────────────────────────────────── */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ArrowRight({ size = 16 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 16 16")}>
      <path {...stroke} d="M2.5 8h11M9.5 4l4 4-4 4" />
    </svg>
  );
}

export function ArrowLeft({ size = 16 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 16 16")}>
      <path {...stroke} d="M13.5 8h-11M6.5 4l-4 4 4 4" />
    </svg>
  );
}

export function MailIcon({ size = 18 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 20 20")}>
      <rect {...stroke} x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path {...stroke} d="M3 5.5l7 5 7-5" />
    </svg>
  );
}

export function KeyIcon({ size = 18 }: MarkProps) {
  return (
    <svg {...svgProps(size, "0 0 20 20")}>
      <circle {...stroke} cx="6.5" cy="13.5" r="3.5" />
      <path {...stroke} d="M9 11l7.5-7.5M13.5 6.5l2 2M11.5 8.5l1.5 1.5" />
    </svg>
  );
}

export function EyeIcon({ open, size = 18 }: MarkProps & { open: boolean }) {
  return (
    <svg {...svgProps(size, "0 0 20 20")}>
      <path {...stroke} d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10z" />
      <circle {...stroke} cx="10" cy="10" r="2.5" />
      {!open && <path {...stroke} d="M3 17L17 3" />}
    </svg>
  );
}
