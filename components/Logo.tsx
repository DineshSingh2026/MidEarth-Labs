import Image from "next/image";

/*
  The supplied artwork was a glow baked onto solid black. scripts/gen-logo.mjs
  cuts real alpha out of it, so this sits over the live background field with no
  black plate behind it.

  On dark that cutout is exact. On light it cannot be: the mark's shadow lobe is
  baked to (0,0,0) and merges with the plate across a wide front, so nothing
  finds its silhouette and the M tears open on cream. So the light theme shows
  the wordmark alone — see scripts/gen-logo-light.mjs. Both files are in the
  markup and CSS picks between them; swapping in JS would land after hydration,
  i.e. a beat of the wrong logo on every light-theme load.

  The two have different proportions, so each carries its own ratio. They share
  a height, so sizing either by `height` puts the wordmark at identical scale
  across themes — only the mark appears or disappears.

  Width and height go to next/image at the size actually rendered, not the
  intrinsic size of the file — otherwise a 30px-tall logo asks the optimizer for
  a 3840px candidate.
*/

const DARK = { src: "/midearth-labs.png", ratio: 1400 / 281 };
const LIGHT = { src: "/midearth-wordmark-light.png", ratio: 918 / 281 };

type Props = {
  /** rendered height in px; width follows each variant's own ratio */
  height?: number;
  /** set on the header instance only — it is above the fold */
  priority?: boolean;
  className?: string;
};

/** Mark plus wordmark on dark, wordmark alone on light. */
export default function Logo({ height = 30, priority = false, className }: Props) {
  const variant = (art: typeof DARK, theme: string) => (
    <Image
      src={art.src}
      alt="MidEarth Labs"
      width={Math.round(height * art.ratio)}
      height={height}
      priority={priority}
      className={`logo-art logo-art-${theme}${className ? ` ${className}` : ""}`}
    />
  );

  return (
    <>
      {variant(DARK, "dark")}
      {variant(LIGHT, "light")}
    </>
  );
}
