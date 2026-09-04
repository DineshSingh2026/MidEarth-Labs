"use client";

import { applyTheme, readTheme, useTheme } from "./theme";

/*
  A switch, not a cycle: two labelled halves with the brand pill sliding
  between them, so the state is legible without reading an icon. The two glyphs
  stay visible in both positions — the one that is off dims rather than
  disappearing, which is what makes it read as a control rather than a status.

  Rendered as a real <button> with aria-pressed, so a screen reader gets
  "Light theme, toggle button, not pressed" instead of a mystery icon.
*/

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="3.1" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 1.1v1.7M8 13.2v1.7M1.1 8h1.7M13.2 8h1.7" />
        <path d="M3.2 3.2l1.2 1.2M11.6 11.6l1.2 1.2M12.8 3.2l-1.2 1.2M4.4 11.6l-1.2 1.2" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
      <path
        d="M13.4 9.9A5.9 5.9 0 0 1 6.1 2.6a5.9 5.9 0 1 0 7.3 7.3z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const theme = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={light}
      aria-label="Light theme"
      title={light ? "Switch to dark" : "Switch to light"}
      /*
        What to flip to is read from the element, not from the render that
        produced this handler. Two clicks landing inside one render pass would
        otherwise both compute the same target and the second would be a no-op.
      */
      onClick={() => applyTheme(readTheme() === "light" ? "dark" : "light")}
    >
      <span className="theme-toggle-thumb" aria-hidden="true" />
      <span className="theme-toggle-face" aria-hidden="true">
        <MoonIcon />
      </span>
      <span className="theme-toggle-face" aria-hidden="true">
        <SunIcon />
      </span>
    </button>
  );
}
