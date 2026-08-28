import raw from "../data/products.json" with { type: "json" };

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
};

export const products = raw as Product[];

export const FACETS = ["material", "season", "gender", "category", "brand"] as const;
export type Facet = (typeof FACETS)[number];

/** Selected values per facet. Empty/missing array = no constraint on that facet. */
export type Filters = Partial<Record<Facet, string[]>>;

const valuesOf = (p: Product, f: Facet): string[] => {
  const v = p[f];
  return Array.isArray(v) ? v : [v];
};

/** AND across facets, OR within a facet. */
export function filterProducts(list: Product[], filters: Filters): Product[] {
  return list.filter((p) =>
    FACETS.every((f) => {
      const selected = filters[f];
      if (!selected?.length) return true;
      return valuesOf(p, f).some((v) => selected.includes(v));
    }),
  );
}

/** Distinct values of a facet with counts, for rendering the filter UI. */
export function facetOptions(list: Product[], f: Facet): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of list) for (const v of valuesOf(p, f)) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([value, count]) => ({ value, count }));
}

/** URLSearchParams -> Filters. Repeated params (?material=linen&material=wool) are the selection. */
export function filtersFromParams(params: Record<string, string | string[] | undefined>): Filters {
  const out: Filters = {};
  for (const f of FACETS) {
    const v = params[f];
    if (!v) continue;
    out[f] = Array.isArray(v) ? v : [v];
  }
  return out;
}

/** Href with one facet value toggled — filter links are plain <a>, no client state. */
export function toggleHref(filters: Filters, f: Facet, value: string): string {
  const sp = new URLSearchParams();
  for (const key of FACETS) {
    const selected = key === f ? toggle(filters[f] ?? [], value) : (filters[key] ?? []);
    for (const v of selected) sp.append(key, v);
  }
  const q = sp.toString();
  return q ? `/?${q}` : "/";
}

const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

const SYMBOL = { KRW: "₩", USD: "$", GBP: "£" } as const;

/** Prices come from several markets; never render them as one number. */
export const formatPrice = (p: Product) =>
  `${SYMBOL[p.currency]}${p.price.toLocaleString(p.currency === "KRW" ? "ko-KR" : "en-US")}`;

export const LABEL: Record<Facet, string> = {
  material: "소재",
  season: "계절",
  gender: "성별",
  category: "종류",
  brand: "브랜드",
};

/** Facet values are stored in English so the data stays one language; the UI is Korean. */
export const VALUE_KO: Record<string, string> = {
  spring: "봄", summer: "여름", fall: "가을", winter: "겨울",
  women: "여성", men: "남성", unisex: "공용",
  leggings: "레깅스", top: "상의", bra: "브라", shorts: "쇼츠", pants: "팬츠",
  outer: "아우터", set: "세트", dress: "원피스·스커트",
  cotton: "면", "organic cotton": "오가닉 코튼", polyester: "폴리에스터",
  "recycled polyester": "리사이클 폴리", nylon: "나일론", "recycled nylon": "리사이클 나일론",
  elastane: "스판덱스", modal: "모달", tencel: "텐셀", linen: "린넨", wool: "울",
  "merino wool": "메리노 울", rayon: "레이온", acrylic: "아크릴", bamboo: "대나무",
  cupro: "큐프라", acetate: "아세테이트", silk: "실크", "recycled cotton": "리사이클 코튼",
};
export const ko = (v: string) => VALUE_KO[v] ?? v;
