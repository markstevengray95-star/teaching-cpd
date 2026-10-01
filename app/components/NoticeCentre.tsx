"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, type StaffRole } from "@/lib/rolePermissions";
import "./NoticeCentre.css";

type Notice = {
  id: string;
  organisation_id: string;
  title: string;
  body: string;
  category: string;
  audience: string;
  target_department: string;
  priority: "normal" | "important" | "urgent";
  pinned: boolean;
  requires_acknowledgement: boolean;
  starts_at: string;
  expires_at: string | null;
  published_by: string;
  created_at: string;
};

type ReadState = { notice_id: string; read_at: string; acknowledged_at: string | null };
type LegacyProfile = { department: string | null; organisation_id: string | null };

const categories = ["General", "Teaching", "Pastoral", "Safeguarding", "SEND / EAL", "CPD", "Operations", "Events", "Urgent"];
const audiences = ["All staff", "Teaching staff", "Tutors", "Leadership", "Support staff", "Department"];
const publisherRoles: StaffRole[] = ["hod", "pastoral", "send-eal", "slt", "administrator", "super-admin"];

function visibleToRole(notice: Notice, role: StaffRole, department: string) {
  if (publisherRoles.includes(role)) return true;
  if (notice.audience === "All staff") return true;
  if (notice.audience === "Teaching staff") return ["teacher", "tutor"].includes(role);
  if (notice.audience === "Tutors") return role === "tutor";
  if (notice.audience === "Support staff") return role === "support";
  if (notice.audience === "Department") return Boolean(department && notice.target_department.toLowerCase() === department.toLowerCase());
  return false;
}

export default function NoticeCentre() {
  const [userId, setUserId] = useState("");
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<StaffRole>("teacher");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [reads, setReads] = useState<ReadState[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("Current");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showPublisher, setShowPublisher] = useState(false);

  const canPublish = publisherRoles.includes(role);

  async function load() {
    const client = getSupabaseBrowserClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) { window.location.href = "/auth?next=/notices"; return; }
    setUserId(auth.user.id);
    const access = await resolveStaffAccess(client, auth.user);
    setRole(access.role);

    const { data: legacy } = await client.from("staff_profiles").select("department,organisation_id").eq("id", auth.user.id).maybeSingle();
    const profile = (legacy || null) as LegacyProfile | null;
    const org = access.organizationId || profile?.organisation_id || null;
    setOrganisationId(org);
    setDepartment(profile?.department || "");
    if (!org) { setMessage("Join or select a school organisation before using notices."); setLoading(false); return; }

    const [{ data: noticeRows, error: noticeError }, { data: readRows, error: readError }] = await Promise.all([
      client.from("school_notices").select("id,organisation_id,title,body,category,audience,target_department,priority,pinned,requires_acknowledgement,starts_at,expires_at,published_by,created_at").eq("organisation_id", org).order("pinned", { ascending: false }).order("starts_at", { ascending: false }),
      client.from("school_notice_reads").select("notice_id,read_at,acknowledged_at").eq("user_id", auth.user.id),
    ]);
    setNotices((noticeRows || []) as Notice[]);
    setReads((readRows || []) as ReadState[]);
    setMessage([noticeError?.message, readError?.message].filter(Boolean).join(" · "));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const readMap = useMemo(() => new Map(reads.map(item => [item.notice_id, item])), [reads]);
  const now = Date.now();
  const visible = useMemo(() => notices.filter(notice => {
    if (!visibleToRole(notice, role, department)) return false;
    const started = new Date(notice.starts_at).getTime() <= now;
    const expired = Boolean(notice.expires_at && new Date(notice.expires_at).getTime() < now);
    if (filter === "Current" && (!started || expired)) return false;
    if (filter === "Unread" && readMap.has(notice.id)) return false;
    if (filter === "Acknowledgement" && (!notice.requires_acknowledgement || readMap.get(notice.id)?.acknowledged_at)) return false;
    if (filter === "Archived" && !expired) return false;
    if (category !== "All" && notice.category !== category) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${notice.title} ${notice.body} ${notice.category} ${notice.audience}`.toLowerCase().includes(needle);
  }), [notices, role, department, filter, category, query, readMap, now]);

  async function recordRead(notice: Notice, acknowledge = false) {
    if (!userId) return;
    const client = getSupabaseBrowserClient();
    const payload = { notice_id: notice.id, user_id: userId, read_at: new Date().toISOString(), acknowledged_at: acknowledge ? new Date().toISOString() : readMap.get(notice.id)?.acknowledged_at || null };
    const { error } = await client.from("school_notice_reads").upsert(payload, { onConflict: "notice_id,user_id" });
    if (error) { setMessage(error.message); return; }
    setReads(current => [{ notice_id: notice.id, read_at: payload.read_at, acknowledged_at: payload.acknowledged_at }, ...current.filter(item => item.notice_id !== notice.id)]);
    setMessage(acknowledge ? "Notice acknowledged." : "Notice marked as read.");
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organisationId || !userId || !canPublish) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const body = String(form.get("body") || "").trim();
    if (!title || !body) { setMessage("Add a title and message before publishing."); return; }
    const { error } = await getSupabaseBrowserClient().from("school_notices").insert({
      organisation_id: organisationId,
      title,
      body,
      category: String(form.get("category") || "General"),
      audience: String(form.get("audience") || "All staff"),
      target_department: String(form.get("target_department") || "").trim(),
      priority: String(form.get("priority") || "normal"),
      pinned: form.get("pinned") === "on",
      requires_acknowledgement: form.get("requires_acknowledgement") === "on",
      starts_at: String(form.get("starts_at") || "") || new Date().toISOString(),
      expires_at: String(form.get("expires_at") || "") || null,
      published_by: userId,
    });
    if (error) { setMessage(error.message); return; }
    event.currentTarget.reset();
    setShowPublisher(false);
    setMessage("Notice published.");
    await load();
  }

  async function remove(notice: Notice) {
    if (!canPublish || !window.confirm(`Delete “${notice.title}”?`)) return;
    const { error } = await getSupabaseBrowserClient().from("school_notices").delete().eq("id", notice.id);
    if (error) { setMessage(error.message); return; }
    setNotices(current => current.filter(item => item.id !== notice.id));
    setMessage("Notice deleted.");
  }

  if (loading) return <main className="noticePage"><div className="noticeLoading">Loading school notices…</div></main>;

  const unread = notices.filter(item => visibleToRole(item, role, department) && !readMap.has(item.id) && new Date(item.starts_at).getTime() <= now && (!item.expires_at || new Date(item.expires_at).getTime() >= now)).length;
  const awaitingAck = notices.filter(item => item.requires_acknowledgement && visibleToRole(item, role, department) && !readMap.get(item.id)?.acknowledged_at && (!item.expires_at || new Date(item.expires_at).getTime() >= now)).length;

  return <main className="noticePage">
    <header className="noticeTopbar"><Link href="/school">← School</Link><div><span>PHASE 43</span><strong>Notices Centre</strong></div>{canPublish ? <button onClick={() => setShowPublisher(value => !value)}>{showPublisher ? "Close" : "+ Publish notice"}</button> : <Link href="/dashboard">Dashboard</Link>}</header>

    <section className="noticeHero"><div><span className="noticeEyebrow">SCHOOL COMMUNICATION</span><h1>Important information without the clutter.</h1><p>See current school notices, priorities and actions in one place. Read status and acknowledgements stay attached to your account.</p></div><div className="noticeStats"><span><strong>{unread}</strong><small>unread</small></span><span><strong>{awaitingAck}</strong><small>need acknowledgement</small></span><span><strong>{notices.filter(n => n.pinned).length}</strong><small>pinned</small></span></div></section>

    {message && <div className="noticeMessage">{message}</div>}

    {showPublisher && canPublish && <section className="noticePublisher"><div><span className="noticeEyebrow">PUBLISH</span><h2>New school notice</h2><p>Target the right audience and add an expiry so old information clears automatically.</p></div><form onSubmit={publish}><label className="wide">Title<input name="title" required /></label><label className="wide">Message<textarea name="body" rows={5} required /></label><label>Category<select name="category">{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Audience<select name="audience">{audiences.map(item => <option key={item}>{item}</option>)}</select></label><label>Department<input name="target_department" placeholder="Only for Department audience" /></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></label><label>Starts<input name="starts_at" type="datetime-local" /></label><label>Expires<input name="expires_at" type="datetime-local" /></label><label className="check"><input name="pinned" type="checkbox" /> Pin to top</label><label className="check"><input name="requires_acknowledgement" type="checkbox" /> Require acknowledgement</label><div className="wide"><button className="primary">Publish notice</button></div></form></section>}

    <section className="noticeControls"><div>{["Current", "Unread", "Acknowledgement", "Archived"].map(item => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><select value={category} onChange={e => setCategory(e.target.value)}><option>All</option>{categories.map(item => <option key={item}>{item}</option>)}</select><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notices…" /></section>

    <section className="noticeList">{visible.map(notice => { const read = readMap.get(notice.id); const expired = Boolean(notice.expires_at && new Date(notice.expires_at).getTime() < now); return <article key={notice.id} className={`noticeCard ${notice.priority} ${read ? "read" : "unread"}`}><div className="noticeCardHead"><div><span className="noticeCategory">{notice.category}</span>{notice.pinned && <span>PINNED</span>}{notice.priority !== "normal" && <span>{notice.priority.toUpperCase()}</span>}</div><small>{new Date(notice.starts_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small></div><h2>{notice.title}</h2><p>{notice.body}</p><div className="noticeMeta"><span>{notice.audience}{notice.audience === "Department" && notice.target_department ? ` · ${notice.target_department}` : ""}</span>{notice.expires_at && <span>{expired ? "Expired" : `Until ${new Date(notice.expires_at).toLocaleDateString("en-GB")}`}</span>}{read && <span>Read</span>}{read?.acknowledged_at && <span>Acknowledged</span>}</div><div className="noticeActions">{!read && <button onClick={() => recordRead(notice)}>Mark read</button>}{notice.requires_acknowledgement && !read?.acknowledged_at && <button className="primary" onClick={() => recordRead(notice, true)}>Acknowledge</button>}{canPublish && <button className="danger" onClick={() => remove(notice)}>Delete</button>}</div></article>; })}{!visible.length && <div className="noticeEmpty"><strong>No notices match this view.</strong><p>Try another filter or search term.</p></div>}</section>
  </main>;
}
