import Link from "next/link";
import {
  FILTER_KEYS, FLOW_KEYS, FIT_KO, clearFiltersHref, en, hasFlow, ko,
  recommend, toggleHref, type FlowKey, type Selection,
} from "@/lib/products";
import { FilterBar } from "./filter-bar";
import { ProductCard } from "./product-card";
import { RefineTrigger } from "./discovery";

const PAGE_SIZE = 24;

const flowLabel = (k: string, v: string) => (k === "fit" ? FIT_KO[v] : k === "season" ? ko(v) : v);

/**
 * The product grid and its controls, shared by the homepage and every practice
 * archive. `base` is the route the links should stay on: undefined on the home
 * page, the archive path on an archive — where the practice belongs to the URL
 * path rather than to the query.
 */
export function ProductSection({
  selection,
  personalized = false,
  base,
  header,
  require,
}: {
  selection: Selection;
  personalized?: boolean;
  base?: string;
  header?: React.ReactNode;
  /** Flow keys an archive turns into a hard filter rather than a ranking hint. */
  require?: FlowKey[];
}) {
  // A flow the visitor answered in discovery ranks; a value they ticked in the
  // filter bar narrows. Same keys, different promise — so only the personalised
  // page leaves practice / season / fit as ranking hints.
  const narrowing = require ?? (personalized ? [] : [...FLOW_KEYS]);
  const results = recommend(selection, { require: narrowing });
  // Whatever narrows is what the visitor can see and take off again.
  const chipKeys = [...FILTER_KEYS, ...narrowing];
  const shown = results.slice(0, PAGE_SIZE);
  const links = { flow: personalized, base };
  const clearHref = clearFiltersHref(selection, links, personalized ? undefined : []);

  return (
    <section id="products" className="mx-auto w-full max-w-7xl scroll-mt-4 px-6 pb-32 md:px-10">
      {header ??
        (personalized && hasFlow(selection) ? (
          <header className="border-t border-sand pt-16 md:pt-20">
            <p className="eyebrow text-gray">Your flow, curated.</p>
            <h2 className="display mt-5 text-[clamp(2rem,5.5vw,4rem)] leading-[1.05]">
              {FLOW_KEYS.flatMap((k) => (selection[k] ?? []).map((v) => flowLabel(k, v))).join(" · ")}
            </h2>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
              <p className="max-w-md text-sm leading-relaxed text-gray">
                움직임과 착용감, 계절을 기준으로 고른 제품입니다.
              </p>
              <RefineTrigger
                selection={selection}
                label="Refine my flow"
                className="eyebrow text-charcoal underline underline-offset-4 hover:text-gray"
              />
            </div>
          </header>
        ) : (
          <header className="border-t border-sand pt-16 md:pt-20">
            <p className="eyebrow text-gray">The edit</p>
            <h2 className="display mt-5 text-[clamp(2rem,5.5vw,4rem)] leading-[1.05]">
              Pieces for your practice.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-gray">
              97개 브랜드에서 모은 요가웨어. 위의 수련을 고르거나, 아래에서 조건을 좁혀보세요.
            </p>
          </header>
        ))}

      <div className="sticky top-0 z-30 mt-12 bg-white/95 py-4 backdrop-blur">
        <FilterBar selection={selection} links={links} />
      </div>

      {chipKeys.some((k) => selection[k]?.length) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="eyebrow text-gray">Filters</span>
          {chipKeys.flatMap((k) =>
            (selection[k] ?? []).map((v) => (
              <Link
                key={`${k}-${v}`}
                href={toggleHref(selection, k, v, links)}
                className="rounded-full border border-sand px-3 py-1 text-xs text-gray transition hover:border-charcoal hover:text-charcoal"
              >
                {en(v)} ×
              </Link>
            )),
          )}
          <Link
            href={clearHref}
            className="ml-1 text-xs text-gray underline underline-offset-4 hover:text-charcoal"
          >
            Clear filters
          </Link>
        </div>
      )}

      <p className="mb-8 text-sm text-gray">{results.length.toLocaleString("ko-KR")}개</p>

      {results.length === 0 ? (
        <div className="py-28 text-center">
          <p className="display text-4xl">No perfect match yet.</p>
          <p className="mt-5 text-sm text-gray">조건 하나만 풀어보세요.</p>
          <div className="mt-10 flex items-center justify-center gap-8">
            {personalized && (
              <RefineTrigger
                selection={selection}
                label="Refine my flow"
                className="rounded-full bg-charcoal px-7 py-3.5 text-sm text-ivory hover:bg-ink"
              />
            )}
            <Link
              href={clearHref}
              className="text-sm text-gray underline underline-offset-4 hover:text-charcoal"
            >
              Clear filters
            </Link>
          </div>
        </div>
      ) : (
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
    </section>
  );
}
