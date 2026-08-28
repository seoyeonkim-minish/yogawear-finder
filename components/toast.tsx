"use client";

import { useEffect, useState } from "react";

const EVENT = "amadi:toast";

/** Announce something small. Nothing waits on it and nothing blocks on it. */
export const toast = (message: string) =>
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 2200);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-8 z-[70] flex justify-center px-6"
    >
      {message && (
        <p className="rounded-full bg-charcoal px-5 py-2.5 text-xs text-ivory shadow-lg transition-opacity">
          {message}
        </p>
      )}
    </div>
  );
}
