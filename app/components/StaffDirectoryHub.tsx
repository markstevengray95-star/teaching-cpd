"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./RemainingPhases.css";

type DirectoryEntry = {
  id: string;
  user_id: string;
  display_name: string;
  role: string | null;
  department: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  expertise: string[] | null;
  bio: string | null;
  directory_visible: boolean;
};

export default function StaffDirectoryHub() {
  const client = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [userId, setUserId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [role, setRole] = useState<StaffRole>("teacher");
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");
  const [visible, setVisible] = useState(true);

  async function load() {
    setLoading(true);
    setMessage("");
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) { setMessage("Sign in to view the staff directory."); setLoading(false); return; }
    setUserId(auth.user.id);
    const access = await resolveStaffAccess(client, auth.user);
    setRole(access.role);
    setOrganizationId(access.organizationId || "");
    if (!access.organizationId) { setMessage("Select a school organisation first."); setLoading(false); return; }
    const [{ data: directory, error }, { data: profile }] = await Promise.all([
      client.from("staff_directory_entries").select("*").eq("organization_id", access.organizationId).order("display_name"),
      client.from("staff_development_profiles").select("display_name,department").eq("user_id", auth.user.id).maybeSingle(),
    ]);
    if (error) setMessage(error.message);
    const next = (directory || []) as DirectoryEntry[];
    setEntries(next);
    const own = next.find((item) => item.user_id === auth.user!.id);
    setDisplayName(own?.display_name || profile?.display_name || auth.user.email?.split("@")[0] || "Staff member");
    setDepartment(own?.department || profile?.department || "");
    setJobTitle(own?.job_title || "");
    setEmail(own?.email || auth.user.email || "");
    setPhone(own?.phone || "");
    setLocation(own?.location || "");
    setExpertise((own?.expertise || []).join(", "));
    setBio(own?.bio || "");
    setVisible(own?.directory_visible ?? true);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !userId || !displayName.trim()) return;
    setMessage("");
    const payload = {
      organization_id: organizationId,
      user_id: userId,
      display_name: displayName.trim(),
      role,
      department: department.trim() || null,
      job_title: jobTitle.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      location: location.trim() || null,
      expertise: expertise.split(",").map((item) => item.trim()).filter(Boolean),
      bio: bio.trim() || null,
      directory_visible: visible,
      updated_at: new Date().toISOString(),
    };
    const { error } = await client.from("staff_directory_entries").upsert(payload, { onConflict: "organization_id,user_id" });
    if (error) setMessage(error.message); else { setEditing(false); await load(); }
  }

  const departments = useMemo(() => Array.from(new Set(entries.map((item) => item.department).filter(Boolean) as string[])).sort(), [entries]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesDepartment = departmentFilter === "all" || entry.department === departmentFilter;
      const haystack = [entry.display_name, entry.role, entry.department, entry.job_title, entry.email, ...(entry.expertise || [])].join(" ").toLowerCase();
      return matchesDepartment && (!needle || haystack.includes(needle));
    });
  }, [entries, query, departmentFilter]);

  return <main className="rpShell">
    <header className="rpTopbar">
      <Link href="/dashboard" className="rpBrand"><span>SD</span><strong>Staff Development</strong></Link>
      <nav><Link href="/school">School</Link><Link href="/resources">Resources</Link><Link href="/search">Search</Link></nav>
      <span className="rpRole">{STAFF_ROLE_LABELS[role]}</span>
    </header>

    <section className="rpHero">
      <div><span>PHASE 45 · STAFF DIRECTORY</span><h1>Staff Directory</h1><p>Find colleagues by department, role or expertise and keep your own school contact card up to date.</p></div>
      <button type="button" onClick={() => setEditing(true)}>Edit my profile</button>
    </section>

    <section className="rpStats">
      <article><strong>{entries.length}</strong><span>Visible colleagues</span></article>
      <article><strong>{departments.length}</strong><span>Departments</span></article>
      <article><strong>{entries.filter((item) => (item.expertise || []).length).length}</strong><span>Expertise profiles</span></article>
      <article><strong>{STAFF_ROLE_LABELS[role]}</strong><span>Your role</span></article>
    </section>

    <section className="rpToolbar">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, role, department or expertise…" />
      <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="all">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select>
      <button onClick={() => void load()}>Refresh</button>
    </section>

    {message && <div className="rpMessage">{message}</div>}
    {loading ? <section className="rpEmpty">Loading directory…</section> : <section className="rpCompactGrid">
      {filtered.map((entry) => <article key={entry.id} className="rpPanel">
        <div className="rpPills"><span>{entry.department || "Whole school"}</span>{entry.role && <span>{entry.role}</span>}</div>
        <h2>{entry.display_name}</h2>
        <p><strong>{entry.job_title || "Staff member"}</strong></p>
        {entry.bio && <p>{entry.bio}</p>}
        <div className="rpListRows">
          {entry.email && <div className="rpRow"><small>Email</small><strong>{entry.email}</strong></div>}
          {entry.phone && <div className="rpRow"><small>Phone</small><strong>{entry.phone}</strong></div>}
          {entry.location && <div className="rpRow"><small>Location</small><strong>{entry.location}</strong></div>}
        </div>
        {!!entry.expertise?.length && <div className="rpPills">{entry.expertise.map((item) => <span key={item}>{item}</span>)}</div>}
      </article>)}
      {!filtered.length && <section className="rpEmpty"><strong>No directory entries match.</strong><p>Try another search or add your own profile.</p></section>}
    </section>}

    {editing && <div className="rpModal" role="dialog" aria-modal="true"><form className="rpComposer" onSubmit={saveProfile}>
      <div className="rpComposerHead"><div><span>PHASE 45</span><h2>My directory profile</h2></div><button type="button" onClick={() => setEditing(false)}>×</button></div>
      <div className="rpFormGrid">
        <label>Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label>
        <label>Department<input value={department} onChange={(event) => setDepartment(event.target.value)} /></label>
        <label>Job title<input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} /></label>
        <label>School email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Phone / extension<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label>Location / room<input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
      </div>
      <label>Expertise / areas colleagues can ask you about<input value={expertise} onChange={(event) => setExpertise(event.target.value)} placeholder="Physics, SEND, coaching…" /></label>
      <label>Short profile<textarea rows={4} value={bio} onChange={(event) => setBio(event.target.value)} /></label>
      <label className="rpCheck"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Show my profile in the school directory</label>
      <div className="rpComposerActions"><button type="button" className="secondary" onClick={() => setEditing(false)}>Cancel</button><button type="submit">Save profile</button></div>
    </form></div>}
  </main>;
}
