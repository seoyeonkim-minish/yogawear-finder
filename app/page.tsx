import Link from "next/link";
import {
  FILTER_KEYS, FLOW_KEYS, FIT_KO, PRACTICE_LEAD, clearFiltersHref, hasFilters, hasFlow,
  isPersonalized, ko, products, recommend, selectionFromParams, toggleHref,
  type Selection,
} from "@/lib/products";
import { FilterBar } from "@/components/filter-bar";
import { HeroSection } from "@/components/hero-section";
import { Intro } from "@/components/intro";
import { PracticeGrid } from "@/components/practice-grid";
import { ProductCard } from "@/components/product-card";
import { RefineTrigger } from "@/components/discovery";

const PAGE_SIZE = 24;

/** Imagery comes from the catalogue itself — real yoga-wear model shots. */
const image = (id: string, fallback: number) =>
  products.find((p) => p.id === id)?.image ?? products[fallback].image;

const HERO_IMAGES = [
  image("alo-yoga-16-high-waist-airlift-capri", 0),
  image("29cm-부디무드라-fortune-pants-16-colors-2138961", 40),
  image("29cm-무브웜-bar-tank-top-4026991", 80),
  image("29cm-데비웨어-나디안-하렘팬츠-devi-b0077-네이비-2669357", 120),
];

const PRACTICE_IMAGES: Record<string, string> = {
  Hatha: image("29cm-부디무드라-fortune-pants-16-colors-2138961", 40),
  Vinyasa: image("alo-yoga-7-8-high-waist-airbrush-legging", 160),
  Ashtanga: image("alo-yoga-16-high-waist-airlift-capri", 0),
  "Hot Yoga": image("29cm-데비웨어-나디안-하렘팬츠-devi-b0077-네이비-2669357", 120),
  "Yin Yoga": image("29cm-무브웜-bar-tank-top-4026991", 80),
  Pilates: image("29cm-데비웨어-군살제로-바이커-5부-devi-b0013-블랙-347673", 200),
};

const flowLabel = (k: string, v: string) => (k === "fit" ? FIT_KO[v] : k === "season" ? ko(v) : v);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selection = selectionFromParams(params);
  const personalized = isPersonalized(params);

  return (
    <main>
      <HeroSection selection={selection} images={HERO_IMAGES} />
      <Intro />
      <PracticeGrid images={PRACTICE_IMAGES} />
      <Products selection={selection} personalized={personalized} />
      <Closing image={HERO_IMAGES[3]} />
    </main>
  );
}

function Products({ selection, personalized }: { selection: Selection; personalized: boolean }) {
  const results = recommend(selection);
  const shown = results.slice(0, PAGE_SIZE);
  const practice = selection.practice?.length === 1 ? selection.practice[0] : null;

  return (
    <section id="products" className="mx-auto w-full max-w-7xl scroll-mt-4 px-6 pb-32 md:px-10">
      <header className="border-t border-sand pt-16 md:pt-20">
        {personalized && hasFlow(selection) ? (
          <>
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
          </>
        ) : (
          <>
            <p className="eyebrow text-gray">{practice ?? "The edit"}</p>
            <h2 className="display mt-5 text-[clamp(2rem,5.5vw,4rem)] leading-[1.05]">
              {practice ? "Made to flow." : "Pieces for your practice."}
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-gray">
              {practice
                ? PRACTICE_LEAD[practice]
                : "97개 브랜드에서 모은 요가웨어. 위의 수련을 고르거나, 아래에서 조건을 좁혀보세요."}
            </p>
          </>
        )}
      </header>

      <div className="sticky top-0 z-30 mt-12 bg-ivory/95 py-4 backdrop-blur">
        <FilterBar selection={selection} flow={personalized} />
      </div>

      {hasFilters(selection) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="eyebrow text-gray">Filters</span>
          {FILTER_KEYS.flatMap((k) =>
            (selection[k] ?? []).map((v) => (
              <Link
                key={`${k}-${v}`}
                href={toggleHref(selection, k, v, personalized)}
                className="rounded-full border border-sand px-3 py-1 text-xs text-gray transition hover:border-charcoal hover:text-charcoal"
              >
                {ko(v)} ×
              </Link>
            )),
          )}
          <Link
            href={clearFiltersHref(selection, personalized)}
            className="ml-1 text-xs text-gray underline underline-offset-4 hover:text-charcoal"
          >
            Clear filters
          </Link>
        </div>
      )}

      <p className="mb-8 text-sm text-gray">
        {practice && !personalized ? `${practice} · ` : ""}
        {results.length.toLocaleString("ko-KR")}개
      </p>

      {results.length === 0 ? (
        <Empty selection={selection} personalized={personalized} />
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

/** Offer the flow edit before the blunt reset — the flow is the thing they built. */
function Empty({ selection, personalized }: { selection: Selection; personalized: boolean }) {
  return (
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
          href={clearFiltersHref(selection, personalized)}
          className="text-sm text-gray underline underline-offset-4 hover:text-charcoal"
        >
          Clear filters
        </Link>
      </div>
    </div>
  );
}

function Closing({ image }: { image: string }) {
  return (
    <section className="relative isolate mt-8 flex min-h-[70svh] items-end overflow-hidden">
      <div data-parallax="-0.1" className="absolute inset-0 -z-10 scale-110">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-6 pb-20 md:px-10">
        <h2 className="display max-w-xl text-[clamp(2rem,5vw,3.5rem)] leading-tight text-ivory" data-split>
          Yoga wear that moves with who you are.
        </h2>
        <p className="mt-5 max-w-sm text-sm text-ivory/70" data-reveal>
          2,914개 제품 · 97개 브랜드 · 국내외 요가웨어를 한자리에서.
        </p>
      </div>
    </section>
  );
}
