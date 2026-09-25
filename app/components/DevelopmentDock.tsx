"use client";

import { usePathname } from "next/navigation";

export default function DevelopmentDock() {
  const pathname = usePathname();
  if (pathname.startsWith("/auth") || pathname.startsWith("/join")) return null;

  const links = [
    ["/", "Home"],
    ["/pathways", "Pathways"],
    ["/portfolio", "Portfolio"],
    ["/actions", "Action plans"],
    ["/leadership", "Leadership"],
  ] as const;

  return <nav className="developmentDock" aria-label="Professional development navigation">
    {links.map(([href, label]) => <a key={href} href={href} className={pathname === href ? "active" : ""}>{label}</a>)}
  </nav>;
}
