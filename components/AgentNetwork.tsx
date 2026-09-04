"use client";

import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Geometry, then a hand-rolled rAF loop that writes attributes on a fixed
   pool of DOM nodes. No React state per frame, no animation library.
   ────────────────────────────────────────────────────────────────────────── */

type Pt = { x: number; y: number };
type Place = "above" | "below" | "left" | "right";
type Label = { x: number; y: number; text: string; place: Place; delay: number };
type Edge = { a: Pt; b: Pt; c?: Pt; ai: number; bi: number };
type Box = { l: number; r: number; t: number; b: number };

const CORE = -1;
const AGENT_NAMES = ["RESEARCH", "BUILD", "VERIFY"];
const COMPACT_AT = 640;
const PAD = 26; // clearance around the type block
const SAFE = 74; // clearance from the viewport edge

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/**
 * Edges and packets are free to cross behind the type — that is the bleed.
 * Nodes and their labels are not: they get pushed out of the measured type
 * block along whichever axis is cheapest, so a label never lands on a word
 * at any viewport size.
 */
function escapeBox(p: Pt, box: Box, w: number, h: number): Pt {
  const inside = (q: Pt) => q.x > box.l && q.x < box.r && q.y > box.t && q.y < box.b;
  let out = p;

  if (inside(out)) {
    const d = [out.x - box.l, box.r - out.x, out.y - box.t, box.b - out.y];
    const min = Math.min(...d);
    if (min === d[0]) out = { x: box.l, y: out.y };
    else if (min === d[1]) out = { x: box.r, y: out.y };
    else if (min === d[2]) out = { x: out.x, y: box.t };
    else out = { x: out.x, y: box.b };
  }

  out = { x: clamp(out.x, SAFE, w - SAFE), y: clamp(out.y, 46, h - 46) };

  // Clamping to the viewport can push a node back into the type block;
  // if so, resolve it vertically, where there is always more room.
  if (inside(out)) {
    out = {
      x: out.x,
      y:
        out.y - box.t < box.b - out.y
          ? Math.max(46, box.t)
          : Math.min(h - 46, box.b),
    };
  }
  return out;
}

function buildLayout(w: number, h: number, text: Box | null) {
  const compact = w < COMPACT_AT;

  if (compact) {
    // Below the CTA, tighter radius, one satellite fewer — not a cropped
    // version of the desktop composition. Nothing to avoid down here.
    const r = clamp(w * 0.26, 72, 96);
    const core = { x: w * 0.5, y: h * 0.24 };
    const agents = [
      { x: core.x - r * 1.04, y: core.y + r * 0.62 },
      { x: core.x + r * 0.9, y: core.y + r * 0.3 },
    ];
    return { core, agents, compact, box: null as Box | null };
  }

  const box: Box = text
    ? { l: text.l - PAD, r: text.r + PAD, t: text.t - PAD, b: text.b + PAD }
    : { l: w * 0.5 - 442, r: w * 0.5 + 442, t: h * 0.16, b: h * 0.84 };

  const cx = (box.l + box.r) / 2;
  const bh = box.b - box.t;
  const sx = clamp(w * 0.4, 150, 460);

  // Wide enough for nodes to sit in the side margins?
  const wide = box.l - SAFE >= 40 && w - SAFE - box.r >= 40;
  const headroom = box.t - 46;

  let core: Pt;
  let raw: Pt[];

  if (wide) {
    // Core above the type and off-axis, so its bloom rakes the headline from
    // the upper left instead of haloing it symmetrically. Satellite radii and
    // angular gaps are deliberately unequal — even spacing is what makes
    // these read as diagrams rather than compositions.
    core = {
      x: clamp(cx - sx * 0.34, SAFE, w - SAFE),
      y: clamp(box.t - 30, 46, h * 0.42),
    };
    raw = [
      { x: box.l - 52, y: box.t + bh * 0.46 },
      { x: box.r + 62, y: box.t + bh * 0.16 },
      { x: box.r + 30, y: box.b + 42 },
    ];
  } else if (headroom >= 150) {
    // The type fills the width, so the network lives in the bands above and
    // below it. Heights are staggered hard: three nodes at one altitude is
    // a row, and a row is a diagram.
    core = { x: w * 0.4, y: clamp(box.t - 120, 46, h * 0.4) };
    raw = [
      { x: w * 0.16, y: box.t - 30 },
      { x: w * 0.84, y: box.t - 78 },
      { x: w * 0.62, y: Math.min(box.b + 44, h - 46) },
    ];
  } else {
    // Neither margins nor headroom: everything drops below the type.
    core = { x: w * 0.38, y: Math.min(box.b + 40, h - 46) };
    raw = [
      { x: w * 0.14, y: Math.min(box.b + 100, h - 46) },
      { x: w * 0.8, y: Math.min(box.b + 62, h - 46) },
      { x: w * 0.58, y: Math.min(box.b + 138, h - 46) },
    ];
  }

  const agents = raw.map((p) => escapeBox(p, box, w, h));

  return { core, agents, compact, box };
}

function labelFor(
  p: Pt,
  box: Box | null,
  core: Pt,
  w: number,
  text: string,
  delay: number,
): Label {
  let place: Place;
  if (!box) place = p.x >= core.x ? "right" : "left";
  else if (p.x <= box.l) place = "left";
  else if (p.x >= box.r) place = "right";
  else place = p.y <= box.t ? "above" : "below";

  // A side label needs room for roughly 8 tracked characters.
  if (place === "left" && p.x < 96) place = p.y <= (box?.t ?? 0) ? "above" : "below";
  if (place === "right" && p.x > w - 108)
    place = p.y <= (box?.t ?? 0) ? "above" : "below";

  return { x: p.x, y: p.y, text, place, delay };
}

const LABEL_OFFSET: Record<Place, { dx: number; dy: number; t: string }> = {
  above: { dx: 0, dy: -14, t: "translate(-50%, -100%)" },
  below: { dx: 0, dy: 14, t: "translate(-50%, 0)" },
  left: { dx: -14, dy: 0, t: "translate(-100%, -50%)" },
  right: { dx: 14, dy: 0, t: "translate(0, -50%)" },
};

/** Quadratic control point pushed away from the core, so agent-to-agent
 *  traffic visibly bows around the hub instead of cutting through it. */
function bow(a: Pt, b: Pt, core: Pt): Pt {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = mx - core.x;
  const dy = my - core.y;
  const len = Math.hypot(dx, dy) || 1;
  const push = Math.hypot(b.x - a.x, b.y - a.y) * 0.26;
  return { x: mx + (dx / len) * push, y: my + (dy / len) * push };
}

function pointOn(e: Edge, t: number): Pt {
  if (!e.c) {
    return { x: e.a.x + (e.b.x - e.a.x) * t, y: e.a.y + (e.b.y - e.a.y) * t };
  }
  const u = 1 - t;
  return {
    x: u * u * e.a.x + 2 * u * t * e.c.x + t * t * e.b.x,
    y: u * u * e.a.y + 2 * u * t * e.c.y + t * t * e.b.y,
  };
}

type Particle = {
  edge: number;
  dir: 1 | -1;
  t: number;
  dur: number;
  live: boolean;
};

/**
 * Traffic is colour-coded by what it means, not for decoration:
 * a task leaving the core is brand orange, a result coming back is machine
 * blue, and agents talking directly to each other are gold. You can read the
 * direction of work off the page without being told.
 */
const PACKET = {
  out: { head: "#FF8038", trail: "#F44E04" },
  in: { head: "#4C7DFF", trail: "#4C7DFF" },
  lateral: { head: "#E8A33D", trail: "#E8A33D" },
} as const;

export default function AgentNetwork() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [textBox, setTextBox] = useState<Box | null>(null);

  const partRefs = useRef<(SVGGElement | null)[]>([]);
  const flashRefs = useRef<(SVGGElement | null)[]>([]);
  const coreRingRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    // The type block is a sibling, so it is read from the DOM rather than
    // threaded through props — this component still takes none.
    const type = document.querySelector<HTMLElement>("[data-hero-type]");

    const measure = () => {
      const host = el.getBoundingClientRect();
      const w = Math.round(host.width);
      const h = Math.round(host.height);
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));

      if (!type) return;
      const t = type.getBoundingClientRect();
      const next: Box = {
        l: Math.round(t.left - host.left),
        r: Math.round(t.right - host.left),
        t: Math.round(t.top - host.top),
        b: Math.round(t.bottom - host.top),
      };
      setTextBox((prev) =>
        prev && prev.l === next.l && prev.r === next.r && prev.t === next.t && prev.b === next.b
          ? prev
          : next,
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (type) ro.observe(type);
    // fonts settling can reflow the headline without resizing the host
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, []);

  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const ready = w > 0 && h > 0;

  const { core, agents, compact, box } = ready
    ? buildLayout(w, h, textBox)
    : { core: { x: 0, y: 0 }, agents: [] as Pt[], compact: false, box: null as Box | null };

  const spokes: Edge[] = agents.map((a, i) => ({ a: core, b: a, ai: CORE, bi: i }));
  const lateral: Edge[] = [];
  for (let i = 0; i < agents.length; i += 1) {
    for (let j = i + 1; j < agents.length; j += 1) {
      lateral.push({
        a: agents[i],
        b: agents[j],
        c: bow(agents[i], agents[j], core),
        ai: i,
        bi: j,
      });
    }
  }
  const edges = [...spokes, ...lateral];

  const labels: Label[] = ready
    ? [
        {
          x: core.x,
          y: core.y,
          text: "YOU",
          // sits above the core unless the type reaches too high for that
          place: !box || core.y - 14 <= box.t ? "above" : "left",
          delay: 620,
        },
        ...agents.map((a, i) =>
          labelFor(a, box, core, w, AGENT_NAMES[i] ?? "AGENT", 630 + i * 80),
        ),
      ]
    : [];

  const pool = compact ? 8 : 12;
  const bloomR = compact ? 74 : 96;

  useEffect(() => {
    if (!ready || agents.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const place = (i: number, p: Pt, angle: number, o: number) => {
      const g = partRefs.current[i];
      if (!g) return;
      g.setAttribute(
        "transform",
        "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ") rotate(" + angle.toFixed(1) + ")",
      );
      g.setAttribute("opacity", o.toFixed(3));
    };

    // Reduced motion: one frozen packet per spoke, nothing else moves.
    if (reduce) {
      const frozen = [0.44, 0.62, 0.36];
      spokes.forEach((e, i) => {
        const t = frozen[i] ?? 0.5;
        const p = pointOn(e, t);
        const q = pointOn(e, Math.max(0, t - 0.02));
        place(i, p, (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI, 1);
      });
      for (let i = spokes.length; i < pool; i += 1) place(i, { x: -60, y: -60 }, 0, 0);
      return;
    }

    const particles: Particle[] = Array.from({ length: pool }, () => ({
      edge: 0,
      dir: 1 as 1 | -1,
      t: 0,
      dur: 2000,
      live: false,
    }));
    const flash = new Array<number>(agents.length).fill(0);
    let coreFlash = 0;

    const dispatch = () => {
      const p = particles.find((x) => !x.live);
      if (!p) return;
      const useLateral = lateral.length > 0 && Math.random() < 0.18;
      p.edge = useLateral
        ? spokes.length + Math.floor(Math.random() * lateral.length)
        : Math.floor(Math.random() * spokes.length);
      p.dir = Math.random() < 0.5 ? 1 : -1;
      p.t = p.dir === 1 ? 0 : 1;
      p.dur = rand(1600, 2400);
      p.live = true;

      const tone = useLateral
        ? PACKET.lateral
        : p.dir === 1
          ? PACKET.out
          : PACKET.in;
      const g = partRefs.current[particles.indexOf(p)];
      if (g) {
        g.style.setProperty("--pc", tone.head);
        g.style.setProperty("--pt", tone.trail);
      }
    };

    const arrive = (e: Edge, dir: 1 | -1) => {
      const target = dir === 1 ? e.bi : e.ai;
      if (target === CORE) coreFlash = 1;
      else flash[target] = 1;
    };

    let raf = 0;
    let last = performance.now();
    let nextAt = last + 1100; // first dispatch, per the entrance sequence

    const frame = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;

      if (now >= nextAt) {
        dispatch();
        nextAt = now + rand(400, 900);
      }

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (!p.live) {
          place(i, { x: -60, y: -60 }, 0, 0);
          continue;
        }

        const e = edges[p.edge];
        p.t += (p.dir * dt) / p.dur;

        if ((p.dir === 1 && p.t >= 1) || (p.dir === -1 && p.t <= 0)) {
          arrive(e, p.dir);
          p.live = false;
          place(i, { x: -60, y: -60 }, 0, 0);
          continue;
        }

        const cur = pointOn(e, p.t);
        const prev = pointOn(e, clamp(p.t - p.dir * 0.02, 0, 1));
        const angle = (Math.atan2(cur.y - prev.y, cur.x - prev.x) * 180) / Math.PI;
        // ease in and out at the ends so packets emerge from the nodes
        const fade = Math.min(1, Math.min(p.t, 1 - p.t) / 0.12);
        place(i, cur, angle, fade);
      }

      for (let i = 0; i < flash.length; i += 1) {
        flash[i] = Math.max(0, flash[i] - dt / 600);
        flashRefs.current[i]?.setAttribute("opacity", flash[i].toFixed(3));
      }
      coreFlash = Math.max(0, coreFlash - dt / 600);
      coreRingRef.current?.setAttribute("stroke-opacity", coreFlash.toFixed(3));

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, w, h, compact, textBox]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none relative z-0 mt-6 h-[140px] w-full select-none sm:absolute sm:inset-0 sm:-z-10 sm:mt-0 sm:h-auto"
    >
      {ready ? (
        <>
          <svg
            className="net-svg absolute inset-0 h-full w-full"
            viewBox={"0 0 " + w + " " + h}
            role="presentation"
            focusable="false"
          >
            <defs>
              <radialGradient id="an-bloom">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.3" />
                <stop offset="45%" stopColor="var(--brand)" stopOpacity="0.09" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="an-spark">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* agent-to-agent lanes: present, faint, occasionally used */}
            {lateral.map((e, i) => (
              <path
                key={"lat-" + i}
                className="net-weak"
                style={{ animationDelay: "900ms" }}
                d={
                  "M " + e.a.x + " " + e.a.y +
                  " Q " + e.c!.x + " " + e.c!.y +
                  " " + e.b.x + " " + e.b.y
                }
                fill="none"
                stroke="var(--brand)"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
            ))}

            {/* spokes draw outward from the core */}
            {spokes.map((e, i) => (
              <path
                key={"spoke-" + i}
                className="net-edge"
                style={{ animationDelay: 150 + i * 80 + "ms" }}
                d={"M " + e.a.x + " " + e.a.y + " L " + e.b.x + " " + e.b.y}
                fill="none"
                stroke="var(--brand)"
                strokeOpacity="0.15"
                strokeWidth="1"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset="1"
              />
            ))}

            {/* core: the page's only light source */}
            <g className="net-core">
              <g className="net-breathe">
                <circle cx={core.x} cy={core.y} r={bloomR} fill="url(#an-bloom)" />
                <circle cx={core.x} cy={core.y} r={7} fill="var(--brand)" fillOpacity="0.18" />
                <circle
                  cx={core.x}
                  cy={core.y}
                  r={7}
                  fill="none"
                  stroke="var(--brand)"
                  strokeOpacity="0.75"
                  strokeWidth="1.2"
                />
                {/* a returning result lands on the core in machine blue */}
                <circle
                  ref={coreRingRef}
                  cx={core.x}
                  cy={core.y}
                  r={11}
                  fill="none"
                  stroke="var(--machine)"
                  strokeOpacity="0"
                  strokeWidth="1.4"
                />
              </g>
            </g>

            {/* agents */}
            {agents.map((a, i) => (
              <g
                key={"node-" + i}
                className="net-node"
                style={{ animationDelay: 530 + i * 80 + "ms" }}
              >
                <circle cx={a.x} cy={a.y} r={13} fill="url(#an-spark)" opacity="0.3" />
                <circle cx={a.x} cy={a.y} r={4} fill="var(--ink)" />
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={4}
                  fill="none"
                  stroke="var(--line-2)"
                  strokeWidth="1.25"
                />
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={4}
                  fill="none"
                  stroke="var(--brand)"
                  strokeOpacity="0.3"
                  strokeWidth="1"
                />
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={1.3}
                  fill="var(--brand)"
                  fillOpacity="0.5"
                />
                <g
                  ref={(el) => {
                    flashRefs.current[i] = el;
                  }}
                  opacity="0"
                >
                  <circle cx={a.x} cy={a.y} r={16} fill="url(#an-spark)" />
                  <circle
                    cx={a.x}
                    cy={a.y}
                    r={4}
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="1.25"
                  />
                </g>
              </g>
            ))}

            {/* packet pool */}
            <g>
              {Array.from({ length: pool }, (_, i) => (
                <g
                  key={"p-" + i}
                  ref={(el) => {
                    partRefs.current[i] = el;
                  }}
                  opacity="0"
                >
                  <line
                    x1="-16"
                    y1="0"
                    x2="-1"
                    y2="0"
                    style={{ stroke: "var(--pt, var(--brand))" }}
                    strokeOpacity="0.5"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <circle r="5.5" style={{ fill: "var(--pc, var(--brand))" }} fillOpacity="0.16" />
                  <circle r="1.9" style={{ fill: "var(--pc, var(--brand))" }} fillOpacity="1" />
                </g>
              ))}
            </g>
          </svg>

          {/* Labels sit outside the masked SVG so they keep full contrast. */}
          <div className="absolute inset-0">
            {labels.map((l) => {
              const o = LABEL_OFFSET[l.place];
              return (
                <span
                  key={l.text}
                  className="t-nodelabel net-label absolute"
                  style={{
                    left: l.x + o.dx,
                    top: l.y + o.dy,
                    transform: o.t,
                    animationDelay: l.delay + "ms",
                  }}
                >
                  {l.text}
                </span>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
