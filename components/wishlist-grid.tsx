"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/use-wishlist";
import { ProductCard } from "./product-card";

/**
 * The same card as everywhere else — a saved piece is not a different kind of
 * thing. Removing one drops it from the grid immediately, because the grid is
 * rendered from the store rather than from a snapshot taken on load.
 */
export function WishlistGrid() {
  const saved = useWishlist();

  if (saved.length === 0) {
    return (
      <div className="py-32 text-center">
        <p className="display text-4xl">Your wishlist is waiting.</p>
        <p className="mt-5 text-sm text-gray">돌아와서 다시 보고 싶은 것들을 저장해두세요.</p>
        <Link
          href="/#products"
          className="mt-10 inline-block rounded-full bg-charcoal px-7 py-3.5 text-sm text-ivory transition-colors hover:bg-ink"
        >
          Explore yoga wear
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="py-8 text-sm text-gray">{saved.length}개</p>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-12 pb-32 md:grid-cols-3 xl:grid-cols-4">
        {saved.map((p) => (
          <ProductCard key={p.id} product={p} selection={{}} />
        ))}
      </ul>
    </>
  );
}
