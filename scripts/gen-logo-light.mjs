// Light-theme companion for the logo.
//
//   node scripts/gen-logo-light.mjs
//
// The light theme shows the wordmark alone. The mark is deliberately dropped
// rather than re-toned, because it cannot be cut out of the supplied artwork:
// its shadow lobe is baked to literal (0,0,0) and merges with the black plate
// across a wide front, so there is no threshold, hue or morphology that finds
// the silhouette there. On black that is invisible and the mark is exact; on
// cream the shadow has nowhere to come from and tears a hole through the M.
// Replace public/midearth-labs.png with artwork that has a real alpha channel
// and the mark can come back on both themes.
//
// The wordmark itself re-tones cleanly. Warmth picks the target — r−b is ~0 on
// the whites and 1 on brand orange — so "MidEarth" goes to ink, "Labs" stays
// orange, and the antialiased edges crossfade as they already did.
//
// The crop keeps the lockup's full height, trimming only horizontally. That way
// a caller sizing by height gets type at exactly the size it is inside the dark
// lockup, so the two themes do not change the wordmark's scale.
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

/** Cool pixels are type. Matches --text in the light theme. */
const INK = [28, 27, 25];
/** Warm pixels stay brand orange, a touch deeper so it holds on cream. */
const WARM = [224, 70, 4];

/** r − b, normalised. The whites read ~0, brand orange reads 1. */
const WARM_SPAN = 170;
/** >1 trims the faint glow tails; the artwork core is opaque and untouched. */
const ALPHA_GAMMA = 1.3;
/** Alpha above this counts as artwork when scanning for the interior gap. */
const GAP_FLOOR = 60;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => Math.round(a + (b - a) * t);

/**
 * x of the widest empty column run in the left half — the space between the
 * mark and the wordmark.
 */
function findSplit(data, w, h) {
  let best = null;
  let start = -1;

  for (let x = 0; x <= w; x++) {
    let filled = false;
    for (let y = 0; y < h && !filled; y++) {
      if (data[(y * w + x) * 4 + 3] > GAP_FLOOR) filled = true;
    }
    if (x < w && !filled) {
      if (start < 0) start = x;
      continue;
    }
    if (start >= 0) {
      const run = { from: start, to: x - 1, len: x - start };
      // interior gaps only: the margins at either end are not a split
      if (run.from > 0 && run.to < w - 1 && (!best || run.len > best.len)) best = run;
      start = -1;
    }
  }

  if (!best) return null;
  const mid = (best.from + best.to) / 2;
  return mid < w * 0.55 ? mid : null;
}

const SRC = "public/midearth-labs.png";
const DEST = "public/midearth-wordmark-light.png";

const { data, info } = await sharp(resolve(SRC))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: w, height: h } = info;
const split = findSplit(data, w, h);
if (split === null) throw new Error(`${SRC}: no mark/wordmark gap found`);

// last column carrying artwork, so the crop ends tight on the "s" of Labs
let right = split;
for (let x = w - 1; x > split; x--) {
  let filled = false;
  for (let y = 0; y < h && !filled; y++) {
    if (data[(y * w + x) * 4 + 3] > GAP_FLOOR) filled = true;
  }
  if (filled) {
    right = x;
    break;
  }
}

const left = Math.round(split);
const cropW = right - left + 1;
const outBuf = Buffer.alloc(cropW * h * 4);

for (let y = 0; y < h; y++) {
  for (let x = 0; x < cropW; x++) {
    const s = (y * w + (x + left)) * 4;
    const d = (y * cropW + x) * 4;
    const a = data[s + 3];

    if (a === 0) continue;

    // smoothstep so the crossover between ink and orange is not a seam
    const raw = clamp01((data[s] - data[s + 2]) / WARM_SPAN);
    const t = raw * raw * (3 - 2 * raw);

    outBuf[d] = mix(INK[0], WARM[0], t);
    outBuf[d + 1] = mix(INK[1], WARM[1], t);
    outBuf[d + 2] = mix(INK[2], WARM[2], t);
    outBuf[d + 3] = Math.round(255 * Math.pow(a / 255, ALPHA_GAMMA));
  }
}

await sharp(outBuf, { raw: { width: cropW, height: h, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(resolve(DEST));

console.log(`${DEST}  ${cropW}x${h}  (wordmark from x=${left} of ${w})`);
