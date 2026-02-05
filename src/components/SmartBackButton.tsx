"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SmartBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const shouldHideForRoute = pathname === "/dashboard" || pathname === "/login";

  const canGoBack = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (typeof document === "undefined") return false;

    const explicitFromDashboard = searchParams?.get("from") === "dashboard";
    if (explicitFromDashboard) return true;

    const hasHistory = window.history.length > 1;
    const referrer = document.referrer || "";
    const sameOrigin = referrer.startsWith(window.location.origin);

    return hasHistory && !!referrer && sameOrigin;
  }, [searchParams]);

  if (shouldHideForRoute) return null;
  if (!canGoBack) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && typeof document !== "undefined") {
          const hasHistory = window.history.length > 1;
          const referrer = document.referrer || "";
          const sameOrigin = referrer.startsWith(window.location.origin);

          if (hasHistory && !!referrer && sameOrigin) {
            router.back();
            return;
          }
        }
        router.push("/dashboard");
      }}
      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded px-3 py-2 text-sm"
      aria-label="Go back"
    >
      &larr; Back
    </button>
  );
}
