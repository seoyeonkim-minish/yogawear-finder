import { FIT_KO, formatPrice, ko, reasons, type Product, type Selection } from "@/lib/products";
import { WishlistButton } from "./wishlist-button";

/**
 * The card body is an external link to the brand's own product page — this site
 * finds pieces, it does not sell them. The heart is a sibling of that link, not
 * a child, so saving never opens the shop.
 */
export function ProductCard({ product: p, selection }: { product: Product; selection: Selection }) {
  const why = reasons(p, selection);
  return (
    <li className="group relative">
      <a href={p.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative overflow-hidden rounded-sm bg-beige">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="aspect-3/4 w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
          />
          {why.length > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-ivory/85 px-2.5 py-1 text-[0.625rem] text-charcoal backdrop-blur-sm">
              {why[0]}
            </span>
          )}
        </div>
        <p className="eyebrow mt-3 text-gray">{p.brand}</p>
        <p className="mt-1 text-sm leading-snug text-charcoal">{p.name}</p>
        <p className="mt-1.5 text-sm text-gray">{formatPrice(p)}</p>
        <p className="mt-1 text-[0.6875rem] text-gray">
          {[p.material.length ? p.material.map(ko).join(" · ") : null, FIT_KO[p.fit]]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {p.practice.length > 0 && (
          <p className="mt-0.5 text-[0.6875rem] text-gray">{p.practice.slice(0, 2).join(" · ")}</p>
        )}
        {p.colors.length > 1 && p.colors[0] !== "-" && (
          <p className="mt-0.5 text-[0.6875rem] text-gray-soft">{p.colors.length}컬러</p>
        )}
      </a>
      <div className="absolute right-2 top-2 text-lg">
        <WishlistButton id={p.id} />
      </div>
    </li>
  );
}
