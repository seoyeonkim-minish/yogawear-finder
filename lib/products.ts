import raw from "../data/products.json" with { type: "json" };

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  material: string[];
  season: string[];
  price: number;
  colors: string[];
  image: string;
  url: string;
};

export const products = raw as Product[];

export const FACETS = ["material", "season", "category", "brand"] as const;
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

/** Sorted distinct values of a facet, with counts, for rendering the filter UI. */
export function facetOptions(list: Product[], f: Facet): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of list) for (const v of valuesOf(p, f)) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));
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

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
