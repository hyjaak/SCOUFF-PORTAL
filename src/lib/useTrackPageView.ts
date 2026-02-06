"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const parts = document.cookie.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return "";
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function generateVisitorId() {
  return `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function useTrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    if (lastPath.current === fullPath) return;
    lastPath.current = fullPath;

    let visitorId = getCookie("scouff_vid");
    if (!visitorId) {
      visitorId = generateVisitorId();
      setCookie("scouff_vid", visitorId);
    }

    const payload = {
      path: fullPath,
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      visitorId,
    };

    const send = () =>
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => undefined);

    const handle = setTimeout(send, 300);
    return () => clearTimeout(handle);
  }, [pathname, searchParams]);
}
