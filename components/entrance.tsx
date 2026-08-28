"use client";

import { useEffect, useRef, useState } from "react";
import { dotSize, gridCells } from "@/lib/grid";

const SESSION_KEY = "amadi:entered";
const COLS = 13;
const CELLS = gridCells(COLS, COLS);
const STEP = 100 / (COLS - 1);

// React's server renderer trims style numbers, so full-precision values hydrate
// as a mismatch. Fixing the precision here makes both sides agree.
const pct = (n: number) => `${n.toFixed(3)}%`;

/**
 * The site opens on one breath.
 *
 * A dot grid expands from its middle outward — the stagger mechanism from the
 * reference — breathes once, then opens a hole in itself that grows past the
 * viewport. The hero is mounted underneath the whole time, so the reveal is a
 * hole rather than a transition between two screens.
 *
 * It is a brand moment, not a loader: nothing waits on it, and it plays once
 * per session. The overlay is server-rendered and opaque from the first paint —
 * mounting it later would let the hero flash through for a frame — and CSS,
 * not JavaScript, keeps it away from anyone who asked for reduced motion.
 */
export function Entrance() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    // Reduced motion needs no work here: the CSS rule above has already taken
    // the overlay out of the layout, and nothing should animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      seen = true; // storage blocked: treat as a return visit rather than replay
    }

    // Claimed before the hero's own reveals are scheduled, so its headline does
    // not play underneath the overlay.
    if (!seen) document.documentElement.setAttribute("data-entrance", "");

    let cancelled = false;
    let kill = () => {};

    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      const finish = () => {
        document.documentElement.removeAttribute("data-entrance");
        window.dispatchEvent(new Event("amadi:entered"));
        setDone(true);
      };

      if (seen) {
        const tl = gsap.timeline({ onComplete: finish });
        tl.to(el, { autoAlpha: 0, duration: 0.22, ease: "power2.out" });
        kill = () => tl.kill();
        return;
      }

      const cluster = el.querySelector("[data-cluster]");
      const hole = { r: 0 };
      const tl = gsap.timeline({ onComplete: finish });

      tl
        // 0.00–0.34  a single point
        .fromTo(
          el.querySelector("[data-seed]"),
          { scale: 0, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.34, ease: "power2.out" },
        )
        // 0.16–1.10  the wave travels outward across the grid
        .fromTo(
          el.querySelectorAll("[data-dot]"),
          { scale: 0, autoAlpha: 0, filter: "blur(9px)" },
          {
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.7,
            ease: "power3.out",
            stagger: { grid: [COLS, COLS], from: "center", amount: 0.6 },
          },
          0.16,
        )
        .to(el.querySelector("[data-seed]"), { autoAlpha: 0, duration: 0.3 }, 0.3)
        .fromTo(
          el.querySelectorAll("[data-speck]"),
          { scale: 0.3, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.8,
            ease: "power2.out",
            stagger: { grid: [COLS, COLS], from: "center", amount: 0.5 },
          },
          0.35,
        )
        // 1.10–1.50  one breath — inhale, then soften
        .to(cluster, { scale: 1.03, duration: 0.42, ease: "sine.inOut" }, 1.05)
        .to(cluster, { scale: 1, duration: 0.32, ease: "sine.inOut" })
        // 1.50–2.35  the exhale opens a hole; the hero is already behind it
        .to(cluster, { scale: 2.4, autoAlpha: 0, duration: 0.85, ease: "power2.inOut" })
        .to(
          hole,
          {
            r: 150,
            duration: 0.8,
            ease: "power3.inOut",
            onUpdate: () => {
              // A mask, not clip-path: the overlay has to be pierced from the
              // middle, and clip-path can only keep a shape, not remove one.
              const m = `radial-gradient(circle at 50% 50%, transparent ${hole.r}%, #000 ${hole.r + 7}%)`;
              el.style.maskImage = m;
              el.style.webkitMaskImage = m;
            },
          },
          "<",
        );

      kill = () => tl.kill();
    })();

    return () => {
      cancelled = true;
      kill();
      // Never strand the page behind a half-finished entrance.
      document.documentElement.removeAttribute("data-entrance");
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      aria-hidden
      data-entrance-overlay
      className="fixed inset-0 z-[60] bg-ivory"
    >
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative aspect-square w-[min(46vmin,420px)]">
          <span
            data-seed
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-charcoal"
          />
          {/* Inner dots stay large, outer ones fall away — the reference's blob. */}
          <div data-cluster className="absolute inset-0">
            {CELLS.map((c) => (
              <span
                key={`d-${c.col}-${c.row}`}
                data-dot
                className="absolute rounded-full bg-charcoal"
                style={{
                  left: pct(c.col * STEP + c.jitterX * STEP),
                  top: pct(c.row * STEP + c.jitterY * STEP),
                  width: pct(dotSize(c.distance) * STEP * 0.9),
                  aspectRatio: "1",
                  transform: "translate(-50%, -50%)",
                  opacity: Number((1 - 0.9 * c.distance).toFixed(3)),
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* The sparse outer field. Dropped on small screens — fewer nodes, same gesture. */}
      <div className="pointer-events-none absolute inset-0 hidden place-items-center md:grid">
        <div className="relative aspect-square w-[min(96vmin,1100px)]">
          {CELLS.filter((c) => c.distance > 0.45).map((c) => (
            <span
              key={`s-${c.col}-${c.row}`}
              data-speck
              className="absolute h-[3px] w-[3px] rounded-full bg-sand"
              style={{
                left: pct(c.col * STEP + c.jitterX * STEP * 2),
                top: pct(c.row * STEP + c.jitterY * STEP * 2),
                transform: "translate(-50%, -50%)",
                opacity: Number((0.55 - 0.4 * c.distance).toFixed(3)),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
