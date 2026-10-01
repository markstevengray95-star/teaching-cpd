"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { claimSchoolAccess, safeNextPath } from "@/lib/schoolAccess";

type PasswordMode = "signin" | "signup";
type UsernameSession = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user_id?: string;
  error?: string;
};

const STAFF_DEVELOPMENT_ORIGIN = "https://schoolcpd.vercel.app";

export default function AuthPage() {
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("signin");
  const [showFallback, setShowFallback] = useState(false);
  const [identity, setIdentity] = useState("");
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
    if (oauthError) setMessage(formatOAuthError(oauthError));
    if (params.get("login") === "username") setShowFallback(true);

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

        const managed = auth.user.app_metadata?.platform_managed_user === true || auth.user.app_metadata?.platform_test_user === true;
        if (managed) {
          const managedAccess = String(auth.user.app_metadata?.platform_managed_access || "admin");
          if (managedAccess === "disabled") {
            window.location.replace(`/access?reason=access_disabled&next=${encodeURIComponent(nextPath())}`);
            return;
          }
          window.location.replace(nextPath());
          return;
        }
      }

      const access = await claimSchoolAccess(supabase);
      if (access.allowed) {
        const target = nextPath();
        if (auth.user?.user_metadata?.username_setup_pending === true && !target.startsWith("/account/username")) {
          window.location.replace(`/account/username?next=${encodeURIComponent(target)}`);
          return;
        }
        window.location.replace(target);
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
        const value = identity.trim();
        if (value.includes("@")) {
          const { error } = await supabase.auth.signInWithPassword({ email: value, password });
          if (error) throw error;
        } else {
          const username = normaliseUsername(value);
          const { data, error } = await supabase.functions.invoke<UsernameSession>("username-login", {
            body: { username, password },
          });
          if (error || !data?.access_token || !data?.refresh_token) {
            throw new Error("That email/username and password combination was not accepted.");
          }
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          if (sessionError) throw sessionError;
        }
        await finishAccess();
      } else {
        const email = identity.trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim(), department: department.trim(), username_setup_pending: true },
            emailRedirectTo: `${appOrigin()}/auth?next=${encodeURIComponent(nextPath())}`,
          },
        });
        if (error) throw error;
        if (data.session) await finishAccess();
        else setMessage("Account created. Confirm your school email, then sign in. After your first successful sign-in you can choose an optional username for quicker future access.");
      }
    } catch (error) {
      finishingAccess.current = false;
      const raw = error instanceof Error ? error.message : "Unable to authenticate.";
      setMessage(raw.toLowerCase().includes("invalid login credentials")
        ? "That email/username and password combination was not accepted. You can still use an email sign-in link or reset your password with your email address."
        : raw);
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink(){
    const value=identity.trim();
    if(!value || !value.includes("@")){setShowFallback(true);setMessage("Enter your email address (not your username) first, then choose ‘Email me a sign-in link’.");return;}
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
    const value=identity.trim();
    if(!value || !value.includes("@")){setShowFallback(true);setMessage("Enter your email address (not your username) first, then choose ‘Reset password’.");return;}
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
      <p>If your school has purchased the School plan, any member of staff using its verified school email domain can create an account and join automatically. After signup, staff can also choose a username and use that instead of their email when signing in.</p>
      <div className="schoolAccessFlow" aria-label="School access process">
        <span><b>1</b> School subscription</span><i>→</i><span><b>2</b> Verified domain</span><i>→</i><span><b>3</b> Staff creates/signs into account</span><i>→</i><span><b>4</b> Automatic school access</span>
      </div>
      <div className="schoolAuthTrust"><span>✓ Email or username login</span><span>✓ School-scoped data</span><span>✓ Admin-controlled roles</span></div>
    </section>

    <section className="phaseCard authCard schoolAuthCard">
      {!hasSupabaseConfig() && <div className="phaseNotice">The authentication service is not connected.</div>}
      <div className="schoolAuthHeading"><span className="eyebrow">STAFF SIGN IN / CREATE ACCOUNT</span><h2>Continue with your school identity</h2><p>First time here? Create an account with your school email. Once it is confirmed, you can choose a username for future sign-ins.</p></div>
      <button type="button" className="schoolProviderButton google" disabled={busy} onClick={() => schoolOAuth("google")}><span className="providerMark">G</span><span><strong>Continue with Google</strong><small>Google Workspace school account</small></span></button>
      <button type="button" className="schoolProviderButton microsoft" disabled={busy} onClick={() => schoolOAuth("azure")}><span className="providerMark microsoftMark"><i/><i/><i/><i/></span><span><strong>Continue with Microsoft</strong><small>Microsoft 365 / Entra school account</small></span></button>

      <div className="schoolDomainRule"><strong>Username sign-in is supported</strong><p>Staff can sign in with their school email or a unique username. Accounts created by the Platform Owner under Managed logins are already authorised and enter the site directly without school-domain verification.</p></div>

      <div className="schoolAccountActions"><button className="secondary" type="button" onClick={openAccountCreation}>Create account with school email</button><a className="textButton" href="/admin-login">School Admin sign in</a><a className="textButton" href="/owner-login">Platform Owner sign in</a></div>
      <button className="textButton schoolFallbackToggle" type="button" onClick={() => { setShowFallback(v => !v); if(!showFallback)setPasswordMode("signin"); setMessage(""); }}>{showFallback ? "Hide password sign in" : "Use email or username + password"}</button>
      {showFallback && <form className="schoolFallbackForm" onSubmit={passwordSubmit}>
        {passwordMode === "signup" && <>
          <label>Full name<input required value={name} onChange={e => setName(e.target.value)} /></label>
          <label>Department<input required value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Science" /></label>
        </>}
        <label>{passwordMode === "signin" ? "Email or username" : "School email"}<input required type={passwordMode === "signin" ? "text" : "email"} autoComplete={passwordMode === "signin" ? "username" : "email"} autoCapitalize="none" autoCorrect="off" value={identity} onChange={e => setIdentity(e.target.value)} placeholder={passwordMode === "signin" ? "name@school.org or username" : "name@school.org"} /></label>
        <label>Password<input required minLength={8} type="password" autoComplete={passwordMode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="primary full" disabled={busy}>{busy ? "Checking access…" : passwordMode === "signin" ? "Sign in" : "Create school account"}</button>
        {passwordMode==="signin"&&<div className="passwordHelpActions"><button type="button" className="secondary" disabled={busy} onClick={sendMagicLink}>Email me a sign-in link</button><button type="button" className="textButton" disabled={busy} onClick={resetPassword}>Reset password</button></div>}
        <button className="textButton" type="button" onClick={() => { setPasswordMode(passwordMode === "signin" ? "signup" : "signin"); setMessage(""); }}>{passwordMode === "signin" ? "Create a new school account" : "Already have an account?"}</button>
      </form>}

      {message && <div className="feedback" role="status">{message}</div>}
      <p className="schoolAuthFinePrint">Email remains attached to normal school accounts for confirmation, password resets and school-domain access. Platform Owner-created managed usernames are pre-authorised and use the access level you assign.</p>
    </section>
  </main>;
}

function normaliseUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
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
