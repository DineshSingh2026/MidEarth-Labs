/* ──────────────────────────────────────────────────────────────────────────
   The part of the theme that the server renders.

   Split out from theme.ts because that module calls React hooks, and Next
   refuses to let a server component — the root layout — import a module that
   does. Nothing here touches React, so both sides can have it.
   ────────────────────────────────────────────────────────────────────────── */

export type Theme = "dark" | "light";

export const STORAGE_KEY = "midearth-theme";

/** Browser chrome to match the ground the page is painting. */
export const THEME_COLOR: Record<Theme, string> = {
  dark: "#06070A",
  light: "#FAF9F5",
};

/**
 * Inlined into <head> and run before first paint, so a stored light theme is
 * on the element before anything is drawn. Without it the page paints dark and
 * then flips, which is worse than either theme.
 *
 * Dark is the default and the unset state, so this only ever adds.
 */
export const NO_FLASH_SCRIPT = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
