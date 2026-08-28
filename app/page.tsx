import Link from "next/link";
import {
  FACETS,
  facetOptions,
  filterProducts,
  filtersFromParams,
  products,
  toggleHref,
  type Facet,
} from "@/lib/products";

const LABEL: Record<Facet, string> = {
  material: "소재",
  season: "계절",
  category: "종류",
  brand: "브랜드",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromParams(await searchParams);
  const results = filterProducts(products, filters);
  const active = FACETS.some((f) => filters[f]?.length);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">요가웨어 탐색</h1>
        <p className="mt-2 text-sm opacity-60">
          소재와 계절로 브랜드를 가로질러 찾아보세요.
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-[220px_1fr]">
        <aside className="space-y-7">
          {FACETS.map((f) => (
            <section key={f}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider opacity-50">
                {LABEL[f]}
              </h2>
              <ul className="flex flex-wrap gap-1.5 md:flex-col md:gap-1">
                {facetOptions(products, f).map(({ value, count }) => {
                  const on = filters[f]?.includes(value);
                  return (
                    <li key={value}>
                      <Link
                        href={toggleHref(filters, f, value)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition ${
                          on
                            ? "bg-foreground text-background"
                            : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
                        }`}
                      >
                        {value}
                        <span className="text-xs opacity-50">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </aside>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-sm opacity-60">{results.length}개</p>
            {active && (
              <Link href="/" className="text-sm underline opacity-60 hover:opacity-100">
                필터 초기화
              </Link>
            )}
          </div>

          {results.length === 0 ? (
            <p className="py-20 text-center text-sm opacity-50">
              조건에 맞는 제품이 없어요.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-3">
              {results.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.id}`} className="group block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="aspect-3/4 w-full rounded-lg object-cover transition group-hover:opacity-85"
                    />
                    <p className="mt-3 text-xs uppercase tracking-wider opacity-50">
                      {p.brand}
                    </p>
                    <p className="mt-0.5 text-sm font-medium leading-snug">{p.name}</p>
                    <p className="mt-1 text-sm opacity-60">${p.price}</p>
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
