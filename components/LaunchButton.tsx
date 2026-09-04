"use client";

import { useState } from "react";
import PricingDialog from "./PricingDialog";

const TARGET = "https://chandu-dev.tailae0280.ts.net/";

/**
 * The page's pair of calls to action. BUY AGENTS carries the fill and the halo
 * — it is the action the page is asking for. FREE AGENT sits beside it as the
 * quiet way in, and stays an anchor rather than a button with a redirect
 * handler, so middle-click and cmd-click behave.
 */
export default function LaunchButton() {
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <>
      <div className="cta-row">
        <span className="cta-enter is-quiet">
          <a
            className="cta cta-alt t-cta"
            href={TARGET}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="cta-mark" aria-hidden="true">
              ◆
            </span>
            FREE AGENT
          </a>
        </span>

        <span className="cta-enter" style={{ animationDelay: "890ms" }}>
          <button
            type="button"
            className="cta t-cta"
            onClick={() => setPricingOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={pricingOpen}
          >
            <span className="cta-mark" aria-hidden="true">
              ✦
            </span>
            BUY AGENTS
          </button>
        </span>
      </div>

      <PricingDialog open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}
