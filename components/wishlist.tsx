"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "amadi:wishlist";
const listeners = new Set<() => void>();

const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return []; // private windows and blocked site data both land here
  }
};

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

function write(next: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the heart still reflects this session */
  }
  cache = next;
  for (const fn of listeners) fn();
}

// useSyncExternalStore compares snapshots by identity, so the array is cached
// and only replaced on a write.
let cache: string[] | null = null;
const snapshot = () => (cache ??= read());

/** Per-viewer only, and deliberately so — there is no account to sync it to. */
export function WishlistButton({ id, label }: { id: string; label?: string }) {
  const on = useSyncExternalStore(
    subscribe,
    useCallback(() => snapshot().includes(id), [id]),
    () => false, // the server has no localStorage
  );

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    write(on ? snapshot().filter((x) => x !== id) : [...snapshot(), id]);
  };

  return (
    <button
      onClick={toggle}
      aria-label={on ? "위시리스트에서 빼기" : "위시리스트에 담기"}
      className={`transition ${on ? "text-charcoal" : "text-gray-soft hover:text-gray"}`}
    >
      {on ? "♥" : "♡"}
      {label ? <span className="ml-2 text-sm">{label}</span> : null}
    </button>
  );
}
