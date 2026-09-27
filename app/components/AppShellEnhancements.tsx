"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { applyAccessibilityPreferences, readAccessibilityPreferences } from "@/lib/accessibility";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { claimSchoolAccess } from "@/lib/schoolAccess";

const PUBLIC_PREFIXES = ["/auth", "/admin-login", "/owner-login", "/reset-password", "/access", "/join", "/offline", "/verify"];
const SELF_GUARDED_SETUP_PREFIXES = ["/organisation", "/school-access", "/platform", "/owner-portal"];
const HEX = /^#[0-9A-Fa-f]{6}$/;

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
      const { data: auth } = await client.auth.getUser();
      if (!active || !auth.user) return;
      const { data: profile } = await client.from("staff_profiles").select("organisation_id").eq("id", auth.user.id).maybeSingle();
      if (!active || !profile?.organisation_id) return;
      const { data: org } = await client.from("organisations").select("brand_name,accent_color,secondary_color").eq("id", profile.organisation_id).maybeSingle();
      if (!active || !org) return;
      const root = document.documentElement;
      if (org.accent_color && HEX.test(org.accent_color)) root.style.setProperty("--green", org.accent_color);
      if (org.secondary_color && HEX.test(org.secondary_color)) root.style.setProperty("--green2", org.secondary_color);
      if (org.brand_name) document.title = `${org.brand_name} · CPD Hub`;
    })();
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) return;
    if (SELF_GUARDED_SETUP_PREFIXES.some(prefix => pathname.startsWith(prefix))) return;
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
        const { data: platform } = await client.from("platform_admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
        if (platform) return;
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
