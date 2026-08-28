import test from "node:test";
import assert from "node:assert/strict";
import { CONTOUR, CONTOUR_RANGE, DRAW_SHARE, SEQUENCES } from "../lib/hero-story.ts";

test("the story covers the scroll without running past either end", () => {
  assert.equal(SEQUENCES.length, 4);
  for (const s of SEQUENCES) {
    const [start, end] = s.range;
    assert.ok(start >= 0 && end <= 1, `${s.index}: ${start}-${end} leaves the timeline`);
    assert.ok(end > start, `${s.index}: empty window`);
    assert.ok(end - start > 0.15, `${s.index}: too fast to read`);
  }
  assert.ok(SEQUENCES[0].range[0] > 0.1, "the first line must not start before the headline is read");
  assert.ok(SEQUENCES.at(-1)!.range[1] < 1, "the last copy must land before the pin releases");
});

test("sequences run in order and overlap only enough to feel continuous", () => {
  for (let i = 1; i < SEQUENCES.length; i++) {
    const prev = SEQUENCES[i - 1].range;
    const next = SEQUENCES[i].range;
    assert.ok(next[0] > prev[0], `${SEQUENCES[i].index} starts before the one before it`);
    assert.ok(next[0] < prev[1], `${SEQUENCES[i].index} leaves a dead gap in the scroll`);
    assert.ok(next[0] > prev[0] + (prev[1] - prev[0]) * DRAW_SHARE, `${SEQUENCES[i].index} interrupts the copy before it`);
  }
});

test("indices and copy are unique, and sides alternate", () => {
  assert.equal(new Set(SEQUENCES.map((s) => s.index)).size, SEQUENCES.length);
  assert.equal(new Set(SEQUENCES.map((s) => s.title)).size, SEQUENCES.length);
  const sides = SEQUENCES.map((s) => s.label.align);
  for (let i = 1; i < sides.length; i++) {
    assert.notEqual(sides[i], sides[i - 1], "annotations must not stack on one side");
  }
});

test("copy stays on movement and never on the body", () => {
  const banned = /\b(slim|perfect|curve|curves|body|figure|waistline|flatter|correct)\b/i;
  for (const s of SEQUENCES) {
    assert.doesNotMatch(s.title, banned, `${s.index} title`);
    assert.doesNotMatch(s.sub, banned, `${s.index} sub`);
  }
});

test("every path is drawable and starts on the model, not off-frame", () => {
  for (const { index, path } of SEQUENCES) {
    assert.match(path, /^M [\d.]+ [\d.]+/, `${index}: no move-to`);
    const [x, y] = path.slice(2).split(" ").map(Number);
    // The model is cropped left of centre in this photograph, so a line can
    // legitimately start near the left edge — it may not start outside it.
    assert.ok(x > 5 && x < 95, `${index}: starts at x=${x}, off the body`);
    assert.ok(y > 10 && y < 130, `${index}: starts at y=${y}, outside the frame`);
  }
  assert.match(CONTOUR, /^M /);
  assert.ok(CONTOUR_RANGE[0] < SEQUENCES[0].range[0], "the contour must begin before the first annotation");
});

test("mobile keeps a readable subset", () => {
  const mobile = SEQUENCES.filter((s) => s.mobile);
  assert.ok(mobile.length >= 2 && mobile.length <= 3, `mobile shows ${mobile.length}`);
  assert.deepEqual(mobile.map((s) => s.index), ["01", "02"], "mobile should keep the opening pair");
});
