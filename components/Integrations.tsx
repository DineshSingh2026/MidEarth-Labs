import type { CSSProperties } from "react";

import { BRANDS } from "./brandMarks";
import { HouseMark, isHouse } from "./houseMarks";

type App = { name: string; does: string };

/** Ours. They get their own shelf above the third-party directory. */
const STRING_AGENTS: App[] = [
  { name: "MidEarth", does: "Connect your MidEarth workspace to your agents" },
  { name: "String Ecosystem", does: "Reach every String service from one chat" },
  { name: "MidEarth Fantasy", does: "Connect MidEarth Fantasy to your agents" },
  { name: "String BenPOS", does: "Connect String BenPOS to your agents" },
  { name: "String Signal AI", does: "Turn live signals into agent actions" },
];

/** Ordered the way a directory surfaces them: most-reached-for first. */
const APPS: App[] = [
  { name: "Google Drive", does: "Search, read, and upload files instantly" },
  { name: "Gmail", does: "Draft replies, summarize threads, & search your inbox" },
  { name: "Google Calendar", does: "Manage your schedule and coordinate meetings" },
  { name: "Notion", does: "Connect your Notion workspace to search pages and databases" },
  { name: "Figma", does: "Generate diagrams and better code from Figma files and comments" },
  { name: "Slack", does: "Send messages, create canvases, and fetch Slack channels" },
  { name: "GitHub", does: "Issues, pull requests, and code across every repository" },
  { name: "Linear", does: "Manage issues, projects & team workflows in Linear" },
  { name: "Jira", does: "Access issues and sprints without leaving the chat" },
  { name: "Asana", does: "Connect to Asana to coordinate tasks and projects" },
  { name: "HubSpot", does: "CRM context for every answer, insight, and update" },
  { name: "Stripe", does: "Look up payments and customers in seconds" },
  { name: "Salesforce", does: "Pull CRM records and reports on demand" },
  { name: "Trello", does: "Read and update boards and cards" },
  { name: "Airtable", does: "Query bases and write records back" },
  { name: "Dropbox", does: "Browse files and folders across your team" },
  { name: "Google Docs", does: "Read and write documents in place" },
  { name: "Google Sheets", does: "Read and update spreadsheets and ranges" },
  { name: "Discord", does: "Read messages and post into any channel" },
  { name: "X (Twitter)", does: "Post and read on X from the same thread" },
  { name: "Reddit", does: "Browse threads and post replies" },
  { name: "Sentry", does: "Triage errors and alerts as they land" },
  { name: "PostHog", does: "Analytics, feature flags, experiments" },
  { name: "Zapier", does: "One more hop to 9,000+ apps, no extra wiring" },
];

/*
  Each mark carries both of its colours as custom properties and lets CSS pick
  between them — the choice is a rule, not an inline value, because an inline
  --mark would outrank the theme's override:
  b.color is the hue lifted for legibility on the dark ground, b.brand is the
  untouched original, which is what these logos are drawn for on white. Four of
  them — the near-black brands — are rendered at --text on dark, so they would
  otherwise disappear against a light tile. Marks that carry per-path fills
  (Slack) are already correct in both themes and keep them.
*/
function Mark({ name, size = 26 }: { name: string; size?: number }) {
  if (isHouse(name)) return <HouseMark name={name} size={size + 6} />;
  const b = BRANDS[name];
  if (!b) return null;
  return (
    <svg
      viewBox={b.viewBox}
      width={size}
      height={size}
      focusable="false"
      style={
        {
          "--mark-dark": b.color ?? "currentColor",
          "--mark-light": b.brand,
        } as CSSProperties
      }
    >
      {b.paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill ?? "var(--mark)"} />
      ))}
    </svg>
  );
}

/** The small "verified publisher" tick that follows each name. */
function Verified() {
  return (
    <svg className="verified" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.2 8.2l1.9 1.9 3.7-3.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** One tile in either grid — same anatomy for ours and for the directory. */
function DirCard({ app }: { app: App }) {
  return (
    <li className="dir-card">
      <span className="dir-tile" aria-hidden="true">
        <Mark name={app.name} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="dir-name truncate">{app.name}</span>
          <Verified />
        </span>
        <span className="dir-does">{app.does}</span>
      </span>

      <span className="dir-action" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="15" height="15">
          <path
            d="M8 3.2v9.6M3.2 8h9.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </li>
  );
}

export default function Integrations() {
  return (
    <section
      id="integrations"
      aria-labelledby="integrations-title"
      className="relative w-full px-6 pt-[clamp(4rem,11vh,8rem)] pb-[clamp(4rem,12vh,9rem)]"
    >
      <div className="mx-auto w-full max-w-[76rem]">
        <header className="max-w-[46rem]">
          <p className="t-eyebrow flex items-center gap-2.5">
            <span className="pip" aria-hidden="true" />
            INTEGRATIONS
          </p>
          <h2 id="integrations-title" className="t-h2 mt-6">
            AI Agent Connectors
          </h2>
          <p className="t-lead mt-5">
            500+ apps out of the box, plus any MCP server you host
            yourself. Your agents read, write and act inside them, without leaving
            the chat.
          </p>
        </header>

        {/* Your own server and your own machine sit above the directory, the
            way a custom connector does — connected, not waiting to be added. */}
        <div className="mt-12 grid max-w-[54rem] grid-cols-1 gap-3.5 md:grid-cols-2">
          <div className="custom-row">
            <span className="dir-tile" aria-hidden="true">
              <span className="dir-tile-glyph">MCP</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="dir-name">Your own MCP server</span>
                <span className="chip">Custom</span>
              </span>
              <span className="dir-host">mcp.your-domain.com</span>
            </span>
            <span className="dir-action is-on" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14">
                <path
                  d="M3.6 8.4l2.8 2.8 6-6.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <div className="custom-row">
            <span className="dir-tile" aria-hidden="true">
              <Mark name="Local VM" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="dir-name">Local VM</span>
                <span className="chip">Local</span>
              </span>
              <span className="dir-host">local virtual machine</span>
            </span>
            <span className="dir-action is-on" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14">
                <path
                  d="M3.6 8.4l2.8 2.8 6-6.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Ours sit above the third-party directory, on the same width as the
            house rows above so the two read as one block. */}
        <h3 className="dir-heading mt-10">String Agents</h3>

        <ul className="mt-5 grid max-w-[54rem] grid-cols-1 gap-3.5 md:grid-cols-2">
          {STRING_AGENTS.map((a) => (
            <DirCard key={a.name} app={a} />
          ))}
        </ul>

        <div className="mt-10 flex items-baseline justify-between gap-6">
          <h3 className="dir-heading">Top connectors</h3>
          {/* a real destination, not a decorative link */}
          <a
            className="dir-all"
            href="https://chandu-dev.tailae0280.ts.net/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the directory &rarr;
          </a>
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {APPS.map((a) => (
            <DirCard key={a.name} app={a} />
          ))}
        </ul>
      </div>
    </section>
  );
}
