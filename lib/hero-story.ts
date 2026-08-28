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
    path: "M 30 40 C 38 39, 46 38, 55 37",
    label: { x: 57, y: 31, align: "right" },
    range: [0.18, 0.42],
    mobile: true,
  },
  {
    index: "02",
    title: "Flex where you move",
    sub: "Flexible construction built for continuous movement.",
    path: "M 36 56 C 46 56, 56 55, 66 54",
    label: { x: 68, y: 48, align: "right" },
    range: [0.38, 0.62],
    mobile: true,
  },
  {
    index: "03",
    title: "Stability in every pose",
    sub: "Support that holds through a long, low stance.",
    path: "M 42 74 C 52 74, 62 73, 72 72",
    label: { x: 74, y: 66, align: "right" },
    range: [0.58, 0.82],
    mobile: false,
  },
  {
    index: "04",
    title: "Breathes as you move",
    sub: "Light, quick-drying fabric at the waistband and seams.",
    path: "M 46 88 C 56 88, 66 87, 76 86",
    label: { x: 78, y: 80, align: "right" },
    range: [0.72, 0.94],
    mobile: false,
  },
];

/** The contour that follows the body while the annotations arrive. */
// Shoulder -> waist -> hip -> leg, following the model down the left third.
export const CONTOUR =
  "M 29 39 C 33 47, 35 56, 38 64 C 41 74, 43 82, 46 90";

export const CONTOUR_RANGE: [number, number] = [0.08, 0.78];

/** Split of each window: the line draws, then the index, then the copy. */
export const DRAW_SHARE = 0.55;
