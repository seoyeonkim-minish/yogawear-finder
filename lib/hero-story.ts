/**
 * The hero's scroll story: four annotations drawn onto the model, in sequence.
 *
 * Coordinates are percentages of the hero itself (viewBox 100x100, stretched to
 * the section), because the photograph is full-bleed. The model sits in the left
 * third of that crop, so every line starts on her and runs right across the open
 * backdrop to its annotation. They are hand-fitted to ONE photograph at ONE
 * crop — change either and every path here has to be refitted.
 *
 * The copy describes movement and what the garment does. It never describes the
 * body: the lines connect a pose to a fabric property, and that is all.
 */
export type Sequence = {
  index: string;
  title: string;
  sub: string;
  /** Drawn in hero percentages, starting on the body and running outward. */
  path: string;
  /** Where the annotation block sits, in percentages of the hero. */
  label: { x: number; y: number; align: "left" | "right" };
  /** Scroll progress window: line draws over the first half, copy lands after. */
  range: [number, number];
  /** Mobile keeps only the first two — three lines crowd a phone. */
  mobile: boolean;
};

export const SEQUENCES: Sequence[] = [
  {
    index: "01",
    title: "Move with intention",
    sub: "Designed around your practice, not around a size chart.",
    path: "M 30 40 C 44 39, 58 38, 72 37",
    label: { x: 74, y: 30, align: "right" },
    range: [0.24, 0.46],
    mobile: true,
  },
  {
    index: "02",
    title: "Flex where you move",
    sub: "Flexible construction built for continuous movement.",
    path: "M 36 56 C 49 56, 62 55, 74 54",
    label: { x: 76, y: 47, align: "right" },
    range: [0.42, 0.64],
    mobile: true,
  },
  {
    index: "03",
    title: "Stability in every pose",
    sub: "Support that holds through a long, low stance.",
    path: "M 42 74 C 54 74, 65 73, 76 72",
    label: { x: 78, y: 65, align: "right" },
    range: [0.60, 0.82],
    mobile: false,
  },
  {
    index: "04",
    title: "Breathes as you move",
    sub: "Light, quick-drying fabric at the waistband and seams.",
    path: "M 46 88 C 57 88, 67 87, 78 86",
    label: { x: 79, y: 79, align: "right" },
    range: [0.74, 0.94],
    mobile: false,
  },
];

/** The contour that follows the body while the annotations arrive. */
// Shoulder -> waist -> hip -> leg, following the model down the left third.
export const CONTOUR =
  "M 29 39 C 33 47, 35 56, 38 64 C 41 74, 43 82, 46 90";

export const CONTOUR_RANGE: [number, number] = [0.16, 0.8];

/** Split of each window: the line draws, then the index, then the copy. */
export const DRAW_SHARE = 0.55;
