"use client";

import { useCallback, useSyncExternalStore } from "react";
import { products, type Product } from "./products.ts";
import { supabase } from "./supabase.ts";

const KEY = "yoga-wear-wishlist";

/**
 * The wishlist, as one module so the storage can be swapped for an account
 * later without touching a single component.
 *
 * localStorage stayed the store the UI reads even after accounts arrived: no
 * component waits on a network round trip, and the wishlist still works signed
 * out. A signed-in session mirrors every write up to Supabase, and signing in
 * merges the two by union so nothing saved beforehand is lost.
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

/**
 * Add if absent, remove if present. Ids never duplicate.
 *
 * The one place the list is ever mutated by a person, which is why the push to
 * the account hangs off here rather than off `write` — the sign-in merge writes
 * too, and it does its own upload.
 */
export function toggle(id: string): "saved" | "removed" {
  const current = snapshot();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  write(next);
  void push(next);
  return next.length > current.length ? "saved" : "removed";
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

/** For tests and for the account-backed store below. */
export const wishlistStorageKey = KEY;
export const readWishlist = read;

// --- account sync ---------------------------------------------------------

let userId: string | null = null;

/** Quoting is safe here: no product id contains a double quote (see tests). */
const inList = (ids: Store) => `(${ids.map((id) => `"${id}"`).join(",")})`;

/**
 * Push the local list up. The upsert runs before the delete on purpose — if the
 * second call fails, the account is left with an extra saved piece rather than
 * a missing one.
 */
async function push(ids: Store) {
  if (!supabase || !userId) return;
  if (ids.length) {
    await supabase
      .from("wishlist")
      .upsert(ids.map((product_id) => ({ user_id: userId, product_id })));
  }
  let gone = supabase.from("wishlist").delete().eq("user_id", userId);
  if (ids.length) gone = gone.not("product_id", "in", inList(ids));
  await gone;
}

async function remote(): Promise<Store> {
  const { data } = await supabase!
    .from("wishlist")
    .select("product_id")
    .eq("user_id", userId!)
    .order("created_at");
  return data?.map((r) => r.product_id as string) ?? [];
}

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    userId = session?.user.id ?? null;

    if (event === "SIGNED_IN") {
      // The merge moment, and the only one: whatever was saved before signing
      // in joins what the account already had, then goes straight back up.
      void remote().then((rows) => {
        const merged = [...new Set([...rows, ...snapshot()])];
        write(merged);
        void push(merged);
      });
    } else if (event === "INITIAL_SESSION" && userId) {
      // Already signed in on load — the account wins, which is what makes a
      // removal on another device stick instead of being resurrected here.
      // ponytail: last-load-wins, no realtime. Items saved while offline are
      // lost on the next load; add a proper sync queue only if that shows up.
      void remote().then((rows) => write(rows));
    } else if (event === "SIGNED_OUT") {
      // Never leave one person's list behind for the next one on this machine.
      write([]);
    }
  });
}
