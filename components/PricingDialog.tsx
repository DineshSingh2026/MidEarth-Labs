"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/*
  Static pricing sheet for BUY AGENTS. Every tier is presentational — there is
  no checkout and nothing here routes anywhere, so no tier carries a control
  that would sit dead under the cursor. The one real control is the close
  button, plus Escape and the scrim.
*/

type Tier = {
  price: string;
  name: string;
  blurb: string;
  perks: string[];
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    price: "2",
    name: "Starter",
    blurb: "A single agent to try the workflow end to end.",
    perks: ["1 active agent", "500 runs / month", "Community models"],
  },
  {
    price: "3",
    name: "Builder",
    blurb: "Room for a small crew that hands work between itself.",
    perks: ["3 active agents", "2,000 runs / month", "Bring your own keys"],
  },
  {
    price: "5",
    name: "Pro",
    blurb: "The working set — parallel agents on your own infrastructure.",
    perks: ["10 active agents", "10,000 runs / month", "Private connectors"],
    featured: true,
  },
  {
    price: "10",
    name: "Scale",
    blurb: "Unmetered agents with the throughput a team leans on.",
    perks: ["Unlimited agents", "50,000 runs / month", "Priority compute"],
  },
];

function Check() {
  return (
    <svg className="pd-check" viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" focusable="false">
      <path
        d="M2.6 7.4l3 3 5.8-6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Whatever opened the sheet gets focus back when it closes.
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      // Only the close button is focusable, so Tab has nowhere else to go —
      // hold it inside the panel rather than letting it walk the page behind.
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  /*
    Portalled to <body>. Hero is `isolate`, so a fixed element rendered inside
    it is confined to Hero's stacking context — the site header and everything
    after Hero in the DOM would paint straight over the sheet.
  */
  return createPortal(
    <div
      className="pd-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-title"
        aria-describedby="pd-sub"
        className="pd-panel"
      >
        <button
          ref={closeRef}
          type="button"
          className="pd-close"
          onClick={onClose}
          aria-label="Close pricing"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <header className="pd-head">
          <p className="t-eyebrow flex items-center justify-center gap-2.5">
            <span className="pip" aria-hidden="true" />
            PRICING
          </p>
          <h2 id="pd-title" className="pd-title">
            Buy Agents
          </h2>
          <p id="pd-sub" className="pd-sub">
            Pick the size of the crew. Every plan runs on your own infrastructure and
            your own models — the price covers the orchestration, not the tokens.
          </p>
        </header>

        <ul className="pd-grid">
          {TIERS.map((tier) => (
            <li
              key={tier.name}
              className={`pd-tier${tier.featured ? " is-featured" : ""}`}
            >
              {tier.featured && <span className="pd-flag">MOST POPULAR</span>}

              <p className="pd-tier-name">{tier.name}</p>

              <p className="pd-price">
                <span className="pd-currency" aria-hidden="true">
                  $
                </span>
                {tier.price}
                <span className="pd-period">
                  <span className="sr-only">US dollars</span> / mo
                </span>
              </p>

              <p className="pd-blurb">{tier.blurb}</p>

              <ul className="pd-perks">
                {tier.perks.map((perk) => (
                  <li key={perk}>
                    <Check />
                    {perk}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="pd-foot">
          Prices in USD, billed monthly. Checkout opens soon — the free agent stays
          free.
        </p>
      </div>
    </div>,
    document.body,
  );
}
