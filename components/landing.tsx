"use client";

import { useCallback, useRef } from "react";
import { Discovery } from "./discovery";
import { Hero } from "./hero";
import type { Selection } from "@/lib/products";

/**
 * Hero and Discover are one scroll, not two pages. The CTA scrolls rather than
 * navigates, so clicking it and simply scrolling arrive at the same place by
 * the same transition.
 */
export function Landing({ selection, images }: { selection: Selection; images: string[] }) {
  const discover = useRef<HTMLDivElement>(null);

  const goDiscover = useCallback(() => {
    discover.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      <Hero images={images} onDiscover={goDiscover} />

      {/* The hero's media has drifted right by the time this is in view, so the
          question rises into the space that opened on the left. */}
      {/* Pulled up into the hero's tail: by the time this is in view the hero
          media has receded, so the two share one frame instead of butting. */}
      <section ref={discover} className="relative -mt-[8svh] min-h-[100svh] px-6 pb-24 pt-0 md:px-10">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-16 md:grid-cols-[1fr_0.8fr]">
          <div data-reveal>
            <Discovery selection={selection} variant="inline" />
          </div>
          <div
            data-parallax="-0.12"
            className="hidden aspect-3/4 overflow-hidden rounded-sm bg-beige md:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[3]} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
