import Link from "next/link";
import {
  FACETS,
  LABEL,
  facetOptions,
  filterProducts,
  filtersFromParams,
  formatPrice,
  ko,
  products,
  toggleHref,
} from "@/lib/products";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromParams(await searchParams);
  const results = filterProducts(products, filters);
  const active = FACETS.filter((f) => filters[f]?.length);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10">
      <header className="mb-14 border-b border-rose/20 pb-10">
        <p className="eyebrow text-rose">Yogawear Index</p>
        <h1 className="display mt-3 text-6xl leading-none md:text-7xl">Amadi</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-cream-dim">
          요가 브랜드를 가로질러, 소재와 계절로 찾습니다.
          <br />
          {products.length.toLocaleString("ko-KR")}개 · {new Set(products.map((p) => p.brand)).size}개
          브랜드.
        </p>
      </header>

      <div className="grid gap-12 md:grid-cols-[210px_1fr] md:gap-14">
        <aside className="space-y-8">
          {FACETS.map((f) => {
            const options = facetOptions(products, f);
            return (
              <section key={f}>
                <h2 className="eyebrow mb-3 text-rose">{LABEL[f]}</h2>
                <ul className="flex flex-wrap gap-1.5 md:flex-col md:gap-0.5">
                  {options.slice(0, f === "brand" ? 24 : 40).map(({ value, count }) => {
                    const on = filters[f]?.includes(value);
                    return (
                      <li key={value}>
                        <Link
                          href={toggleHref(filters, f, value)}
                          className={`inline-flex items-baseline gap-2 rounded-full px-3 py-1 text-sm transition ${
                            on
                              ? "bg-cream text-ground-deep"
                              : "text-cream-dim hover:bg-surface-2 hover:text-cream"
                          }`}
                        >
                          {ko(value)}
                          <span className="text-[0.6875rem] opacity-50">{count}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          <p className="border-t border-rose/15 pt-5 text-[0.6875rem] leading-relaxed text-cream-dim/60">
            계절은 소재와 품목에서 추정한 값입니다. 소재는 브랜드가 공개한 혼용률이 있을 때만
            표시됩니다.
          </p>
        </aside>

        <section>
          <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
            <p className="text-sm text-cream-dim">
              {results.length.toLocaleString("ko-KR")}개
            </p>
            {active.length > 0 && (
              <Link href="/" className="eyebrow text-rose hover:text-cream">
                Reset
              </Link>
            )}
          </div>

          {results.length === 0 ? (
            <p className="display py-24 text-center text-2xl text-cream-dim">
              조건에 맞는 제품이 없습니다.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.id}`} className="group block">
                    <div className="overflow-hidden rounded-sm bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="aspect-3/4 w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                      />
                    </div>
                    <p className="eyebrow mt-3 text-rose">{p.brand}</p>
                    <p className="mt-1 text-sm leading-snug text-cream">{p.name}</p>
                    <p className="mt-1.5 text-sm text-cream-dim">{formatPrice(p)}</p>
                    {p.material.length > 0 && (
                      <p className="mt-1 text-[0.6875rem] text-cream-dim/60">
                        {p.material.map(ko).join(" · ")}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
