"use client";

import { useState } from "react";
import { Discovery } from "./discovery";
import { Entrance } from "./entrance";
import { Hero } from "./hero";
import type { Selection } from "@/lib/products";

/**
 * The hero owns the guided discovery. It is not on the page until the CTA asks
 * for it, and closing it returns the visitor to exactly where they were — the
 * questionnaire is an offer, not the price of entry.
 */
export function HeroSection({ selection, images }: { selection: Selection; images: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Sits above the hero and opens a hole in itself — the hero is already
          rendered underneath, so there is no intro screen to transition from. */}
      <Entrance />
      <Hero onDiscover={() => setOpen(true)} />
      {open && (
        <Discovery
          selection={selection}
          variant="overlay"
          backdrop={images[0]}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
