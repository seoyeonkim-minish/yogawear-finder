import { LABEL_LEAD } from "@/lib/copy";

/**
 * Why the site exists, before anything is for sale. The filter vocabulary is
 * introduced here as language rather than as controls — the controls appear
 * further down, once there is something to filter.
 */
export function Intro() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-28 md:px-10 md:py-40">
      <div className="grid gap-16 md:grid-cols-[1.1fr_0.9fr] md:gap-24">
        <div>
          <p className="eyebrow text-gray" data-reveal>
            Your practice. Your fit.
          </p>
          <h2 className="display mt-8 text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.05]" data-split>
            Every flow asks for something different.
          </h2>
          <div className="mt-10 max-w-md space-y-5 text-sm leading-relaxed text-gray" data-reveal>
            <p>
              모든 수련이 같은 움직임을 요구하지 않습니다. 빠르게 이어지는 Vinyasa와 Ashtanga에는
              신축성과 몸을 잡아주는 핏이, Hot Yoga에는 가볍고 빨리 마르는 소재가, Yin과 Hatha에는
              몸을 편안하게 감싸는 촉감이 필요합니다.
            </p>
            <p className="text-charcoal">
              그래서 여기서는 요가웨어를 나열하지 않습니다. Practice · Material · Season · Fit으로
              당신의 움직임에 맞는 옷을 발견합니다.
            </p>
          </div>
        </div>

        {/* Accordions, not filters: this explains how the site thinks. The real
            controls live above the product grid. */}
        <dl className="self-end border-t border-sand" data-reveal>
          {LABEL_LEAD.map(({ key, title, lead, body }) => (
            <details key={key} className="group border-b border-sand py-6">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6">
                <span className="eyebrow text-charcoal">
                  {title} <span className="text-gray">— {lead}</span>
                </span>
                <span className="text-lg leading-none text-gray transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray">{body}</p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}
