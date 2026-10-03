"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { hasCurrentLegalAcceptance } from "@/lib/legal";

const EXEMPT_PREFIXES = [
  "/auth", "/legal", "/demo", "/procurement", "/reset-password", "/verify", "/join",
  "/access", "/access-denied", "/admin-login", "/owner-login", "/owner-portal", "/platform",
];

export default function LegalAcceptanceGuard() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || EXEMPT_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) return;
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data } = await client.auth.getUser();
      const user = data.user;
      if (!active || !user) return;
      const trustedPlatform = user.app_metadata?.platform_admin === true || user.app_metadata?.zones_role === "admin" || user.app_metadata?.platform_managed_user === true || user.app_metadata?.platform_test_user === true;
      if (trustedPlatform) return;
      const { data: platform } = await client.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!active || platform) return;
      const accepted = await hasCurrentLegalAcceptance(client, user.id);
      if (!active || accepted) return;
      const next = `${pathname}${window.location.search || ""}`;
      window.location.replace(`/legal/accept?next=${encodeURIComponent(next)}`);
    })().catch(() => {
      // Route-level auth/RLS remains authoritative if the convenience guard cannot complete.
    });
    return () => { active = false; };
  }, [pathname]);
  return null;
}
