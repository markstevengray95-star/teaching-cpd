"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function DevelopmentDock() {
  const pathname = usePathname();
  const [role, setRole] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    let active = true;
    (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) return;
      const { data } = await client.from("staff_profiles").select("role").eq("id", auth.user.id).maybeSingle();
      if (active && data?.role) setRole(data.role);
    })();
    return () => { active = false; };
  }, []);

  if (pathname.startsWith("/auth") || pathname.startsWith("/join")) return null;

  const links: [string,string][] = [
    ["/", "Home"],
    ["/training", "My training"],
    ["/needs-audit", "Needs audit"],
    ["/coach", "CPD Coach"],
    ["/coaching", "Coaching"],
    ["/pathways", "Pathways"],
    ["/portfolio", "Portfolio"],
    ["/external-cpd", "External CPD"],
    ["/actions", "Action plans"],
    ["/organisation", "Organisation"],
    ["/accessibility", "App settings"],
  ];
  if (["Department Lead", "CPD Lead", "Admin"].includes(role)) links.push(["/leadership", "Leadership"]);
  if (["CPD Lead", "Admin"].includes(role)) {
    links.push(["/quality", "Annual CPD & QA"]);
    links.push(["/admin", "CPD admin"]);
    links.push(["/builder", "Course creator"]);
  }

  return <nav className="developmentDock" aria-label="Professional development navigation">
    {links.map(([href, label]) => <a key={href} href={href} className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""}>{label}</a>)}
  </nav>;
}
