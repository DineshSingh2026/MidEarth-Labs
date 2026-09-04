"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "./theme";

/* ──────────────────────────────────────────────────────────────────────────
   The page background is the product, drawn ambiently: a live agent mesh.

   Layers, back to front, one canvas, one rAF loop:

     1. thermals — huge, slow, additive colour fields (the warmth)
     2. lattice  — a dot grid that only exists where light falls on it
     3. mesh     — drifting nodes linked to their near neighbours
     4. packets  — messages that random-walk the mesh, flipping colour at
                   every hub: brand orange is a task going out, machine blue
                   is a result coming back
     5. embers   — sparks drifting up through the whole page

   A slow scan sweeps left to right and the pointer carries its own light;
   both raise the local gain, so the mesh brightens where attention is.

   Thermals render into a fraction-scale buffer because they are pure
   low-frequency colour. Static single frame under prefers-reduced-motion.

   The light theme is the same field with a second palette, not a second
   effect. Two things have to change with it: the thermals stop compositing
   additively — adding light to cream only bleaches it — and the cool tint
   that carries the lattice and the links becomes a terracotta, because a
   #ffc7a3 hairline over #faf9f5 is not a hairline. Everything else is one
   palette lookup away.
   ────────────────────────────────────────────────────────────────────────── */

type RGB = readonly [number, number, number];

type Palette = {
  BRAND: RGB;
  BRAND2: RGB;
  GOLD: RGB;
  MACHINE: RGB;
  TINT: RGB;
  /** thermals add on dark and layer on light */
  blend: GlobalCompositeOperation;
  /** thermals want far less weight once they are tinting paper */
  thermal: number;
  /** geometry ink: alpha that reads on black is heavy-handed on cream */
  line: number;
  /** a hub's glow is light spilling; on paper it reads as a stain instead */
  bloom: number;
};

const DARK: Palette = {
  BRAND: [244, 78, 4],
  BRAND2: [255, 128, 56],
  GOLD: [232, 163, 61],
  MACHINE: [76, 125, 255],
  TINT: [255, 199, 163],
  blend: "lighter",
  thermal: 1,
  line: 1,
  bloom: 1,
};

const LIGHT: Palette = {
  BRAND: [226, 70, 4],
  BRAND2: [201, 88, 26],
  GOLD: [173, 116, 26],
  MACHINE: [50, 84, 206],
  TINT: [186, 106, 56],
  blend: "source-over",
  thermal: 0.46,
  line: 0.8,
  bloom: 0.5,
};

type Hue = "BRAND" | "BRAND2" | "GOLD" | "MACHINE" | "TINT";

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

type Thermal = {
  /** position and radius are fractions of the viewport, so resize is free */
  fx: number;
  fy: number;
  fr: number;
  vx: number;
  vy: number;
  /** resolved against the active palette at draw time, not baked in */
  c: Hue;
  a: number;
  ph: number;
  sp: number;
};

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hub: boolean;
  ph: number;
  /** decays from 1 each time a packet lands here */
  flash: number;
  /** local light gain for this frame */
  e: number;
};

type Packet = {
  from: number;
  to: number;
  t: number;
  /** px per second */
  sp: number;
  c: RGB;
};

type Ember = {
  fx: number;
  y: number;
  vy: number;
  amp: number;
  ph: number;
  sp: number;
  r: number;
  c: RGB;
  a: number;
};

const THERMALS: Thermal[] = [
  { fx: 0.36, fy: 0.2, fr: 0.55, vx: 0.011, vy: 0.006, c: "BRAND", a: 0.34, ph: 0, sp: 0.16 },
  { fx: 0.72, fy: 0.34, fr: 0.42, vx: -0.009, vy: 0.008, c: "GOLD", a: 0.18, ph: 1.7, sp: 0.21 },
  { fx: 0.18, fy: 0.66, fr: 0.46, vx: 0.007, vy: -0.005, c: "MACHINE", a: 0.23, ph: 3.1, sp: 0.13 },
  { fx: 0.84, fy: 0.78, fr: 0.38, vx: -0.006, vy: -0.009, c: "BRAND2", a: 0.17, ph: 4.4, sp: 0.19 },
  { fx: 0.5, fy: 0.46, fr: 0.3, vx: 0.005, vy: 0.004, c: "TINT", a: 0.08, ph: 2.2, sp: 0.24 },
];

const GRID = 34;
const EMBER_COUNT = 36;

/* mesh */
const LINK = 186; // px — link two nodes closer than this
const NODE_AREA = 14000; // one node per this many px² of viewport
const NODE_MIN = 54;
const NODE_MAX = 150;
const MAX_DEG = 10; // adjacency slots kept per node for the packet walk
const HUB_EVERY = 12; // roughly one hub per this many nodes
const PACKET_COUNT = 20;

/* lights */
const PTR_R = 210;
const SWEEP_FRAC = 0.15; // scan half-width as a fraction of viewport width
const SWEEP_DUR = 7.5; // seconds to cross
const SWEEP_GAP = 6.5; // seconds of rest between passes

export default function BackgroundField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const P = theme === "light" ? LIGHT : DARK;
    const { BRAND, BRAND2, GOLD, MACHINE, TINT } = P;

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;

    // Thermals are low-frequency colour; a quarter-scale buffer is free.
    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d");
    const BUF_SCALE = 0.26;

    const thermals = THERMALS.map((t) => ({ ...t }));

    /* ── mesh ──────────────────────────────────────────────────────────── */

    let nodes: Node[] = [];
    let packets: Packet[] = [];

    // Adjacency is rebuilt every frame into flat arrays so the walk never
    // allocates. Links are collected the same way for the draw pass.
    let adj = new Int32Array(0);
    let deg = new Int32Array(0);
    let linkA = new Int32Array(0);
    let linkB = new Int32Array(0);
    let linkD = new Float32Array(0);
    let linkN = 0;

    const buildMesh = () => {
      const count = Math.round(
        Math.min(NODE_MAX, Math.max(NODE_MIN, (w * h) / NODE_AREA)),
      );

      nodes = Array.from({ length: count }, (_, i) => {
        const hub = i % HUB_EVERY === 0;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: rand(-9, 9),
          vy: rand(-9, 9),
          r: hub ? 2.6 : rand(0.9, 1.7),
          hub,
          ph: rand(0, Math.PI * 2),
          flash: 0,
          e: 1,
        };
      });

      adj = new Int32Array(count * MAX_DEG);
      deg = new Int32Array(count);
      const maxLinks = count * MAX_DEG;
      linkA = new Int32Array(maxLinks);
      linkB = new Int32Array(maxLinks);
      linkD = new Float32Array(maxLinks);

      // link the mesh once up front so packets can be seeded onto real edges
      relink();

      packets = Array.from({ length: Math.min(PACKET_COUNT, count) }, () => {
        const p: Packet = {
          from: 0,
          to: 0,
          t: Math.random(),
          sp: rand(95, 185),
          c: Math.random() < 0.62 ? BRAND2 : MACHINE,
        };
        placeOnEdge(p);
        return p;
      });
    };

    /** Drop a packet onto some existing edge — used to seed and to recover. */
    const placeOnEdge = (p: Packet) => {
      const n = nodes.length;
      for (let tries = 0; tries < 24; tries++) {
        const i = (Math.random() * n) | 0;
        const j = nextHop(i, -1);
        if (j >= 0) {
          p.from = i;
          p.to = j;
          p.t = 0;
          return;
        }
      }
      p.from = 0;
      p.to = 0;
      p.t = 0;
    };

    /** O(n²) over ~130 nodes is a few thousand checks — cheaper than hashing. */
    const relink = () => {
      linkN = 0;
      deg.fill(0);
      const n = nodes.length;
      const lim = LINK * LINK;

      for (let i = 0; i < n; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < n; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > lim) continue;

          if (linkN < linkA.length) {
            linkA[linkN] = i;
            linkB[linkN] = j;
            linkD[linkN] = Math.sqrt(d2);
            linkN++;
          }
          if (deg[i] < MAX_DEG) adj[i * MAX_DEG + deg[i]++] = j;
          if (deg[j] < MAX_DEG) adj[j * MAX_DEG + deg[j]++] = i;
        }
      }
    };

    /** Next hop for a walking packet: any neighbour but the one it came from. */
    const nextHop = (at: number, cameFrom: number) => {
      const d = deg[at];
      if (d === 0) return -1;
      if (d === 1) return adj[at * MAX_DEG];
      for (let tries = 0; tries < 6; tries++) {
        const pick = adj[at * MAX_DEG + ((Math.random() * d) | 0)];
        if (pick !== cameFrom) return pick;
      }
      return adj[at * MAX_DEG];
    };

    /* ── embers ────────────────────────────────────────────────────────── */

    const embers: Ember[] = Array.from({ length: EMBER_COUNT }, () => ({
      fx: Math.random(),
      y: Math.random(),
      vy: rand(6, 20),
      amp: rand(6, 26),
      ph: rand(0, Math.PI * 2),
      sp: rand(0.15, 0.5),
      r: rand(0.6, 1.9),
      c: Math.random() < 0.62 ? BRAND2 : Math.random() < 0.6 ? GOLD : TINT,
      a: rand(0.25, 0.75),
    }));

    /* ── lights ────────────────────────────────────────────────────────── */

    // pointer light, lerped so it trails the cursor instead of snapping
    const ptr = { x: -1, y: -1, tx: -1, ty: -1, on: 0 };
    // the scan rests offscreen between passes, so it reads as a beat
    const scan = { t: -SWEEP_GAP * Math.random() };
    let sweepX = -1e6;
    let sweepW = 1;

    /** Local brightness multiplier from the scan bar and the pointer light. */
    const gainAt = (x: number, y: number) => {
      let g = 1;
      const sx = (x - sweepX) / sweepW;
      if (sx > -3 && sx < 3) g += 1.7 * Math.exp(-sx * sx);
      if (ptr.on > 0.01) {
        const dx = (x - ptr.x) / PTR_R;
        const dy = (y - ptr.y) / PTR_R;
        const d2 = dx * dx + dy * dy;
        if (d2 < 9) g += 2.1 * ptr.on * Math.exp(-d2);
      }
      return g;
    };

    const resize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      const had = w > 0 && h > 0;
      const rx = had ? nw / w : 1;
      const ry = had ? nh / h : 1;

      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = nw;
      h = nh;
      canvas.width = Math.round(nw * dpr);
      canvas.height = Math.round(nh * dpr);
      canvas.style.width = nw + "px";
      canvas.style.height = nh + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buf.width = Math.max(1, Math.round(nw * BUF_SCALE));
      buf.height = Math.max(1, Math.round(nh * BUF_SCALE));
      sweepW = Math.max(120, nw * SWEEP_FRAC);

      if (!had) {
        buildMesh();
      } else {
        // keep the composition the user was looking at; just restretch it
        for (const n of nodes) {
          n.x *= rx;
          n.y *= ry;
        }
      }
    };

    const drawThermals = (time: number) => {
      if (!bctx) return;
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.clearRect(0, 0, buf.width, buf.height);
      bctx.globalCompositeOperation = P.blend;

      for (const t of thermals) {
        const drift = reduce ? 0 : time;
        // wrap the drift so blobs orbit gently instead of leaving the frame
        const x = (t.fx + Math.sin(drift * t.vx + t.ph) * 0.09) * buf.width;
        const y = (t.fy + Math.cos(drift * t.vy + t.ph * 1.3) * 0.07) * buf.height;
        const breath = reduce ? 1 : 1 + Math.sin(drift * t.sp + t.ph) * 0.14;
        const r = t.fr * Math.max(buf.width, buf.height) * breath;

        const hue = P[t.c];
        const a = t.a * P.thermal;
        const g = bctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(hue, a));
        g.addColorStop(0.42, rgba(hue, a * 0.34));
        g.addColorStop(1, rgba(hue, 0));
        bctx.fillStyle = g;
        bctx.fillRect(x - r, y - r, r * 2, r * 2);
      }

      bctx.globalCompositeOperation = "source-over";
      ctx.drawImage(buf, 0, 0, w, h);
    };

    /** Dots are only drawn inside a light's radius — the lattice is revealed
     *  rather than tiled, so the cost scales with light, not viewport. */
    const drawGridUnderLight = (
      lx: number,
      ly: number,
      radius: number,
      c: RGB,
      strength: number,
    ) => {
      if (strength <= 0.01) return;
      const x0 = Math.ceil((lx - radius) / GRID) * GRID;
      const y0 = Math.ceil((ly - radius) / GRID) * GRID;
      const r2 = radius * radius;

      for (let gx = x0; gx <= lx + radius; gx += GRID) {
        if (gx < -GRID || gx > w + GRID) continue;
        for (let gy = y0; gy <= ly + radius; gy += GRID) {
          if (gy < -GRID || gy > h + GRID) continue;
          const dx = gx - lx;
          const dy = gy - ly;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const f = 1 - Math.sqrt(d2) / radius;
          const a = f * f * 0.7 * strength * P.line;
          if (a < 0.012) continue;
          ctx.fillStyle = rgba(c, a);
          ctx.fillRect(gx - 1, gy - 1, 2, 2);
        }
      }
    };

    /** Drift, wrap, and cache this frame's light gain per node. */
    const stepNodes = (time: number, dt: number) => {
      const m = LINK * 0.5;
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          if (n.x < -m) n.x = w + m;
          else if (n.x > w + m) n.x = -m;
          if (n.y < -m) n.y = h + m;
          else if (n.y > h + m) n.y = -m;
          n.flash = Math.max(0, n.flash - dt * 1.6);
        }
        n.e = gainAt(n.x, n.y);
        // hubs breathe on their own so the mesh never reads as fully static
        if (n.hub && !reduce) n.e *= 1 + Math.sin(time * 0.9 + n.ph) * 0.22;
      }
    };

    const drawLinks = () => {
      for (let k = 0; k < linkN; k++) {
        const a = nodes[linkA[k]];
        const b = nodes[linkB[k]];
        const near = 1 - linkD[k] / LINK;
        const gain = Math.max(a.e, b.e);
        const alpha = Math.min(0.4, near * 0.26 * gain) * P.line;
        if (alpha < 0.014) continue;

        // links touching a hub carry its warmth, the rest stay machine-cool
        const hot = a.hub || b.hub;
        ctx.strokeStyle = rgba(hot ? BRAND2 : TINT, alpha);
        ctx.lineWidth = hot ? 1 : 0.75;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    };

    const drawNodes = () => {
      for (const n of nodes) {
        const gain = Math.min(3.2, n.e);
        const c = n.hub ? BRAND2 : TINT;

        if (n.hub) {
          const bloom = 16 + gain * 5;
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, bloom);
          g.addColorStop(0, rgba(BRAND, 0.3 * Math.min(1.6, gain) * P.bloom));
          g.addColorStop(1, rgba(BRAND, 0));
          ctx.fillStyle = g;
          ctx.fillRect(n.x - bloom, n.y - bloom, bloom * 2, bloom * 2);
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (n.hub ? 1 : 0.9 + gain * 0.1), 0, Math.PI * 2);
        ctx.fillStyle = rgba(c, Math.min(0.95, 0.34 * gain));
        ctx.fill();

        // a packet just landed: ring out from the node
        if (n.flash > 0.01) {
          const rr = 3 + (1 - n.flash) * 17;
          ctx.beginPath();
          ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(GOLD, n.flash * 0.45);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    /** Messages random-walking the mesh — the page's clearest sign of life. */
    const stepPackets = (dt: number) => {
      for (const p of packets) {
        let a = nodes[p.from];
        let b = nodes[p.to];
        if (!a || !b) continue;

        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.max(1, Math.hypot(dx, dy));

        // The edge under this packet can vanish mid-flight — the nodes drift
        // apart, or one wraps to the far side. Never draw that stretched line:
        // re-drop the packet onto an edge that still exists.
        if (dist > LINK * 1.35) {
          placeOnEdge(p);
          a = nodes[p.from];
          b = nodes[p.to];
          dx = b.x - a.x;
          dy = b.y - a.y;
          dist = Math.max(1, Math.hypot(dx, dy));
          if (dist > LINK * 1.35) continue;
        }

        if (!reduce) {
          p.t += (p.sp * dt) / dist;
          if (p.t >= 1) {
            b.flash = 1;
            // a hub turns a task into a result, and vice versa
            if (b.hub) p.c = p.c === BRAND2 ? MACHINE : BRAND2;
            const next = nextHop(p.to, p.from);
            if (next < 0) {
              p.from = (Math.random() * nodes.length) | 0;
              const seed = nextHop(p.from, -1);
              p.to = seed < 0 ? p.from : seed;
            } else {
              p.from = p.to;
              p.to = next;
            }
            p.t = 0;
            continue;
          }
        }

        const t = reduce ? 0.5 : p.t;
        const x = a.x + dx * t;
        const y = a.y + dy * t;
        const tt = Math.max(0, t - 0.3);
        const tx = a.x + dx * tt;
        const ty = a.y + dy * tt;

        const trail = ctx.createLinearGradient(tx, ty, x, y);
        trail.addColorStop(0, rgba(p.c, 0));
        trail.addColorStop(1, rgba(p.c, 0.5));
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();

        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, rgba(p.c, 0.38));
        g.addColorStop(1, rgba(p.c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - 9, y - 9, 18, 18);

        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.c, 0.95);
        ctx.fill();
      }
    };

    const drawEmbers = (time: number, dt: number) => {
      for (const e of embers) {
        if (!reduce) {
          e.y -= (e.vy * dt) / h;
          if (e.y < -0.04) {
            e.y = 1.04;
            e.fx = Math.random();
          }
        }
        const sway = Math.sin(time * e.sp + e.ph) * e.amp;
        const x = e.fx * w + sway;
        const y = e.y * h;
        const twinkle = reduce ? 0.8 : 0.55 + Math.sin(time * 1.6 + e.ph) * 0.45;

        ctx.beginPath();
        ctx.arc(x, y, e.r * 3.6, 0, Math.PI * 2);
        ctx.fillStyle = rgba(e.c, e.a * twinkle * 0.1);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(e.c, e.a * twinkle);
        ctx.fill();
      }
    };

    const stepScan = (dt: number) => {
      if (reduce) {
        sweepX = -1e6;
        return;
      }
      scan.t += dt;
      if (scan.t > SWEEP_DUR + SWEEP_GAP) scan.t = 0;
      if (scan.t < 0 || scan.t > SWEEP_DUR) {
        sweepX = -1e6;
        return;
      }
      const p = scan.t / SWEEP_DUR;
      sweepX = -sweepW * 1.5 + p * (w + sweepW * 3);
    };

    const render = (time: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);

      drawThermals(time);
      stepScan(dt);

      // primary light sits roughly where the network core lands
      const coreX = w * 0.42;
      const coreY = h * 0.26;
      const pulse = reduce ? 1 : 1 + Math.sin(time * 0.7) * 0.08;
      drawGridUnderLight(coreX, coreY, Math.min(w, h) * 0.52 * pulse, TINT, 0.6);

      if (ptr.on > 0.01) {
        drawGridUnderLight(ptr.x, ptr.y, 240, BRAND2, ptr.on);
      }

      stepNodes(time, dt);
      relink();
      drawLinks();
      stepPackets(dt);
      drawNodes();
      drawEmbers(time, dt);
    };

    resize();

    if (reduce) {
      render(0, 0);
      const onResize = () => {
        resize();
        render(0, 0);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const onPointer = (e: PointerEvent) => {
      ptr.tx = e.clientX;
      ptr.ty = e.clientY;
      if (ptr.x < 0) {
        ptr.x = e.clientX;
        ptr.y = e.clientY;
      }
    };
    const onLeave = () => {
      ptr.tx = -1;
      ptr.ty = -1;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let last = performance.now();
    const start = last;
    let hidden = false;
    const onVis = () => {
      hidden = document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const time = (now - start) / 1000;

      if (ptr.tx >= 0) {
        ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 6);
        ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 6);
        ptr.on = Math.min(1, ptr.on + dt * 1.6);
      } else {
        ptr.on = Math.max(0, ptr.on - dt * 1.6);
      }

      render(time, dt);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
    // a theme change rebuilds the field: same geometry rules, new palette
  }, [theme]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={ref} className="block h-full w-full" />
      {/* keeps the type legible over the brightest part of the field — the
          gradient itself lives in globals.css, since it is the page ground
          and has to follow the theme */}
      <div className="field-veil absolute inset-0" />
    </div>
  );
}
