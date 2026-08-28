import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ATTR_KO, FIT_HINT, FIT_KO, formatPrice, ko, products, reasons,
  selectionFromParams, type Product,
} from "@/lib/products";
import { WishlistButton } from "@/components/wishlist-button";

const ROWS: [string, (p: Product) => string][] = [
  ["브랜드", (p) => p.brand],
  ["종류", (p) => ko(p.category)],
  ["성별", (p) => ko(p.gender)],
  ["소재", (p) => (p.material.length ? p.material.map(ko).join(", ") : "미표기")],
  ["착용감", (p) => `${FIT_KO[p.fit]} — ${FIT_HINT[p.fit]}`],
  ["수련", (p) => (p.practice.length ? p.practice.join(", ") : "—")],
  ["계절", (p) => `${p.season.map(ko).join(", ")} (추정)`],
  ["컬러", (p) => (p.colors[0] === "-" ? "미표기" : p.colors.slice(0, 12).join(", "))],
];

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  const selection = selectionFromParams(await searchParams);
  const why = reasons(product, selection);
  const related = products.filter((p) => p.id !== product.id && p.brand === product.brand).slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 md:px-10">
      <Link href="/#products" className="eyebrow text-gray hover:text-charcoal">
        ← Amadi
      </Link>

      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <div className="overflow-hidden rounded-sm bg-beige">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="aspect-3/4 w-full object-cover" />
        </div>

        <div>
          <p className="eyebrow text-gray">{product.brand}</p>
          <h1 className="display mt-3 text-4xl leading-tight">{product.name}</h1>
          <p className="mt-4 text-lg text-gray">{formatPrice(product)}</p>

          {why.length > 0 && (
            <div className="mt-8 rounded-sm border border-sand bg-ivory-dim/50 p-5">
              <p className="eyebrow text-gray">Why it fits your flow</p>
              <p className="mt-2 text-sm leading-relaxed text-gray">
                {why.join(" · ")} — {FIT_HINT[product.fit]}
                {product.attributes.length > 0 &&
                  `, ${product.attributes.slice(0, 3).map((a) => ATTR_KO[a] ?? a).join(" · ")}`}
              </p>
            </div>
          )}

          <dl className="mt-8 space-y-3.5 border-t border-sand pt-8 text-sm">
            {ROWS.map(([label, get]) => (
              <div key={label} className="flex gap-5">
                <dt className="w-14 shrink-0 text-gray">{label}</dt>
                <dd className="text-gray">{get(product)}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex items-center gap-6">
            <a
              href={product.url}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-full bg-charcoal px-6 py-3 text-sm text-ivory transition hover:bg-ink"
            >
              {product.source === "29cm" ? "29CM에서 보기" : "브랜드 사이트에서 보기"}
            </a>
            <span className="text-xl">
              <WishlistButton id={product.id} label="저장" />
            </span>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-sand pt-10">
          <h2 className="eyebrow mb-6 text-gray">More from {product.brand}</h2>
          <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <Link href={`/product/${p.id}`} className="group block">
                  <div className="overflow-hidden rounded-sm bg-beige">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="aspect-3/4 w-full object-cover opacity-90 transition group-hover:opacity-100"
                    />
                  </div>
                  <p className="mt-2.5 text-sm leading-snug text-charcoal">{p.name}</p>
                  <p className="mt-1 text-sm text-gray">{formatPrice(p)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
