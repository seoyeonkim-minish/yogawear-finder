import Link from "next/link";
import { FIT_KO, formatPrice, ko, reasons, type Product, type Selection } from "@/lib/products";
import { WishlistButton } from "./wishlist";

export function ProductCard({ product: p, selection }: { product: Product; selection: Selection }) {
  const why = reasons(p, selection);
  return (
    <li className="group relative">
      <Link href={`/product/${p.id}`} className="block">
        <div className="relative overflow-hidden rounded-sm bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="aspect-3/4 w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          />
          {why.length > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-ground-deep/80 px-2.5 py-1 text-[0.625rem] text-cream backdrop-blur-sm">
              {why[0]}
            </span>
          )}
        </div>
        <p className="eyebrow mt-3 text-rose">{p.brand}</p>
        <p className="mt-1 text-sm leading-snug text-cream">{p.name}</p>
        <p className="mt-1.5 text-sm text-cream-dim">{formatPrice(p)}</p>
        <p className="mt-1 text-[0.6875rem] text-cream-dim/60">
          {[p.material.length ? p.material.map(ko).join(" · ") : null, FIT_KO[p.fit]]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {p.practice.length > 0 && (
          <p className="mt-0.5 text-[0.6875rem] text-rose/70">{p.practice.slice(0, 2).join(" · ")}</p>
        )}
        {p.colors.length > 1 && p.colors[0] !== "-" && (
          <p className="mt-0.5 text-[0.6875rem] text-cream-dim/50">{p.colors.length}컬러</p>
        )}
      </Link>
      <div className="absolute right-2 top-2 text-lg">
        <WishlistButton id={p.id} />
      </div>
    </li>
  );
}
