"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWishlistCount } from "@/lib/use-wishlist";

/** Top-right utility. Deliberately small: it must not compete with the hero. */
export function WishlistLink() {
  const count = useWishlistCount();
  const onWishlist = usePathname() === "/wishlist";
  if (onWishlist) return null;

  return (
    <Link
      href="/wishlist"
      className="fixed right-6 top-6 z-40 flex items-center gap-2 rounded-full bg-ivory/80 px-4 py-2 text-xs text-charcoal backdrop-blur transition hover:bg-ivory md:right-10"
    >
      <span aria-hidden>{count > 0 ? "♥" : "♡"}</span>
      <span className="eyebrow">Wishlist</span>
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </Link>
  );
}
