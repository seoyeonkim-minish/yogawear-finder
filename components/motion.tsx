"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * Smooth scrolling + the scroll-linked motion layer.
 *
 * Everything here is progressive enhancement: the markup renders and reads
 * without it, `.js` on <html> is what hides the pre-animation state, and
 * prefers-reduced-motion skips both Lenis and every scroll animation.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Smooth scrolling is a page-level concern: set up once, torn down on unmount.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    document.documentElement.classList.add("js");
    if (reduce || !fine) return; // touch scrolling is better left alone

    let dispose = () => {};
    (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      dispose = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();

    return () => dispose();
  }, []);

  return (
    <>
      {children}
      {/* Reads the URL, so it sits behind its own Suspense boundary — reading it
          in the provider itself opts every page out of static prerendering. */}
      <Suspense>
        <Reveals />
      </Suspense>
    </>
  );
}

/**
 * Binds the scroll reveals, and rebinds them on every navigation. Client-side
 * routing swaps the DOM without remounting the provider, so a mount-only setup
 * left the next page's elements hidden by the `.js` rule with nothing to reveal.
 */
function Reveals() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    let killed = false;
    let kill = () => {};

    (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        gsap.registerPlugin(ScrollTrigger);
        if (killed) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          gsap.set("[data-reveal], [data-split], [data-stagger] > *", { autoAlpha: 1, clearProps: "all" });
          return;
        }

        const created: gsap.core.Tween[] = [];
        splitAll(gsap);
        revealAll(gsap, created);
        parallaxAll(gsap, created);

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh);
        const t = setTimeout(refresh, 600); // fonts and remote images settle late

        kill = () => {
          clearTimeout(t);
          window.removeEventListener("load", refresh);
          created.forEach((tween) => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
        };
      } catch {
        // Motion is an enhancement: if it cannot load, show the content.
        document.documentElement.classList.remove("js");
      }
    })();

    return () => {
      killed = true;
      kill();
    };
  }, [pathname, search]);

  return null;
}

type GSAP = typeof import("gsap")["gsap"];

/** Wrap each word in a mask so it can rise into view without bleeding outside. */
function splitAll(gsap: GSAP) {
  document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
    if (el.dataset.splitReady === "true") return;
    const text = el.textContent ?? "";
    el.setAttribute("aria-label", text.trim());
    el.textContent = "";
    for (const part of text.split(/(\s+)/)) {
      if (!part.trim()) {
        el.appendChild(document.createTextNode(part));
        continue;
      }
      const mask = document.createElement("span");
      mask.className = "split-word-mask";
      mask.setAttribute("aria-hidden", "true");
      const word = document.createElement("span");
      word.className = "split-word";
      word.textContent = part;
      mask.appendChild(word);
      el.appendChild(mask);
    }
    el.dataset.splitReady = "true";
    gsap.set(el, { autoAlpha: 1 });
  });
}

function revealAll(gsap: GSAP, out: gsap.core.Tween[]) {
  document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
    const words = el.querySelectorAll(".split-word");
    const delay = Number(el.dataset.delay ?? 0);
    out.push(gsap.fromTo(
      words,
      { yPercent: 115, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 1.05,
        ease: "power4.out",
        stagger: 0.055,
        delay,
        scrollTrigger: el.dataset.immediate ? undefined : { trigger: el, start: "top 85%", once: true },
      },
    ));
  });

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const delay = Number(el.dataset.delay ?? 0);
    out.push(gsap.fromTo(
      el,
      { y: 28, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.95,
        ease: "power4.out",
        delay,
        scrollTrigger: el.dataset.immediate ? undefined : { trigger: el, start: "top 88%", once: true },
      },
    ));
  });

  // Product cards: a quiet stagger, deliberately weaker than the hero.
  document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((list) => {
    out.push(gsap.fromTo(
      list.children,
      { y: 24, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.045,
        scrollTrigger: { trigger: list, start: "top 92%", once: true },
      },
    ));
  });

}

function parallaxAll(gsap: GSAP, out: gsap.core.Tween[]) {
  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((layer) => {
    const speed = Number(layer.dataset.parallax || -0.15);
    const section = layer.closest("section") ?? layer;
    out.push(gsap.to(layer, {
      y: () => window.innerHeight * speed,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    }));
  });
}
