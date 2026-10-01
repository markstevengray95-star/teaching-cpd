"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./RemainingPhases.css";

export default function GoogleIntegrationsHub() {
  const client = getSupabaseBrowserClient();
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [role,setRole]=useState<StaffRole>("teacher");
  const [googleConnected,setGoogleConnected]=useState(false);
  const [email,setEmail]=useState("");

  async function load(){
    setLoading(true);setMessage("");
    const {data:auth}=await client.auth.getUser();
    if(!auth.user){setMessage("Sign in to manage integrations.");setLoading(false);return;}
    const access=await resolveStaffAccess(client,auth.user);setRole(access.role);
    setEmail(auth.user.email||"");
    setGoogleConnected(Boolean(auth.user.identities?.some((identity)=>identity.provider==="google")||auth.user.app_metadata?.provider==="google"));
    setLoading(false);
  }
  useEffect(()=>{void load();},[]);

  async function connectGoogle(){
    const redirectTo=`${window.location.origin}/integrations`;
    const {error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo}});
    if(error)setMessage(error.message);
  }

  return <main className="rpShell">
    <header className="rpTopbar"><Link href="/dashboard" className="rpBrand"><span>SD</span><strong>Staff Development</strong></Link><nav><Link href="/integrations">Integrations</Link><Link href="/calendar">Calendar</Link><Link href="/resource-library">Drive resources</Link></nav><span className="rpRole">{STAFF_ROLE_LABELS[role]}</span></header>
    <section className="rpHero"><div><span>PHASE 67 · GOOGLE INTEGRATIONS</span><h1>Google Workspace Integrations</h1><p>Use the existing Google sign-in, calendar export and Drive-linked resource workflows from one clear integration page.</p></div>{!googleConnected&&<button onClick={()=>void connectGoogle()}>Connect Google account</button>}</section>
    {message&&<div className="rpMessage">{message}</div>}
    {loading?<section className="rpEmpty">Checking Google connection…</section>:<>
      <section className="rpStats"><article><strong>{googleConnected?"Connected":"Not linked"}</strong><span>Google sign-in</span></article><article><strong>{email||"—"}</strong><span>Signed-in account</span></article><article><strong>ICS</strong><span>Calendar export</span></article><article><strong>Drive links</strong><span>Resource-library support</span></article></section>
      <section className="rpCompactGrid">
        <article className="rpPanel"><div className="rpPills"><span>{googleConnected?"Connected":"Optional"}</span></div><h2>Google sign-in</h2><p>The platform can use the Google identity provider already configured in Supabase for school account sign-in.</p>{!googleConnected&&<button onClick={()=>void connectGoogle()}>Connect with Google</button>}</article>
        <article className="rpPanel"><h2>Google Calendar</h2><p>The School Calendar can export events as standard <strong>.ics</strong> files, which can be added to Google Calendar without exposing a long-lived Google token to the browser.</p><Link href="/calendar">Open School Calendar →</Link></article>
        <article className="rpPanel"><h2>Google Drive resources</h2><p>Paste Google Drive or Docs links into the Resource Library and Policy Centre so staff can find them through Universal Search and the School AI source index.</p><Link href="/resource-library">Open Resource Library →</Link></article>
        <article className="rpPanel"><h2>Google Classroom</h2><p>Classroom-specific posting is kept separate from staff authentication. The integration hub is ready for a future server-side Classroom connector without storing provider refresh tokens in the client.</p><Link href="/admin-centre">Open integration readiness →</Link></article>
        <article className="rpPanel" style={{gridColumn:"span 2"}}><h2>Security boundary</h2><p>Basic Google authentication is active. Direct Drive/Calendar/Classroom API write access is intentionally not requested here because those scopes require secure server-side token handling and administrator consent. Existing calendar export and Drive-link workflows work without that extra access.</p></article>
      </section>
    </>}
  </main>;
}
