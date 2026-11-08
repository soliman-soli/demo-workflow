"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback?: () => void }) => string;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Renders Cloudflare Turnstile only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * Turnstile injects its own <input name="cf-turnstile-response"> into the form.
 */
export function TurnstileWidget() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current || !window.turnstile) return;
    const id = window.turnstile.render(ref.current, { sitekey: SITE_KEY });
    return () => window.turnstile?.remove(id);
  }, []);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" />
      <div ref={ref} className="my-2" />
    </>
  );
}
