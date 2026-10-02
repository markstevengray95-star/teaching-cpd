"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./GlobalMainTabs.css";

const hiddenPrefixes = ["/auth", "/reset-password", "/admin-login", "/owner-login", "/verify", "/join", "/access-denied"];

const tabs = [
  { id: "home", href: "/dashboard", label: "Home", icon: "⌂" },
  { id: "teach", href: "/teach", label: "Teach", icon: "✦" },
  { id: "students", href: "/students", label: "Students", icon: "◉" },
  { id: "develop", href: "/develop", label: "Develop", icon: "↗" },
  { id: "school", href: "/school", label: "School", icon: "▦" },
  { id: "resources", href: "/resources", label: "Resources", icon: "▤" },
] as const;

type AreaId = (typeof tabs)[number]["id"];

const routeGroups: Record<Exclude<AreaId, "home">, string[]> = {
  teach: [
    "/teach", "/teaching-learning", "/resource-generator", "/department-hub", "/curriculum",
    "/subject-cpd", "/standards", "/learning-walks", "/department-cpd",
  ],
  students: [
    "/students", "/pastoral", "/regulation-behaviour", "/send-eal", "/interventions",
    "/regulation-room", "/zones", "/zone-quest", "/zones-school", "/zones-cpd",
  ],
  develop: [
    "/develop", "/professional-learning", "/portfolio", "/coaching", "/appraisal", "/cpd",
    "/micro-cpd", "/pathways", "/training", "/development", "/actions", "/impact",
    "/recommendations", "/needs-audit", "/external-cpd", "/certificates", "/reading", "/adaptive",
    "/ai-coach", "/coach",
  ],
  school: [
    "/school", "/staff-timetable", "/calendar", "/notices", "/directory", "/school-improvement", "/department-plans",
    "/forms", "/trips", "/compliance", "/induction", "/leadership-dashboard", "/department-analytics",
    "/recognition", "/staff-voice", "/notifications", "/integrations", "/admin-centre", "/organisation",
    "/school-hub", "/departments", "/improvement", "/leadership", "/school-access", "/staff-access",
    "/staff-sync", "/launch-readiness", "/platform", "/owner-portal", "/admin",
  ],
  resources: [
    "/resources", "/resource-library", "/policies", "/search", "/school-assistant", "/files",
    "/knowledge-base", "/safeguarding", "/policy-training", "/course-packs", "/help", "/accessibility",
  ],
};

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function activeArea(pathname: string): AreaId {
  if (pathname === "/" || matches(pathname, "/dashboard")) return "home";
  for (const [area, prefixes] of Object.entries(routeGroups) as [Exclude<AreaId, "home">, string[]][]) {
    if (prefixes.some((prefix) => matches(pathname, prefix))) return area;
  }
  return "home";
}

export default function GlobalMainTabs() {
  const pathname = usePathname();
  if (hiddenPrefixes.some((prefix) => matches(pathname, prefix))) return null;

  const active = activeArea(pathname);

  return (
    <header className="globalMainNav">
      <Link href="/dashboard" className="globalMainBrand" aria-label="Teaching CPD home">
        <span className="globalMainBrandMark">TC</span>
        <span className="globalMainBrandCopy"><strong>Teaching CPD</strong><small>Whole-school staff platform</small></span>
      </Link>

      <nav className="globalMainTabs" aria-label="Main areas">
        {tabs.map((tab) => (
          <Link key={tab.id} href={tab.href} className={active === tab.id ? "active" : ""} aria-current={active === tab.id ? "page" : undefined}>
            <span className="globalMainTabIcon">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>

      <div className="globalMainActions">
        <Link href="/search" className={matches(pathname, "/search") ? "active" : ""} aria-label="Search"><span>⌕</span><small>Search</small></Link>
        <Link href="/notifications" className={matches(pathname, "/notifications") ? "active" : ""} aria-label="Notifications"><span>◉</span><small>Alerts</small></Link>
      </div>
    </header>
  );
}
