// Turns the supplied MidEarth Labs artwork (a glowing lockup baked onto solid
// black) into web assets with real alpha, so the mark can sit over the live
// background field instead of punching a black rectangle through it.
//
//   node scripts/gen-logo.mjs "<source.png>"
//
// The source is a glow on black, which is exactly a premultiplied image: the
// black IS the transparency. So alpha comes from the brightest channel and the
// colour is un-premultiplied back out, which keeps the glow falloff smooth
// instead of hard-keying it and leaving a halo.
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const SRC = process.argv[2];
if (!SRC) {
  console.error('usage: node scripts/gen-logo.mjs "<source.png>"');
  process.exit(1);
}

const ROOT = resolve(process.cwd());
const out = (p) => {
  const full = resolve(ROOT, p);
  mkdirSync(dirname(full), { recursive: true });
  return full;
};

/** Pixels this dark are glow tails, not artwork — ignored when finding edges. */
const TRIM_FLOOR = 10;
/** Breathing room kept around the trimmed artwork, as a fraction of its size. */
const MARGIN = 0.02;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Brightness at which a pixel stops being plate-or-glow and becomes the solid
 * body of the artwork. The flood treats anything below this as passable, so it
 * seeps through the glow tails and fills every real background pocket, and
 * anything at or above it as a wall.
 */
const SOLID = 45;

/**
 * Radius, in source pixels, for sealing the seams the flood leaks through
 * where the mark's shadow runs to black at the silhouette edge. Large enough
 * to close those, small enough to leave the V between the peaks open.
 */
const SEAL = 26;

/**
 * The lockup is mark-then-wordmark on one baseline. Rather than hand-measure
 * it, find the first run of empty columns wide enough to be the gutter the
 * designer left between the two, and treat everything left of it as the mark.
 * Driven off luminance so it can run before the alpha exists.
 */
function markRightFrom(v, width, height) {
  const gutter = Math.round(width * 0.02);
  let seen = false; // ignore the empty margin before the mark starts
  let run = 0;

  for (let x = 0; x < width; x++) {
    let hit = false;
    for (let y = 0; y < height; y++) {
      if (v[y * width + x] > TRIM_FLOOR) {
        hit = true;
        break;
      }
    }

    if (hit) {
      seen = true;
      run = 0;
      continue;
    }
    if (seen && ++run >= gutter) return x - run;
  }
  return width - 1;
}

/**
 * Flood the plate inward from the border. What it cannot reach is either the
 * artwork itself or dark enclosed BY the artwork — which is how the mark's
 * shadow lobe is told apart from the background it is the same colour as.
 * Without this the lobe keys out and the M renders with a hole in it on any
 * ground that is not already black.
 */
function floodPlate(v, width, height) {
  const reached = new Uint8Array(width * height);
  const stack = [];

  const push = (x, y) => {
    const i = y * width + x;
    if (!reached[i] && v[i] < SOLID) {
      reached[i] = 1;
      stack.push(i);
    }
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    const y = (i / width) | 0;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }

  return reached;
}

/**
 * Read a sharp pipeline back as one byte per pixel. sharp promotes a
 * one-channel raw buffer to three, so the stride has to be read back rather
 * than assumed — indexing it 1:1 silently smears the mask across the image.
 */
async function grey(pipe, width, height) {
  const { data, info } = await pipe.raw().toBuffer({ resolveWithObject: true });
  if (info.channels === 1) return data;
  const out = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) out[i] = data[i * info.channels];
  return out;
}

/**
 * Morphological closing — dilate, then erode by the same amount — done as
 * blur-and-threshold, which is close enough at this radius and stays O(n).
 * Blurring a binary mask by sigma and cutting at 5% reaches about 1.7σ, so
 * that is the conversion from the radius asked for.
 */
async function seal(mask, width, height, radius) {
  const sigma = Math.max(0.4, radius / 1.7);
  const raw = { width, height, channels: 1 };
  const grown = await grey(
    sharp(mask, { raw }).blur(sigma).threshold(12),
    width,
    height,
  );
  return grey(sharp(grown, { raw }).blur(sigma).threshold(243), width, height);
}

/** Un-premultiply against black and return raw RGBA plus the artwork bounds. */
async function cut(src) {
  const img = sharp(src).ensureAlpha();
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();
  const n = width * height;

  const v = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    v[i] = Math.max(raw[i * 4], raw[i * 4 + 1], raw[i * 4 + 2]);
  }

  const reached = floodPlate(v, width, height);
  const markEnd = markRightFrom(v, width, height);

  /*
    Filling everything the flood missed is only right for the mark. Applied to
    the wordmark it also fills the counters of a, b, d, e — they are enclosed
    dark too — which is invisible on black and very visible on cream. So the
    body mask stops at the gutter.

    Within the mark, the shadow lobe runs to true black where it meets the
    silhouette edge, so the flood leaks in through those seams and bites
    wedges out of the M. Closing the mask seals seams narrower than the
    radius while leaving the V between the peaks, which is far wider, alone.
  */
  const body = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    body[i] = !reached[i] && i % width <= markEnd ? 255 : 0;
  }
  const sealed = await seal(body, width, height, SEAL);

  // Feathered so it meets the un-premultiplied glow smoothly instead of
  // leaving a hairline seam where the wall threshold falls.
  const solid = await grey(
    sharp(sealed, { raw: { width, height, channels: 1 } }).blur(1.4),
    width,
    height,
  );

  let l = width;
  let r = -1;
  let t = height;
  let b = -1;

  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const lit = v[i];
    const w = solid[i] / 255; // 1 deep inside the enclosed dark, 0 in the glow

    if (lit > TRIM_FLOOR || w > 0.02) {
      const x = i % width;
      const y = (i / width) | 0;
      if (x < l) l = x;
      if (x > r) r = x;
      if (y < t) t = y;
      if (y > b) b = y;
    }

    if (lit === 0 && w === 0) {
      raw[p + 3] = 0;
      continue;
    }

    // colour / alpha, so compositing over the page's ink reproduces the
    // original pixel rather than a dimmed copy of it
    const k = lit === 0 ? 1 : 255 / lit;
    for (let c = 0; c < 3; c++) {
      const un = raw[p + c] * k;
      raw[p + c] = clamp(Math.round(un * (1 - w) + raw[p + c] * w), 0, 255);
    }
    raw[p + 3] = clamp(Math.round(Math.max(lit, solid[i])), 0, 255);
  }

  if (r < 0) throw new Error("source is entirely black — nothing to trim to");
  return { raw, width, height, box: { l, t, r, b } };
}

/** Crop the cut buffer, in source pixels, with a proportional margin. */
function crop({ raw, width, height, box }, over) {
  const l = over?.l ?? box.l;
  const t = over?.t ?? box.t;
  const r = over?.r ?? box.r;
  const b = over?.b ?? box.b;

  const m = Math.round(Math.max(r - l, b - t) * MARGIN);
  const left = clamp(l - m, 0, width - 1);
  const top = clamp(t - m, 0, height - 1);

  return sharp(raw, { raw: { width, height, channels: 4 } }).extract({
    left,
    top,
    width: clamp(r + m - left + 1, 1, width - left),
    height: clamp(b + m - top + 1, 1, height - top),
  });
}

const png = (pipe, w) =>
  pipe
    .resize({ width: w, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: false });

const cutBuf = await cut(SRC);
const { box } = cutBuf;
const w = box.r - box.l + 1;

/* Recomputed here from the finished alpha; identical split, tighter source. */
function findMarkRight() {
  const { raw, width, height } = cutBuf;
  const a = new Uint8Array(width * height);
  for (let i = 0; i < a.length; i++) a[i] = raw[i * 4 + 3];
  return markRightFrom(a, width, height);
}

const markRight = findMarkRight();

await png(crop(cutBuf), 1400).toFile(out("public/midearth-labs.png"));
await png(crop(cutBuf, { ...box, r: markRight }), 512).toFile(
  out("public/midearth-mark.png"),
);

// Favicon and OG card want the ink behind them, not transparency.
const INK = { r: 6, g: 7, b: 10, alpha: 1 };

await sharp({ create: { width: 512, height: 512, channels: 4, background: INK } })
  .composite([
    {
      input: await png(crop(cutBuf, { ...box, r: markRight }), 384).toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toFile(out("app/icon.png"));

await sharp({ create: { width: 1200, height: 630, channels: 4, background: INK } })
  .composite([
    { input: await png(crop(cutBuf), 880).toBuffer(), gravity: "center" },
  ])
  .png()
  .toFile(out("app/opengraph-image.png"));

console.log(
  `source ${cutBuf.width}x${cutBuf.height} → artwork ${w}x${box.b - box.t + 1} at ${box.l},${box.t}`,
);
console.log(`mark split at x=${markRight} (mark is ${markRight - box.l + 1}px wide)`);
console.log(
  "wrote public/midearth-labs.png, public/midearth-mark.png, app/icon.png, app/opengraph-image.png",
);
