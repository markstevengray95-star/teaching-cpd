"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./MobilePlatformDock.css";

const hiddenPrefixes = ["/auth", "/reset-password", "/admin-login", "/owner-login", "/verify", "/join", "/access-denied"];
const items = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/teach", label: "Teach", icon: "✦" },
  { href: "/students", label: "Students", icon: "◉" },
  { href: "/sen", label: "SEN", icon: "◇" },
  { href: "/develop", label: "Develop", icon: "↗" },
  { href: "/school", label: "School", icon: "▦" },
  { href: "/resources", label: "Resources", icon: "▤" },
];

const routeGroups: Record<string, string[]> = {
  "/teach": ["/teaching-learning", "/resource-generator", "/department-hub", "/curriculum", "/subject-cpd", "/standards", "/learning-walks", "/department-cpd"],
  "/students": ["/pastoral", "/regulation-behaviour", "/interventions", "/regulation-room", "/zones", "/zone-quest", "/zones-school", "/zones-cpd"],
  "/sen": ["/send-eal"],
  "/develop": ["/professional-learning", "/portfolio", "/coaching", "/appraisal", "/cpd", "/micro-cpd", "/pathways", "/training", "/development", "/actions", "/impact", "/recommendations", "/needs-audit", "/external-cpd", "/certificates", "/reading", "/adaptive", "/ai-coach", "/coach"],
  "/school": ["/calendar", "/notices", "/directory", "/school-improvement", "/department-plans", "/forms", "/trips", "/compliance", "/induction", "/leadership-dashboard", "/department-analytics", "/recognition", "/staff-voice", "/notifications", "/integrations", "/admin-centre", "/organisation", "/school-hub", "/departments", "/improvement", "/leadership", "/school-access", "/staff-access", "/staff-sync", "/launch-readiness", "/platform", "/owner-portal", "/admin"],
  "/resources": ["/resource-library", "/policies", "/search", "/school-assistant", "/files", "/knowledge-base", "/safeguarding", "/policy-training", "/course-packs", "/help", "/accessibility"],
};

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function activeFor(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/" || matches(pathname, href);
  return matches(pathname, href) || (routeGroups[href] || []).some((prefix) => matches(pathname, prefix));
}

export default function MobilePlatformDock() {
  const pathname = usePathname();
  if (hiddenPrefixes.some((prefix) => matches(pathname, prefix))) return null;
  return <nav className="mobilePlatformDock" aria-label="Main areas">
    {items.map((item) => {
      const active = activeFor(pathname, item.href);
      return <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><span>{item.icon}</span><small>{item.label}</small></Link>;
    })}
  </nav>;
}
