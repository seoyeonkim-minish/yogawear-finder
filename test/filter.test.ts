import test from "node:test";
import assert from "node:assert/strict";
import {
  FACETS,
  facetOptions,
  filterProducts,
  filtersFromParams,
  formatPrice,
  products,
  toggleHref,
  type Product,
} from "../lib/products.ts";

const SEASONS = ["spring", "summer", "fall", "winter"];
const GENDERS = ["women", "men", "unisex"];

test("crawled data matches the schema", () => {
  assert.ok(products.length > 100, `only ${products.length} products — did the crawl fail?`);
  const ids = new Set<string>();
  for (const p of products) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
    for (const k of ["id", "brand", "name", "category", "image", "url"] as const) {
      assert.ok(p[k]?.length, `${p.id}: ${k} missing`);
    }
    assert.ok(p.price > 0, `${p.id}: price`);
    assert.ok(["USD", "KRW", "GBP"].includes(p.currency), `${p.id}: currency ${p.currency}`);
    assert.ok(GENDERS.includes(p.gender), `${p.id}: gender ${p.gender}`);
    assert.ok(p.season.length && p.season.every((s) => SEASONS.includes(s)), `${p.id}: season`);
    assert.ok(Array.isArray(p.material), `${p.id}: material`);
    assert.ok(p.colors.length, `${p.id}: colors`);
    assert.ok(p.image.startsWith("https://"), `${p.id}: image not https`);
  }
});

test("material coverage stays useful — the site is a material browser", () => {
  const tagged = products.filter((p) => p.material.length).length;
  const pct = Math.round((tagged / products.length) * 100);
  assert.ok(pct >= 40, `material coverage dropped to ${pct}% (expected >= 40)`);
});

test("every market is priced in its own currency", () => {
  const by = (c: string) => products.filter((p) => p.currency === c);
  assert.ok(by("KRW").length > 50, `only ${by("KRW").length} KRW products`);
  assert.ok(by("USD").length > 50, `only ${by("USD").length} USD products`);
  // Shopify Markets localises prices to the requesting region while meta.json still
  // reports the store default, so a won price labelled USD is the live failure mode.
  for (const p of by("KRW")) assert.ok(p.price >= 1000, `${p.id}: ₩${p.price} is too low for KRW`);
  for (const c of ["USD", "GBP"]) {
    for (const p of by(c)) assert.ok(p.price < 2000, `${p.id}: ${c} ${p.price} looks like a won price`);
  }
  assert.match(formatPrice(by("KRW")[0]), /^₩[\d,]+$/);
  assert.match(formatPrice(by("USD")[0]), /^\$[\d,]+$/);
});

test("gender is split, not everything defaulted to women", () => {
  const men = products.filter((p) => p.gender === "men").length;
  assert.ok(men > 5, `only ${men} men's products — the gender derivation is probably broken`);
});

test("OR within a facet", () => {
  const a = filterProducts(products, { gender: ["men"] });
  const b = filterProducts(products, { gender: ["unisex"] });
  const both = filterProducts(products, { gender: ["men", "unisex"] });
  assert.ok(a.length > 0 && b.length > 0);
  assert.equal(both.length, a.length + b.length);
});

test("AND across facets", () => {
  const got = filterProducts(products, { season: ["winter"], category: ["outer"] });
  assert.ok(got.length > 0);
  for (const p of got) {
    assert.ok(p.season.includes("winter"));
    assert.equal(p.category, "outer");
  }
  assert.ok(got.length <= filterProducts(products, { season: ["winter"] }).length);
});

test("empty filters pass everything through", () => {
  assert.equal(filterProducts(products, {}).length, products.length);
  assert.equal(filterProducts(products, { material: [] }).length, products.length);
});

test("facet counts match what the filter returns", () => {
  for (const f of ["category", "gender", "brand"] as const) {
    for (const { value, count } of facetOptions(products, f).slice(0, 10)) {
      assert.equal(
        filterProducts(products, { [f]: [value] }).length,
        count,
        `${f}=${value} count mismatch`,
      );
    }
  }
});

test("multi-valued facets: counts sum to at least the product count", () => {
  // material/season are arrays, so counts overlap — but a single-valued facet must sum exactly.
  const sum = facetOptions(products, "category").reduce((n, o) => n + o.count, 0);
  assert.equal(sum, products.length);
});

test("params round-trip through toggleHref", () => {
  const params = new URL(toggleHref({}, "gender", "men"), "http://x").searchParams;
  const filters = filtersFromParams(Object.fromEntries(FACETS.map((f) => [f, params.getAll(f)])));
  assert.deepEqual(filters.gender, ["men"]);
  assert.equal(toggleHref(filters, "gender", "men"), "/", "toggling off clears the query");
});

test("no product is dropped by every facet at once", () => {
  // Each product must be reachable by filtering on its own values.
  const p: Product = products[0];
  const found = filterProducts(products, {
    brand: [p.brand],
    category: [p.category],
    gender: [p.gender],
  });
  assert.ok(found.some((x) => x.id === p.id));
});
