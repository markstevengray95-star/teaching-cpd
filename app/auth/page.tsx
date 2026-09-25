"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = nextPath();
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("The production database is not connected yet. Phase 2 code is ready and will activate once Supabase environment variables are added.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = nextPath();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, department } },
        });
        if (error) throw error;
        if (data.session) window.location.href = nextPath();
        else setMessage("Account created. Check your email to confirm the account, then sign in.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to authenticate.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="phasePage authPhasePage">
    <section className="phaseHero compactHero">
      <a className="phaseBack" href="/">← Teaching CPD</a>
      <span className="eyebrow">SECURE STAFF ACCESS</span>
      <h1>{mode === "signin" ? "Sign in to your CPD account" : "Create your staff CPD account"}</h1>
      <p>Production accounts use Supabase authentication. New accounts start with the Staff role; leadership permissions are assigned separately.</p>
    </section>
    <form className="phaseCard authCard" onSubmit={submit}>
      {!hasSupabaseConfig() && <div className="phaseNotice">Backend connection pending. This screen is already wired and will become live once the new CPD Supabase project is connected.</div>}
      {mode === "signup" && <>
        <label>Full name<input required value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Department<input required value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Science" /></label>
      </>}
      <label>Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input required minLength={8} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
      {message && <div className="feedback">{message}</div>}
      <button className="primary full" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      <button className="textButton" type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
        {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
    </form>
  </main>;
}

function nextPath() {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") ? next : "/";
}
