import Link from "next/link";
import {
  FILTER_KEYS, FLOW_KEYS, FIT_KO, clearFiltersHref, hasFilters, hasFlow, ko,
  products, recommend, selectionFromParams, toggleHref, type Selection,
} from "@/lib/products";
import { FilterBar } from "@/components/filter-bar";
import { Landing } from "@/components/landing";
import { ProductCard } from "@/components/product-card";
import { RefineTrigger } from "@/components/discovery";

const PAGE_SIZE = 48;

/** Hero imagery comes from the catalogue itself — real yoga-wear model shots. */
const HERO_IDS = [
  "alo-yoga-16-high-waist-airlift-capri",
  "29cm-부디무드라-fortune-pants-16-colors-2138961",
  "29cm-무브웜-bar-tank-top-4026991",
  "29cm-데비웨어-나디안-하렘팬츠-devi-b0077-네이비-2669357",
];
const heroImages = HERO_IDS.map(
  (id, i) => products.find((p) => p.id === id)?.image ?? products[i * 40]?.image,
).filter(Boolean) as string[];

const flowLabel = (k: string, v: string) => (k === "fit" ? FIT_KO[v] : k === "season" ? ko(v) : v);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const selection = selectionFromParams(await searchParams);
  if (!hasFlow(selection)) return <Landing selection={selection} images={heroImages} />;

  const results = recommend(selection);
  const shown = results.slice(0, PAGE_SIZE);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10">
      <Link href="/" className="display text-3xl">
        Amadi
      </Link>

      {/* The recommendation moment: what we heard, before what we found. */}
      <section className="border-b border-sand py-16 md:py-20">
        <p className="eyebrow text-gray" data-reveal data-immediate>
          Your flow, curated.
        </p>
        <h1 className="display mt-5 text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]" data-split data-immediate data-delay="0.15">
          {FLOW_KEYS.flatMap((k) => (selection[k] ?? []).map((v) => flowLabel(k, v))).join(" · ")}
        </h1>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3" data-reveal data-immediate data-delay="0.5">
          <p className="max-w-md text-sm leading-relaxed text-gray">
            움직임과 착용감, 계절을 기준으로 고른 제품입니다.
          </p>
          <RefineTrigger
            selection={selection}
            label="Refine my flow"
            className="eyebrow text-charcoal underline underline-offset-4 hover:text-gray"
          />
        </div>
      </section>

      <div className="sticky top-0 z-30 -mx-6 bg-ivory/95 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
        <FilterBar selection={selection} />
      </div>

      {hasFilters(selection) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="eyebrow text-gray">Filters</span>
          {FILTER_KEYS.flatMap((k) =>
            (selection[k] ?? []).map((v) => (
              <Link
                key={`${k}-${v}`}
                href={toggleHref(selection, k, v)}
                className="rounded-full border border-sand px-3 py-1 text-xs text-gray transition hover:border-charcoal hover:text-charcoal"
              >
                {ko(v)} ×
              </Link>
            )),
          )}
          <Link
            href={clearFiltersHref(selection)}
            className="ml-1 text-xs text-gray underline underline-offset-4 hover:text-charcoal"
          >
            Clear filters
          </Link>
        </div>
      )}

      <p className="mb-8 text-sm text-gray">{results.length.toLocaleString("ko-KR")}개</p>

      {results.length === 0 ? <Empty selection={selection} /> : (
        <>
          <ul data-stagger className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} selection={selection} />
            ))}
          </ul>
          {results.length > shown.length && (
            <p className="mt-16 text-center text-sm text-gray">
              적합도 순 상위 {PAGE_SIZE}개입니다. 조건을 더하면 좁혀집니다.
            </p>
          )}
        </>
      )}
    </main>
  );
}

/** Offer the flow edit before the blunt reset — the flow is the thing they built. */
function Empty({ selection }: { selection: Selection }) {
  return (
    <div className="py-28 text-center">
      <p className="display text-4xl">No perfect match yet.</p>
      <p className="mt-5 text-sm text-gray">플로우는 그대로 두고 조건 하나만 풀어보세요.</p>
      <div className="mt-10 flex items-center justify-center gap-8">
        <RefineTrigger
          selection={selection}
          label="Refine my flow"
          className="rounded-full bg-charcoal px-7 py-3.5 text-sm text-ivory hover:bg-ink"
        />
        <Link
          href={clearFiltersHref(selection)}
          className="text-sm text-gray underline underline-offset-4 hover:text-charcoal"
        >
          Clear filters
        </Link>
      </div>
    </div>
  );
}
