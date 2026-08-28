/**
 * The entrance graphic is a square dot grid animated from the middle outward —
 * the same mechanism as anime.js `stagger({ grid, from: "center" })`, which
 * GSAP expresses as `stagger: { grid, from: "center" }`.
 *
 * GSAP handles the timing. What it does not do is make the grid look like
 * anything but a grid, so each cell also carries its own distance (for size and
 * blur falloff) and a small deterministic wobble, which is what keeps the shape
 * organic rather than machined.
 */
export type Cell = {
  col: number;
  row: number;
  /** 0 at the middle, 1 at the furthest corner. */
  distance: number;
  /** Percentage offsets, a fraction of one cell — enough to break the lattice. */
  jitterX: number;
  jitterY: number;
};

/** Deterministic, so the server and client render the same grid. */
const wobble = (i: number, salt: number) => {
  const n = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n) - 0.5; // -0.5 .. 0.5
};

export function gridCells(cols: number, rows: number): Cell[] {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const max = Math.hypot(cx, cy) || 1;
  const cells: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      cells.push({
        col,
        row,
        distance: Math.hypot(col - cx, row - cy) / max,
        jitterX: wobble(i, 1) * 0.55,
        jitterY: wobble(i, 2) * 0.55,
      });
    }
  }
  return cells;
}

/**
 * Inner dots stay large, outer ones fall away to specks. The falloff is steep
 * on purpose: a gentle one leaves the square lattice visible at the corners,
 * and the shape has to read as a round cluster, not a grid.
 */
export const dotSize = (distance: number) => 1 - 0.92 * distance ** 1.7;
