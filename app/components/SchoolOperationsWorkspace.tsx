"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./RemainingPhases.css";

type WorkspaceMode =
  | "school-improvement"
  | "department-plans"
  | "forms"
  | "trips"
  | "resource-library"
  | "policies"
  | "recognition"
  | "staff-voice";

type GenericRow = Record<string, any> & { id: string };

type ModeConfig = {
  phase: number;
  eyebrow: string;
  title: string;
  description: string;
  table: string;
  kindField: string;
  kindValue: string;
  addLabel: string;
  categories: string[];
};

const configs: Record<WorkspaceMode, ModeConfig> = {
  "school-improvement": {
    phase: 46,
    eyebrow: "SCHOOL IMPROVEMENT",
    title: "School Improvement Plan",
    description: "Turn strategic priorities into owned actions, milestones, evidence and impact review.",
    table: "school_improvement_items",
    kindField: "scope",
    kindValue: "school",
    addLabel: "Add improvement priority",
    categories: ["Teaching & Learning", "Curriculum", "Pastoral", "SEND / EAL", "Attendance", "Behaviour", "Staff Development", "Leadership", "Operations"],
  },
  "department-plans": {
    phase: 47,
    eyebrow: "DEPARTMENT IMPROVEMENT",
    title: "Department Improvement Plans",
    description: "Keep department priorities connected to the whole-school plan, evidence and measurable impact.",
    table: "school_improvement_items",
    kindField: "scope",
    kindValue: "department",
    addLabel: "Add department priority",
    categories: ["Curriculum", "Outcomes", "Teaching", "Assessment", "Literacy", "Practical Work", "SEND / EAL", "Professional Learning"],
  },
  forms: {
    phase: 49,
    eyebrow: "FORMS & APPROVALS",
    title: "Forms & Approvals",
    description: "Submit requests, track decisions and keep approval notes in one school workflow.",
    table: "school_requests",
    kindField: "request_type",
    kindValue: "form",
    addLabel: "Start a form",
    categories: ["Purchase", "Cover", "Room / Event", "CPD", "Curriculum", "Pastoral", "IT / Equipment", "Other"],
  },
  trips: {
    phase: 50,
    eyebrow: "TRIPS & VISITS",
    title: "Trips & Visits Centre",
    description: "Start trip requests, record core planning information and track approval before a visit goes ahead.",
    table: "school_requests",
    kindField: "request_type",
    kindValue: "trip",
    addLabel: "Plan a trip",
    categories: ["Day Visit", "Residential", "Fieldwork", "Competition", "University / Careers", "Cultural", "Sports", "Other"],
  },
  "resource-library": {
    phase: 51,
    eyebrow: "RESOURCE LIBRARY",
    title: "Whole-school Resource Library",
    description: "Share trusted school resources, links and files without burying them across separate hubs.",
    table: "school_content_items",
    kindField: "content_type",
    kindValue: "resource",
    addLabel: "Add resource",
    categories: ["Teaching", "Assessment", "Pastoral", "SEND / EAL", "Safeguarding", "Operations", "Leadership", "Templates"],
  },
  policies: {
    phase: 52,
    eyebrow: "POLICY CENTRE",
    title: "Policy Centre",
    description: "Keep current policy versions, review dates and staff-facing summaries in one controlled place.",
    table: "school_content_items",
    kindField: "content_type",
    kindValue: "policy",
    addLabel: "Add policy",
    categories: ["Safeguarding", "Behaviour", "Teaching", "SEND", "Attendance", "Trips", "Health & Safety", "HR", "Data / IT"],
  },
  recognition: {
    phase: 60,
    eyebrow: "RECOGNITION",
    title: "Staff Recognition",
    description: "Capture specific examples of contribution, teamwork, improvement and positive impact across the school.",
    table: "staff_voice_entries",
    kindField: "kind",
    kindValue: "recognition",
    addLabel: "Recognise a colleague",
    categories: ["Teaching", "Pastoral", "Teamwork", "Leadership", "Innovation", "Student Support", "Community"],
  },
  "staff-voice": {
    phase: 61,
    eyebrow: "STAFF VOICE",
    title: "Staff Voice",
    description: "Give staff a clear route to raise ideas, barriers and suggestions, including anonymous submissions where appropriate.",
    table: "staff_voice_entries",
    kindField: "kind",
    kindValue: "voice",
    addLabel: "Share feedback",
    categories: ["Workload", "Teaching & Learning", "Pastoral", "Systems", "Communication", "Wellbeing", "Facilities", "Idea"],
  },
};

const leadershipRoles: StaffRole[] = ["hod", "pastoral", "send-eal", "slt", "administrator", "super-admin"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function prettyDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusClass(status?: string) {
  return `rpStatus rpStatus-${String(status || "draft").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

export default function SchoolOperationsWorkspace({ mode }: { mode: WorkspaceMode }) {
  const config = configs[mode];
  const client = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<GenericRow[]>([]);
  const [userId, setUserId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [role, setRole] = useState<StaffRole>("teacher");
  const [department, setDepartment] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(config.categories[0] || "General");
  const [dueDate, setDueDate] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [departmentField, setDepartmentField] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [version, setVersion] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<GenericRow | null>(null);
  const [uploading, setUploading] = useState(false);

  const canManage = leadershipRoles.includes(role);
  const isImprovement = mode === "school-improvement" || mode === "department-plans";
  const isRequest = mode === "forms" || mode === "trips";
  const isContent = mode === "resource-library" || mode === "policies";
  const isVoice = mode === "recognition" || mode === "staff-voice";

  async function load() {
    setLoading(true);
    setMessage("");
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      setMessage("Sign in to use this school workspace.");
      return;
    }
    setUserId(auth.user.id);
    const access = await resolveStaffAccess(client, auth.user);
    setRole(access.role);
    setOrganizationId(access.organizationId || "");
    const { data: profile } = await client.from("staff_development_profiles").select("department").eq("user_id", auth.user.id).maybeSingle();
    const userDepartment = profile?.department || "";
    setDepartment(userDepartment);
    setDepartmentField(userDepartment);
    if (!access.organizationId) {
      setRows([]);
      setMessage("Join or select a school organisation before using this area.");
      setLoading(false);
      return;
    }
    const { data, error } = await client
      .from(config.table)
      .select("*")
      .eq("organization_id", access.organizationId)
      .eq(config.kindField, config.kindValue)
      .order(isVoice ? "created_at" : "updated_at", { ascending: false });
    if (error) setMessage(error.message);
    setRows((data || []) as GenericRow[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [mode]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesText = !needle || [row.title, row.description, row.summary, row.body, row.category, row.department, row.strand]
        .some((value) => String(value || "").toLowerCase().includes(needle));
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  const counts = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => ["active", "submitted", "reviewing", "published", "approved"].includes(row.status)).length,
    due: rows.filter((row) => row.due_date && row.due_date <= today() && !["complete", "approved", "published", "archived"].includes(row.status)).length,
  }), [rows]);

  function resetForm() {
    setTitle(""); setDescription(""); setCategory(config.categories[0] || "General"); setDueDate(""); setEventDate("");
    setLinkUrl(""); setVersion(""); setAnonymous(false); setProgress(0); setDepartmentField(department); setComposer(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !organizationId || !userId) return;
    setMessage("");
    let payload: Record<string, any> = { organization_id: organizationId, [config.kindField]: config.kindValue };
    if (isImprovement) {
      payload = {
        ...payload, title: title.trim(), description: description.trim() || null, strand: category,
        department: mode === "department-plans" ? (departmentField || department || null) : null,
        status: "planned", priority: "normal", due_date: dueDate || null, progress,
        success_criteria: "", evidence: "", impact: "", created_by: userId,
      };
    } else if (isRequest) {
      payload = {
        ...payload, title: title.trim(), description: description.trim() || null, requester_user_id: userId,
        department: departmentField || department || null, status: "draft", due_date: dueDate || null,
        event_date: mode === "trips" ? (eventDate || null) : null,
        metadata: { category },
      };
    } else if (isContent) {
      payload = {
        ...payload, title: title.trim(), description: description.trim() || null, category,
        department: departmentField || department || null, audience: "all-staff", version: version || null,
        review_date: dueDate || null, link_url: linkUrl.trim() || null, status: canManage ? "published" : "draft", created_by: userId,
      };
    } else if (isVoice) {
      payload = {
        ...payload, title: title.trim(), body: description.trim(), category,
        anonymous: mode === "staff-voice" && anonymous,
        created_by: mode === "staff-voice" && anonymous ? null : userId,
        status: mode === "recognition" && canManage ? "published" : "submitted",
      };
    }
    const { error } = await client.from(config.table).insert(payload);
    if (error) { setMessage(error.message); return; }
    resetForm();
    await load();
  }

  async function updateStatus(row: GenericRow, next: string) {
    const patch: Record<string, any> = { status: next, updated_at: new Date().toISOString() };
    if (isImprovement && next === "complete") patch.progress = 100;
    const { error } = await client.from(config.table).update(patch).eq("id", row.id);
    if (error) setMessage(error.message); else await load();
  }

  async function updateProgress(row: GenericRow, next: number) {
    const { error } = await client.from(config.table).update({ progress: next, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) setMessage(error.message); else await load();
  }

  async function remove(row: GenericRow) {
    const { error } = await client.from(config.table).delete().eq("id", row.id);
    if (error) setMessage(error.message); else { if (selected?.id === row.id) setSelected(null); await load(); }
  }

  async function uploadFile(file: File) {
    if (!organizationId || !userId || !canManage) return;
    setUploading(true);
    setMessage("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const path = `${organizationId}/${userId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await client.storage.from("school-knowledge").upload(path, file, { upsert: false });
    if (error) setMessage(error.message); else setLinkUrl(`storage:${path}`);
    setUploading(false);
  }

  async function openResource(row: GenericRow) {
    const value = String(row.link_url || row.storage_path || "");
    if (!value) return;
    if (value.startsWith("storage:")) {
      const path = value.slice("storage:".length);
      const { data, error } = await client.storage.from("school-knowledge").createSignedUrl(path, 300);
      if (error) setMessage(error.message); else if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(value, "_blank", "noopener,noreferrer");
  }

  const statuses = Array.from(new Set(rows.map((row) => String(row.status || "draft"))));

  return (
    <main className="rpShell">
      <header className="rpTopbar">
        <Link href="/dashboard" className="rpBrand"><span>SD</span><strong>Staff Development</strong></Link>
        <nav><Link href="/school">School</Link><Link href="/resources">Resources</Link><Link href="/search">Search</Link></nav>
        <span className="rpRole">{STAFF_ROLE_LABELS[role]}</span>
      </header>

      <section className="rpHero">
        <div><span>PHASE {config.phase} · {config.eyebrow}</span><h1>{config.title}</h1><p>{config.description}</p></div>
        <button type="button" onClick={() => setComposer(true)}>{config.addLabel}</button>
      </section>

      <section className="rpStats">
        <article><strong>{counts.total}</strong><span>Total records</span></article>
        <article><strong>{counts.active}</strong><span>Active / current</span></article>
        <article><strong>{counts.due}</strong><span>Need attention</span></article>
        <article><strong>{canManage ? "Manage" : "Contribute"}</strong><span>Your access</span></article>
      </section>

      <section className="rpToolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
        <button type="button" onClick={() => void load()}>Refresh</button>
      </section>

      {message && <div className="rpMessage">{message}</div>}
      {loading ? <section className="rpEmpty">Loading…</section> : (
        <section className="rpGrid">
          <div className="rpList">
            {filtered.map((row) => (
              <article key={row.id} className={`rpCard ${selected?.id === row.id ? "selected" : ""}`} onClick={() => setSelected(row)}>
                <div className="rpCardTop"><span className={statusClass(row.status)}>{row.status || "draft"}</span><small>{row.category || row.strand || row.metadata?.category || row.department || config.eyebrow}</small></div>
                <h3>{row.title}</h3>
                <p>{row.description || row.body || "No summary added yet."}</p>
                {isImprovement && <div className="rpProgress"><span style={{ width: `${row.progress || 0}%` }} /></div>}
                <div className="rpMeta">
                  {row.department && <span>{row.department}</span>}
                  {row.due_date && <span>Due {prettyDate(row.due_date)}</span>}
                  {row.event_date && <span>{prettyDate(row.event_date)}</span>}
                  {row.review_date && <span>Review {prettyDate(row.review_date)}</span>}
                  {row.version && <span>v{row.version}</span>}
                  {row.anonymous && <span>Anonymous</span>}
                </div>
              </article>
            ))}
            {!filtered.length && <section className="rpEmpty"><strong>No records yet.</strong><p>Use “{config.addLabel}” to create the first one.</p></section>}
          </div>

          <aside className="rpDetail">
            {selected ? <>
              <span className={statusClass(selected.status)}>{selected.status}</span>
              <h2>{selected.title}</h2>
              <p>{selected.description || selected.body || "No additional detail."}</p>
              {isImprovement && <>
                <label>Progress <strong>{selected.progress || 0}%</strong></label>
                {canManage && <input type="range" min="0" max="100" step="5" value={selected.progress || 0} onChange={(event) => void updateProgress(selected, Number(event.target.value))} />}
              </>}
              {isContent && (selected.link_url || selected.storage_path) && <button type="button" onClick={() => void openResource(selected)}>Open resource</button>}
              <div className="rpActions">
                {isRequest && selected.status === "draft" && selected.requester_user_id === userId && <button onClick={() => void updateStatus(selected, "submitted")}>Submit for approval</button>}
                {canManage && isRequest && selected.status === "submitted" && <><button onClick={() => void updateStatus(selected, "approved")}>Approve</button><button className="secondary" onClick={() => void updateStatus(selected, "changes-requested")}>Request changes</button></>}
                {canManage && isImprovement && selected.status !== "complete" && <button onClick={() => void updateStatus(selected, selected.status === "active" ? "complete" : "active")}>{selected.status === "active" ? "Mark complete" : "Start priority"}</button>}
                {canManage && isVoice && selected.status !== "published" && <button onClick={() => void updateStatus(selected, mode === "recognition" ? "published" : "actioned")}>{mode === "recognition" ? "Publish recognition" : "Mark actioned"}</button>}
                {canManage && isContent && selected.status !== "published" && <button onClick={() => void updateStatus(selected, "published")}>Publish</button>}
                {(canManage || selected.created_by === userId || selected.requester_user_id === userId) && <button className="danger" onClick={() => void remove(selected)}>Delete</button>}
              </div>
            </> : <><strong>Select an item</strong><p>Open a record to view actions and details.</p></>}
          </aside>
        </section>
      )}

      {composer && <div className="rpModal" role="dialog" aria-modal="true">
        <form className="rpComposer" onSubmit={submit}>
          <div className="rpComposerHead"><div><span>PHASE {config.phase}</span><h2>{config.addLabel}</h2></div><button type="button" onClick={resetForm}>×</button></div>
          <label>Title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label>{isVoice ? "Message" : "Description"}<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} required={isVoice} /></label>
          <div className="rpFormGrid">
            <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{config.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            {(isImprovement || isRequest || isContent) && <label>Department<input value={departmentField} onChange={(event) => setDepartmentField(event.target.value)} placeholder="Optional" /></label>}
            {(isImprovement || isRequest || isContent) && <label>{isContent ? "Review date" : "Due date"}<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>}
            {mode === "trips" && <label>Visit date<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label>}
            {isContent && <label>Version<input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="e.g. 2.1" /></label>}
          </div>
          {isContent && <>
            <label>Web / Drive link<input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" /></label>
            {canManage && <label className="rpUpload">Or upload a school file<input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); }} />{uploading && <small>Uploading…</small>}</label>}
          </>}
          {mode === "staff-voice" && <label className="rpCheck"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> Submit anonymously to school leadership</label>}
          <div className="rpComposerActions"><button type="button" className="secondary" onClick={resetForm}>Cancel</button><button type="submit">Save</button></div>
        </form>
      </div>}
    </main>
  );
}
