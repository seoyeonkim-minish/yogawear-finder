import test from "node:test";
import assert from "node:assert/strict";
import {
  FACETS,
  facetOptions,
  filterProducts,
  filtersFromParams,
  products,
  toggleHref,
} from "../lib/products.ts";

test("seed data matches the schema", () => {
  assert.ok(products.length > 0);
  const ids = new Set<string>();
  for (const p of products) {
    assert.equal(typeof p.id, "string", `${p.id}: id`);
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
    for (const k of ["brand", "name", "category", "image", "url"] as const) {
      assert.ok(p[k]?.length, `${p.id}: ${k} missing`);
    }
    assert.ok(p.material.length && p.season.length && p.colors.length, `${p.id}: empty array`);
    assert.ok(p.price > 0, `${p.id}: price`);
    assert.ok(
      p.season.every((s) => ["spring", "summer", "fall", "winter"].includes(s)),
      `${p.id}: bad season`,
    );
  }
});

test("OR within a facet", () => {
  const linen = filterProducts(products, { material: ["linen"] });
  const wool = filterProducts(products, { material: ["merino wool"] });
  const both = filterProducts(products, { material: ["linen", "merino wool"] });
  assert.ok(linen.length > 0 && wool.length > 0);
  assert.equal(both.length, new Set([...linen, ...wool].map((p) => p.id)).size);
});

test("AND across facets", () => {
  const filters = { season: ["winter"], category: ["outer"] };
  const got = filterProducts(products, filters);
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

test("facet counts sum to the number of tagged products", () => {
  const opts = facetOptions(products, "category");
  assert.equal(
    opts.reduce((n, o) => n + o.count, 0),
    products.length,
  );
  for (const { value, count } of opts) {
    assert.equal(filterProducts(products, { category: [value] }).length, count);
  }
});

test("params round-trip through toggleHref", () => {
  const params = new URL(toggleHref({}, "material", "linen"), "http://x").searchParams;
  const filters = filtersFromParams(Object.fromEntries(FACETS.map((f) => [f, params.getAll(f)])));
  assert.deepEqual(filters.material, ["linen"]);
  assert.equal(toggleHref(filters, "material", "linen"), "/", "toggling off clears the query");
});
