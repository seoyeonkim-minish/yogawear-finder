"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const pill =
  "flex items-center gap-2 rounded-full bg-ivory/80 px-4 py-2 text-xs text-charcoal backdrop-blur transition hover:bg-ivory";

/**
 * The account control, sized to match the wishlist link beside it — signing in
 * is a utility here, not a gate, so it never grows louder than the catalogue.
 *
 * Google is the only provider. Kakao was set up and then removed: Supabase
 * always asks Kakao for `account_email`, and that scope is locked behind a
 * business account, so every attempt came back KOE205. A second provider brings
 * back the menu this file used to carry.
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

  if (!user) {
    return (
      <button
        className={pill}
        onClick={() =>
          client.auth.signInWithOAuth({
            provider: "google",
            // Back to the page you left, wishlist and all — but without its
            // hash. `href` keeps the anchor, and the redirect appends its own
            // fragment behind it, which parses as neither.
            options: { redirectTo: pageUrl() },
          })
        }
      >
        <span className="eyebrow">Sign in</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className={pill}>
        <span className="eyebrow">{name(user)}</span>
      </button>
      {open && (
        <button
          // ponytail: closes on sign-out or the next auth change, not on an
          // outside click. Add a listener if it ever actually annoys anyone.
          className="absolute right-0 mt-2 w-28 rounded-2xl bg-ivory/95 px-4 py-2 text-left text-xs text-charcoal shadow-lg backdrop-blur transition hover:bg-ivory"
          onClick={() => client.auth.signOut()}
        >
          로그아웃
        </button>
      )}
    </div>
  );
}

/** The current page, minus any anchor the visitor happens to be parked on. */
function pageUrl() {
  const { origin, pathname, search } = window.location;
  return origin + pathname + search;
}

/** Whatever the provider gave us, shortened to something that fits the pill. */
function name(user: User) {
  const raw = (user.user_metadata?.name as string | undefined) ?? user.email ?? "Account";
  return raw.split("@")[0].slice(0, 12);
}
