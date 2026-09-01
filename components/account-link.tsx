"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "kakao", label: "카카오" },
] as const;

const pill =
  "flex items-center gap-2 rounded-full bg-ivory/80 px-4 py-2 text-xs text-charcoal backdrop-blur transition hover:bg-ivory";

/**
 * The account control, sized to match the wishlist link beside it — signing in
 * is a utility here, not a gate, so it never grows louder than the catalogue.
 */
export function AccountLink() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setOpen(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Nothing to offer without a project configured; better an absent control
  // than one that fails on click.
  const client = supabase;
  if (!client) return null;

  const signIn = (provider: (typeof PROVIDERS)[number]["id"]) =>
    client.auth.signInWithOAuth({
      provider,
      // Back to the page you left, wishlist and all.
      options: { redirectTo: window.location.href },
    });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={pill}
      >
        <span className="eyebrow">{user ? name(user) : "Sign in"}</span>
      </button>

      {open && (
        <div
          // ponytail: closes on choose or on the next auth change, not on an
          // outside click. Add a listener if it ever actually annoys anyone.
          className="absolute right-0 mt-2 flex w-36 flex-col overflow-hidden rounded-2xl bg-ivory/95 py-1 text-xs text-charcoal shadow-lg backdrop-blur"
        >
          {user ? (
            <button
              className="px-4 py-2 text-left transition hover:bg-charcoal/5"
              onClick={() => client.auth.signOut()}
            >
              로그아웃
            </button>
          ) : (
            PROVIDERS.map((p) => (
              <button
                key={p.id}
                className="px-4 py-2 text-left transition hover:bg-charcoal/5"
                onClick={() => signIn(p.id)}
              >
                {p.label}로 계속하기
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Whatever the provider gave us, shortened to something that fits the pill. */
function name(user: User) {
  const raw = (user.user_metadata?.name as string | undefined) ?? user.email ?? "Account";
  return raw.split("@")[0].slice(0, 12);
}
