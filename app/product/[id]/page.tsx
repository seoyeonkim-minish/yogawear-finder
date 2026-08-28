import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

const ROWS = [
  ["브랜드", (p: (typeof products)[number]) => p.brand],
  ["종류", (p: (typeof products)[number]) => p.category],
  ["소재", (p: (typeof products)[number]) => p.material.join(", ")],
  ["계절", (p: (typeof products)[number]) => p.season.join(", ")],
  ["컬러", (p: (typeof products)[number]) => p.colors.join(", ")],
] as const;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm underline opacity-60 hover:opacity-100">
        ← 목록으로
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="aspect-3/4 w-full rounded-xl object-cover"
        />

        <div>
          <p className="text-xs uppercase tracking-wider opacity-50">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-2 text-lg">${product.price}</p>

          <dl className="mt-8 space-y-3 text-sm">
            {ROWS.map(([label, get]) => (
              <div key={label} className="flex gap-4">
                <dt className="w-16 shrink-0 opacity-50">{label}</dt>
                <dd>{get(product)}</dd>
              </div>
            ))}
          </dl>

          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm text-background"
          >
            브랜드 사이트에서 보기
          </a>
        </div>
      </div>
    </main>
  );
}
