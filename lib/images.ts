import { products } from "./products";

/** Editorial imagery, picked from the catalogue itself — real yoga-wear model shots. */
const pick = (id: string, fallback: number) =>
  products.find((p) => p.id === id)?.image ?? products[fallback].image;

export const HERO_IMAGES = [
  pick("alo-yoga-16-high-waist-airlift-capri", 0),
  pick("29cm-부디무드라-fortune-pants-16-colors-2138961", 40),
  pick("29cm-무브웜-bar-tank-top-4026991", 80),
  pick("29cm-데비웨어-나디안-하렘팬츠-devi-b0077-네이비-2669357", 120),
];

export const PRACTICE_IMAGES: Record<string, string> = {
  Hatha: pick("29cm-부디무드라-fortune-pants-16-colors-2138961", 40),
  Vinyasa: pick("alo-yoga-7-8-high-waist-airbrush-legging", 160),
  Ashtanga: pick("alo-yoga-16-high-waist-airlift-capri", 0),
  "Hot Yoga": pick("29cm-데비웨어-나디안-하렘팬츠-devi-b0077-네이비-2669357", 120),
  "Yin Yoga": pick("29cm-무브웜-bar-tank-top-4026991", 80),
  Pilates: pick("29cm-데비웨어-군살제로-바이커-5부-devi-b0013-블랙-347673", 200),
};
