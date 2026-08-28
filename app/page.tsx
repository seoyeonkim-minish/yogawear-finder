import Link from "next/link";
import {
  FILTER_KEYS, FLOW_KEYS, FIT_KO, clearFiltersHref, hasFilters, hasFlow, ko,
  recommend, selectionFromParams, toggleHref,
} from "@/lib/products";
import { DiscoveryTrigger } from "@/components/discovery";
import { FilterBar } from "@/components/filter-bar";
import { ProductCard } from "@/components/product-card";

const PAGE_SIZE = 48;

const flowLabel = (k: string, v: string) => (k === "fit" ? FIT_KO[v] : k === "season" ? ko(v) : v);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selection = selectionFromParams(params);
  const started = hasFlow(selection);

  // First entry shows the guided discovery, not a wall of filters.
  if (!started) return <Landing selection={selection} />;

  const results = recommend(selection);
  const shown = results.slice(0, PAGE_SIZE);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <Link href="/" className="display text-3xl">
          Amadi
        </Link>
      </header>

      <section className="mt-10 border-b border-rose/20 pb-8">
        <p className="eyebrow text-rose">Your flow</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <p className="display text-3xl leading-tight md:text-4xl">
            {FLOW_KEYS.flatMap((k) => (selection[k] ?? []).map((v) => flowLabel(k, v))).join(" · ")}
          </p>
          <DiscoveryTrigger
            selection={selection}
            label="Refine my flow"
            className="eyebrow text-rose underline underline-offset-4 hover:text-cream"
          />
        </div>
        <p className="mt-3 max-w-lg text-sm text-cream-dim">
          움직임과 착용감, 계절을 기준으로 고른 제품입니다.
        </p>
      </section>

      <div className="sticky top-0 z-30 -mx-6 bg-ground/95 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
        <FilterBar selection={selection} />
      </div>

      {hasFilters(selection) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="eyebrow text-rose">Filters</span>
          {FILTER_KEYS.flatMap((k) =>
            (selection[k] ?? []).map((v) => (
              <Link
                key={`${k}-${v}`}
                href={toggleHref(selection, k, v)}
                className="rounded-full border border-rose/30 px-3 py-1 text-xs text-cream-dim hover:border-cream hover:text-cream"
              >
                {ko(v)} ×
              </Link>
            )),
          )}
          <Link
            href={clearFiltersHref(selection)}
            className="ml-1 text-xs text-cream-dim/60 underline underline-offset-4 hover:text-cream"
          >
            Clear filters
          </Link>
        </div>
      )}

      <p className="mb-6 text-sm text-cream-dim">{results.length.toLocaleString("ko-KR")}개</p>

      {results.length === 0 ? (
        <div className="py-24 text-center">
          <p className="display text-3xl">No perfect match yet.</p>
          <p className="mt-4 text-sm text-cream-dim">
            플로우는 그대로 두고 조건 하나만 풀어보세요.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <DiscoveryTrigger
              selection={selection}
              label="Refine my flow"
              className="rounded-full bg-cream px-6 py-3 text-sm text-ground-deep hover:bg-rose-soft"
            />
            <Link href={clearFiltersHref(selection)} className="text-sm text-cream-dim underline underline-offset-4 hover:text-cream">
              Clear filters
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} selection={selection} />
            ))}
          </ul>
          {results.length > shown.length && (
            <p className="mt-12 text-center text-sm text-cream-dim/60">
              적합도 순 상위 {PAGE_SIZE}개를 보여주고 있습니다. 조건을 더하면 좁혀집니다.
            </p>
          )}
        </>
      )}
    </main>
  );
}

function Landing({ selection }: { selection: ReturnType<typeof selectionFromParams> }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-20 md:px-10">
      <p className="eyebrow text-rose">Yogawear Index</p>
      <h1 className="display mt-4 text-7xl leading-none md:text-8xl">Amadi</h1>
      <p className="mt-8 max-w-md text-base leading-relaxed text-cream-dim">
        어떻게 움직이고, 어떤 착용감을 좋아하고, 언제 수련하는지.
        <br />
        세 가지만 알려주시면 나머지는 저희가 고릅니다.
      </p>

      <DiscoveryStarter selection={selection} />

      <p className="mt-16 text-xs text-cream-dim/50">
        97개 브랜드 · 2,900개+ 제품 · 국내외 요가웨어
      </p>
    </main>
  );
}

/** The landing CTA opens the same flow the refine button does. */
function DiscoveryStarter({ selection }: { selection: ReturnType<typeof selectionFromParams> }) {
  return (
    <div className="mt-10">
      <DiscoveryTrigger
        selection={selection}
        label="Find my yoga wear"
        className="rounded-full bg-cream px-8 py-4 text-sm text-ground-deep transition hover:bg-rose-soft"
      />
    </div>
  );
}
