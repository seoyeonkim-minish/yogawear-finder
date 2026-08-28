import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PRACTICE_LEAD, PRACTICE_SLUGS, PRACTICE_TRAITS, practiceFromSlug, practiceHref,
  selectionFromParams,
} from "@/lib/products";
import { ProductSection } from "@/components/product-section";
import { PRACTICE_IMAGES } from "@/lib/images";

export function generateStaticParams() {
  return Object.keys(PRACTICE_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const practice = practiceFromSlug((await params).slug);
  return practice
    ? { title: `${practice} — Amadi`, description: PRACTICE_LEAD[practice] }
    : {};
}

/**
 * A practice archive: everything in the catalogue that suits one practice,
 * ranked by how well it does. The practice is owned by the path, so it cannot
 * be filtered away — removing it means going somewhere else.
 */
export default async function PracticeArchive({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const practice = practiceFromSlug(slug);
  if (!practice) notFound();

  const selection = { ...selectionFromParams(await searchParams), practice: [practice] };
  const base = practiceHref(practice);

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="px-6 pb-2 pt-10 md:px-10">
        <Link href="/" className="eyebrow text-gray hover:text-charcoal">
          ← Amadi
        </Link>
      </div>

      {/* The photograph is a full-body product shot, so it is framed as a portrait.
          Cropped into a wide banner it lands on the torso, which is not the subject. */}
      <header className="mt-6 grid items-end gap-10 px-6 md:grid-cols-[0.9fr_1.1fr] md:px-10">
        <div className="overflow-hidden rounded-sm bg-beige">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PRACTICE_IMAGES[practice]}
            alt=""
            className="aspect-4/5 w-full object-cover"
          />
        </div>
        <div className="pb-2">
          <p className="eyebrow text-gray">Explore your practice</p>
          <h1 className="display mt-4 text-[clamp(3rem,8vw,6rem)] leading-none">{practice}</h1>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-gray">
            {PRACTICE_TRAITS[practice]}
          </p>
          <p className="mt-7 max-w-md text-sm leading-relaxed text-gray">{PRACTICE_LEAD[practice]}</p>
        </div>
      </header>

      <ProductSection
        selection={selection}
        base={base}
        require={["practice"]}
        header={<div className="pt-12" />}
      />

      <nav className="border-t border-sand px-6 py-14 md:px-10">
        <p className="eyebrow text-gray">Other practices</p>
        <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {Object.values(PRACTICE_SLUGS)
            .filter((p) => p !== practice)
            .map((p) => (
              <li key={p}>
                <Link href={practiceHref(p)} className="display text-2xl hover:text-gray md:text-3xl">
                  {p}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </main>
  );
}
