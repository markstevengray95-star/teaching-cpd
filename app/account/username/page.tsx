"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { safeNextPath } from "@/lib/schoolAccess";

type UsernameResult = { ok?: boolean; username?: string; error?: string };

export default function UsernameSetupPage() {
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.replace(`/auth?next=${encodeURIComponent(`/account/username?next=${encodeURIComponent(nextPath())}`)}`);
        return;
      }

      const { data, error } = await client
        .from("staff_development_profiles")
        .select("username")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) setMessage(error.message);
      const existing = String(data?.username || "");
      setCurrentUsername(existing);
      setUsername(existing);
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  async function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = normaliseUsername(username);
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(clean)) {
      setMessage("Use 3–32 characters: letters, numbers, dots, dashes or underscores. Start with a letter or number.");
      return;
    }

    const client = getSupabaseBrowserClient();
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await client.functions.invoke<UsernameResult>("set-username", { body: { username: clean } });
      if (error) throw error;
      if (!data?.ok || !data.username) throw new Error(data?.error || "Unable to save username.");
      await clearUsernamePrompt(client);
      setCurrentUsername(data.username);
      setUsername(data.username);
      window.location.replace(nextPath());
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Unable to save username.";
      setMessage(raw.toLowerCase().includes("edge function") ? "That username could not be saved. It may already be in use; try another." : raw);
    } finally {
      setBusy(false);
    }
  }

  async function skipUsername() {
    const client = getSupabaseBrowserClient();
    setBusy(true);
    setMessage("");
    try {
      await clearUsernamePrompt(client);
      window.location.replace(nextPath());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
      setBusy(false);
    }
  }

  if (!ready) return <main className="stagePage"><div className="stageCard">Preparing your account…</div></main>;

  return <main className="stagePage">
    <section className="stageHero">
      <span className="eyebrow">ACCOUNT SETUP · OPTIONAL USERNAME</span>
      <h1>Choose a simpler way to sign in.</h1>
      <p>Your school email stays attached to your account for verification, school access and password recovery. A username is an optional sign-in alias.</p>
      <div className="schoolAuthTrust"><span>✓ Sign in with email or username</span><span>✓ Same password</span><span>✓ Email still used for recovery</span></div>
    </section>

    {message && <div className="phaseNotice" role="status">{message}</div>}

    <section className="stageGrid">
      <div className="stageCard stageSpan7">
        <span className="eyebrow">{currentUsername ? "CHANGE USERNAME" : "CREATE USERNAME"}</span>
        <h2>{currentUsername ? `Current username: ${currentUsername}` : "Pick your username"}</h2>
        <p>Use 3–32 characters. Letters, numbers, dots, dashes and underscores are allowed. Usernames are unique and are not case-sensitive.</p>
        <form className="stageForm" onSubmit={saveUsername}>
          <label>Username<input required minLength={3} maxLength={32} autoComplete="username" autoCapitalize="none" autoCorrect="off" value={username} onChange={event => setUsername(event.target.value)} placeholder="e.g. j.smith" /></label>
          <button className="primary" disabled={busy}>{busy ? "Saving…" : currentUsername ? "Update username" : "Create username"}</button>
        </form>
      </div>

      <div className="stageCard stageSpan5">
        <span className="eyebrow">YOU CAN SKIP THIS</span>
        <h2>Email sign-in still works.</h2>
        <p>You do not need a username. If you skip this step, continue signing in with your school email and password. You can return to this page later to create one.</p>
        <button className="secondary" type="button" disabled={busy} onClick={skipUsername}>Skip for now</button>
      </div>
    </section>
  </main>;
}

async function clearUsernamePrompt(client: ReturnType<typeof getSupabaseBrowserClient>) {
  const { data: auth, error: userError } = await client.auth.getUser();
  if (userError || !auth.user) throw userError || new Error("Authentication required.");
  const { error } = await client.auth.updateUser({
    data: { ...(auth.user.user_metadata || {}), username_setup_pending: false },
  });
  if (error) throw error;
}

function normaliseUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function nextPath() {
  if (typeof window === "undefined") return "/";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}
