"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { claimSchoolAccess } from "@/lib/schoolAccess";

type UsernameSession = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user_id?: string;
  error?: string;
};

export default function TestLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    client.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/");
    });
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const client = getSupabaseBrowserClient();
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");

    try {
      const { data, error } = await client.functions.invoke<UsernameSession>("username-login", {
        body: { username: cleanUsername, password },
      });
      if (error) throw error;
      if (!data?.access_token || !data?.refresh_token) throw new Error(data?.error || "The username or password was not accepted.");

      const { error: sessionError } = await client.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) throw sessionError;

      const access = await claimSchoolAccess(client);
      if (!access.allowed) throw new Error("The test account signed in, but its full-access school entitlement could not be confirmed.");
      window.location.replace("/");
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Unable to sign in.";
      setMessage(raw.toLowerCase().includes("edge function") ? "The username or password was not accepted." : raw);
      await client.auth.signOut().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  return <main className="phasePage authPhasePage schoolAuthPage">
    <section className="phaseHero compactHero schoolAuthHero">
      <span className="eyebrow">TEACHING CPD · TEST ACCESS</span>
      <h1>Test login</h1>
      <p>Use a username and password created by the Platform Owner. Test accounts open the full product inside an isolated test school.</p>
      <div className="schoolAuthTrust"><span>✓ Full CPD catalogue</span><span>✓ School Admin tools</span><span>✓ All course sections unlocked</span></div>
    </section>

    <section className="phaseCard authCard schoolAuthCard">
      <div className="schoolAuthHeading"><span className="eyebrow">USERNAME / PASSWORD</span><h2>Open the test environment</h2><p>No email address or email confirmation is needed for an owner-created test login.</p></div>
      <form className="schoolFallbackForm" onSubmit={signIn}>
        <label>Username<input required minLength={3} maxLength={32} autoComplete="username" autoCapitalize="none" autoCorrect="off" value={username} onChange={event => setUsername(event.target.value)} placeholder="e.g. demo.school" /></label>
        <label>Password<input required minLength={8} type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
        <button className="primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in with test login"}</button>
      </form>
      {message && <div className="feedback" role="status">{message}</div>}
      <div className="adminLoginLinks"><a href="/auth">Use normal school sign in</a></div>
    </section>
  </main>;
}
