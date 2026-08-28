import test from "node:test";
import assert from "node:assert/strict";
import {
  FILTER_KEYS, FLOW_KEYS, PRACTICE_SLUGS, applyFilters, clearFiltersHref, formatPrice,
  hasFlow, isPersonalized, optionsFor, practiceFromSlug, practiceHref, products, reasons,
  recommend, score, selectionFromParams, toggleHref, toQuery,
  type Product, type Selection,
} from "../lib/products.ts";

const SEASONS = ["spring", "summer", "fall", "winter"];
const GENDERS = ["women", "men", "unisex"];
const FITS = ["relaxed", "sculpted", "compression", "high support"];

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
    assert.ok(FITS.includes(p.fit), `${p.id}: fit ${p.fit}`);
    assert.ok(p.season.length && p.season.every((s) => SEASONS.includes(s)), `${p.id}: season`);
    assert.ok(Array.isArray(p.material) && Array.isArray(p.attributes), `${p.id}: arrays`);
    assert.ok(p.colors.length, `${p.id}: colors`);
    assert.ok(p.image.startsWith("https://"), `${p.id}: image not https`);
  }
});

test("material coverage stays useful — the site is a material browser", () => {
  const pct = Math.round((products.filter((p) => p.material.length).length / products.length) * 100);
  assert.ok(pct >= 40, `material coverage dropped to ${pct}% (expected >= 40)`);
});

test("derived traits cover enough of the catalogue to rank on", () => {
  const withPractice = products.filter((p) => p.practice.length).length;
  assert.ok(withPractice / products.length >= 0.4, `only ${withPractice} products carry a practice`);
  assert.ok(new Set(products.map((p) => p.fit)).size >= 3, "fit collapsed to one or two values");
});

test("every market is priced in its own currency", () => {
  const by = (c: string) => products.filter((p) => p.currency === c);
  assert.ok(by("KRW").length > 50, `only ${by("KRW").length} KRW products`);
  assert.ok(by("USD").length > 50, `only ${by("USD").length} USD products`);
  // Shopify Markets localises prices while meta.json still reports the store
  // default, so a won price labelled USD is the live failure mode.
  for (const p of by("KRW")) assert.ok(p.price >= 1000, `${p.id}: ₩${p.price} too low for KRW`);
  for (const c of ["USD", "GBP"]) {
    for (const p of by(c)) assert.ok(p.price < 2000, `${p.id}: ${c} ${p.price} looks like won`);
  }
  assert.match(formatPrice(by("KRW")[0]), /^₩[\d,]+$/);
  assert.match(formatPrice(by("USD")[0]), /^\$[\d,]+$/);
});

test("gender is split, not everything defaulted to women", () => {
  const men = products.filter((p) => p.gender === "men").length;
  assert.ok(men > 5, `only ${men} men's products — the gender derivation is probably broken`);
});

/* ------------------------------------------- flow ranks, filters exclude ---- */

test("flow never removes a product, it only reorders", () => {
  const flow: Selection = { practice: ["Hot Yoga"], fit: ["compression"], season: ["summer"] };
  assert.equal(recommend(flow).length, products.length);
});

test("flow actually reorders — top results match the flow better than the tail", () => {
  const flow: Selection = { practice: ["Yin Yoga"], fit: ["relaxed"], season: ["winter"] };
  const ranked = recommend(flow);
  const head = ranked.slice(0, 40).reduce((n, p) => n + score(p, flow), 0) / 40;
  const tail = ranked.slice(-40).reduce((n, p) => n + score(p, flow), 0) / 40;
  assert.ok(head > tail, `head ${head} should outscore tail ${tail}`);
  assert.ok(score(ranked[0], flow) > 0, "the top result scores nothing — ranking is inert");
});

test("filters exclude: AND across keys, OR within a key", () => {
  const got = applyFilters(products, { gender: ["men", "unisex"], category: ["leggings"] });
  assert.ok(got.length > 0);
  for (const p of got) {
    assert.ok(["men", "unisex"].includes(p.gender));
    assert.equal(p.category, "leggings");
  }
  const men = applyFilters(products, { gender: ["men"] }).length;
  const unisex = applyFilters(products, { gender: ["unisex"] }).length;
  assert.equal(applyFilters(products, { gender: ["men", "unisex"] }).length, men + unisex);
});

test("clearing filters keeps the flow — the whole point of the split", () => {
  const s: Selection = {
    practice: ["Vinyasa"], fit: ["sculpted"], season: ["summer"],
    gender: ["women"], material: ["nylon"], proportions: ["Tall"],
  };
  const href = clearFiltersHref(s);
  const kept = selectionFromParams(
    Object.fromEntries(
      [...FLOW_KEYS, ...FILTER_KEYS].map((k) => [k, new URL(href, "http://x").searchParams.getAll(k)]),
    ),
  );
  assert.deepEqual(kept.practice, ["Vinyasa"]);
  assert.deepEqual(kept.fit, ["sculpted"]);
  assert.deepEqual(kept.season, ["summer"]);
  for (const k of FILTER_KEYS) assert.ok(!kept[k]?.length, `${k} survived clear filters`);
  assert.ok(hasFlow(kept));
});

test("toggling a value off returns to the URL without it", () => {
  const s: Selection = { practice: ["Vinyasa"] };
  const on = toggleHref(s, "gender", "women");
  assert.match(on, /gender=women/);
  assert.match(on, /practice=Vinyasa/);
  const off = toggleHref({ ...s, gender: ["women"] }, "gender", "women");
  assert.doesNotMatch(off, /gender=/);
  assert.match(off, /practice=Vinyasa/);
});

test("option counts match what the filter returns", () => {
  for (const k of ["category", "gender", "brand"] as const) {
    for (const { value, count } of optionsFor(products, k).slice(0, 8)) {
      assert.equal(applyFilters(products, { [k]: [value] }).length, count, `${k}=${value}`);
    }
  }
});

test("a recommendation always explains itself when a flow is set", () => {
  const flow: Selection = { practice: ["Vinyasa"], fit: ["sculpted"], season: ["summer"] };
  const top: Product = recommend(flow)[0];
  const why = reasons(top, flow);
  assert.ok(why.length > 0, "the top recommendation has no reason to show");
  assert.ok(why.length <= 2, "cards show at most two reasons");
});

test("equal-scoring results are spread across brands, not one brand's catalogue", () => {
  const flow: Selection = { practice: ["Vinyasa"], fit: ["relaxed"], season: ["fall"] };
  const top = recommend(flow).slice(0, 12);
  const brands = new Set(top.map((p) => p.brand));
  assert.ok(brands.size >= 5, `top 12 came from only ${brands.size} brands`);
});

test("ranking is deterministic — the same flow gives the same order", () => {
  const flow: Selection = { practice: ["Ashtanga"], fit: ["compression"], season: ["summer"] };
  assert.deepEqual(
    recommend(flow).slice(0, 20).map((p) => p.id),
    recommend(flow).slice(0, 20).map((p) => p.id),
  );
});

/* --------------------------------- the two discovery paths are distinct ---- */

test("a practice card and a completed discovery produce different states", () => {
  // Quick path: a card sets only the practice and never claims to be personal.
  const quick = new URL(toQuery({ practice: ["Vinyasa"] }), "http://x");
  assert.equal(quick.searchParams.get("flow"), null);
  assert.ok(!isPersonalized(Object.fromEntries(quick.searchParams)));

  // Personalised path: discovery marks the answers as its own.
  const flow = new URL(
    toQuery({ practice: ["Vinyasa"], fit: ["sculpted"], season: ["summer"] }, { flow: true }),
    "http://x",
  );
  assert.equal(flow.searchParams.get("flow"), "1");
  assert.ok(isPersonalized(Object.fromEntries(flow.searchParams)));
});

test("the flow marker survives filtering and clearing filters", () => {
  const s: Selection = { practice: ["Vinyasa"], fit: ["sculpted"], gender: ["women"] };
  for (const href of [toggleHref(s, "material", "nylon", { flow: true }), clearFiltersHref(s, { flow: true })]) {
    assert.equal(new URL(href, "http://x").searchParams.get("flow"), "1", href);
  }
  // ...and is not invented when it was never set.
  assert.equal(new URL(toggleHref(s, "material", "nylon"), "http://x").searchParams.get("flow"), null);
});

test("every selection link lands on the product section", () => {
  assert.match(toQuery({ practice: ["Hatha"] }), /#products$/);
  assert.match(toggleHref({}, "gender", "women"), /#products$/);
});

test("a practice card narrows and ranks: its practice tops the results", () => {
  for (const practice of ["Vinyasa", "Ashtanga", "Yin Yoga", "Hot Yoga"]) {
    const top = recommend({ practice: [practice] }).slice(0, 8);
    assert.ok(
      top.every((p) => p.practice.includes(practice as never)),
      `${practice}: top results do not match the practice`,
    );
  }
});

/* ------------------------------------------- practice archives ------------- */

test("every practice has an archive, and the slug round-trips", () => {
  const practices = new Set(products.flatMap((p) => p.practice));
  for (const practice of practices) {
    const href = practiceHref(practice);
    assert.match(href, /^\/practice\/[a-z-]+$/, `${practice}: ${href}`);
    const slug = href.split("/").pop()!;
    assert.equal(practiceFromSlug(slug), practice, `${slug} does not map back`);
  }
  assert.equal(Object.keys(PRACTICE_SLUGS).length, 6);
});

test("an unknown slug has no archive, and a known one is case-insensitive", () => {
  for (const slug of ["", "yoga", "hot yoga", "hot-yoga-2", "../products", "vinyasa/"]) {
    assert.equal(practiceFromSlug(slug), null, `"${slug}" should not resolve`);
  }
  assert.equal(practiceFromSlug("Hot-Yoga"), "Hot Yoga");
  assert.equal(practiceFromSlug("HOT-YOGA"), "Hot Yoga");
});

test("archive links stay on the archive and never re-add the practice", () => {
  const base = practiceHref("Vinyasa");
  const s: Selection = { practice: ["Vinyasa"], gender: ["women"] };

  const material = toggleHref(s, "material", "nylon", { base });
  assert.ok(material.startsWith(`${base}?`), material);
  assert.doesNotMatch(material, /practice=/, "the path already owns the practice");
  assert.match(material, /gender=women/);

  const cleared = clearFiltersHref(s, { base });
  assert.ok(cleared.startsWith(base), cleared);
  assert.doesNotMatch(cleared, /gender=/);
});

test("choosing another practice on an archive moves to that archive", () => {
  const base = practiceHref("Vinyasa");
  assert.equal(toggleHref({ practice: ["Vinyasa"] }, "practice", "Ashtanga", { base }), "/practice/ashtanga");
});

test("home links are unaffected by the archive base", () => {
  const home = toggleHref({ practice: ["Vinyasa"] }, "material", "nylon");
  assert.ok(home.startsWith("/?"), home);
  assert.match(home, /practice=Vinyasa/, "the home page keeps the practice in the query");
  assert.match(home, /#products$/);
});

test("an archive contains only its own practice, and the home page does not", () => {
  for (const practice of Object.values(PRACTICE_SLUGS)) {
    const archive = recommend({ practice: [practice] }, { require: ["practice"] });
    assert.ok(archive.length > 0, `${practice}: empty archive`);
    assert.ok(
      archive.every((p) => p.practice.includes(practice as never)),
      `${practice}: the archive holds pieces that do not suit it`,
    );
    // Without `require` the same key only ranks — that is the home page's behaviour.
    assert.equal(recommend({ practice: [practice] }).length, products.length);
    assert.ok(archive.length < products.length, `${practice}: the archive did not narrow anything`);
  }
});

test("an archive still narrows when other filters are applied", () => {
  const s: Selection = { practice: ["Vinyasa"], gender: ["men"] };
  const got = recommend(s, { require: ["practice"] });
  assert.ok(got.length > 0);
  for (const p of got) {
    assert.ok(p.practice.includes("Vinyasa"));
    assert.equal(p.gender, "men");
  }
});
