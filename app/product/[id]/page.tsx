import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, ko, products, type Product } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

const ROWS: [string, (p: Product) => string][] = [
  ["브랜드", (p) => p.brand],
  ["종류", (p) => ko(p.category)],
  ["성별", (p) => ko(p.gender)],
  ["소재", (p) => (p.material.length ? p.material.map(ko).join(", ") : "미표기")],
  ["계절", (p) => `${p.season.map(ko).join(", ")} (추정)`],
  ["컬러", (p) => (p.colors[0] === "-" ? "미표기" : p.colors.slice(0, 12).join(", "))],
];

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  const related = products
    .filter((p) => p.id !== product.id && p.brand === product.brand)
    .slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 md:px-10">
      <Link href="/" className="eyebrow text-rose hover:text-cream">
        ← Amadi
      </Link>

      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <div className="overflow-hidden rounded-sm bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="aspect-3/4 w-full object-cover" />
        </div>

        <div>
          <p className="eyebrow text-rose">{product.brand}</p>
          <h1 className="display mt-3 text-4xl leading-tight">{product.name}</h1>
          <p className="mt-4 text-lg text-cream-dim">{formatPrice(product)}</p>

          <dl className="mt-10 space-y-3.5 border-t border-rose/20 pt-8 text-sm">
            {ROWS.map(([label, get]) => (
              <div key={label} className="flex gap-5">
                <dt className="w-14 shrink-0 text-cream-dim/60">{label}</dt>
                <dd className="text-cream-dim">{get(product)}</dd>
              </div>
            ))}
          </dl>

          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-block rounded-full bg-cream px-6 py-3 text-sm text-ground-deep transition hover:bg-rose-soft"
          >
            {product.source === "29cm" ? "29CM에서 보기" : "브랜드 사이트에서 보기"}
          </a>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-rose/20 pt-10">
          <h2 className="eyebrow mb-6 text-rose">More from {product.brand}</h2>
          <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <Link href={`/product/${p.id}`} className="group block">
                  <div className="overflow-hidden rounded-sm bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="aspect-3/4 w-full object-cover opacity-90 transition group-hover:opacity-100"
                    />
                  </div>
                  <p className="mt-2.5 text-sm leading-snug text-cream">{p.name}</p>
                  <p className="mt-1 text-sm text-cream-dim">{formatPrice(p)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
