"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type TestLoginResult = {
  ok?: boolean;
  created?: boolean;
  username?: string;
  display_name?: string;
  access?: string;
  error?: string;
};

export default function TestLoginsPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUsername, setLastUsername] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.replace(`/auth?next=${encodeURIComponent("/test-logins")}`);
        return;
      }
      const { data, error } = await client.from("platform_admins").select("user_id").eq("user_id", auth.user.id).maybeSingle();
      if (!active) return;
      if (error) setMessage(error.message);
      setAllowed(Boolean(data));
    })();
    return () => { active = false; };
  }, []);

  async function createTestLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const username = String(fields.get("username") || "").trim().toLowerCase().replace(/\s+/g, "");
    const password = String(fields.get("password") || "");
    const displayName = String(fields.get("display_name") || "").trim();

    setBusy(true);
    setMessage("");
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.functions.invoke<TestLoginResult>("manage-test-login", {
      body: { username, password, display_name: displayName },
    });
    setBusy(false);

    if (error) {
      setMessage(error.message || "Unable to create the test login.");
      return;
    }
    if (!data?.ok) {
      setMessage(data?.error || "Unable to create the test login.");
      return;
    }

    setLastUsername(data.username || username);
    setMessage(data.created
      ? `Test login created for ${data.username}. It now has full test-school Admin access.`
      : `Test login ${data.username} already existed. Its password and full test-school Admin access have been refreshed.`);
  }

  if (allowed === null) return <main className="stagePage"><div className="stageCard">Checking Platform Owner access…</div></main>;
  if (!allowed) return <main className="stagePage"><section className="stageHero"><span className="eyebrow">TEST LOGINS</span><h1>Platform Owner access required.</h1><p>Only the platform owner can create unrestricted product test accounts.</p></section></main>;

  return <main className="stagePage testLoginsPage">
    <section className="stageHero">
      <span className="eyebrow">PLATFORM OWNER · TEST ACCOUNTS</span>
      <h1>Create username/password logins for demos and testing.</h1>
      <p>Each login is a real Supabase account in a dedicated Platform Test School. It receives School Admin access, the full CPD catalogue, all school/product features and unrestricted course sections without being able to manage real customer schools from the Platform Owner console.</p>
      <div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/owner-portal">Back to Owner Portal</a><a className="secondary phaseLinkButton" href="/test-login">Open test sign-in</a></div>
    </section>

    {message && <div className="phaseNotice" role="status">{message}</div>}

    <section className="stageGrid">
      <div className="stageCard stageSpan7">
        <span className="eyebrow">CREATE / RESET LOGIN</span>
        <h2>Set the username and password</h2>
        <form className="stageForm" onSubmit={createTestLogin}>
          <label>Display name<input name="display_name" required placeholder="e.g. Demo Teacher" /></label>
          <label>Username<input name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,31}" autoCapitalize="none" autoCorrect="off" autoComplete="off" placeholder="e.g. demo.school" /></label>
          <label>Password<input name="password" required minLength={8} type="password" autoComplete="new-password" placeholder="At least 8 characters" /></label>
          <button className="primary" disabled={busy}>{busy ? "Creating login…" : "Create / reset full-access test login"}</button>
        </form>
      </div>

      <div className="stageCard stageSpan5">
        <span className="eyebrow">HOW IT WORKS</span>
        <h2>Safe full-access testing</h2>
        <div className="schoolAccessSteps">
          <div><span>1</span><strong>Create credentials</strong><p>Choose any available username and a password of at least eight characters.</p></div>
          <div><span>2</span><strong>Share the test-login page</strong><p>The tester signs in with the username and password only; no email confirmation is required.</p></div>
          <div><span>3</span><strong>Explore all product features</strong><p>The account is a School Admin inside the isolated test organisation, so it does not touch a real school's data.</p></div>
        </div>
        {lastUsername && <div className="domainSecurityNote"><strong>Latest test username</strong><p>{lastUsername}</p><a className="primary phaseLinkButton" href="/test-login">Try this login</a></div>}
      </div>
    </section>
  </main>;
}
