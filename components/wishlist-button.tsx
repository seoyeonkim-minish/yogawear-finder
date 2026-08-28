"use client";

import { toggle, useIsSaved } from "@/lib/use-wishlist";
import { toast } from "./toast";

/**
 * The heart. It sits inside the card's link, so it has to stop the click from
 * reaching it — pressing the heart saves a piece, it never opens the shop.
 */
export function WishlistButton({ id, label }: { id: string; label?: string }) {
  const saved = useIsSaved(id);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast(toggle(id) === "saved" ? "Saved to wishlist" : "Removed from wishlist");
  };

  return (
    <button
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "위시리스트에서 빼기" : "위시리스트에 담기"}
      className={`transition-[transform,color] duration-300 ease-out active:scale-90 ${
        saved ? "scale-110 text-charcoal" : "text-charcoal/40 hover:text-charcoal"
      }`}
    >
      <span aria-hidden>{saved ? "♥" : "♡"}</span>
      {label ? <span className="ml-2 text-sm">{label}</span> : null}
    </button>
  );
}
