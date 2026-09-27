"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { claimSchoolAccess, safeNextPath } from "@/lib/schoolAccess";

type PasswordMode = "signin" | "signup";

export default function AuthPage() {
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("signin");
  const [showFallback, setShowFallback] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) finishSchoolAccess();
    });
    return () => { active = false; };
  }, []);

  async function finishSchoolAccess() {
    const supabase = getSupabaseBrowserClient();
    try {
      const access = await claimSchoolAccess(supabase);
      if (access.allowed) {
        window.location.replace(nextPath());
        return;
      }
      window.location.replace(`/access?reason=${encodeURIComponent(access.reason)}&next=${encodeURIComponent(nextPath())}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Access check failed.";
      window.location.replace(`/access?reason=access_check_failed&detail=${encodeURIComponent(detail)}&next=${encodeURIComponent(nextPath())}`);
    }
  }

  async function schoolOAuth(provider: "google" | "azure") {
    const supabase = getSupabaseBrowserClient();
    setBusy(true);
    setMessage("");
    try {
      const redirectTo = `${window.location.origin}/auth?next=${encodeURIComponent(nextPath())}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          ...(provider === "azure" ? { scopes: "email" } : {}),
        },
      });
      if (error) throw error;
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Unable to start school sign-in.";
      setMessage(raw.toLowerCase().includes("provider") && raw.toLowerCase().includes("enabled")
        ? "That school sign-in provider is not enabled on this installation yet. A platform administrator needs to finish the Google/Microsoft OAuth provider setup."
        : raw);
      setBusy(false);
    }
  }

  async function passwordSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    setBusy(true);
    setMessage("");
    try {
      if (passwordMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        await finishSchoolAccess();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim(), department: department.trim() } },
        });
        if (error) throw error;
        if (data.session) await finishSchoolAccess();
        else setMessage("Account created. Confirm your school email, then return here to sign in. If your school has an active subscription and verified domain, access will be granted automatically without an invitation.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to authenticate.");
    } finally {
      setBusy(false);
    }
  }

  function openAccountCreation(){setShowFallback(true);setPasswordMode("signup");setMessage("");}

  return <main className="phasePage authPhasePage schoolAuthPage">
    <section className="phaseHero compactHero schoolAuthHero">
      <span className="eyebrow">TEACHING CPD · SCHOOL ACCESS</span>
      <h1>Use your school account.</h1>
      <p>If your school has purchased the School plan, any member of staff using its verified school email domain can create an account and join automatically. No individual invitation code is required.</p>
      <div className="schoolAccessFlow" aria-label="School access process">
        <span><b>1</b> School subscription</span><i>→</i><span><b>2</b> Verified domain</span><i>→</i><span><b>3</b> Staff creates/signs into account</span><i>→</i><span><b>4</b> Automatic school access</span>
      </div>
      <div className="schoolAuthTrust"><span>✓ Whole-school access</span><span>✓ School-scoped data</span><span>✓ Admin-controlled roles</span></div>
    </section>

    <section className="phaseCard authCard schoolAuthCard">
      {!hasSupabaseConfig() && <div className="phaseNotice">The authentication service is not connected.</div>}
      <div className="schoolAuthHeading"><span className="eyebrow">STAFF SIGN IN / CREATE ACCOUNT</span><h2>Continue with your school identity</h2><p>First time here? Choosing Google or Microsoft creates your account automatically when your school identity is accepted.</p></div>
      <button type="button" className="schoolProviderButton google" disabled={busy} onClick={() => schoolOAuth("google")}><span className="providerMark">G</span><span><strong>Continue with Google</strong><small>Google Workspace school account</small></span></button>
      <button type="button" className="schoolProviderButton microsoft" disabled={busy} onClick={() => schoolOAuth("azure")}><span className="providerMark microsoftMark"><i/><i/><i/><i/></span><span><strong>Continue with Microsoft</strong><small>Microsoft 365 / Entra school account</small></span></button>

      <div className="schoolDomainRule"><strong>No invite needed for subscribed schools</strong><p>Once the school domain is verified and the subscription is active, any confirmed staff email on that domain can join. New users start with Staff access unless a School Admin gives them a higher role.</p></div>

      <div className="schoolAccountActions"><button className="secondary" type="button" onClick={openAccountCreation}>Create account with school email</button><a className="textButton" href="/admin-login">School Admin sign in</a></div>
      <button className="textButton schoolFallbackToggle" type="button" onClick={() => { setShowFallback(v => !v); if(!showFallback)setPasswordMode("signin"); setMessage(""); }}>{showFallback ? "Hide email/password options" : "Use email/password fallback"}</button>
      {showFallback && <form className="schoolFallbackForm" onSubmit={passwordSubmit}>
        {passwordMode === "signup" && <>
          <label>Full name<input required value={name} onChange={e => setName(e.target.value)} /></label>
          <label>Department<input required value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Science" /></label>
        </>}
        <label>School email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@school.org" /></label>
        <label>Password<input required minLength={8} type="password" autoComplete={passwordMode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="primary full" disabled={busy}>{busy ? "Checking access…" : passwordMode === "signin" ? "Sign in with email" : "Create school account"}</button>
        <button className="textButton" type="button" onClick={() => { setPasswordMode(passwordMode === "signin" ? "signup" : "signin"); setMessage(""); }}>{passwordMode === "signin" ? "Create a new school account" : "Already have a password account?"}</button>
      </form>}

      {message && <div className="feedback" role="status">{message}</div>}
      <p className="schoolAuthFinePrint">Personal email addresses do not grant access to a subscribed school. School access is based on the confirmed email domain and the school's active subscription.</p>
    </section>
  </main>;
}

function nextPath() {
  if (typeof window === "undefined") return "/";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}
