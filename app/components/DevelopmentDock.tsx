"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function DevelopmentDock() {
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [platformAdmin, setPlatformAdmin] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    let active = true;
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) return;
      const [{ data: profile }, { data: platform }] = await Promise.all([
        client.from("staff_profiles").select("role").eq("id", auth.user.id).maybeSingle(),
        client.from("platform_admins").select("user_id").eq("user_id", auth.user.id).maybeSingle(),
      ]);
      if (!active) return;
      if (profile?.role) setRole(profile.role);
      setPlatformAdmin(Boolean(platform));
    })();
    return () => { active = false; };
  }, []);

  if (pathname.startsWith("/auth") || pathname.startsWith("/admin-login") || pathname.startsWith("/access") || pathname.startsWith("/join")) return null;

  const links: [string,string][] = [
    ["/", "Home"],
    ["/school-hub", "School hub"],
    ["/safeguarding", "Safeguarding"],
    ["/reminders", "Reminders"],
    ["/micro-cpd", "Micro-CPD"],
    ["/course-studio", "Course Studio"],
    ["/training", "My training"],
    ["/needs-audit", "Needs audit"],
    ["/coach", "CPD Coach"],
    ["/coaching", "Coaching"],
    ["/improvement", "School improvement"],
    ["/recommendations", "Recommendations"],
    ["/impact", "CPD impact"],
    ["/pathways", "Pathways"],
    ["/portfolio", "Portfolio"],
    ["/external-cpd", "External CPD"],
    ["/actions", "Action plans"],
    ["/organisation", "Organisation"],
    ["/help", "Help"],
    ["/accessibility", "App settings"],
  ];
  if (["Department Lead", "CPD Lead", "Admin"].includes(role)) {
    links.push(["/department-cpd", "Department CPD"]);
    links.push(["/leadership", "Leadership"]);
  }
  if (["CPD Lead", "Admin"].includes(role)) {
    links.push(["/launch-readiness", "Launch readiness"]);
    links.push(["/school-access", "School access"]);
    links.push(["/quality", "Annual CPD & QA"]);
    links.push(["/admin", "CPD admin"]);
    links.push(["/builder", "Course creator"]);
  }
  if (role === "Admin") {
    links.push(["/staff-access", "Staff access"]);
    links.push(["/staff-sync", "Staff sync"]);
  }
  if (platformAdmin) {
    links.push(["/owner-portal", "Owner portal"]);
    links.push(["/platform", "Platform"]);
  }

  return <nav className="developmentDock" aria-label="Professional development navigation">
    {links.map(([href, label]) => <a key={href} href={href} className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""}>{label}</a>)}
  </nav>;
}
