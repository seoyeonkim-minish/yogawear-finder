// Rewrites data/products.json from two sources.
//   npm run crawl              reuse .cache/ if present
//   npm run crawl -- fresh     re-fetch everything
//   npm run crawl -- only=29cm|shopify
//
// Source 1 — the brands' own public Shopify /products.json (10 global brands).
// Source 2 — 29CM's public search API, which aggregates Korean brands, so one
//            source covers many of them (per the 29CM sports curation reference).
//
// Three things neither source gives us directly:
//   material — not in either payload (measured 0-45% on Shopify; on 3 of 4 brands
//              it is client-rendered on the product page). Comes from
//              data/materials.json, keyed by the fabric line named in the title.
//   season   — derived from fabric + garment words. Marked as derived in the UI.
//   gender   — 29CM gives it (여성의류/남성의류); for Shopify it is derived from
//              tags/title, defaulting to women (these are women-led brands).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const CACHE = new URL("../.cache/", import.meta.url);
const FRESH = process.argv.includes("fresh");
const ONLY = process.argv.find((a) => a.startsWith("only="))?.slice(5);
const UA = "Mozilla/5.0 (compatible; yogawear-finder/0.1)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s || "").toLowerCase();
const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

/** Cache one source's raw payload so iterating on the mapping costs no requests. */
async function cached(name, fetcher) {
  const file = new URL(`${name}.json`, CACHE);
  if (!FRESH && existsSync(file)) {
    const data = JSON.parse(await readFile(file));
    console.log(`  ${name}: ${data.length} (cached)`);
    return data;
  }
  const data = await fetcher();
  await writeFile(file, JSON.stringify(data));
  console.log(`  ${name}: ${data.length} fetched`);
  return data;
}

// ---------------------------------------------------------------- shared rules

// Not yogawear, even where the words overlap with apparel categories.
const EXCLUDE = ["sock", "panty", "thong", "brief", "bikini", "swim", "towel", "bag", "bottle", "gift card", "beanie", "headband", "scrunchie", "blanket", "bolster", "sticker", "candle", "shoe", "sandal", "slipper", "glove", "sunglass", "necklace", "earring", "pajama", "pyjama", "kids", "youth", "sample", "e-gift", "yoga mat", "mat towel", "요가매트", "매트", "양말", "가방", "수영", "비키니", "아동", "키즈", "발레슈즈", "폼롤러", "링", "블럭"];

// First match wins — order matters (bra before top, legging before pant).
const CATEGORY = [
  ["bra", ["bra", "bralette", "bandeau", "브라", "브라탑"]],
  ["leggings", ["legging", "tight", "7/8", "capri", "flare pant", "yoga pant", "레깅스", "타이츠"]],
  ["shorts", ["short", "biker", "bike ", "쇼츠", "반바지", "숏"]],
  ["set", ["set", "onesie", "unitard", "bodysuit", "romper", "jumpsuit", "세트", "슈트", "수트", "점프"]],
  ["outer", ["jacket", "hoodie", "sweatshirt", "crew", "cardigan", "vest", "coat", "wrap", "pullover", "sweater", "half zip", "quarter zip", "1/4 zip", "1/2 zip", "자켓", "재킷", "후디", "후드", "집업", "가디건", "베스트", "점퍼", "스웨트셔츠", "맨투맨", "바람막이"]],
  ["top", ["tank", "tee", "t-shirt", "top", "shirt", "long sleeve", "camisole", "blouse", "crop", "상의", "티셔츠", "탑", "나시", "슬리브", "반팔", "긴팔", "크롭"]],
  ["pants", ["pant", "jogger", "trouser", "sweatpant", "팬츠", "바지", "조거", "슬랙스"]],
  ["dress", ["dress", "skirt", "skort", "원피스", "스커트", "스컬"]],
];

const MATERIAL_WORDS = {
  린넨: "linen", 리넨: "linen", 면: "cotton", 코튼: "cotton", 오가닉코튼: "organic cotton",
  모달: "modal", 텐셀: "tencel", 나일론: "nylon", 폴리: "polyester", 폴리에스터: "polyester",
  스판: "elastane", 울: "wool", 메리노: "merino wool", 기모: "polyester", 플리스: "polyester",
  냉감: "nylon", 리사이클: "recycled polyester", 대나무: "bamboo",
};

const SEASON_BY_MATERIAL = [
  [["wool", "merino wool"], ["winter"]],
  [["linen", "tencel", "bamboo"], ["summer"]],
];
const SEASON_BY_CATEGORY = {
  bra: ["spring", "summer"], shorts: ["summer"], leggings: ["spring", "fall", "winter"],
  pants: ["spring", "fall"], top: ["spring", "summer"], outer: ["fall", "winter"],
  set: ["spring", "fall"], dress: ["summer"],
};
// A fleece/기모 garment is winter whatever its fiber; mesh/냉감 is summer.
const WINTER_WORDS = ["fleece", "sherpa", "quilted", "puffer", "thermal", "down", "wool", "기모", "플리스", "패딩", "누빔", "起毛"];
const SUMMER_WORDS = ["mesh", "냉감", "쿨", "cooling", "linen", "린넨", "썸머"];

let shopifyCurrency = {};

const materials = JSON.parse(await readFile(new URL("../data/materials.json", import.meta.url)));
// Longest key first so "heather rib" beats "rib".
const lineTable = Object.fromEntries(
  Object.entries(materials)
    .filter(([, v]) => typeof v === "object")
    .map(([brand, lines]) => [brand, Object.entries(lines).sort((a, b) => b[0].length - a[0].length)]),
);

const categoryOf = (hay) => CATEGORY.find(([, ws]) => ws.some((w) => hay.includes(w)))?.[0] ?? null;

function materialOf(brand, hay) {
  for (const [line, fibers] of lineTable[brand] ?? []) if (hay.includes(line)) return fibers;
  const ko = Object.entries(MATERIAL_WORDS).filter(([k]) => hay.includes(k)).map(([, v]) => v);
  return [...new Set(ko)];
}

function seasonOf(material, category, hay) {
  if (WINTER_WORDS.some((w) => hay.includes(w))) return ["winter"];
  if (SUMMER_WORDS.some((w) => hay.includes(w))) return ["summer"];
  for (const [mats, seasons] of SEASON_BY_MATERIAL)
    if (material.some((m) => mats.includes(m))) return seasons;
  return SEASON_BY_CATEGORY[category] ?? ["spring", "summer", "fall"];
}

const UNISEX_WORDS = ["unisex", "유니섹스", "공용", "남녀공용", "남녀"];
// "men" is a substring of "women" — match on a word boundary or every women's
// product reads as men's. (It did: 1780 men vs 1077 women before this.)
const MEN_RE = /(^|[^a-z가-힣])(men|mens|men's|남성|맨즈|남자)([^a-z가-힣]|$)/;
const WOMEN_RE = /(^|[^a-z가-힣])(women|womens|women's|여성|우먼|레이디)([^a-z가-힣]|$)/;

/** Women wins over men when both appear ("women's" contains "men"). */
function genderOf(hay, hint) {
  if (UNISEX_WORDS.some((w) => hay.includes(w))) return "unisex";
  if (WOMEN_RE.test(hay)) return "women";
  if (MEN_RE.test(hay)) return "men";
  return hint ?? "women";
}

/** "Go Time Pullover - Azure Blue" -> "Go Time Pullover". Colorway suffix, not a new garment. */
const baseName = (t) =>
  t.replace(/^\[[^\]]*\]\s*/, "").split(/\s+[-–—]\s+|\s*\|\s*|\s*\(\d+\s*colou?rs?\)/i)[0].trim();

// ---------------------------------------------------- derived shopping traits
// Practice / fit / proportions / performance attributes are in no source payload
// (and no amount of crawling produces them), so they are derived from what we do
// have: fabric, garment type, season and the words the brand put in the title.
// They drive the Discover -> Recommend flow, so they are ranking signals, not facts.

const FIT_RULES = [
  ["high support", ["high support", "high impact", "max support", "power", "run ", "running", "하이서포트", "고강도"]],
  ["compression", ["compress", "compressive", "firm", "shaping", "shape ", "보정", "압박", "코어"]],
  ["sculpted", ["sculpt", "airlift", "airbrush", "skinluxe", "seamless", "second skin", "slim", "contour", "bodysuit", "심리스", "슬림", "탄탄"]],
  ["relaxed", ["oversize", "oversized", "relaxed", "loose", "wide", "harem", "lounge", "boyfriend", "baggy", "flare", "와이드", "루즈", "오버핏", "하렘", "부츠컷"]],
];
const FIT_BY_CATEGORY = {
  leggings: "sculpted", bra: "sculpted", shorts: "sculpted",
  top: "relaxed", outer: "relaxed", pants: "relaxed", set: "sculpted", dress: "relaxed",
};

const BREATHABLE = ["cotton", "organic cotton", "modal", "tencel", "linen", "bamboo", "rayon"];
const SYNTHETIC = ["polyester", "recycled polyester", "nylon", "recycled nylon"];
const SOFT = ["modal", "tencel", "cotton", "organic cotton", "bamboo", "cupro", "silk"];

// Half the catalogue has no published fibre list. Rather than let those products
// fall out of every recommendation, assume what the garment type guarantees:
// activewear leggings/bras/shorts stretch and are synthetic. Nothing else is assumed.
const ASSUMED_BY_CATEGORY = {
  leggings: ["stretch", "quick dry"],
  bra: ["stretch", "quick dry"],
  shorts: ["stretch", "quick dry"],
  set: ["stretch"],
};

function attributesOf(material, category, season, fit, hay) {
  const has = (list) => material.some((m) => list.includes(m));
  const a = new Set(material.length ? [] : (ASSUMED_BY_CATEGORY[category] ?? []));
  if (!material.length && (a.has("stretch") && (fit === "compression" || fit === "sculpted"))) a.add("high stretch");
  if (!material.length && fit === "relaxed") a.add("comfort");
  if (has(BREATHABLE) || hay.includes("mesh") || hay.includes("메쉬")) a.add("breathable");
  if (has(SYNTHETIC)) a.add("quick dry");
  if (has(SOFT)) a.add("soft touch");
  if (material.includes("elastane")) a.add("stretch");
  if (material.includes("elastane") && (fit === "compression" || fit === "sculpted")) a.add("high stretch");
  if (fit === "compression" || fit === "high support") a.add("secure fit");
  if (fit === "relaxed") a.add("comfort");
  if (material.includes("nylon") || material.includes("recycled nylon")) a.add("durability");
  if (season.includes("summer") || category === "shorts" || hay.includes("light") || hay.includes("냉감")) a.add("lightweight");
  if (season.includes("winter")) a.add("warm");
  return [...a];
}

// A product suits a practice when it carries what that practice demands.
const PRACTICE_NEEDS = {
  Vinyasa: ["stretch", "breathable"],
  Ashtanga: ["high stretch", "secure fit"],
  "Hot Yoga": ["quick dry", "lightweight"],
  "Yin Yoga": ["soft touch", "comfort"],
  Hatha: ["breathable", "comfort"],
  Pilates: ["stretch", "secure fit"],
};

function practiceOf(attributes, category, season) {
  const out = Object.entries(PRACTICE_NEEDS)
    .filter(([, needs]) => needs.every((n) => attributes.includes(n)))
    .map(([name]) => name);
  // A winter piece is not what anyone wears to hot yoga.
  return season.length === 1 && season[0] === "winter" ? out.filter((x) => x !== "Hot Yoga") : out;
}

/**
 * Maternity is only ever the brand's own claim, and only where a shopper can
 * see it: the product's name. Nothing infers it from a relaxed fit or a stretchy
 * fabric, and merchandising tags are not enough either — matching those put a
 * maxi dress in the maternity list.
 */
const MATERNITY_WORDS = ["maternity", "pregnan", "bump", "nursing", "임부", "임산부", "마타니티", "산모", "임신"];
const isMaternity = (hay) => MATERNITY_WORDS.some((w) => hay.includes(w));

const PROPORTION_WORDS = {
  Tall: ["tall", "long length", "롱버전", "롱기장", "키큰"],
  Petite: ["petite", "cropped length", "short length", "숏기장", "숏버전"],
  Curvy: ["curve", "curvy", "plus size", "extended size", "빅사이즈"],
  Athletic: ["athletic fit", "muscle", "broad", "애슬릿"],
};
const proportionsOf = (hay) =>
  Object.entries(PROPORTION_WORDS).filter(([, ws]) => ws.some((w) => hay.includes(w))).map(([k]) => k);

function deriveTraits(p, hay) {
  const fit = FIT_RULES.find(([, ws]) => ws.some((w) => hay.includes(w)))?.[0]
    ?? FIT_BY_CATEGORY[p.category] ?? "relaxed";
  const attributes = attributesOf(p.material, p.category, p.season, fit, hay);
  return {
    ...p,
    fit,
    attributes,
    practice: practiceOf(attributes, p.category, p.season),
    proportions: proportionsOf(hay),
    maternityFriendly: isMaternity(norm(p.name)),
  };
}

// ------------------------------------------------------- source 1: Shopify API

const SHOPIFY = [
  { brand: "Alo Yoga", host: "www.aloyoga.com" },
  { brand: "Beyond Yoga", host: "beyondyoga.com" },
  { brand: "Girlfriend Collective", host: "www.girlfriend.com" },
  { brand: "TALA", host: "www.wearetala.com" },
  { brand: "Onzie", host: "onzie.com" },
  { brand: "Senita Athletics", host: "senitaathletics.com" },
  { brand: "Manduka", host: "www.manduka.com" },
  { brand: "Liforme", host: "www.liforme.com" },
  { brand: "Spiritual Gangster", host: "www.spiritualgangster.com" },
  { brand: "PopFlex", host: "popflexactive.com" },
];
const SHOPIFY_PAGES = 6;
const SHOPIFY_DELAY = 4000; // these stores 429 below ~1 req / 2.5s

/** One request per store. Kept separate from the product cache so it survives it. */
async function fetchShopifyCurrencies() {
  const out = {};
  for (const { brand, host } of SHOPIFY) {
    out[brand] = "USD";
    try {
      const meta = await (await fetch(`https://${host}/meta.json`, { headers: { "user-agent": UA } })).json();
      if (meta?.currency) out[brand] = meta.currency;
    } catch { /* keep the default */ }
    await sleep(500);
  }
  return out;
}

async function fetchShopify() {
  const out = [];
  for (const { brand, host } of SHOPIFY) {
    let got = 0;

    for (let page = 1; page <= SHOPIFY_PAGES; page++) {
      let res;
      for (let attempt = 0; attempt < 4; attempt++) {
        res = await fetch(`https://${host}/products.json?limit=250&page=${page}`, { headers: { "user-agent": UA } });
        if (res.status !== 429) break;
        await sleep(SHOPIFY_DELAY * (attempt + 2));
      }
      if (!res.ok) { console.warn(`    ! ${host} p${page} HTTP ${res.status}`); break; }
      const { products } = await res.json();
      if (!products?.length) break;
      out.push(...products.map((p) => ({ ...p, _brand: brand, _host: host })));
      got += products.length;
      if (products.length < 250) break;
      await sleep(SHOPIFY_DELAY);
    }
    console.log(`    ${brand}: ${got}`);
    await sleep(SHOPIFY_DELAY);
  }
  return out;
}

function mapShopify(p) {
  const hay = `${norm(p.title)} ${norm(p.product_type)} ${norm((p.tags || []).join(" "))}`;
  const category = categoryOf(hay);
  const price = Number(p.variants?.[0]?.price);
  const image = p.images?.[0]?.src;
  if (!category || !price || !image) return null;

  const colorOpt = (p.options || []).find((o) => /colou?r/i.test(o.name));
  const tagged = (p.tags || []).filter((t) => /^colou?r:/i.test(t)).map((t) => norm(t.split(":")[1]));
  const suffix = p.title.split(/\s+[-–—]\s+/)[1];
  const colors = colorOpt?.values?.map(norm) ?? (tagged.length ? tagged : suffix ? [norm(suffix)] : []);

  const material = materialOf(p._brand, hay);
  const name = baseName(p.title);
  return deriveTraits({
    id: slug(`${p._brand}-${name}`),
    brand: p._brand,
    name,
    category,
    gender: genderOf(hay),
    material,
    season: seasonOf(material, category, hay),
    price: Math.round(price),
    currency: shopifyCurrency[p._brand] ?? "USD",
    colors,
    image,
    url: `https://${p._host}/products/${p.handle}`,
    source: "brand",
  }, hay);
}

// ---------------------------------------------- source 2: 29CM search (Korean)

const KO_QUERIES = ["요가복", "요가 레깅스", "필라테스 레깅스", "브라탑", "요가 팬츠", "필라테스 세트", "요가 상의", "레깅스 여성", "남성 요가", "남성 레깅스", "요가 원피스", "필라테스 크롭", "요가 자켓", "기능성 레깅스", "린넨 요가"];
const KO_PAGES = 5;

async function fetch29cm() {
  const seen = new Set();
  const out = [];
  for (const kw of KO_QUERIES) {
    let got = 0;
    for (let page = 1; page <= KO_PAGES; page++) {
      const url = `https://search-api.29cm.co.kr/api/v4/products/search?keyword=${encodeURIComponent(kw)}&count=100&page=${page}`;
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
      if (!res.ok) { console.warn(`    ! 29cm "${kw}" p${page} HTTP ${res.status}`); break; }
      const products = (await res.json())?.data?.products ?? [];
      if (!products.length) break;
      for (const p of products) {
        if (seen.has(p.itemNo)) continue;
        seen.add(p.itemNo);
        out.push(p);
        got++;
      }
      await sleep(800);
    }
    console.log(`    "${kw}": +${got}`);
  }
  return out;
}

function map29cm(p) {
  const brand = p.frontBrandNameKor || p.frontBrandNameEng;
  const hay = `${norm(p.itemName)} ${norm(brand)}`;
  const cats = p.frontCategoryInfo || [];
  const catNames = cats.map((c) => `${c.categoryLargeName ?? ""} ${c.categoryMediumName ?? ""} ${c.categorySmallName ?? ""}`).join(" ");
  const category = categoryOf(hay) ?? categoryOf(norm(catNames));
  const price = p.saleInfoV2?.sellPrice || p.lastSalePrice || p.consumerPrice;
  if (!brand || !category || !price || !p.imageUrl) return null;

  // 29CM states the gender in its own category tree; the title only breaks ties.
  const larges = new Set(cats.map((c) => c.categoryLargeName));
  const hint = larges.has("남성의류") && !larges.has("여성의류") ? "men" : "women";
  const gender = genderOf(hay, hint);

  const material = materialOf(brand, hay);
  const name = baseName(p.itemName);
  return deriveTraits({
    id: slug(`29cm-${brand}-${name}-${p.itemNo}`),
    brand,
    name,
    category,
    gender,
    material,
    season: seasonOf(material, category, hay),
    price,
    currency: "KRW",
    colors: (p.colorHexes || []).length ? p.colorHexes : [],
    image: `https://img.29cm.co.kr${p.imageUrl}?width=600`,
    url: `https://www.29cm.co.kr/products/${p.itemNo}`,
    source: "29cm",
  }, hay);
}

// -------------------------------------- 29CM material enrichment (product page)
// The search API has no fibers, but each 29CM product page carries a structured
// "제품 소재" field (itemDetailsCode 101101). Measured: 90% of them hold a real
// composition, so this is worth one request per product. Cached by itemNo.

const KO_FIBER = [
  ["메리노", "merino wool"], ["오가닉코튼", "organic cotton"], ["유기농면", "organic cotton"],
  ["리사이클", "recycled polyester"], ["재생폴리", "recycled polyester"],
  ["폴리에스터", "polyester"], ["폴리에스테르", "polyester"], ["폴리우레탄", "elastane"],
  ["스판덱스", "elastane"], ["스판텍스", "elastane"], ["엘라스탄", "elastane"], ["스판", "elastane"],
  ["나일론", "nylon"], ["폴리아미드", "nylon"], ["모달", "modal"], ["텐셀", "tencel"],
  ["리오셀", "tencel"], ["라이오셀", "tencel"], ["린넨", "linen"], ["리넨", "linen"],
  ["레이온", "rayon"], ["비스코스", "rayon"], ["아크릴", "acrylic"], ["대나무", "bamboo"],
  ["큐프라", "cupro"], ["아세테이트", "acetate"], ["캐시미어", "wool"], ["양모", "wool"],
  ["코튼", "cotton"], ["면", "cotton"], ["울", "wool"], ["실크", "silk"],
  ["polyurethane", "elastane"], ["polyester", "polyester"], ["spandex", "elastane"],
  ["elastane", "elastane"], ["nylon", "nylon"], ["polyamide", "nylon"], ["cotton", "cotton"],
  ["rayon", "rayon"], ["viscose", "rayon"], ["modal", "modal"], ["tencel", "tencel"],
  ["linen", "linen"], ["wool", "wool"], ["acrylic", "acrylic"], ["silk", "silk"],
];

/** "겉감 : 나일론 83%, 폴리우레탄 17%" -> ["nylon","elastane"] */
function parseFibers(text) {
  const hay = norm(text);
  const found = [];
  for (const [ko, canonical] of KO_FIBER) {
    if (!hay.includes(ko)) continue;
    if (found.includes(canonical)) continue;
    // "울" is a substring of "폴리우레탄"/"모달" etc — only take it as a standalone fiber.
    if (ko === "울" && !/(^|[^가-힣])울([^가-힣]|$)/.test(hay)) continue;
    if (ko === "면" && !/(^|[^가-힣])면([^가-힣]|$)/.test(hay)) continue;
    found.push(canonical);
  }
  return found;
}

const NO_FIBER = ["상세", "참조", "참고", "본문", "이미지"];

async function enrich29cm(products) {
  const file = new URL("29cm-material.json", CACHE);
  const store = !FRESH && existsSync(file) ? JSON.parse(await readFile(file)) : {};
  let fetched = 0, hits = 0;

  for (const p of products) {
    const itemNo = p.url.split("/").pop();
    if (!(itemNo in store)) {
      try {
        const res = await fetch(`https://www.29cm.co.kr/products/${itemNo}`, { headers: { "user-agent": UA } });
        const html = await res.text();
        const i = html.indexOf("101101");
        let value = "";
        if (i > 0) {
          const chunk = html.slice(i, i + 700).replace(/\\+"/g, '"').replace(/\\+n/g, " ");
          value = (chunk.match(/itemDetailsValue"\s*:\s*"([^"]*)"/) || [])[1] || "";
        }
        store[itemNo] = NO_FIBER.some((w) => value.includes(w)) && !/%/.test(value) ? "" : value;
      } catch {
        store[itemNo] = "";
      }
      fetched++;
      if (fetched % 40 === 0) {
        await writeFile(file, JSON.stringify(store));
        console.log(`    material: ${fetched} pages fetched`);
      }
      await sleep(700);
    }
    const fibers = parseFibers(store[itemNo]);
    if (fibers.length) {
      p.material = fibers;
      p.season = seasonOf(fibers, p.category, norm(p.name));
      Object.assign(p, deriveTraits(p, norm(p.name)));
      hits++;
    }
  }

  await writeFile(file, JSON.stringify(store));
  console.log(`    material from product pages: ${hits}/${products.length} (${fetched} newly fetched)`);
  return products;
}

// ------------------------------------------------------------------- pipeline

await mkdir(CACHE, { recursive: true });

const rows = [];
if (ONLY !== "29cm") {
  shopifyCurrency = (await cached("shopify-currency", async () => [await fetchShopifyCurrencies()]))[0];
  rows.push(...(await cached("shopify", fetchShopify)).map(mapShopify));
}
if (ONLY !== "shopify") {
  const ko = (await cached("29cm", fetch29cm)).map(map29cm).filter(Boolean);
  rows.push(...(await enrich29cm(ko)));
}

const skipped = rows.filter((r) => !r).length;
const merged = new Map();
let excluded = 0;

for (const r of rows) {
  if (!r) continue;
  const hay = `${norm(r.name)} ${norm(r.brand)}`;
  if (EXCLUDE.some((w) => hay.includes(w))) { excluded++; continue; }

  const key = `${r.brand}::${norm(r.name)}::${r.gender}`;
  const hit = merged.get(key);
  if (!hit) { merged.set(key, r); continue; }
  for (const c of r.colors) if (!hit.colors.includes(c)) hit.colors.push(c);
  if (!hit.material.length && r.material.length) {
    hit.material = r.material;
    hit.season = r.season;
  }
}

// Shopify Markets served some stores' prices in KRW (we request from Korea) while
// their meta.json still says USD. A store's prices are one currency, so judge by
// the brand's median: nothing in this catalogue costs 5,000 dollars or pounds.
// ponytail: magnitude test, not a real signal — replace if a store ever mixes currencies.
function reconcileCurrency(list) {
  const byBrand = new Map();
  for (const p of list) {
    if (p.source !== "brand") continue;
    (byBrand.get(p.brand) ?? byBrand.set(p.brand, []).get(p.brand)).push(p.price);
  }
  const localised = new Set();
  for (const [brand, prices] of byBrand) {
    prices.sort((a, b) => a - b);
    if (prices[prices.length >> 1] >= 5000) localised.add(brand);
  }
  for (const p of list) if (localised.has(p.brand)) p.currency = "KRW";
  if (localised.size) console.log(`  currency: ${[...localised].join(", ")} served in KRW (region-localised)`);
}

const ids = new Set();
const products = [...merged.values()].filter((p) => {
  if (ids.has(p.id)) return false;
  ids.add(p.id);
  p.colors = p.colors.length ? p.colors : ["-"];
  return true;
});

reconcileCurrency(products);
products.sort((a, b) => a.brand.localeCompare(b.brand, "ko") || a.name.localeCompare(b.name, "ko"));
await writeFile(new URL("../data/products.json", import.meta.url), JSON.stringify(products, null, 1) + "\n");

const pct = (n) => `${Math.round((n / products.length) * 100)}%`;
const count = (f) => products.filter(f).length;
console.log(`\n${products.length} products from ${rows.length} raw listings`);
console.log(`  dropped: ${skipped} unmappable, ${excluded} non-apparel; colorways merged`);
console.log(`  brands: ${new Set(products.map((p) => p.brand)).size}`);
console.log(`  material: ${pct(count((p) => p.material.length))} tagged`);
console.log(`  gender: women ${count((p) => p.gender === "women")} / men ${count((p) => p.gender === "men")} / unisex ${count((p) => p.gender === "unisex")}`);
console.log(`  currency: ${[...new Set(products.map((p) => p.currency))].map((c) => `${c} ${count((p) => p.currency === c)}`).join(" / ")}`);
console.log(`  fit: ${["relaxed", "sculpted", "compression", "high support"].map((f) => `${f} ${count((p) => p.fit === f)}`).join(" / ")}`);
console.log(`  practice tagged: ${count((p) => p.practice.length)} (${pct(count((p) => p.practice.length))})`);
console.log(`  proportions tagged: ${count((p) => p.proportions.length)}`);
console.log(`  maternity (brand-declared): ${count((p) => p.maternityFriendly)}`);
console.log(`  source: brand ${count((p) => p.source === "brand")} / 29cm ${count((p) => p.source === "29cm")}`);

const holes = new Map();
for (const p of products) if (!p.material.length) holes.set(p.brand, (holes.get(p.brand) ?? 0) + 1);
const top = [...holes].sort((a, b) => b[1] - a[1]).slice(0, 12);
if (top.length) {
  console.log(`\nbrands missing material (add fabric-line keys to data/materials.json):`);
  for (const [b, n] of top) console.log(`  ${String(n).padStart(4)}  ${b}`);
}
