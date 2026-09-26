"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { applyAccessibilityPreferences, readAccessibilityPreferences } from "@/lib/accessibility";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { claimSchoolAccess } from "@/lib/schoolAccess";

const PUBLIC_PREFIXES = ["/auth", "/access", "/join", "/offline"];

export default function AppShellEnhancements() {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    applyAccessibilityPreferences(readAccessibilityPreferences());
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) return;
    const client = getSupabaseBrowserClient();
    let active = true;
    (async () => {
      const { data, error } = await client.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        window.location.replace(`/auth?next=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      try {
        const access = await claimSchoolAccess(client);
        if (!active) return;
        if (!access.allowed) {
          window.location.replace(`/access?reason=${encodeURIComponent(access.reason)}&next=${encodeURIComponent(pathname || "/")}`);
        }
      } catch (accessError) {
        if (!active) return;
        const detail = accessError instanceof Error ? accessError.message : "Access check failed";
        window.location.replace(`/access?reason=access_check_failed&detail=${encodeURIComponent(detail)}&next=${encodeURIComponent(pathname || "/")}`);
      }
    })();
    return () => { active = false; };
  }, [pathname]);

  return <>
    <a className="skipLink" href="#main-content">Skip to main content</a>
    {!online && <div className="offlineBanner" role="status" aria-live="polite">You are offline. Live sessions and cloud saves are paused until your connection returns.</div>}
  </>;
}
