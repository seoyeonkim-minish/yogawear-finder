import Link from "next/link";
import { PRACTICE_TRAITS, practiceHref } from "@/lib/products";

/**
 * Explore by practice — the quick path. Each card opens that practice's archive:
 * the whole catalogue filtered to it and ranked by how well each piece suits it.
 */
export function PracticeGrid({ images }: { images: Record<string, string> }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-28 md:px-10 md:pb-40">
      <div className="max-w-lg">
        <p className="eyebrow text-gray" data-reveal>
          Explore your practice
        </p>
        <h2 className="display mt-6 text-[clamp(2rem,5vw,3.75rem)] leading-tight" data-split>
          Move your way.
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-gray" data-reveal>
          수련마다 요구하는 것이 다릅니다. 당신의 수련에 맞춰 만들어진 것들을 보세요.
        </p>
      </div>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2" data-stagger>
        {Object.entries(PRACTICE_TRAITS).map(([name, traits]) => (
          <li key={name}>
            <Link
              href={practiceHref(name)}
              className="group relative block aspect-4/5 overflow-hidden rounded-sm bg-beige md:aspect-3/2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[name]}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <h3 className="display text-3xl text-ivory md:text-4xl">{name}</h3>
                <p className="mt-1.5 text-xs text-ivory/75">{traits}</p>
                <p className="mt-4 flex items-center gap-2 text-xs text-ivory/0 transition-[color] duration-500 group-hover:text-ivory">
                  Explore {name}
                  <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
