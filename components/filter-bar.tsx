import Link from "next/link";
import {
  FILTER_KEYS, FIT_HINT, FIT_KO, LABEL, MATERIAL_HINT, ko, optionsFor,
  products, toggleHref, type Key, type Selection,
} from "@/lib/products";

/**
 * Horizontal filter bar. Each control is a native <details> popover holding
 * plain links — no client state, so a filtered page is a real, shareable URL.
 * On mobile the same markup collapses into a chip row that scrolls.
 */
function Popover({
  selection,
  k,
  title,
  children,
}: {
  selection: Selection;
  k: Key;
  title: string;
  children: React.ReactNode;
}) {
  const n = selection[k]?.length ?? 0;
  return (
    <details className="group relative shrink-0">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
          n
            ? "border-cream bg-cream text-ground-deep"
            : "border-rose/30 text-cream-dim hover:border-rose/60 hover:text-cream"
        }`}
      >
        {title}
        {n > 0 && <span className="text-xs">{n}</span>}
        <span className="text-[0.625rem] opacity-60 group-open:rotate-180">▾</span>
      </summary>
      <div className="absolute left-0 z-40 mt-2 max-h-96 w-64 overflow-y-auto rounded-sm border border-rose/25 bg-ground-deep p-2 shadow-xl">
        {children}
      </div>
    </details>
  );
}

function OptionLink({
  selection,
  k,
  value,
  count,
  label,
  hint,
}: {
  selection: Selection;
  k: Key;
  value: string;
  count?: number;
  label: string;
  hint?: string;
}) {
  const on = selection[k]?.includes(value);
  return (
    <Link
      href={toggleHref(selection, k, value)}
      className={`flex items-baseline justify-between gap-3 rounded-sm px-3 py-2 text-sm transition ${
        on ? "bg-surface-2 text-cream" : "text-cream-dim hover:bg-surface"
      }`}
    >
      <span>
        {on ? "✓ " : ""}
        {label}
        {hint && <span className="mt-0.5 block text-[0.6875rem] opacity-60">{hint}</span>}
      </span>
      {count !== undefined && <span className="text-[0.6875rem] opacity-50">{count}</span>}
    </Link>
  );
}

const PRACTICES = ["Hatha", "Vinyasa", "Ashtanga", "Hot Yoga", "Yin Yoga", "Pilates"];
const PROPORTIONS = ["Petite", "Tall", "Curvy", "Athletic"];
const FITS = ["relaxed", "sculpted", "compression", "high support"];

export function FilterBar({ selection }: { selection: Selection }) {
  const counts = Object.fromEntries(
    ([...FILTER_KEYS, "practice", "fit", "season"] as Key[]).map((k) => [
      k,
      new Map(optionsFor(products, k).map((o) => [o.value, o.count])),
    ]),
  ) as Record<Key, Map<string, number>>;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Popover selection={selection} k="gender" title={LABEL.gender}>
        {["women", "men", "unisex"].map((v) => (
          <OptionLink key={v} selection={selection} k="gender" value={v} label={ko(v)} count={counts.gender.get(v)} />
        ))}
      </Popover>

      <Popover selection={selection} k="practice" title={LABEL.practice}>
        {PRACTICES.map((v) => (
          <OptionLink key={v} selection={selection} k="practice" value={v} label={v} count={counts.practice.get(v)} />
        ))}
      </Popover>

      <Popover selection={selection} k="material" title={LABEL.material}>
        {optionsFor(products, "material").map(({ value, count }) => (
          <OptionLink
            key={value}
            selection={selection}
            k="material"
            value={value}
            label={ko(value)}
            hint={MATERIAL_HINT[value]}
            count={count}
          />
        ))}
      </Popover>

      <Popover selection={selection} k="season" title={LABEL.season}>
        {["spring", "summer", "fall", "winter"].map((v) => (
          <OptionLink key={v} selection={selection} k="season" value={v} label={ko(v)} count={counts.season.get(v)} />
        ))}
      </Popover>

      {/* Proportions and preferred fit are related but not the same thing, so the
          popover keeps them as two labelled groups rather than one merged list. */}
      <Popover selection={selection} k="proportions" title="Find your fit">
        <p className="px-3 pb-1 pt-2 eyebrow text-rose">Your proportions</p>
        <p className="px-3 pb-2 text-[0.6875rem] text-cream-dim/60">
          체형에 맞게 설계된 제품을 찾습니다.
        </p>
        {PROPORTIONS.map((v) => (
          <OptionLink
            key={v}
            selection={selection}
            k="proportions"
            value={v}
            label={ko(v)}
            count={counts.proportions.get(v) ?? 0}
          />
        ))}
        <p className="mt-3 border-t border-rose/20 px-3 pb-1 pt-3 eyebrow text-rose">Preferred fit</p>
        {FITS.map((v) => (
          <OptionLink
            key={v}
            selection={selection}
            k="fit"
            value={v}
            label={FIT_KO[v]}
            hint={FIT_HINT[v]}
          />
        ))}
      </Popover>
    </div>
  );
}
