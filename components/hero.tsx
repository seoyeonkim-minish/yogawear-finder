"use client";

import { useEffect, useRef, useState } from "react";
import { CONTOUR, CONTOUR_RANGE, DRAW_SHARE, SEQUENCES } from "@/lib/hero-story";

const WORDS = ["flow.", "move.", "breathe.", "stretch."];

/**
 * The loudest motion on the site, and a scroll story in its own right.
 *
 * The hero pins for a little over two viewports. The model holds the centre and
 * barely moves; everything else does — a contour follows her line, then four
 * annotations draw outward from the body, each one landing its index before its
 * copy. The lines connect a pose to something the garment does. They never
 * describe the body.
 *
 * Underneath that, the earlier hero behaviour is unchanged: the kinetic word,
 * the pointer parallax, and the magnetic CTA — now over looping footage.
 */
function Annotation({ sequence }: { sequence: (typeof SEQUENCES)[number] }) {
  return (
    <>
      <span data-index={sequence.index} data-story-copy className="eyebrow block text-ivory/70">
        ({sequence.index})
      </span>
      <div data-copy={sequence.index} className="mt-2">
        <p data-story-copy className="text-sm uppercase tracking-[0.12em] text-ivory">
          {sequence.title}
        </p>
        <p data-story-copy className="mt-1.5 text-xs leading-relaxed text-ivory/70">{sequence.sub}</p>
      </div>
    </>
  );
}

export function Hero({ images, onDiscover }: { images: string[]; onDiscover: () => void }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [word, setWord] = useState(0);

  // Kinetic word swap. Slow on purpose — an ad banner cadence would cheapen it.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Autoplaying footage is motion too: hold it on the poster frame.
      video.current?.pause();
      return;
    }

    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;

      const q = gsap.utils.selector(el);
      const small = window.matchMedia("(max-width: 767px)").matches;

      /* ---- the pinned story ------------------------------------------- */
      // One timeline of unit length, so every tween can be placed at the exact
      // scroll fraction the story asks for.
      const story = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: small ? "+=140%" : "+=240%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // gsap's selector types assume HTML; these are SVG paths.
      const path = (sel: string) => el.querySelector<SVGPathElement>(sel);

      const contour = path("[data-contour]");
      if (contour) {
        const len = contour.getTotalLength();
        gsap.set(contour, { strokeDasharray: len, strokeDashoffset: len });
        story.to(
          contour,
          { strokeDashoffset: 0, ease: "none", duration: CONTOUR_RANGE[1] - CONTOUR_RANGE[0] },
          CONTOUR_RANGE[0],
        );
      }

      for (const s of SEQUENCES) {
        if (small && !s.mobile) continue;
        const [start, end] = s.range;
        const span = end - start;
        const draw = span * DRAW_SHARE;

        const line = path(`[data-line="${s.index}"]`);
        if (line) {
          const len = line.getTotalLength();
          gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
          story.to(line, { strokeDashoffset: 0, ease: "none", duration: draw }, start);
        }
        // Line, then index, then copy — the order is the whole point.
        story.fromTo(
          q(`[data-index="${s.index}"]`),
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, ease: "none", duration: span * 0.15 },
          start + draw,
        );
        story.fromTo(
          q(`[data-copy="${s.index}"] > *`),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, ease: "none", stagger: span * 0.06, duration: span * 0.22 },
          start + draw + span * 0.08,
        );
      }

      // The headline steps aside once the story starts, and the layers drift at
      // different rates so the scene has depth rather than one flat plane.
      story
        .to(q("[data-hero-copy]"), { autoAlpha: 0, y: -60, ease: "none", duration: 0.12 }, 0.02)
        .to(q("[data-hero-media]"), { scale: 1.04, ease: "none", duration: 1 }, 0)
        .to(q("[data-hero-annotations]"), { yPercent: -4, ease: "none", duration: 1 }, 0)
        // Everything clears before the pin releases, so the next section arrives clean.
        .to(q("[data-hero-graphics]"), { autoAlpha: 0, ease: "none", duration: 0.06 }, 0.94)
        .to(q("[data-hero-scroll]"), { autoAlpha: 0, ease: "none", duration: 0.08 }, 0.06);

      /* ---- pointer behaviour, desktop only ----------------------------- */
      const fine = window.matchMedia("(pointer: fine)").matches;
      const onMove = (e: PointerEvent) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        gsap.to(q("[data-hero-media]"), { x: x * 18, y: y * 12, duration: 1.2, ease: "power3.out", overwrite: "auto" });
      };
      if (fine) window.addEventListener("pointermove", onMove);

      const cta = q("[data-magnetic]")[0] as HTMLElement | undefined;
      const onCta = (e: PointerEvent) => {
        if (!cta) return;
        const r = cta.getBoundingClientRect();
        gsap.to(cta, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.28,
          y: (e.clientY - (r.top + r.height / 2)) * 0.35,
          duration: 0.5,
          ease: "power3.out",
        });
      };
      const offCta = () => cta && gsap.to(cta, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
      if (fine && cta) {
        cta.addEventListener("pointermove", onCta as EventListener);
        cta.addEventListener("pointerleave", offCta);
      }

      cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        cta?.removeEventListener("pointermove", onCta as EventListener);
        cta?.removeEventListener("pointerleave", offCta);
        story.scrollTrigger?.kill();
        story.kill();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <section ref={root} className="relative min-h-[100svh] overflow-hidden">
        {/* The model fills the hero. The story still happens around her. */}
      <div
        data-hero-media
        className="pointer-events-none absolute inset-0 -z-10 bg-[#c9848c]"
      >
        {/* Full-bleed footage, framed like the still it replaces: a wide
            viewport crops only backdrop, phones crop the sides, so the focus
            sits right of centre there — that is where the two of them are.
            The poster is the still, so the first paint is never an empty box.
            The H.264 transcode is served rather than the HEVC master: every
            browser decodes it, and it is 1.3MB against the master's 8MB. */}
        <video
          ref={video}
          poster={images[0]}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="요가복을 입은 두 모델"
          className="h-full w-full object-cover object-[53%_55%] md:object-[50%_58%]"
        >
          <source src="/hero-yoga.h264.mp4" type="video/mp4" />
        </video>
        {/* Only over the copy: full-bleed photography and dark type do not
            coexist, and dimming the whole frame would flatten the image. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/45 via-ink/35 to-ink/55" />
      </div>

        <div data-hero-graphics className="pointer-events-none absolute inset-0 z-10">
        {/* One viewBox for every line, so a path stays on the shoulder or the
            waistband at any viewport size. */}
        <svg
          data-hero-annotations
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            data-contour
            d={CONTOUR}
            pathLength={1}
            stroke="var(--ivory)"
            strokeWidth={0.35}
            strokeOpacity={0.5}
            vectorEffect="non-scaling-stroke"
          />
          {SEQUENCES.map((s) => (
            <path
              key={s.index}
              data-line={s.index}
              d={s.path}
              pathLength={1}
              stroke="var(--ivory)"
              strokeWidth={0.35}
              strokeOpacity={0.6}
              vectorEffect="non-scaling-stroke"
              className={s.mobile ? undefined : "hidden md:block"}
            />
          ))}
        </svg>

        {/* Desktop: annotations sit beside the model, where their lines end. */}
        {SEQUENCES.map((s) => (
          <div
            key={s.index}
            className={`absolute hidden w-[20%] max-w-[13rem] md:block ${
              s.label.align === "right" ? "text-left" : "text-right"
            }`}
            style={{ left: `${s.label.x}%`, top: `${s.label.y}%` }}
          >
            <Annotation sequence={s} />
          </div>
        ))}

        {/* Phones: stacked under the model instead. Beside it they cover the
            pose and run off the edge, and the point is the movement. */}
        <div className="absolute inset-x-6 bottom-10 space-y-5 md:hidden">
          {SEQUENCES.filter((s) => s.mobile).map((s) => (
            <div key={s.index}>
              <Annotation sequence={s} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-center px-6 py-16 md:px-10">
        <div data-hero-copy className="relative z-20 max-w-3xl">
          <p className="eyebrow text-ivory/70" data-reveal data-immediate data-delay="0.2">
            Yogawear Index — Amadi
          </p>
          <h1 className="display mt-5 text-[clamp(3.25rem,9vw,7.5rem)] leading-[0.95] text-ivory">
            <span className="block" data-split data-immediate data-delay="0.35">
              Find your
            </span>
            <span className="relative mt-1 block h-[1.05em] overflow-hidden">
              {WORDS.map((w, i) => (
                <span
                  key={w}
                  className="absolute inset-x-0 transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: `translateY(${(i - word) * 100}%)`, opacity: i === word ? 1 : 0 }}
                  aria-hidden={i !== word}
                >
                  {w}
                </span>
              ))}
            </span>
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-ivory/85 md:text-lg" data-reveal data-immediate data-delay="0.9">
            Yoga wear that moves with who you are.
          </p>
          <button
            data-magnetic
            data-reveal
            data-immediate
            data-delay="1.1"
            onClick={onDiscover}
            className="mt-10 rounded-full border border-ivory/60 bg-ink/45 px-12 py-5 text-base text-ivory backdrop-blur-sm transition-colors hover:bg-ink/70"
          >
            Discover my flow
          </button>
        </div>

        <div data-hero-scroll className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2">
          <span className="eyebrow text-ivory/60">Scroll</span>
        </div>
      </div>
    </section>
  );
}
