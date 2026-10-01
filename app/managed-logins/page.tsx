"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type AccessLevel = "staff" | "department_lead" | "cpd_lead" | "admin" | "disabled";

type ManagedAccount = {
  user_id: string;
  username: string;
  display_name: string;
  access_level: AccessLevel;
  access_label: string;
  active: boolean;
};

type ManagedResult = {
  ok?: boolean;
  created?: boolean;
  username?: string;
  display_name?: string;
  access_level?: AccessLevel;
  access_label?: string;
  accounts?: ManagedAccount[];
  error?: string;
};

const accessOptions: { value: AccessLevel; label: string; help: string }[] = [
  { value: "staff", label: "Staff", help: "Courses, personal CPD, portfolio and normal staff tools." },
  { value: "department_lead", label: "Department Lead", help: "Staff access plus department leadership tools." },
  { value: "cpd_lead", label: "CPD Lead", help: "Whole-school CPD leadership, assignments, compliance and course-management tools." },
  { value: "admin", label: "Full school admin", help: "All Teaching CPD school features and all course sections. No Platform Owner controls." },
  { value: "disabled", label: "Disabled", help: "The username remains saved but cannot enter the product." },
];

export default function ManagedLoginsPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [accessDrafts, setAccessDrafts] = useState<Record<string, AccessLevel>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.replace(`/auth?next=${encodeURIComponent("/managed-logins")}`);
        return;
      }
      const { data, error } = await client.from("platform_admins").select("user_id").eq("user_id", auth.user.id).maybeSingle();
      if (!active) return;
      if (error) {
        setMessage(error.message);
        setAllowed(false);
        return;
      }
      setAllowed(Boolean(data));
      if (data) await loadAccounts();
    })();
    return () => { active = false; };
  }, []);

  async function invoke(body: Record<string, unknown>) {
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.functions.invoke<ManagedResult>("manage-user-login", { body });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || "Unable to manage this login.");
    return data;
  }

  async function loadAccounts() {
    try {
      const data = await invoke({ action: "list" });
      const next = data.accounts || [];
      setAccounts(next);
      setAccessDrafts(Object.fromEntries(next.map(account => [account.username, account.access_level])));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load managed logins.");
    }
  }

  async function createLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const username = String(fields.get("username") || "").trim().toLowerCase().replace(/\s+/g, "");
    const password = String(fields.get("password") || "");
    const displayName = String(fields.get("display_name") || "").trim();
    const accessLevel = String(fields.get("access_level") || "staff") as AccessLevel;

    setBusy(true);
    setMessage("");
    try {
      const data = await invoke({ action: "upsert", username, password, display_name: displayName, access_level: accessLevel });
      setMessage(data.created
        ? `Login created for ${data.username} with ${data.access_label} access.`
        : `Login ${data.username} updated. Its password and access are now set to ${data.access_label}.`);
      form.reset();
      await loadAccounts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the login.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAccess(username: string) {
    const accessLevel = accessDrafts[username] || "staff";
    setBusy(true);
    setMessage("");
    try {
      const data = await invoke({ action: "set_access", username, access_level: accessLevel });
      setMessage(`${username} now has ${data.access_label} access.`);
      await loadAccounts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to change access.");
    } finally {
      setBusy(false);
    }
  }

  if (allowed === null) return <main className="stagePage"><div className="stageCard">Checking Platform Owner access…</div></main>;
  if (!allowed) return <main className="stagePage"><section className="stageHero"><span className="eyebrow">MANAGED LOGINS</span><h1>Platform Owner access required.</h1><p>Only the Platform Owner can create username/password accounts and choose their access.</p></section></main>;

  return <main className="stagePage managedLoginsPage">
    <section className="stageHero">
      <span className="eyebrow">PLATFORM OWNER · MANAGED LOGINS</span>
      <h1>Create username/password accounts and control exactly what they can access.</h1>
      <p>These accounts use the normal Teaching CPD sign-in page. Choose a role when you create the login, change it later, or disable access without deleting the username.</p>
      <div className="stageHeroActions"><a className="secondary phaseLinkButton" href="/owner-portal">Back to Owner Portal</a><a className="primary phaseLinkButton" href="/auth?login=username">Open sign in</a></div>
    </section>

    {message && <div className="phaseNotice" role="status">{message}</div>}

    <section className="stageGrid">
      <div className="stageCard stageSpan7">
        <span className="eyebrow">CREATE / RESET LOGIN</span>
        <h2>Set username, password and access</h2>
        <form className="stageForm" onSubmit={createLogin}>
          <label>Display name<input name="display_name" required placeholder="e.g. Alex Teacher" /></label>
          <label>Username<input name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,31}" autoCapitalize="none" autoCorrect="off" autoComplete="off" placeholder="e.g. alex.teacher" /></label>
          <label>Password<input name="password" required minLength={8} type="password" autoComplete="new-password" placeholder="At least 8 characters" /></label>
          <label>Access level<select name="access_level" defaultValue="staff">{accessOptions.filter(option => option.value !== "disabled").map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <button className="primary" disabled={busy}>{busy ? "Saving login…" : "Create / reset login"}</button>
        </form>
      </div>

      <div className="stageCard stageSpan5">
        <span className="eyebrow">ACCESS LEVELS</span>
        <h2>Choose the right permissions</h2>
        <div className="schoolAccessSteps">
          {accessOptions.map((option, index) => <div key={option.value}><span>{index + 1}</span><strong>{option.label}</strong><p>{option.help}</p></div>)}
        </div>
        <div className="domainSecurityNote"><strong>Platform Owner stays separate</strong><p>Even the Full school admin option cannot access your Platform Owner customer, billing or subscription controls.</p></div>
      </div>
    </section>

    <section className="stageCard">
      <span className="eyebrow">EXISTING MANAGED ACCOUNTS</span>
      <h2>Change access at any time</h2>
      {!accounts.length ? <p>No managed username accounts have been created yet.</p> : <div className="managedAccountList">
        {accounts.map(account => <div className="managedAccountRow" key={account.user_id}>
          <div><strong>{account.display_name}</strong><p>@{account.username}</p></div>
          <label>Access<select value={accessDrafts[account.username] || account.access_level} onChange={event => setAccessDrafts(current => ({ ...current, [account.username]: event.target.value as AccessLevel }))}>{accessOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <button className="secondary" disabled={busy || (accessDrafts[account.username] || account.access_level) === account.access_level} onClick={() => saveAccess(account.username)}>Save access</button>
        </div>)}
      </div>}
    </section>
  </main>;
}
