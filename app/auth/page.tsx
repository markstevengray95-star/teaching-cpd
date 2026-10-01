"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { claimSchoolAccess, safeNextPath } from "@/lib/schoolAccess";

type PasswordMode = "signin" | "signup";

const STAFF_DEVELOPMENT_ORIGIN = "https://schoolcpd.vercel.app";

export default function AuthPage() {
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("signin");
  const [showFallback, setShowFallback] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const finishingAccess = useRef(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error_description") || params.get("error");
    if (oauthError) {
      setMessage(formatOAuthError(oauthError));
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session) return;
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        void finishAccess();
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage(error.message);
        return;
      }
      if (data.session) void finishAccess();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function finishAccess() {
    if (finishingAccess.current) return;
    finishingAccess.current = true;

    const supabase = getSupabaseBrowserClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: platform, error: platformError } = await supabase.from("platform_admins").select("user_id").eq("user_id", auth.user.id).maybeSingle();
        if (platformError) throw platformError;
        if (platform) {
          const target = nextPath();
          window.location.replace(target === "/" || target.startsWith("/access") ? "/owner-portal" : target);
          return;
        }
      }

      const access = await claimSchoolAccess(supabase);
      if (access.allowed) {
        window.location.replace(nextPath());
        return;
      }
      window.location.replace(`/access?reason=${encodeURIComponent(access.reason)}&next=${encodeURIComponent(nextPath())}`);
    } catch (error) {
      finishingAccess.current = false;
      const detail = error instanceof Error ? error.message : "Access check failed.";
      window.location.replace(`/access?reason=access_check_failed&detail=${encodeURIComponent(detail)}&next=${encodeURIComponent(nextPath())}`);
    }
  }

  async function schoolOAuth(provider: "google" | "azure") {
    const supabase = getSupabaseBrowserClient();
    setBusy(true);
    setMessage("");
    try {
      const redirectTo = `${appOrigin()}/auth?next=${encodeURIComponent(nextPath())}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
          ...(provider === "azure" ? { scopes: "email" } : {}),
        },
      });
      if (error) throw error;
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Unable to start school sign-in.";
      setMessage(formatOAuthError(raw));
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
        await finishAccess();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim(), department: department.trim() },
            emailRedirectTo: `${appOrigin()}/auth?next=${encodeURIComponent(nextPath())}`,
          },
        });
        if (error) throw error;
        if (data.session) await finishAccess();
        else setMessage("Account created. Confirm your school email, then return here to sign in. If your school has an active subscription and verified domain, access will be granted automatically without an invitation.");
      }
    } catch (error) {
      finishingAccess.current = false;
      const raw = error instanceof Error ? error.message : "Unable to authenticate.";
      setMessage(raw.toLowerCase().includes("invalid login credentials")
        ? "That email/password combination was not accepted. Use ‘Email me a sign-in link’ below or reset your password."
        : raw);
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink(){
    const value=email.trim();
    if(!value){setShowFallback(true);setMessage("Enter your email address first, then choose ‘Email me a sign-in link’.");return;}
    const supabase=getSupabaseBrowserClient();setBusy(true);setMessage("");
    try{
      const redirectTo=`${appOrigin()}/auth?next=${encodeURIComponent(nextPath())}`;
      const {error}=await supabase.auth.signInWithOtp({email:value,options:{emailRedirectTo:redirectTo,shouldCreateUser:false}});
      if(error)throw error;
      setMessage("Sign-in link sent. Open the email on this device and you’ll be returned to Teaching CPD. Platform Admin accounts then open the Owner Portal automatically.");
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to send the sign-in link.");}
    finally{setBusy(false);}
  }

  async function resetPassword(){
    const value=email.trim();
    if(!value){setShowFallback(true);setMessage("Enter your email address first, then choose ‘Reset password’.");return;}
    const supabase=getSupabaseBrowserClient();setBusy(true);setMessage("");
    try{
      const redirectTo=`${appOrigin()}/reset-password`;
      const {error}=await supabase.auth.resetPasswordForEmail(value,{redirectTo});
      if(error)throw error;
      setMessage("Password reset email sent. Open the link in that email to choose a new password.");
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to send the password reset email.");}
    finally{setBusy(false);}
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

      <div className="schoolAccountActions"><button className="secondary" type="button" onClick={openAccountCreation}>Create account with school email</button><a className="textButton" href="/admin-login">School Admin sign in</a><a className="textButton" href="/owner-login">Platform Owner sign in</a></div>
      <button className="textButton schoolFallbackToggle" type="button" onClick={() => { setShowFallback(v => !v); if(!showFallback)setPasswordMode("signin"); setMessage(""); }}>{showFallback ? "Hide email/password options" : "Use email/password fallback"}</button>
      {showFallback && <form className="schoolFallbackForm" onSubmit={passwordSubmit}>
        {passwordMode === "signup" && <>
          <label>Full name<input required value={name} onChange={e => setName(e.target.value)} /></label>
          <label>Department<input required value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Science" /></label>
        </>}
        <label>School email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@school.org" /></label>
        <label>Password<input required minLength={8} type="password" autoComplete={passwordMode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="primary full" disabled={busy}>{busy ? "Checking access…" : passwordMode === "signin" ? "Sign in with email" : "Create school account"}</button>
        {passwordMode==="signin"&&<div className="passwordHelpActions"><button type="button" className="secondary" disabled={busy} onClick={sendMagicLink}>Email me a sign-in link</button><button type="button" className="textButton" disabled={busy} onClick={resetPassword}>Reset password</button></div>}
        <button className="textButton" type="button" onClick={() => { setPasswordMode(passwordMode === "signin" ? "signup" : "signin"); setMessage(""); }}>{passwordMode === "signin" ? "Create a new school account" : "Already have a password account?"}</button>
      </form>}

      {message && <div className="feedback" role="status">{message}</div>}
      <p className="schoolAuthFinePrint">Personal email addresses do not grant access to a subscribed school. Platform Admin accounts use the dedicated Platform Owner sign-in above and bypass school-domain checks.</p>
    </section>
  </main>;
}

function nextPath() {
  if (typeof window === "undefined") return "/";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}

function appOrigin() {
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || STAFF_DEVELOPMENT_ORIGIN).replace(/\/+$/, "");
}

function formatOAuthError(raw: string) {
  const value = raw.replace(/\+/g, " ");
  const lower = value.toLowerCase();
  if (lower.includes("provider") && (lower.includes("enabled") || lower.includes("unsupported"))) {
    return "That school sign-in provider is not enabled yet. Enable the Google or Microsoft provider in the Staff Development Supabase Auth settings, then try again.";
  }
  if (lower.includes("redirect") || lower.includes("callback")) {
    return "School sign-in could not return to Staff Development. Check that https://schoolcpd.vercel.app/auth is in the Supabase Auth redirect allow list and try again.";
  }
  return value;
}
