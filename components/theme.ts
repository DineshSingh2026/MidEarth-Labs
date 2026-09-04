"use client";

import { useEffect, useState } from "react";

import { STORAGE_KEY, THEME_COLOR, type Theme } from "./themeScript";

export type { Theme };

/* ──────────────────────────────────────────────────────────────────────────
   Theme is one attribute — data-theme on <html> — and nothing else. CSS reads
   it directly, so anything styled in globals.css follows with no JS at all;
   the background field reads it through useTheme() because it paints its own
   pixels into a canvas and cannot inherit a custom property.

   Dark is the default and the unset state: no attribute means dark. The system
   preference is deliberately not consulted — this site is dark unless the
   viewer says otherwise, and the header switch is how they say it.

   The pieces the server needs — the storage key and the pre-paint script —
   live in themeScript.ts, since a server component cannot import a module that
   calls hooks.
   ────────────────────────────────────────────────────────────────────────── */

export function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(next: Theme) {
  const root = document.documentElement;
  if (next === "light") root.dataset.theme = "light";
  else delete root.dataset.theme;

  // keep the browser chrome in step with the page it is framing
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[next]);

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // private mode, or storage denied — the switch still works for this visit
  }
}

/**
 * Subscribes to the attribute rather than to a store, so a theme set by the
 * no-flash script, by the switch, or from another tab all arrive the same way.
 * Starts at "dark" on both server and first client render — the real value is
 * read in an effect, which keeps hydration from mismatching.
 */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const read = () => setTheme(readTheme());
    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
