"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";
import "./PlatformQuickAccess.css";

const hiddenPrefixes = ["/auth", "/reset-password", "/admin-login", "/owner-login", "/verify", "/join", "/access-denied"];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default function PlatformQuickAccess() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data } = await client.auth.getUser();
      if (!data.user || !mounted) return;
      const access = await resolveStaffAccess(client, data.user);
      if (!mounted) return;
      setIsAdmin(Boolean(access.platformAdmin || access.role === "administrator" || access.role === "super-admin" || access.role === "slt"));
    })().catch((error) => console.error("Could not resolve quick-access role", error));
    return () => { mounted = false; };
  }, []);

  if (hiddenPrefixes.some((prefix) => matches(pathname, prefix))) return null;

  return (
    <aside className="platformQuickAccess" aria-label="Quick access tools">
      <div className="platformQuickAccessInner">
        <span className="platformQuickAccessLabel">QUICK ACCESS</span>
        <Link className="platformQuickAccessLink timetable" href="/timetable">
          <span className="platformQuickAccessIcon">▦</span>
          <span><strong>School Timetable</strong><small>Build, review, publish and sync the whole-school timetable</small></span>
          <span className="platformQuickAccessArrow">→</span>
        </Link>
        {isAdmin && (
          <Link className="platformQuickAccessLink demo" href="/demo-school">
            <span className="platformQuickAccessIcon">⌂</span>
            <span><strong>Demo School</strong><small>Open Oakfield Academy test workspace</small></span>
            <span className="platformQuickAccessArrow">→</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
