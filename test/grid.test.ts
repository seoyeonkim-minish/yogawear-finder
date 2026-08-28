import test from "node:test";
import assert from "node:assert/strict";
import { dotSize, gridCells } from "../lib/grid.ts";

test("the grid is complete and centred", () => {
  const cells = gridCells(13, 13);
  assert.equal(cells.length, 169);

  const middle = cells.find((c) => c.col === 6 && c.row === 6)!;
  assert.equal(middle.distance, 0, "the middle cell must be the wave's origin");

  for (const [col, row] of [[0, 0], [12, 0], [0, 12], [12, 12]]) {
    const corner = cells.find((c) => c.col === col && c.row === row)!;
    assert.ok(Math.abs(corner.distance - 1) < 1e-9, `corner ${col},${row} should be the furthest`);
  }
  assert.ok(cells.every((c) => c.distance >= 0 && c.distance <= 1));
});

test("an even grid has no single middle cell but still starts near zero", () => {
  const cells = gridCells(12, 12);
  assert.equal(cells.length, 144);
  const nearest = Math.min(...cells.map((c) => c.distance));
  assert.ok(nearest > 0 && nearest < 0.12, `nearest cell sat at ${nearest}`);
});

test("the wobble is deterministic — server and client must agree", () => {
  assert.deepEqual(gridCells(7, 7), gridCells(7, 7));
  const jitter = gridCells(13, 13).map((c) => c.jitterX);
  assert.ok(Math.max(...jitter.map(Math.abs)) <= 0.275, "jitter must stay within half a cell");
  assert.ok(new Set(jitter).size > 100, "every cell should wobble differently");
});

test("dots shrink outward without vanishing", () => {
  assert.equal(dotSize(0), 1);
  // Corner dots must nearly vanish, or the cluster reads as a square.
  assert.ok(dotSize(1) > 0.03 && dotSize(1) < 0.15, `corner dot at ${dotSize(1)}`);
  assert.ok(dotSize(0.5) > 0.6, "the middle third should still read as a mass");
  for (let d = 0; d < 1; d += 0.1) {
    assert.ok(dotSize(d) > dotSize(d + 0.1), `size must fall off at ${d}`);
  }
});
