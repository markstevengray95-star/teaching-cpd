"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { claimSchoolAccess } from "@/lib/schoolAccess";

export default function AdminLoginPage(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{let active=true;const c=getSupabaseBrowserClient();c.auth.getSession().then(({data})=>{if(active&&data.session)finishAdminAccess();});return()=>{active=false};},[]);

  async function finishAdminAccess(){
    const c=getSupabaseBrowserClient();
    setBusy(true);setMessage("");
    try{
      const access=await claimSchoolAccess(c);
      if(!access.allowed){window.location.replace(`/access?reason=${encodeURIComponent(access.reason)}&next=${encodeURIComponent("/staff-access")}`);return;}
      const {data:auth}=await c.auth.getUser();
      if(!auth.user)throw new Error("Unable to confirm the signed-in account.");
      const {data:profile,error}=await c.from("staff_profiles").select("role").eq("id",auth.user.id).single();
      if(error)throw error;
      if(profile?.role!=="Admin"){
        setMessage(`This school account is valid, but it currently has ${profile?.role||"Staff"} access rather than School Admin access. Ask an existing School Admin to promote this account.`);
        setBusy(false);return;
      }
      window.location.replace("/staff-access");
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to complete School Admin sign-in.");setBusy(false);}
  }

  async function schoolOAuth(provider:"google"|"azure"){
    const c=getSupabaseBrowserClient();setBusy(true);setMessage("");
    try{
      const {error}=await c.auth.signInWithOAuth({provider,options:{redirectTo:`${window.location.origin}/admin-login`,...(provider==="azure"?{scopes:"email"}:{})}});
      if(error)throw error;
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to start School Admin sign-in.");setBusy(false);}
  }

  async function passwordSignIn(e:FormEvent){
    e.preventDefault();const c=getSupabaseBrowserClient();setBusy(true);setMessage("");
    const {error}=await c.auth.signInWithPassword({email:email.trim(),password});
    if(error){setMessage(error.message);setBusy(false);return;}await finishAdminAccess();
  }

  async function signOut(){const c=getSupabaseBrowserClient();await c.auth.signOut();setMessage("Signed out. You can now use a different School Admin account.");}

  return <main className="phasePage authPhasePage schoolAuthPage adminLoginPage">
    <section className="phaseHero compactHero adminLoginHero"><span className="eyebrow">TEACHING CPD · SCHOOL ADMIN</span><h1>School Admin sign in</h1><p>Use your own school identity. There is no shared admin password: Admin access is attached to an individual staff account and can be changed by another School Admin.</p><div className="schoolAuthTrust"><span>✓ Individual administrator accounts</span><span>✓ Audit-logged permission changes</span><span>✓ School-scoped access</span></div></section>
    <section className="phaseCard authCard schoolAuthCard adminLoginCard">
      {!hasSupabaseConfig()&&<div className="phaseNotice">The authentication service is not connected.</div>}
      <div className="schoolAuthHeading"><span className="eyebrow">ADMIN ACCESS</span><h2>Continue with your school administrator account</h2><p>The nominated purchaser is promoted to School Admin on their first verified school sign-in. Existing Admins can then promote other staff.</p></div>
      <button type="button" className="schoolProviderButton google" disabled={busy} onClick={()=>schoolOAuth("google")}><span className="providerMark">G</span><span><strong>Continue with Google</strong><small>Google Workspace school account</small></span></button>
      <button type="button" className="schoolProviderButton microsoft" disabled={busy} onClick={()=>schoolOAuth("azure")}><span className="providerMark microsoftMark"><i/><i/><i/><i/></span><span><strong>Continue with Microsoft</strong><small>Microsoft 365 / Entra school account</small></span></button>
      <div className="adminLoginDivider"><span>or use the password fallback</span></div>
      <form className="schoolFallbackForm" onSubmit={passwordSignIn}><label>School email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@school.org.uk"/></label><label>Password<input required minLength={8} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary full" disabled={busy}>{busy?"Checking Admin access…":"Sign in as School Admin"}</button></form>
      {message&&<div className="feedback" role="status">{message}</div>}
      <div className="adminLoginLinks"><a href="/auth">Staff sign in / create account</a><button className="textButton" type="button" onClick={signOut}>Sign out current account</button></div>
    </section>
  </main>;
}
