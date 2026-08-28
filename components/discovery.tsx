"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FIT_HINT, FIT_KO, PRACTICE_HINT, SEASON_HINT, ko, toQuery,
  type Selection,
} from "@/lib/products";

const STEPS = [
  {
    key: "practice" as const,
    title: "What's your practice?",
    sub: "주로 하는 수련을 골라주세요. 여러 개도 괜찮습니다.",
    max: 6,
    options: ["Hatha", "Vinyasa", "Ashtanga", "Hot Yoga", "Yin Yoga", "Pilates"],
    hint: PRACTICE_HINT,
    label: (v: string) => v,
  },
  {
    key: "fit" as const,
    title: "How do you like to feel?",
    sub: "원하는 착용감과 지지력만 고르면 됩니다. 최대 2개.",
    max: 2,
    options: ["relaxed", "sculpted", "compression", "high support"],
    hint: FIT_HINT,
    label: (v: string) => FIT_KO[v],
  },
  {
    key: "season" as const,
    title: "When do you practice?",
    sub: "주로 입게 될 계절을 골라주세요.",
    max: 5,
    options: ["spring", "summer", "fall", "winter", "all"],
    hint: SEASON_HINT,
    label: (v: string) => ko(v),
  },
];

/**
 * One component, two placements:
 *   overlay — opened from the hero CTA. Full screen, hero image still faintly
 *             behind it, so answering the questions stays a brand moment.
 *   drawer  — "Refine my flow", where the point is to keep the browsing context.
 * Either way the answers are staged locally and only committed to the URL on
 * the final CTA, so a half-finished edit never disturbs what is behind it.
 */
export function Discovery({
  selection,
  variant,
  backdrop,
  onClose,
  onStepChange,
}: {
  selection: Selection;
  variant: "overlay" | "drawer";
  /** Kept faintly behind the overlay so discovery still feels like the hero. */
  backdrop?: string;
  onClose?: () => void;
  onStepChange?: (step: number) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Selection>(selection);
  const [leaving, setLeaving] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const s = STEPS[step];
  const chosen = draft[s.key] ?? [];
  const last = step === STEPS.length - 1;

  useEffect(() => onStepChange?.(step), [step, onStepChange]);

  useEffect(() => {
    if (!variant) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [variant, onClose]);

  const go = (next: number) => {
    // Cross-fade between questions instead of paging: the section stays put and
    // only its content changes, which is what makes it read as one experience.
    setLeaving(true);
    setTimeout(() => {
      setStep(next);
      setLeaving(false);
    }, 260);
  };

  const toggle = (v: string) => {
    const next = chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v].slice(-s.max);
    setDraft({ ...draft, [s.key]: next });
  };

  const submit = () => {
    router.push(toQuery({ ...selection, ...draft }, { flow: true }));
    onClose?.();
  };

  const body = (
    <div
      ref={panel}
      className={`transition-[opacity,transform] duration-300 ease-out ${
        leaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="eyebrow">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? "text-charcoal" : "text-gray-soft"}>
              {String(i + 1).padStart(2, "0")}
              {i < STEPS.length - 1 ? " — " : ""}
            </span>
          ))}
        </p>
        <button onClick={onClose} className="eyebrow text-gray hover:text-charcoal">
          Close
        </button>
      </div>

      <h2 className="display mt-8 text-[clamp(2rem,5vw,3.5rem)] leading-tight">{s.title}</h2>
      <p className="mt-3 text-sm text-gray">{s.sub}</p>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {s.options.map((v) => {
          const on = chosen.includes(v);
          return (
            <li key={v}>
              <button
                onClick={() => toggle(v)}
                aria-pressed={on}
                className={`w-full rounded-sm border px-5 py-5 text-left transition duration-300 ${
                  on
                    ? "border-charcoal bg-charcoal text-ivory"
                    : "border-sand bg-ivory-dim/40 hover:border-gray hover:bg-ivory-dim"
                }`}
              >
                <span className="block text-lg">{s.label(v)}</span>
                <span className={`mt-1 block text-xs ${on ? "text-ivory/70" : "text-gray"}`}>
                  {s.hint[v]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-12 flex items-center justify-between gap-4">
        <button
          onClick={() => (step === 0 ? onClose?.() : go(step - 1))}
          className="eyebrow text-gray hover:text-charcoal"
        >
          ← Back
        </button>
        <button
          onClick={() => (last ? submit() : go(step + 1))}
          className="rounded-full bg-charcoal px-8 py-4 text-sm text-ivory transition-colors hover:bg-ink"
        >
          {last ? (variant === "drawer" ? "Update recommendations" : "Show my flow") : "Next"}
        </button>
      </div>
    </div>
  );

  if (variant === "drawer") {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-ink/25" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="h-full w-full max-w-2xl overflow-y-auto bg-ivory px-8 py-12 shadow-2xl md:px-12"
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-ivory">
      {backdrop && (
        <div className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={backdrop} alt="" className="h-full w-full object-cover opacity-[0.14]" />
          <div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/85 to-transparent" />
        </div>
      )}
      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-6 py-16 md:px-10">
        {body}
      </div>
    </div>
  );
}

/** "Refine my flow" — the drawer variant, so the grid behind it stays visible. */
export function RefineTrigger({
  selection,
  label,
  className,
}: {
  selection: Selection;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <Discovery selection={selection} variant="drawer" onClose={() => setOpen(false)} />}
    </>
  );
}
