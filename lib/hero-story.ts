/**
 * The hero's scroll story: four annotations that arrive over the film, in
 * sequence. Label positions are percentages of the hero itself, because the
 * footage is full-bleed.
 *
 * The copy describes movement and what the garment does. It never describes
 * the body.
 */
export type Sequence = {
  index: string;
  title: string;
  sub: string;
  /** Where the annotation block sits, in percentages of the hero. */
  label: { x: number; y: number; align: "left" | "right" };
  /** Scroll progress window the annotation lives in. */
  range: [number, number];
  /** Mobile keeps only the first two — three lines crowd a phone. */
  mobile: boolean;
};

export const SEQUENCES: Sequence[] = [
  {
    index: "01",
    title: "Move with intention",
    sub: "Designed around your practice, not around a size chart.",
    label: { x: 74, y: 30, align: "right" },
    range: [0.24, 0.46],
    mobile: true,
  },
  {
    index: "02",
    title: "Flex where you move",
    sub: "Flexible construction built for continuous movement.",
    label: { x: 76, y: 47, align: "right" },
    range: [0.42, 0.64],
    mobile: true,
  },
  {
    index: "03",
    title: "Stability in every pose",
    sub: "Support that holds through a long, low stance.",
    label: { x: 78, y: 65, align: "right" },
    range: [0.60, 0.82],
    mobile: false,
  },
  {
    index: "04",
    title: "Breathes as you move",
    sub: "Light, quick-drying fabric at the waistband and seams.",
    label: { x: 79, y: 79, align: "right" },
    range: [0.74, 0.94],
    mobile: false,
  },
];

