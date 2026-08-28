"use client";

import { useEffect, useRef, useState } from "react";

const WORDS = ["flow.", "move.", "breathe.", "stretch."];

/**
 * The one place in the site where motion is loud. Four scroll-linked things
 * happen here and they are all the same gesture: the hero opens up and hands
 * the page over to Discover, rather than ending and starting again.
 *
 *   1. the image column scales down and slides right
 *   2. the headline drifts up and out
 *   3. the fabric distortion relaxes
 *   4. "What's your practice?" rises into the space that opened on the left
 */
export function Hero({ images, onDiscover }: { images: string[]; onDiscover: () => void }) {
  const root = useRef<HTMLElement>(null);
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup = () => {};
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 1.1,
        },
      });

      tl.to(q("[data-hero-media]"), { scale: 0.72, xPercent: 12, ease: "none" }, 0)
        .to(q("[data-hero-copy]"), { yPercent: -55, autoAlpha: 0, ease: "none" }, 0)
        .to(q("[data-hero-turbulence]"), { attr: { baseFrequency: 0.002 }, ease: "none" }, 0);

      // Pointer parallax, desktop only — a hand on a trackpad, not a gimmick.
      const fine = window.matchMedia("(pointer: fine)").matches;
      const onMove = (e: PointerEvent) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        gsap.to(q("[data-hero-media]"), { x: x * 26, y: y * 18, duration: 1.2, ease: "power3.out", overwrite: "auto" });
        gsap.to(q("[data-hero-back]"), { x: x * -40, y: y * -24, duration: 1.4, ease: "power3.out", overwrite: "auto" });
      };
      if (fine) window.addEventListener("pointermove", onMove);

      // Magnetic CTA.
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
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    })();

    return () => cleanup();
  }, []);

  return (
    <section ref={root} className="relative min-h-[100svh] overflow-hidden">
      {/* The distortion is on a filter, not a canvas: one SVG, no WebGL, and it
          costs nothing when reduced motion turns the scrub off. */}
      <svg aria-hidden className="absolute h-0 w-0">
        <filter id="fabric">
          <feTurbulence
            data-hero-turbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves={2}
            seed={7}
          />
          <feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div
        data-hero-back
        className="pointer-events-none absolute -right-32 top-[18%] hidden h-[46vh] w-[24vw] md:block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[1]} alt="" className="h-full w-full rounded-sm object-cover opacity-25" />
      </div>

      <div className="relative mx-auto grid min-h-[100svh] w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2 md:px-10">
        <div data-hero-copy className="relative z-10">
          <p className="eyebrow text-gray" data-reveal data-immediate data-delay="0.2">
            Yogawear Index — Amadi
          </p>

          <h1 className="display mt-6 text-[clamp(3rem,9vw,7.5rem)] leading-[0.95]">
            <span className="block" data-split data-immediate data-delay="0.35">
              Find your
            </span>
            {/* The changing word is the one thing that keeps moving after the
                entrance finishes, so it carries the whole idea on its own. */}
            <span className="relative mt-1 block h-[1.05em] overflow-hidden">
              {WORDS.map((w, i) => (
                <span
                  key={w}
                  className="absolute inset-x-0 transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    transform: `translateY(${(i - word) * 100}%)`,
                    opacity: i === word ? 1 : 0,
                  }}
                  aria-hidden={i !== word}
                >
                  {w}
                </span>
              ))}
            </span>
          </h1>

          <p className="mt-8 max-w-sm text-base leading-relaxed text-gray" data-reveal data-immediate data-delay="0.9">
            Yoga wear that moves with who you are.
            <br />
            97개 브랜드를 가로질러, 당신의 흐름에 맞춰 고릅니다.
          </p>

          <button
            data-magnetic
            data-reveal
            data-immediate
            data-delay="1.1"
            onClick={onDiscover}
            className="mt-10 rounded-full bg-charcoal px-8 py-4 text-sm text-ivory transition-colors hover:bg-ink"
          >
            Discover my flow
          </button>
        </div>

        <div data-hero-media className="relative h-[60vh] md:h-[78vh]">
          <div className="h-full w-full overflow-hidden rounded-sm bg-beige">
            {/* The image is oversized so the displaced edges fall outside the
                clip — filtering the container instead tears its own border. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt="요가 동작을 하는 모델"
              className="h-full w-full scale-115 object-cover [filter:url(#fabric)]"
            />
          </div>
          <div
            data-parallax="-0.08"
            className="absolute -bottom-14 -left-24 hidden h-44 w-32 overflow-hidden rounded-sm shadow-lg md:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[2]} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2">
        <span className="eyebrow text-gray-soft">Scroll</span>
      </div>
    </section>
  );
}
