import { isPersonalized, selectionFromParams } from "@/lib/products";
import { HERO_IMAGES, PRACTICE_IMAGES } from "@/lib/images";
import { HeroSection } from "@/components/hero-section";
import { Intro } from "@/components/intro";
import { PracticeGrid } from "@/components/practice-grid";
import { ProductSection } from "@/components/product-section";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selection = selectionFromParams(params);

  return (
    <main>
      <HeroSection selection={selection} images={HERO_IMAGES} />
      <Intro />
      <PracticeGrid images={PRACTICE_IMAGES} />
      <ProductSection selection={selection} personalized={isPersonalized(params)} />
      <Closing image={HERO_IMAGES[3]} />
    </main>
  );
}

function Closing({ image }: { image: string }) {
  return (
    <section className="relative isolate mt-8 flex min-h-[70svh] items-end overflow-hidden">
      <div data-parallax="-0.1" className="absolute inset-0 -z-10 scale-110">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-6 pb-20 md:px-10">
        <h2 className="display max-w-xl text-[clamp(2rem,5vw,3.5rem)] leading-tight text-ivory" data-split>
          Yoga wear that moves with who you are.
        </h2>
        <p className="mt-5 max-w-sm text-sm text-ivory/70" data-reveal>
          2,914개 제품 · 97개 브랜드 · 국내외 요가웨어를 한자리에서.
        </p>
      </div>
    </section>
  );
}
