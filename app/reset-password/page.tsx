"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ResetPasswordPage(){
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("Checking your recovery link…");

  useEffect(()=>{
    const c=getSupabaseBrowserClient();
    let active=true;
    c.auth.getSession().then(({data,error})=>{
      if(!active)return;
      if(error||!data.session){setMessage("Open the password-reset link from your email on this device. If the link has expired, return to sign in and request another one.");return;}
      setReady(true);setMessage("");
    });
    return()=>{active=false};
  },[]);

  async function save(e:FormEvent){
    e.preventDefault();
    if(password.length<8){setMessage("Use at least 8 characters for the new password.");return;}
    if(password!==confirm){setMessage("The two passwords do not match.");return;}
    const c=getSupabaseBrowserClient();setBusy(true);setMessage("");
    const {error}=await c.auth.updateUser({password});
    setBusy(false);
    if(error){setMessage(error.message);return;}
    setMessage("Password updated. Taking you back to Owner Login…");
    await c.auth.signOut();
    window.setTimeout(()=>window.location.replace("/owner-login"),600);
  }

  return <main className="phasePage authPhasePage schoolAuthPage"><section className="phaseHero compactHero schoolAuthHero"><span className="eyebrow">TEACHING CPD · ACCOUNT RECOVERY</span><h1>Choose a new password</h1><p>Use the recovery link sent to your email, then set a new password for your Teaching CPD account.</p></section><section className="phaseCard authCard schoolAuthCard"><div className="schoolAuthHeading"><span className="eyebrow">PASSWORD RESET</span><h2>Set your new password</h2></div>{ready&&<form className="schoolFallbackForm" onSubmit={save}><label>New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button className="primary full" disabled={busy}>{busy?"Updating password…":"Save new password"}</button></form>}{message&&<div className="feedback" role="status">{message}</div>}<div className="adminLoginLinks"><a href="/owner-login">Back to Owner Login</a><a href="/auth">School / staff sign in</a></div></section></main>;
}
