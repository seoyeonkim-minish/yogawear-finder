/**
 * The hero's scroll story: four annotations drawn onto the model, in sequence.
 *
 * Coordinates live in the media block's own viewBox (100 wide, 140 tall, matching
 * its 5:7 frame), so a line stays attached to the shoulder or the waistband
 * whatever size the viewport is. They are hand-fitted to ONE photograph — change
 * the hero image and every path here has to be refitted.
 *
 * The copy describes movement and what the garment does. It never describes the
 * body: the lines connect a pose to a fabric property, and that is all.
 */
export type Sequence = {
  index: string;
  title: string;
  sub: string;
  /** Drawn in the media viewBox, starting at the body and running outward. */
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
    path: "M 20 47 C 4 58, -12 74, -29 84",
    label: { x: 3, y: 50, align: "left" },
    range: [0.18, 0.42],
    mobile: true,
  },
  {
    index: "02",
    title: "Flex where you move",
    sub: "Flexible construction built for continuous movement.",
    path: "M 44 52 C 62 48, 80 46, 100 44",
    label: { x: 67, y: 30, align: "right" },
    range: [0.38, 0.62],
    mobile: true,
  },
  {
    index: "03",
    title: "Stability in every pose",
    sub: "Support that holds through a long, low stance.",
    path: "M 44 104 C 28 110, 8 114, -29 118",
    label: { x: 3, y: 70, align: "left" },
    range: [0.58, 0.82],
    mobile: false,
  },
  {
    index: "04",
    title: "Breathes as you move",
    sub: "Light, quick-drying fabric at the waistband and seams.",
    path: "M 84 120 C 90 119, 94 118, 98 117",
    label: { x: 67, y: 72, align: "right" },
    range: [0.72, 0.94],
    mobile: false,
  },
];

/** The contour that follows the body while the annotations arrive. */
// Shoulder -> waist -> hip -> front knee, fitted to the hero photograph's crop.
export const CONTOUR =
  "M 20 47 C 26 57, 33 65, 37 74 C 40 86, 42 96, 44 104";

export const CONTOUR_RANGE: [number, number] = [0.08, 0.78];

/** Split of each window: the line draws, then the index, then the copy. */
export const DRAW_SHARE = 0.55;
