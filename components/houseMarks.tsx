import fs from "node:fs";
import path from "node:path";

/* ──────────────────────────────────────────────────────────────────────────
   First-party marks. These are not in any icon set, so they are drawn here.

   They are interpretations of the supplied artwork, not the original files.
   Drop a real asset at public/brand/<slug>.(svg|png|webp|jpg) and it is used
   automatically in place of the drawing — no code change needed.
   ────────────────────────────────────────────────────────────────────────── */

export const HOUSE_NAMES = [
  "MidEarth",
  "String Ecosystem",
  "MidEarth Fantasy",
  "String BenPOS",
  "Local VM",
] as const;

export const slugify = (n: string) =>
  n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Returns a public path if the real artwork has been dropped in, else null. */
export function houseAsset(name: string): string | null {
  for (const ext of ["svg", "png", "webp", "jpg", "jpeg"]) {
    const rel = `/brand/${slugify(name)}.${ext}`;
    try {
      if (fs.existsSync(path.join(process.cwd(), "public", rel))) return rel;
    } catch {
      /* filesystem unavailable — fall through to the drawn mark */
    }
  }
  return null;
}

/** The shared MidEarth body: a domed blob with a broad, settled base. */
const BLOB = "M32 5c15 0 27 14 27 29 0 13-10 23-23 23h-8C15 57 5 47 5 34 5 19 17 5 32 5Z";

function Eyes() {
  return (
    <g fill="#FFFFFF">
      <ellipse cx="37" cy="28.5" rx="3.1" ry="4.5" />
      <ellipse cx="46.5" cy="26.5" rx="3.1" ry="4.5" />
    </g>
  );
}

function MidEarthMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
      <defs>
        <radialGradient id="he-me" cx="0.6" cy="0.42" r="0.78">
          <stop offset="0%" stopColor="#5CF08C" />
          <stop offset="45%" stopColor="#2ECC9A" />
          <stop offset="100%" stopColor="#159FEF" />
        </radialGradient>
      </defs>
      <path d={BLOB} fill="url(#he-me)" />
      <Eyes />
    </svg>
  );
}

function MidEarthFantasyMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
      <defs>
        <radialGradient id="he-mef" cx="0.66" cy="0.3" r="0.92">
          <stop offset="0%" stopColor="#FB8B2E" />
          <stop offset="38%" stopColor="#EE3B7E" />
          <stop offset="100%" stopColor="#7B3BF0" />
        </radialGradient>
        <linearGradient id="he-ring" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
      </defs>

      {/* ring behind the body */}
      <ellipse
        cx="32"
        cy="42"
        rx="34"
        ry="10"
        transform="rotate(-18 32 42)"
        fill="none"
        stroke="url(#he-ring)"
        strokeWidth="3.4"
      />

      <path d={BLOB} fill="url(#he-mef)" />
      <Eyes />

      {/* the near side of the ring passes in front */}
      <path
        d="M-0.3 52.5Q32 60 64.3 31.5"
        fill="none"
        stroke="url(#he-ring)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />

      {/* sparkle */}
      <path
        d="M52 5q1.4 6.4 7.6 8-6.2 1.6-7.6 8-1.4-6.4-7.6-8 6.2-1.6 7.6-8Z"
        fill="#FCD34D"
      />
    </svg>
  );
}

function StringEcosystemMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
      <defs>
        <linearGradient id="he-se-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB05C" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="he-se-b" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FF9A3D" />
          <stop offset="100%" stopColor="#E8590C" />
        </linearGradient>
      </defs>
      {/* one bold ribbon folded into an S */}
      <path
        d="M48 17C44 9 30 5.5 21.5 12 13 18.5 16.5 28.5 28 31.5 40 34.5 47.5 40 45 48.5 42 58 27 60 17.5 52.5"
        fill="none"
        stroke="url(#he-se-a)"
        strokeWidth="10.5"
        strokeLinecap="round"
      />
      {/* the far face of the fold, a shade deeper */}
      <path
        d="M28 31.5C40 34.5 47.5 40 45 48.5 42 58 27 60 17.5 52.5"
        fill="none"
        stroke="url(#he-se-b)"
        strokeWidth="10.5"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

function StringBenPosMark({ size }: { size: number }) {
  const arms = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
      <defs>
        <linearGradient id="he-bp" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8480C" />
          <stop offset="100%" stopColor="#FF9A2E" />
        </linearGradient>
      </defs>
      <g stroke="url(#he-bp)" fill="url(#he-bp)">
        {arms.map((deg) => (
          <g key={deg} transform={`rotate(${deg} 32 32)`}>
            <path
              d="M32 32c7-1 14-6 18-14"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="52" cy="15" r="5.2" stroke="none" />
          </g>
        ))}
      </g>
    </svg>
  );
}


/** Local VM: a display with a second plate behind it and an isometric cube
    inside — the machine, and the box it is running. */
function LocalVmMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
      <defs>
        <linearGradient id="he-lvm-a" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="52%" stopColor="#4F7CF7" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="he-lvm-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#4F7CF7" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
        <linearGradient id="he-lvm-top" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="he-lvm-left" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#4F7CF7" />
        </linearGradient>
        <linearGradient id="he-lvm-right" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#6D6BF3" />
          <stop offset="100%" stopColor="#C026D3" />
        </linearGradient>
      </defs>

      {/* the plate stacked behind, offset up and to the right */}
      <rect
        x="25"
        y="6.5"
        width="33"
        height="43"
        rx="10"
        fill="none"
        stroke="url(#he-lvm-b)"
        strokeWidth="4.4"
        transform="rotate(6 41.5 28)"
      />

      {/* the display in front, drawn over the plate */}
      <rect
        x="5.5"
        y="13.5"
        width="43"
        height="43"
        rx="10"
        fill="#000000"
        stroke="url(#he-lvm-a)"
        strokeWidth="4.4"
      />
      <rect x="21.5" y="49.4" width="11" height="2.9" rx="1.45" fill="url(#he-lvm-a)" />

      {/* the isometric cube on the screen */}
      <g>
        <path d="M27 21.5 37.5 27.5 27 33.5 16.5 27.5Z" fill="url(#he-lvm-top)" />
        <path d="M16.5 27.5 27 33.5 27 45.5 16.5 39.5Z" fill="url(#he-lvm-left)" />
        <path d="M37.5 27.5 27 33.5 27 45.5 37.5 39.5Z" fill="url(#he-lvm-right)" />
      </g>
    </svg>
  );
}

const DRAWN: Record<string, (p: { size: number }) => React.ReactElement> = {
  MidEarth: MidEarthMark,
  "MidEarth Fantasy": MidEarthFantasyMark,
  "String Ecosystem": StringEcosystemMark,
  "String BenPOS": StringBenPosMark,
  "Local VM": LocalVmMark,
};

export function HouseMark({ name, size = 30 }: { name: string; size?: number }) {
  const asset = houseAsset(name);
  if (asset) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={asset}
        alt=""
        width={size + 6}
        height={size + 6}
        style={{ objectFit: "contain", borderRadius: 8 }}
      />
    );
  }
  const Drawn = DRAWN[name];
  return Drawn ? <Drawn size={size} /> : null;
}

export const isHouse = (name: string) => name in DRAWN;
