"use client";

import { useState } from "react";

export type Pillar = { title: string; body: string };

/*
  The numbered platform list on /signin, as an accordion: every section starts
  closed and opens on click, several at once if the reader wants. Heading >
  button with aria-expanded is the WAI-ARIA accordion pattern. A closed panel
  is inert, so its text is skipped by keyboard and screen reader until opened.

  The panel animates through grid-template-rows 0fr -> 1fr, which reaches the
  text's natural height without measuring it.
*/
export default function PillarList({ pillars }: { pillars: Pillar[] }) {
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <ol className="si-pillars">
      {pillars.map((pillar, i) => {
        const isOpen = open.has(i);
        const id = `pillar-${i + 1}`;
        return (
          <li
            key={pillar.title}
            className={`si-pillar rise${isOpen ? " is-open" : ""}`}
            style={{ animationDelay: `${520 + i * 60}ms` }}
          >
            <h2 className="si-pillar-head">
              <button
                id={`${id}-button`}
                type="button"
                className="si-pillar-toggle"
                aria-expanded={isOpen}
                aria-controls={`${id}-panel`}
                onClick={() => toggle(i)}
              >
                <span className="si-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="si-pillar-title">{pillar.title}</span>
                <svg
                  className="si-chevron"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M4 6l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </h2>

            <div
              id={`${id}-panel`}
              role="region"
              aria-labelledby={`${id}-button`}
              className="si-pillar-panel"
              inert={!isOpen}
            >
              <div className="si-pillar-inner">
                <p className="si-pillar-body">{pillar.body}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
