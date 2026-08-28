import Link from "next/link";
import { WishlistGrid } from "@/components/wishlist-grid";

export const metadata = {
  title: "Your Wishlist — Amadi",
  description: "돌아와서 다시 보고 싶은 것들.",
};

export default function WishlistPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10">
      <Link href="/" className="eyebrow text-gray hover:text-charcoal">
        ← Amadi
      </Link>

      <header className="border-b border-sand py-14 md:py-20">
        <p className="eyebrow text-gray">Saved</p>
        <h1 className="display mt-5 text-[clamp(2.5rem,6vw,4.5rem)] leading-none">Your Wishlist</h1>
        <p className="mt-5 text-sm text-gray">Pieces worth coming back to.</p>
      </header>

      <WishlistGrid />
    </main>
  );
}
