"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type LinkItem = [string, string];
type LinkGroup = { label: string; links: LinkItem[] };

function activePath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

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

  if (pathname.startsWith("/auth") || pathname.startsWith("/admin-login") || pathname.startsWith("/owner-login") || pathname.startsWith("/access") || pathname.startsWith("/join") || pathname.startsWith("/verify") || pathname.startsWith("/reset-password")) return null;

  const learn: LinkItem[] = [
    ["/development", "Development cycle"],
    ["/pathways", "Pathways"],
    ["/adaptive", "Adaptive pre-check"],
    ["/subject-cpd", "Subject-specific CPD"],
    ["/reading", "Course reading"],
    ["/micro-cpd", "Micro-CPD"],
    ["/training", "My training"],
    ["/recommendations", "Recommendations"],
  ];

  const apply: LinkItem[] = [
    ["/simulator", "Practice simulator"],
    ["/actions", "Action plans"],
    ["/coach", "CPD Coach"],
    ["/coaching", "Coaching"],
    ["/needs-audit", "Needs audit"],
    ["/portfolio", "Portfolio"],
    ["/impact", "CPD impact"],
    ["/standards", "Standards map"],
    ["/external-cpd", "External CPD"],
  ];

  const school: LinkItem[] = [
    ["/school-hub", "School hub"],
    ["/safeguarding", "Safeguarding"],
    ["/safeguarding/documents", "Safeguarding documents"],
    ["/safety", "Safety & compliance"],
    ["/certificates", "Certificates"],
    ["/reminders", "Spaced follow-up"],
    ["/improvement", "School improvement"],
  ];

  const more: LinkItem[] = [
    ["/course-studio", "Course Studio"],
    ["/course-packs", "Course packs"],
    ["/help", "Help"],
    ["/accessibility", "Accessibility & reading"],
  ];

  if (["Department Lead", "CPD Lead", "Admin"].includes(role)) {
    school.push(["/department-cpd", "Department CPD"], ["/leadership", "Leadership dashboard"], ["/live", "Live CPD"], ["/facilitator", "Facilitator packs"]);
  }
  if (["CPD Lead", "Admin"].includes(role)) {
    more.push(
      ["/policy-training", "Policy training"],
      ["/builder", "Course creator"],
      ["/launch-readiness", "Launch readiness"],
      ["/school-access", "School access"],
      ["/quality", "Annual CPD & QA"],
      ["/admin", "CPD admin"],
    );
  }
  if (role === "Admin") more.push(["/staff-access", "Staff access"], ["/staff-sync", "Staff sync"]);
  if (platformAdmin) more.push(["/owner-portal", "Owner portal"], ["/platform", "Platform"]);

  const groups: LinkGroup[] = [
    { label: "Learn", links: learn },
    { label: "Apply", links: apply },
    { label: "School", links: school },
    { label: "More", links: more },
  ];

  return <nav className="developmentDock" aria-label="Professional development quick navigation">
    <a href="/" className={`dockHome ${activePath(pathname, "/") ? "active" : ""}`}>Home</a>
    {groups.map(group => {
      const groupActive = group.links.some(([href]) => activePath(pathname, href));
      return <details className={`dockGroup ${groupActive ? "hasActive" : ""}`} key={group.label}>
        <summary>{group.label}</summary>
        <div className="dockMenu">
          <strong>{group.label}</strong>
          {group.links.map(([href, label]) => <a key={href} href={href} className={activePath(pathname, href) ? "active" : ""}>{label}</a>)}
        </div>
      </details>;
    })}
  </nav>;
}
