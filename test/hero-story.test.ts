import test from "node:test";
import assert from "node:assert/strict";
import { SEQUENCES } from "../lib/hero-story.ts";

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
    assert.ok(next[0] > prev[0] + (prev[1] - prev[0]) * 0.5, `${SEQUENCES[i].index} interrupts the copy before it`);
  }
});

test("indices and copy are unique, and annotations clear the model", () => {
  assert.equal(new Set(SEQUENCES.map((s) => s.index)).size, SEQUENCES.length);
  assert.equal(new Set(SEQUENCES.map((s) => s.title)).size, SEQUENCES.length);

  // The full-bleed crop puts the model in the left third, so every annotation
  // sits to her right and they step down the page instead of stacking.
  const ys = SEQUENCES.map((s) => s.label.y);
  for (const s of SEQUENCES) {
    assert.ok(s.label.x > 50, `${s.index} sits at x=${s.label.x}, over the model`);
    assert.ok(s.label.x < 85, `${s.index} sits at x=${s.label.x}, off the right edge`);
  }
  for (let i = 1; i < ys.length; i++) {
    assert.ok(ys[i] - ys[i - 1] >= 12, `${SEQUENCES[i].index} crowds the annotation above it`);
  }
});

test("copy stays on movement and never on the body", () => {
  const banned = /\b(slim|perfect|curve|curves|body|figure|waistline|flatter|correct)\b/i;
  for (const s of SEQUENCES) {
    assert.doesNotMatch(s.title, banned, `${s.index} title`);
    assert.doesNotMatch(s.sub, banned, `${s.index} sub`);
  }
});

test("mobile keeps a readable subset", () => {
  const mobile = SEQUENCES.filter((s) => s.mobile);
  assert.ok(mobile.length >= 2 && mobile.length <= 3, `mobile shows ${mobile.length}`);
  assert.deepEqual(mobile.map((s) => s.index), ["01", "02"], "mobile should keep the opening pair");
});
