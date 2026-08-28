"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FIT_HINT, FIT_KO, PRACTICE_HINT, SEASON_HINT, ko, toQuery,
  type Selection,
} from "@/lib/products";

const STEPS = [
  {
    key: "practice" as const,
    title: "What's your practice?",
    sub: "주로 하는 수련을 골라주세요. 여러 개도 괜찮아요.",
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
 * The guided discovery. Opened on first entry and again by "Refine my flow",
 * where it must come back with the current answers already selected — refining
 * is editing, not starting over.
 */
export function Discovery({
  selection,
  open,
  onClose,
}: {
  selection: Selection;
  open: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Selection>(selection);

  if (!open) return null;

  const s = STEPS[step];
  const chosen = draft[s.key] ?? [];
  const last = step === STEPS.length - 1;

  const toggle = (v: string) => {
    const on = chosen.includes(v);
    const next = on
      ? chosen.filter((x) => x !== v)
      : [...chosen, v].slice(-s.max); // keep the most recent within the cap
    setDraft({ ...draft, [s.key]: next });
  };

  const submit = () => {
    router.push(toQuery({ ...selection, ...draft }));
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ground-deep/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-12 md:py-20">
        <div className="mb-10 flex items-center justify-between">
          <p className="eyebrow text-rose">
            {STEPS.map((_, i) => (
              <span key={i} className={i === step ? "text-cream" : "opacity-40"}>
                {String(i + 1).padStart(2, "0")}
                {i < STEPS.length - 1 ? " — " : ""}
              </span>
            ))}
          </p>
          {onClose && (
            <button onClick={onClose} className="eyebrow text-rose hover:text-cream">
              Close
            </button>
          )}
        </div>

        <h2 className="display text-4xl leading-tight md:text-5xl">{s.title}</h2>
        <p className="mt-3 text-sm text-cream-dim">{s.sub}</p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {s.options.map((v) => {
            const on = chosen.includes(v);
            return (
              <li key={v}>
                <button
                  onClick={() => toggle(v)}
                  aria-pressed={on}
                  className={`w-full rounded-sm border px-5 py-5 text-left transition ${
                    on
                      ? "border-cream bg-cream text-ground-deep"
                      : "border-rose/25 text-cream hover:border-rose/60 hover:bg-surface"
                  }`}
                >
                  <span className="block text-lg">{s.label(v)}</span>
                  <span
                    className={`mt-1 block text-xs ${on ? "text-ground-deep/70" : "text-cream-dim/70"}`}
                  >
                    {s.hint[v]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-4 pt-12">
          <button
            onClick={() => (step === 0 ? onClose?.() : setStep(step - 1))}
            className="eyebrow text-rose hover:text-cream disabled:opacity-30"
            disabled={step === 0 && !onClose}
          >
            ← Back
          </button>
          <button
            onClick={() => (last ? submit() : setStep(step + 1))}
            className="rounded-full bg-cream px-7 py-3 text-sm text-ground-deep transition hover:bg-rose-soft"
          >
            {last ? "Update recommendations" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hero CTA and the "Refine my flow" button both open the same flow. */
export function DiscoveryTrigger({
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
      <Discovery selection={selection} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
