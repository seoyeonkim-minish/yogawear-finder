import test from "node:test";
import assert from "node:assert/strict";

/**
 * The wishlist store is a browser module. These tests run it against a minimal
 * localStorage stand-in, which is the whole point: the storage is one seam that
 * an account-backed store can replace later.
 */
class MemoryStorage {
  #data = new Map<string, string>();
  getItem = (k: string) => this.#data.get(k) ?? null;
  setItem = (k: string, v: string) => void this.#data.set(k, v);
  removeItem = (k: string) => void this.#data.delete(k);
  clear = () => this.#data.clear();
}

const storage = new MemoryStorage();
(globalThis as { localStorage?: unknown }).localStorage = storage;

const { toggle, readWishlist, wishlistStorageKey } = await import("../lib/use-wishlist.ts");
const { products } = await import("../lib/products.ts");

const [a, b] = products;

test("saving, removing, and never duplicating", () => {
  storage.clear();
  assert.deepEqual(readWishlist(), []);

  assert.equal(toggle(a.id), "saved");
  assert.equal(toggle(b.id), "saved");
  assert.deepEqual(readWishlist(), [a.id, b.id]);

  // Toggling an id that is already there removes it rather than adding a copy.
  assert.equal(toggle(a.id), "removed");
  assert.deepEqual(readWishlist(), [b.id]);
  assert.equal(toggle(b.id), "removed");
  assert.deepEqual(readWishlist(), []);
});

test("it survives a reload — the ids are what persist", () => {
  storage.clear();
  toggle(a.id);
  toggle(b.id);
  assert.deepEqual(JSON.parse(storage.getItem(wishlistStorageKey)!), [a.id, b.id]);
});

test("only ids are stored, never a copy of the product", () => {
  storage.clear();
  toggle(a.id);
  const raw = storage.getItem(wishlistStorageKey)!;
  assert.doesNotMatch(raw, /price|image|brand|http/i, `stored: ${raw}`);
});

test("corrupt storage is treated as empty rather than throwing", () => {
  storage.clear();
  storage.setItem(wishlistStorageKey, "not json");
  assert.deepEqual(readWishlist(), []);
  storage.setItem(wishlistStorageKey, '{"not":"an array"}');
  assert.deepEqual(readWishlist(), []);
  storage.setItem(wishlistStorageKey, '["ok", 42, null]');
  assert.deepEqual(readWishlist(), ["ok"], "non-string ids are dropped");
});
