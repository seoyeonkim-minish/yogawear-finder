import raw from "../data/products.json" with { type: "json" };

export type Fit = "relaxed" | "sculpted" | "compression" | "high support";
export type Practice = "Hatha" | "Vinyasa" | "Ashtanga" | "Hot Yoga" | "Yin Yoga" | "Pilates";
export type Proportion = "Petite" | "Tall" | "Curvy" | "Athletic";

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  gender: "women" | "men" | "unisex";
  material: string[];
  season: string[];
  price: number;
  currency: "USD" | "KRW" | "GBP";
  colors: string[];
  image: string;
  url: string;
  source: "brand" | "29cm";
  fit: Fit;
  attributes: string[];
  practice: Practice[];
  proportions: Proportion[];
  /** The brand's own claim, never inferred from fit or fabric. */
  maternityFriendly: boolean;
};

export const products = raw as Product[];

/* -------------------------------------------------------------------------
 * Your Flow vs Filters.
 * Flow is what the guided discovery learned about the person; it ranks.
 * Filters are conditions they added while browsing; they exclude.
 * Both live in the URL so a result is shareable and the back button works.
 * ---------------------------------------------------------------------- */

export const FLOW_KEYS = ["practice", "fit", "season"] as const;
export const FILTER_KEYS = ["gender", "material", "category", "brand", "proportions", "maternity"] as const;
export type FlowKey = (typeof FLOW_KEYS)[number];
export type FilterKey = (typeof FILTER_KEYS)[number];
export type Key = FlowKey | FilterKey;

export type Selection = Partial<Record<Key, string[]>>;

/**
 * Carried through every link but not a facet: it records that the flow came
 * from the guided discovery. Two people can both be filtered to Vinyasa — one
 * chose it from a practice card, one answered three questions — and only the
 * second should be shown a personalised "Your flow" state.
 */
export const isPersonalized = (params: Record<string, string | string[] | undefined>) =>
  params.flow === "1";

const valuesOf = (p: Product, k: Key): string[] => {
  // Maternity is a yes/no condition of wear rather than one of the product's
  // own attributes, so it has no value list of its own.
  if (k === "maternity") return p.maternityFriendly ? ["1"] : [];
  const v = p[k as keyof Product];
  return Array.isArray(v) ? (v as string[]) : [String(v)];
};

export const hasFlow = (s: Selection) => FLOW_KEYS.some((k) => s[k]?.length);
export const hasFilters = (s: Selection) => FILTER_KEYS.some((k) => s[k]?.length);

/**
 * One control, several stored values. "Recycled" is a choice a shopper makes;
 * "recycled polyester" and "recycled nylon" are how the catalogue records it.
 * The group name is what travels in the URL — it expands only when matching.
 */
export const VALUE_GROUP: Partial<Record<Key, Record<string, string[]>>> = {
  material: { recycled: ["recycled polyester", "recycled nylon"] },
};

export const expandValues = (k: Key, values: string[]) =>
  values.flatMap((v) => VALUE_GROUP[k]?.[v] ?? [v]);

/** Filters exclude: AND across keys, OR within a key. Flow never excludes. */
export function applyFilters(list: Product[], s: Selection): Product[] {
  return list.filter((p) =>
    FILTER_KEYS.every((k) => {
      const selected = s[k];
      if (!selected?.length) return true;
      const wanted = expandValues(k, selected);
      return valuesOf(p, k).some((v) => wanted.includes(v));
    }),
  );
}

/* ------------------------------------------------------ recommendation weight */

/** What each practice asks of a garment. Mirrors PRACTICE_NEEDS in scripts/crawl.mjs. */
const PRACTICE_WANTS: Record<Practice, string[]> = {
  Vinyasa: ["stretch", "breathable", "high stretch"],
  Ashtanga: ["high stretch", "secure fit", "durability"],
  "Hot Yoga": ["quick dry", "lightweight", "breathable"],
  "Yin Yoga": ["soft touch", "comfort"],
  Hatha: ["breathable", "comfort", "soft touch"],
  Pilates: ["stretch", "secure fit", "sculpted"],
};

const SEASON_WANTS: Record<string, string[]> = {
  summer: ["lightweight", "breathable", "quick dry"],
  winter: ["warm", "soft touch"],
  spring: ["breathable", "comfort"],
  fall: ["comfort", "soft touch"],
};

/**
 * Score, not filter. A flow answer lifts matching products to the top; it never
 * removes anything, so a narrow answer still leaves a full page to browse.
 */
export function score(p: Product, s: Selection): number {
  let n = 0;
  for (const practice of s.practice ?? []) {
    if (p.practice.includes(practice as Practice)) n += 4;
    const wants = PRACTICE_WANTS[practice as Practice] ?? [];
    n += wants.filter((w) => p.attributes.includes(w) || p.fit === w).length;
  }
  for (const fit of s.fit ?? []) {
    if (p.fit === fit) n += 4;
    else if (fit === "compression" && p.fit === "high support") n += 2;
    else if (fit === "sculpted" && p.fit === "compression") n += 2;
  }
  for (const season of s.season ?? []) {
    if (season === "all") { n += p.season.length >= 3 ? 3 : 1; continue; }
    if (p.season.includes(season)) n += 3;
    n += (SEASON_WANTS[season] ?? []).filter((w) => p.attributes.includes(w)).length;
  }
  return n;
}

/**
 * Filters exclude, then flow ranks. Products that score the same are spread
 * across brands rather than left in id order — otherwise one brand's whole
 * catalogue lands at the top and a curated page reads like a brand page.
 */
export function recommend(s: Selection, opts: { require?: FlowKey[] } = {}): Product[] {
  // Flow keys normally rank without excluding. An archive is the exception: it
  // is a list OF a practice, so that key has to actually narrow the catalogue,
  // or the page claims 2,914 pieces suit Vinyasa.
  let list = applyFilters(products, s);
  for (const k of opts.require ?? []) {
    const wanted = s[k];
    if (!wanted?.length) continue;
    list = list.filter((p) => {
      const v = p[k as keyof Product];
      return Array.isArray(v) ? v.some((x) => wanted.includes(x as string)) : wanted.includes(String(v));
    });
  }
  if (!hasFlow(s)) return list;

  const tiers = new Map<number, Product[]>();
  for (const p of list) {
    const n = score(p, s);
    (tiers.get(n) ?? tiers.set(n, []).get(n)!).push(p);
  }
  return [...tiers.entries()]
    .sort((a, b) => b[0] - a[0])
    .flatMap(([, tier]) => spreadByBrand(tier));
}

/** One product per brand per pass, in a stable order. */
function spreadByBrand(tier: Product[]): Product[] {
  const byBrand = new Map<string, Product[]>();
  for (const p of [...tier].sort((a, b) => a.id.localeCompare(b.id))) {
    (byBrand.get(p.brand) ?? byBrand.set(p.brand, []).get(p.brand)!).push(p);
  }
  const queues = [...byBrand.values()];
  const out: Product[] = [];
  for (let i = 0; out.length < tier.length; i++) {
    for (const q of queues) if (q[i]) out.push(q[i]);
  }
  return out;
}

/** The one or two reasons this product surfaced, for the card and the detail page. */
export function reasons(p: Product, s: Selection): string[] {
  const out: string[] = [];
  // Only ever shown for a product whose brand says so.
  if (p.maternityFriendly && s.maternity?.length) out.push("Maternity-friendly");
  for (const practice of s.practice ?? []) {
    if (p.practice.includes(practice as Practice)) out.push(`Best for ${practice}`);
  }
  if (s.fit?.includes(p.fit)) out.push(FIT_KO[p.fit]);
  for (const a of ["quick dry", "breathable", "high stretch", "warm", "lightweight"]) {
    if (out.length >= 2) break;
    if (p.attributes.includes(a)) out.push(ATTR_KO[a] ?? a);
  }
  return out.slice(0, 2);
}

/* ------------------------------------------------------------------- options */

export function optionsFor(list: Product[], k: Key): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of list) for (const v of valuesOf(p, k)) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([value, count]) => ({ value, count }));
}

export function selectionFromParams(params: Record<string, string | string[] | undefined>): Selection {
  const out: Selection = {};
  for (const k of [...FLOW_KEYS, ...FILTER_KEYS]) {
    const v = params[k];
    if (!v) continue;
    out[k] = Array.isArray(v) ? v : [v];
  }
  return out;
}

/**
 * Every selection link lands on the product section rather than the top of the
 * page. On a practice archive the practice is owned by the path, so it is left
 * out of the query and the link stays on that route.
 */
export function toQuery(s: Selection, opts: { flow?: boolean; base?: string } = {}): string {
  const onArchive = Boolean(opts.base);
  const sp = new URLSearchParams();
  for (const k of [...FLOW_KEYS, ...FILTER_KEYS]) {
    if (onArchive && k === "practice") continue;
    for (const v of s[k] ?? []) sp.append(k, v);
  }
  if (opts.flow) sp.set("flow", "1");
  const base = opts.base ?? "/";
  const q = sp.toString();
  return q ? `${base}?${q}#products` : `${base}#products`;
}

/** Href with one value toggled — every filter control is a plain link. */
export function toggleHref(
  s: Selection,
  k: Key,
  value: string,
  opts: { flow?: boolean; base?: string } = {},
): string {
  // On an archive, choosing a practice means going to that practice's archive.
  if (opts.base && k === "practice") return practiceHref(value);
  const current = s[k] ?? [];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return toQuery({ ...s, [k]: next }, opts);
}

/** Clearing filters must not clear what discovery learned. */
/** Clearing filters keeps the flow, and keeps you on the archive you are in. */
export const clearFiltersHref = (
  s: Selection,
  opts: { flow?: boolean; base?: string } = {},
  /** Keys to carry through. Only a flow the visitor answered survives a clear. */
  keep: readonly FlowKey[] = FLOW_KEYS,
) => toQuery(Object.fromEntries(keep.map((k) => [k, s[k] ?? []])), opts);

/* -------------------------------------------------------------------- labels */

const SYMBOL = { KRW: "₩", USD: "$", GBP: "£" } as const;
export const formatPrice = (p: Product) =>
  `${SYMBOL[p.currency]}${p.price.toLocaleString(p.currency === "KRW" ? "ko-KR" : "en-US")}`;

export const FIT_KO: Record<string, string> = {
  relaxed: "여유 있게",
  sculpted: "몸에 맞게",
  compression: "탄탄하게",
  "high support": "강한 지지",
};
export const FIT_HINT: Record<string, string> = {
  relaxed: "부드럽고 편안한 움직임",
  sculpted: "몸에 붙되 매끄러운 착용감",
  compression: "단단하게 잡아주는 핏",
  "high support": "격한 움직임을 위한 지지력",
};
/** Card copy: three words that carry the character of a practice. */
export const PRACTICE_TRAITS: Record<string, string> = {
  Hatha: "Balanced · Grounded · Steady",
  Vinyasa: "Fluid · Active · Flexible",
  Ashtanga: "Dynamic · Structured · Powerful",
  "Hot Yoga": "Heat · Sweat · Breathability",
  "Yin Yoga": "Slow · Soft · Restorative",
  Pilates: "Controlled · Sculpted · Supportive",
};

/** Practices have their own archive route, so they need a stable URL segment. */
export const PRACTICE_SLUGS: Record<string, string> = {
  hatha: "Hatha",
  vinyasa: "Vinyasa",
  ashtanga: "Ashtanga",
  "hot-yoga": "Hot Yoga",
  "yin-yoga": "Yin Yoga",
  pilates: "Pilates",
};

export const practiceFromSlug = (slug: string): string | null =>
  PRACTICE_SLUGS[slug.toLowerCase()] ?? null;

export const practiceSlug = (practice: string) =>
  practice.toLowerCase().replace(/\s+/g, "-");

export const practiceHref = (practice: string) => `/practice/${practiceSlug(practice)}`;

/** The one-line context shown above the grid when a practice is chosen. */
export const PRACTICE_LEAD: Record<string, string> = {
  Hatha: "Steady pieces for a grounded practice.",
  Vinyasa: "Fluid pieces made to move with you.",
  Ashtanga: "Built to hold through a powerful sequence.",
  "Hot Yoga": "Light, quick-drying pieces for heat and sweat.",
  "Yin Yoga": "Soft pieces to settle and stay a while.",
  Pilates: "Supportive pieces for controlled movement.",
};

export const PRACTICE_HINT: Record<string, string> = {
  Hatha: "느리게 · 기본에 충실하게",
  Vinyasa: "흐르듯 · 활동적으로",
  Ashtanga: "역동적 · 구조적 · 강하게",
  "Hot Yoga": "고온 · 땀 · 빠른 건조",
  "Yin Yoga": "천천히 · 회복 · 이완",
  Pilates: "코어 · 정교한 컨트롤",
};
export const SEASON_HINT: Record<string, string> = {
  spring: "가볍게 · 레이어드",
  summer: "얇게 · 통기성",
  fall: "적당히 · 데일리",
  winter: "따뜻하게 · 레이어드",
  all: "사계절 · 데일리",
};
export const ATTR_KO: Record<string, string> = {
  breathable: "통기성", "quick dry": "빠른 건조", stretch: "신축성",
  "high stretch": "높은 신축성", "secure fit": "안정적인 지지", "soft touch": "부드러운 촉감",
  comfort: "편안함", durability: "내구성", lightweight: "가벼움", warm: "보온",
};
export const LABEL: Record<Key, string> = {
  practice: "Practice", fit: "Fit", season: "Season",
  gender: "Gender", material: "Material", category: "Category",
  brand: "Brand", proportions: "Proportions", maternity: "Maternity",
};
export const VALUE_KO: Record<string, string> = {
  spring: "봄", summer: "여름", fall: "가을", winter: "겨울", all: "사계절",
  women: "여성", men: "남성", unisex: "공용",
  leggings: "레깅스", top: "상의", bra: "브라", shorts: "쇼츠", pants: "팬츠",
  outer: "아우터", set: "세트", dress: "원피스·스커트",
  cotton: "면", "organic cotton": "오가닉 코튼", polyester: "폴리에스터",
  "recycled polyester": "리사이클 폴리", nylon: "나일론", "recycled nylon": "리사이클 나일론",
  elastane: "스판덱스", modal: "모달", tencel: "텐셀", linen: "린넨", wool: "울",
  "merino wool": "메리노 울", rayon: "레이온", acrylic: "아크릴", bamboo: "대나무",
  cupro: "큐프라", acetate: "아세테이트", silk: "실크", "recycled cotton": "리사이클 코튼",
  Petite: "쁘띠", Tall: "톨", Curvy: "커비", Athletic: "애슬레틱",
  "1": "Maternity-friendly",
  ...FIT_KO,
};
export const ko = (v: string) => VALUE_KO[v] ?? v;

/** The filter controls speak English, so the chips that echo them do too. */
export const VALUE_EN: Record<string, string> = {
  women: "Female", men: "Male", unisex: "Unisex",
  spring: "Spring", summer: "Summer", fall: "Autumn", winter: "Winter",
  recycled: "Recycled", "organic cotton": "Organic Cotton", "recycled polyester": "Recycled Polyester",
  "recycled nylon": "Recycled Nylon",
  relaxed: "Relaxed", sculpted: "Sculpted", compression: "Compression", "high support": "High Support",
  "1": "Maternity-friendly",
};
export const en = (v: string) =>
  VALUE_EN[v] ?? v.replace(/\b[a-z]/g, (c) => c.toUpperCase());

/** Material characteristics, shown in the material dropdown. */
export const MATERIAL_HINT: Record<string, string> = {
  modal: "부드럽고 통기성 좋은",
  "recycled nylon": "신축성과 퍼포먼스",
  bamboo: "부드럽고 체온 조절",
  cotton: "편안한 데일리",
  "organic cotton": "부드럽고 자극 적은",
  linen: "가볍고 시원한",
  polyester: "빠른 건조",
  "recycled polyester": "빠른 건조 · 리사이클",
  nylon: "매끄럽고 튼튼한",
  tencel: "시원하고 부드러운",
  elastane: "신축성",
  wool: "보온",
};
