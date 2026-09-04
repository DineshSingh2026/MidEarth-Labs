// Vendors the brand marks we need into a local TS file: no runtime package,
// no external requests, only the 24 paths we actually render.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const si = require("simple-icons");

const INK = [6, 7, 10];

const lin = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
  return (hi + 0.05) / (lo + 0.05);
};
const hexToRgb = (h) => [
  parseInt(h.slice(0, 2), 16),
  parseInt(h.slice(2, 4), 16),
  parseInt(h.slice(4, 6), 16),
];
const toHex = (rgb) =>
  "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

/**
 * A near-black brand mark cannot be "lifted" — mixing black with white only
 * ever yields grey. Those brands render white on dark everywhere, so send them
 * to the page's text colour. Chromatic marks keep their hue and are lifted
 * only as far as legibility requires.
 */
function legible(hex) {
  const rgb = hexToRgb(hex);
  if (Math.max(...rgb) < 48) return "#E8E6E1";
  if (ratio(rgb, INK) >= 4.0) return toHex(rgb);
  for (let t = 0.04; t <= 1.0001; t += 0.04) {
    const mixed = rgb.map((c) => c + (255 - c) * t);
    if (ratio(mixed, INK) >= 4.0) return toHex(mixed);
  }
  return "#E8E6E1";
}

const SLUGS = {
  GitHub: "github",
  Linear: "linear",
  Jira: "jira",
  Sentry: "sentry",
  PostHog: "posthog",
  Notion: "notion",
  "Google Drive": "googledrive",
  "Google Docs": "googledocs",
  "Google Sheets": "googlesheets",
  Dropbox: "dropbox",
  Figma: "figma",
  Gmail: "gmail",
  "Google Calendar": "googlecalendar",
  Discord: "discord",
  "X (Twitter)": "x",
  Reddit: "reddit",
  Stripe: "stripe",
  HubSpot: "hubspot",
  Asana: "asana",
  Trello: "trello",
  Airtable: "airtable",
  Zapier: "zapier",
};

const out = {};

for (const [name, slug] of Object.entries(SLUGS)) {
  const key = "si" + slug.charAt(0).toUpperCase() + slug.slice(1);
  const ic = si[key];
  if (!ic) throw new Error("missing icon: " + slug);
  out[name] = {
    viewBox: "0 0 24 24",
    paths: [{ d: ic.path }],
    color: legible(ic.hex),
    brand: "#" + ic.hex,
  };
}

// Slack pulled its mark from Simple Icons; this is the official four-colour
// pinwheel construction on Slack's own 122.8 grid.
out["Slack"] = {
  viewBox: "0 0 122.8 122.8",
  color: null,
  brand: "#611F69",
  paths: [
    {
      d: "M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z",
      fill: "#E01E5A",
    },
    {
      d: "M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z",
      fill: "#36C5F0",
    },
    {
      d: "M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z",
      fill: "#2EB67D",
    },
    {
      d: "M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z",
      fill: "#ECB22E",
    },
  ],
};

// Salesforce also pulled its mark. Simplified cloud silhouette in Salesforce
// blue — a stand-in, not the registered logo.
out["Salesforce"] = {
  viewBox: "0 0 24 24",
  color: "#00A1E0",
  brand: "#00A1E0",
  approx: true,
  paths: [
    {
      d: "M5,14.5 a4.5,4.5 0 1,0 9,0 a4.5,4.5 0 1,0 -9,0 z M8,12 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 z M14.8,15 a3.6,3.6 0 1,0 7.2,0 a3.6,3.6 0 1,0 -7.2,0 z",
    },
  ],
};

const header = `// GENERATED — brand marks vendored from simple-icons (CC0) plus two
// hand-authored entries. Colours are lifted toward legibility on --ink while
// keeping the brand hue. Trademarks belong to their respective owners.

export type BrandMark = {
  viewBox: string;
  paths: { d: string; fill?: string }[];
  /** null when the mark carries its own per-path fills */
  color: string | null;
  brand: string;
  approx?: boolean;
};

export const BRANDS: Record<string, BrandMark> = ${JSON.stringify(out, null, 2)};
`;

writeFileSync(process.argv[2], header);

const shifted = Object.entries(out).filter(
  ([, v]) => v.color && v.brand.toUpperCase() !== v.color.toUpperCase(),
);
console.log("icons:", Object.keys(out).length);
console.log("lifted for contrast:", shifted.map(([k, v]) => `${k} ${v.brand}->${v.color}`).join(", "));
