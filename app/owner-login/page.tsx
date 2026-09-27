"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const OWNER_EMAIL = "msgray95@hotmail.com";

export default function OwnerLoginPage(){
  const [email,setEmail]=useState(OWNER_EMAIL);
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>{let active=true;const c=getSupabaseBrowserClient();c.auth.getSession().then(({data})=>{if(active&&data.session)finish();});return()=>{active=false};},[]);

  async function finish(){
    const c=getSupabaseBrowserClient();setBusy(true);setMessage("");
    try{
      const {data:auth,error:authError}=await c.auth.getUser();
      if(authError||!auth.user)throw authError||new Error("Unable to verify the signed-in account.");
      const {data:platform,error}=await c.from("platform_admins").select("user_id").eq("user_id",auth.user.id).maybeSingle();
      if(error)throw error;
      if(!platform){setMessage("This account is signed in, but it is not a Platform Admin account.");setBusy(false);return;}
      window.location.replace("/owner-portal");
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to complete owner sign-in.");setBusy(false);}
  }

  async function passwordSignIn(e:FormEvent){
    e.preventDefault();const c=getSupabaseBrowserClient();setBusy(true);setMessage("");
    const {error}=await c.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(error){const raw=error.message||"Unable to sign in.";setMessage(raw.toLowerCase().includes("invalid login credentials")?"That password was not accepted. Use the email sign-in link below or reset your password.":raw);setBusy(false);return;}
    await finish();
  }

  async function magicLink(){
    const value=email.trim().toLowerCase();if(!value){setMessage("Enter your email address first.");return;}
    const c=getSupabaseBrowserClient();setBusy(true);setMessage("");
    const {error}=await c.auth.signInWithOtp({email:value,options:{emailRedirectTo:`${window.location.origin}/owner-login`,shouldCreateUser:false}});
    setBusy(false);
    setMessage(error?error.message:"Owner sign-in link sent. Open the email on this device and you will be taken to the Owner Portal.");
  }

  async function reset(){
    const value=email.trim().toLowerCase();if(!value){setMessage("Enter your email address first.");return;}
    const c=getSupabaseBrowserClient();setBusy(true);setMessage("");
    const {error}=await c.auth.resetPasswordForEmail(value,{redirectTo:`${window.location.origin}/reset-password`});
    setBusy(false);
    setMessage(error?error.message:"Password reset email sent. Open it to choose a new password.");
  }

  async function signOut(){const c=getSupabaseBrowserClient();await c.auth.signOut();setMessage("Signed out. You can now sign in again as Platform Owner.");}

  return <main className="phasePage authPhasePage schoolAuthPage adminLoginPage">
    <section className="phaseHero compactHero adminLoginHero"><span className="eyebrow">TEACHING CPD · PLATFORM OWNER</span><h1>Owner sign in</h1><p>This login is completely separate from school-domain access. Your personal Platform Admin email can sign in here even though it is not a school email.</p><div className="schoolAuthTrust"><span>✓ No school domain required</span><span>✓ Platform Admin only</span><span>✓ Direct Owner Portal access</span></div></section>
    <section className="phaseCard authCard schoolAuthCard adminLoginCard">
      <div className="schoolAuthHeading"><span className="eyebrow">OWNER ACCESS</span><h2>Sign in to the platform control centre</h2><p>Your account is checked against Platform Admin permissions only. School subscription/domain checks do not apply on this route.</p></div>
      <form className="schoolFallbackForm" onSubmit={passwordSignIn}><label>Owner email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input required minLength={8} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary full" disabled={busy}>{busy?"Checking owner access…":"Sign in to Owner Portal"}</button></form>
      <div className="passwordHelpActions"><button type="button" className="secondary" disabled={busy} onClick={magicLink}>Email me an owner sign-in link</button><button type="button" className="textButton" disabled={busy} onClick={reset}>Reset password</button></div>
      {message&&<div className="feedback" role="status">{message}</div>}
      <div className="adminLoginLinks"><a href="/auth">Staff / school sign in</a><a href="/admin-login">School Admin sign in</a><button className="textButton" type="button" onClick={signOut}>Sign out current account</button></div>
    </section>
  </main>;
}
