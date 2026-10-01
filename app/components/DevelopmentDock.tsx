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

  if (pathname.startsWith("/procurement")) return null;

  const learning: LinkItem[] = [
    ["/development", "Development cycle"],
    ["/pathways/personal", "Personal pathway"],
    ["/recommendations", "Recommendations"],
    ["/micro-cpd", "Micro-CPD"],
    ["/subject-cpd", "Subject-specific CPD"],
    ["/reading", "Course reading"],
    ["/adaptive", "Adaptive pre-check"],
  ];

  const practice: LinkItem[] = [
    ["/actions", "Action plans"],
    ["/coach", "CPD Coach plan"],
    ["/coaching", "Coaching"],
    ["/simulator", "Practice simulator"],
    ["/needs-audit", "Needs audit"],
    ["/portfolio", "Portfolio"],
    ["/impact", "CPD impact"],
    ["/standards", "Standards map"],
    ["/external-cpd", "External CPD"],
  ];

  const school: LinkItem[] = [
    ["/school-hub", "School hub"],
    ["/knowledge-base", "School knowledge"],
    ["/appraisal", "Appraisal & review"],
    ["/compliance", "Training compliance"],
    ["/induction", "New staff induction"],
    ["/departments", "Department development"],
    ["/learning-walks", "Learning walks"],
    ["/safeguarding", "Safeguarding"],
    ["/safety", "Safety & compliance"],
    ["/certificates", "Certificates"],
    ["/reminders", "Spaced follow-up"],
    ["/improvement", "School improvement"],
  ];

  const manage: LinkItem[] = [];
  if (["Department Lead", "CPD Lead", "Admin"].includes(role)) {
    school.push(["/department-cpd", "Department CPD"], ["/leadership", "Leadership dashboard"]);
    manage.push(["/live-presenter", "Presenter 2.0"], ["/facilitator", "Facilitator packs"], ["/improvement/programmes", "Improvement → CPD"]);
  }
  if (["CPD Lead", "Admin"].includes(role)) {
    manage.push(["/procurement", "School procurement pack"]);
    manage.push(["/school-onboarding", "School setup & tutorial"]);
    manage.push(
      ["/ai-course-builder", "AI course builder"],
      ["/policy-training", "Policy training"],
      ["/builder", "Course creator"],
      ["/quality", "Annual CPD & QA"],
      ["/presentation-overhaul-final", "Presentation QA"],
      ["/course-quality-dashboard", "Final course QA"],
      ["/school-access", "School access"],
      ["/school-reporting", "School reporting"],
      ["/admin", "CPD admin"],
    );
  }
  if (role === "Admin") manage.push(["/staff-access", "Staff access"], ["/staff-sync", "Staff sync"]);
  if (platformAdmin) manage.push(["/owner-portal", "Owner portal"], ["/platform", "Platform"]);

  const groups: LinkGroup[] = [
    { label: "Learn", links: learning },
    { label: "Apply", links: practice },
    { label: "School", links: school },
    ...(manage.length ? [{ label: "Manage", links: manage }] : []),
  ];

  return <nav className="developmentDock" aria-label="Professional development quick navigation">
    <a href="/ai-coach" className={`dockAi ${activePath(pathname, "/ai-coach") ? "active" : ""}`}>✦ AI CPD Tutor</a>
    <a href="/dashboard" className={activePath(pathname, "/dashboard") ? "active" : ""}>Dashboard</a>
    <a href="/" className={`dockHome ${pathname === "/" ? "active" : ""}`}>Courses</a>
    <a href="/training" className={activePath(pathname, "/training") ? "active" : ""}>My CPD</a>
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
