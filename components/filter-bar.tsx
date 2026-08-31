import Link from "next/link";
import {
  FIT_HINT, LABEL, MATERIAL_HINT, expandValues, optionsFor, products, toggleHref,
  type Key, type Selection,
} from "@/lib/products";

/**
 * Horizontal filter bar. Each control is a native <details> popover holding
 * plain links — no client state, so a filtered page is a real, shareable URL.
 *
 * The row wraps rather than scrolls: an overflow container clips the popovers
 * that open below it, which left every option list unreachable.
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
            ? "border-charcoal bg-charcoal text-ivory"
            : "border-sand text-gray hover:border-charcoal hover:text-charcoal"
        }`}
      >
        {title}
        {n > 0 && <span className="text-xs">{n}</span>}
        <span className="text-[0.625rem] opacity-60 group-open:rotate-180">▾</span>
      </summary>
      <div className="absolute left-0 z-40 mt-2 max-h-96 w-64 overflow-y-auto rounded-sm border border-sand bg-ivory p-2 shadow-xl">
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
  links,
}: {
  selection: Selection;
  k: Key;
  value: string;
  count?: number;
  label: string;
  hint?: string;
  links: { flow?: boolean; base?: string };
}) {
  const on = selection[k]?.includes(value);
  return (
    <Link
      href={toggleHref(selection, k, value, links)}
      className={`flex items-baseline justify-between gap-3 rounded-sm px-3 py-2 text-sm transition ${
        on ? "bg-ivory-dim text-charcoal" : "text-gray hover:bg-beige"
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

/**
 * What each control offers: the left side is the value the catalogue stores (or
 * a group name from VALUE_GROUP), the right side is what the menu says. Only
 * values the catalogue actually holds are listed — an option that matches
 * nothing is a dead end rather than a filter.
 */
const GENDERS = [
  ["women", "Female"],
  ["men", "Male"],
] as const;

const PRACTICES = ["Hatha", "Vinyasa", "Ashtanga", "Hot Yoga", "Yin Yoga", "Pilates"];

const MATERIALS = [
  ["nylon", "Nylon"],
  ["polyester", "Polyester"],
  ["recycled", "Recycled"],
  ["cotton", "Cotton"],
  ["organic cotton", "Organic Cotton"],
  ["modal", "Modal"],
] as const;

const SEASONS = [
  ["spring", "Spring"],
  ["summer", "Summer"],
  ["fall", "Autumn"],
  ["winter", "Winter"],
] as const;

const FITS = [
  ["relaxed", "Relaxed"],
  ["sculpted", "Sculpted"],
  ["compression", "Compression"],
] as const;

export function FilterBar({
  selection,
  links = {},
}: {
  selection: Selection;
  /** Where toggling a value should land: the home page, or a practice archive. */
  links?: { flow?: boolean; base?: string };
}) {
  const counts = Object.fromEntries(
    (["gender", "practice", "material", "season", "fit", "maternity"] as Key[]).map((k) => [
      k,
      new Map(optionsFor(products, k).map((o) => [o.value, o.count])),
    ]),
  ) as Record<Key, Map<string, number>>;

  // A grouped option is worth everything it stands for.
  const count = (k: Key, value: string) =>
    expandValues(k, [value]).reduce((n, v) => n + (counts[k].get(v) ?? 0), 0);

  const maternityOn = Boolean(selection.maternity?.includes("1"));

  return (
    <div className="flex flex-wrap gap-2">
      <Popover selection={selection} k="gender" title={LABEL.gender}>
        {GENDERS.map(([value, label]) => (
          <OptionLink
            key={value}
            links={links}
            selection={selection}
            k="gender"
            value={value}
            label={label}
            count={count("gender", value)}
          />
        ))}
      </Popover>

      <Popover selection={selection} k="practice" title={LABEL.practice}>
        {PRACTICES.map((v) => (
          <OptionLink
            key={v}
            links={links}
            selection={selection}
            k="practice"
            value={v}
            label={v}
            count={count("practice", v)}
          />
        ))}
      </Popover>

      <Popover selection={selection} k="material" title={LABEL.material}>
        {MATERIALS.map(([value, label]) => (
          <OptionLink
            key={value}
            links={links}
            selection={selection}
            k="material"
            value={value}
            label={label}
            hint={MATERIAL_HINT[value]}
            count={count("material", value)}
          />
        ))}
      </Popover>

      <Popover selection={selection} k="season" title={LABEL.season}>
        {SEASONS.map(([value, label]) => (
          <OptionLink
            key={value}
            links={links}
            selection={selection}
            k="season"
            value={value}
            label={label}
            count={count("season", value)}
          />
        ))}
      </Popover>

      {/* A condition of wear, not a facet to browse: one switch, no menu. */}
      <Link
        href={toggleHref(selection, "maternity", "1", links)}
        role="checkbox"
        aria-checked={maternityOn}
        className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
          maternityOn
            ? "border-charcoal bg-charcoal text-ivory"
            : "border-sand text-gray hover:border-charcoal hover:text-charcoal"
        }`}
      >
        <span
          aria-hidden
          className={`grid h-4 w-4 place-items-center rounded-[3px] border text-[0.625rem] leading-none ${
            maternityOn ? "border-ivory bg-ivory text-charcoal" : "border-sand"
          }`}
        >
          {maternityOn ? "✓" : ""}
        </span>
        Maternity-friendly only
      </Link>

      <Popover selection={selection} k="fit" title="Find your fit">
        {FITS.map(([value, label]) => (
          <OptionLink
            key={value}
            links={links}
            selection={selection}
            k="fit"
            value={value}
            label={label}
            hint={FIT_HINT[value]}
            count={count("fit", value)}
          />
        ))}
      </Popover>
    </div>
  );
}
