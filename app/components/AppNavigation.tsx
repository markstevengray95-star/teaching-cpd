"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";
import { hideAppNavigation, NAVIGATION_EVENT, type NavigationAccess } from "@/lib/appNavigation";
import NavigationMenu from "./NavigationMenu";

const noAccess: NavigationAccess = { role: null, legacyRole: "", platformAdmin: false };
export default function AppNavigation() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [access, setAccess] = useState(noAccess);
  const [search, setSearch] = useState("");
  const hidden = hideAppNavigation(pathname);
  useEffect(() => {
    const update = () => setSearch(window.location.search);
    update();
    window.addEventListener("popstate", update);
    window.addEventListener(NAVIGATION_EVENT, update);
    return () => { window.removeEventListener("popstate", update); window.removeEventListener(NAVIGATION_EVENT, update); };
  }, [pathname, params]);
  useEffect(() => {
    if (hidden) { setAccess(noAccess); return; }
    const client = getSupabaseBrowserClient();
    let active = true;
    let revision = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function loadAccess() {
      const request = ++revision;
      try {
        const { data } = await client.auth.getUser();
        if (!active || request !== revision) return;
        if (!data.user) { setAccess(noAccess); return; }
        const [resolved, legacy] = await Promise.all([
          resolveStaffAccess(client, data.user),
          client.from("staff_profiles").select("role").eq("id", data.user.id).maybeSingle(),
        ]);
        if (active && request === revision) setAccess({ role: resolved.role, platformAdmin: resolved.platformAdmin, legacyRole: legacy.data?.role || "" });
      } catch { if (active && request === revision) setAccess(noAccess); }
    }
    void loadAccess();
    const { data: listener } = client.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") { revision++; setAccess(noAccess); }
      else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setAccess(noAccess);
        clearTimeout(timer);
        // Auth callbacks must not await another Supabase operation.
        timer = setTimeout(() => { void loadAccess(); }, 0);
      }
    });
    return () => { active = false; revision++; clearTimeout(timer); listener.subscription.unsubscribe(); };
  }, [hidden]);
  if (hidden) return null;
  return <NavigationMenu access={access} pathname={pathname} search={search}/>;
}
