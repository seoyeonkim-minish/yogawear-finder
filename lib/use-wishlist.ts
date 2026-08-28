"use client";

import { useCallback, useSyncExternalStore } from "react";
import { products, type Product } from "./products.ts";

const KEY = "yoga-wear-wishlist";

/**
 * The wishlist, as one module so the storage can be swapped for an account
 * later without touching a single component.
 *
 * Only product ids are stored. The catalogue is a local file, so a saved copy of
 * the name and price would go stale the moment it is re-crawled; the ids are
 * resolved against the catalogue on read, and an id that no longer exists is
 * simply dropped.
 */
type Store = string[];

const listeners = new Set<() => void>();
let cache: Store | null = null;

function read(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];
  } catch {
    return []; // private windows and blocked site data both land here
  }
}

// useSyncExternalStore compares snapshots by identity, so the array is cached
// and only replaced on a write.
const snapshot = () => (cache ??= read());

function write(next: Store) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the change still holds for this session */
  }
  for (const fn of listeners) fn();
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/** Add if absent, remove if present. Ids never duplicate. */
export function toggle(id: string): "saved" | "removed" {
  const current = snapshot();
  if (current.includes(id)) {
    write(current.filter((x) => x !== id));
    return "removed";
  }
  write([...current, id]);
  return "saved";
}

const EMPTY: Store = [];

export function useWishlistIds(): Store {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function useIsSaved(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    useCallback(() => snapshot().includes(id), [id]),
    () => false, // the server has no localStorage
  );
}

export function useWishlistCount(): number {
  return useSyncExternalStore(subscribe, () => snapshot().length, () => 0);
}

/** Saved products, newest first, skipping ids the catalogue no longer has. */
export function useWishlist(): Product[] {
  const ids = useWishlistIds();
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is Product => Boolean(p))
    .reverse();
}

/** For tests and for a future account-backed store. */
export const wishlistStorageKey = KEY;
export const readWishlist = read;
