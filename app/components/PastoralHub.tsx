"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/rolePermissions";
import "./PastoralHub.css";

type PastoralType = "tutor_activity" | "assembly" | "mentoring" | "attendance" | "behaviour" | "reward" | "wellbeing" | "safeguarding" | "key_date";
type PastoralItem = {
  id: string;
  organization_id: string;
  item_type: PastoralType;
  title: string;
  summary: string;
  body: string;
  year_group: string;
  tutor_group: string;
  week_start: string | null;
  event_date: string | null;
  resource_url: string | null;
  priority: "normal" | "high";
  tags: string[];
  created_by: string;
  updated_at: string;
};

const meta: Record<PastoralType, { label: string; helper: string; icon: string }> = {
  tutor_activity: { label: "Tutor activities", helper: "Ready-to-use tutor-time activities", icon: "☰" },
  assembly: { label: "Assemblies", helper: "Themes, follow-up and discussion prompts", icon: "◫" },
  mentoring: { label: "Mentoring", helper: "Conversation structures and check-ins", icon: "◎" },
  attendance: { label: "Attendance", helper: "Tutor guidance and positive follow-up", icon: "✓" },
  behaviour: { label: "Behaviour", helper: "Restorative and relationship-led support", icon: "◇" },
  reward: { label: "Rewards", helper: "Recognition and celebration ideas", icon: "★" },
  wellbeing: { label: "Wellbeing", helper: "Low-stakes wellbeing and belonging activities", icon: "○" },
  safeguarding: { label: "Safeguarding", helper: "Signposts to official school procedures", icon: "◆" },
  key_date: { label: "Key dates", helper: "Pastoral deadlines, events and reviews", icon: "▦" },
};

const types = Object.keys(meta) as PastoralType[];
const contributorRoles: StaffRole[] = ["tutor", "hod", "pastoral", "send-eal", "slt", "administrator", "super-admin"];
const managerRoles: StaffRole[] = ["pastoral", "send-eal", "slt", "administrator", "super-admin"];

const starterCards = [
  { title: "5-minute weekly check-in", type: "Tutor time", body: "Ask pupils to identify one success from the week, one thing they want to improve and one practical action for next week." },
  { title: "Mentoring conversation", type: "Mentoring", body: "Use: What is going well? What is getting in the way? What is one realistic next step? What support would make that easier?" },
  { title: "Attendance follow-up", type: "Attendance", body: "Use calm, curious questions and the school attendance process. Focus on barriers, patterns and support rather than assumptions." },
  { title: "Recognition moment", type: "Rewards", body: "Make recognition specific: name the action, effort or contribution and explain why it mattered to the group or learning." },
  { title: "Belonging pulse", type: "Wellbeing", body: "Invite pupils to rate how connected and ready for the week they feel, then use the pattern to plan universal tutor support rather than public individual comparison." },
  { title: "Safeguarding route", type: "Safeguarding", body: "Use the school's approved safeguarding process for concerns. Do not record case details or disclosures in this general pastoral hub." },
];

function mondayOf(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function dateLabel(value: string | null) {
  if (!value) return "";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PastoralHub() {
  const [role, setRole] = useState<StaffRole>("teacher");
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [items, setItems] = useState<PastoralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeType, setActiveType] = useState<PastoralType>("tutor_activity");
  const [yearFilter, setYearFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [openInterventions, setOpenInterventions] = useState(0);
  const [recentCheckins, setRecentCheckins] = useState(0);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [tutorGroup, setTutorGroup] = useState("");
  const [weekStart, setWeekStart] = useState(mondayOf());
  const [eventDate, setEventDate] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [priority, setPriority] = useState<"normal" | "high">("normal");
  const [tags, setTags] = useState("");

  const canContribute = contributorRoles.includes(role);
  const canManageAll = managerRoles.includes(role);
  const currentWeek = mondayOf();

  useEffect(() => {
    const savedYear = window.localStorage.getItem("pastoral-year-filter") || "";
    const savedGroup = window.localStorage.getItem("pastoral-group-filter") || "";
    setYearFilter(savedYear);
    setGroupFilter(savedGroup);

    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.assign("/auth?next=/pastoral");
        return;
      }
      const access = await resolveStaffAccess(client, auth.user);
      const [{ data: profile }, { data: legacy }] = await Promise.all([
        client.from("staff_development_profiles").select("preferred_organization_id").eq("user_id", auth.user.id).maybeSingle(),
        client.from("staff_profiles").select("organisation_id").eq("id", auth.user.id).maybeSingle(),
      ]);
      const org = access.organizationId || profile?.preferred_organization_id || legacy?.organisation_id || null;
      if (!mounted) return;
      setRole(access.role);
      setUserId(auth.user.id);
      setOrganizationId(org);
      if (org) await loadHub(org, auth.user.id);
      setLoading(false);
    })().catch((error) => {
      console.error("Pastoral hub load failed", error);
      if (mounted) { setMessage("The pastoral hub could not be loaded yet."); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  async function loadHub(org: string, uid: string) {
    const client = getSupabaseBrowserClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [hub, interventions, checkins] = await Promise.all([
      client.from("pastoral_hub_items").select("id,organization_id,item_type,title,summary,body,year_group,tutor_group,week_start,event_date,resource_url,priority,tags,created_by,updated_at").eq("organization_id", org).order("updated_at", { ascending: false }),
      client.from("staff_development_interventions").select("id", { count: "exact", head: true }).eq("organization_id", org).eq("created_by", uid).neq("status", "complete"),
      client.from("staff_development_checkins").select("id", { count: "exact", head: true }).eq("organization_id", org).eq("created_by", uid).gte("created_at", sevenDaysAgo),
    ]);
    setItems((hub.data || []) as PastoralItem[]);
    setOpenInterventions(interventions.count || 0);
    setRecentCheckins(checkins.count || 0);
    const error = hub.error || interventions.error || checkins.error;
    if (error) setMessage(error.message);
  }

  function matchesAudience(item: PastoralItem) {
    const yearOk = !yearFilter || !item.year_group || item.year_group.toLowerCase() === yearFilter.toLowerCase();
    const groupOk = !groupFilter || !item.tutor_group || item.tutor_group.toLowerCase() === groupFilter.toLowerCase();
    return yearOk && groupOk;
  }

  const thisWeek = useMemo(() => items.filter((item) => item.week_start === currentWeek && matchesAudience(item)), [items, currentWeek, yearFilter, groupFilter]);
  const visibleItems = useMemo(() => items.filter((item) => item.item_type === activeType && matchesAudience(item)), [items, activeType, yearFilter, groupFilter]);
  const upcomingDates = useMemo(() => items.filter((item) => item.event_date && item.event_date >= new Date().toISOString().slice(0, 10) && matchesAudience(item)).sort((a, b) => String(a.event_date).localeCompare(String(b.event_date))).slice(0, 5), [items, yearFilter, groupFilter]);

  function updateFilter(kind: "year" | "group", value: string) {
    if (kind === "year") { setYearFilter(value); window.localStorage.setItem("pastoral-year-filter", value); }
    else { setGroupFilter(value); window.localStorage.setItem("pastoral-group-filter", value); }
  }

  async function createItem() {
    if (!organizationId || !userId || !canContribute || !title.trim()) {
      setMessage("Add a title before saving.");
      return;
    }
    if (activeType === "safeguarding" && /student|pupil|disclosure|concern/i.test(body) && body.trim().length > 180) {
      setMessage("Keep safeguarding entries here generic. Use the school's approved safeguarding system for case details or disclosures.");
      return;
    }
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("pastoral_hub_items").insert({
      organization_id: organizationId,
      item_type: activeType,
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim(),
      year_group: yearGroup.trim(),
      tutor_group: tutorGroup.trim(),
      week_start: weekStart || null,
      event_date: eventDate || null,
      resource_url: resourceUrl.trim() || null,
      priority,
      tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
      created_by: userId,
    });
    if (error) return setMessage(error.message);
    setTitle(""); setSummary(""); setBody(""); setYearGroup(""); setTutorGroup(""); setEventDate(""); setResourceUrl(""); setPriority("normal"); setTags("");
    setMessage("Pastoral resource added.");
    await loadHub(organizationId, userId);
  }

  async function deleteItem(item: PastoralItem) {
    if (!userId || !(canManageAll || item.created_by === userId) || !window.confirm(`Delete “${item.title}”?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("pastoral_hub_items").delete().eq("id", item.id);
    if (error) return setMessage(error.message);
    setItems((current) => current.filter((row) => row.id !== item.id));
  }

  if (loading) return <main className="pastoralPage"><div className="pastoralLoading">Loading pastoral hub…</div></main>;

  return <main className="pastoralPage">
    <header className="pastoralTopbar"><Link href="/students">← Students</Link><div><span>PHASE 35</span><strong>Pastoral Hub</strong></div><Link href="/safeguarding">Safeguarding →</Link></header>

    <section className="pastoralHero">
      <div><span className="pastoralEyebrow">TUTOR · PASTORAL · WELLBEING</span><h1>Your weekly pastoral workspace.</h1><p>Bring tutor-time activities, assemblies, mentoring, attendance guidance, behaviour support, rewards, wellbeing and key pastoral dates into one clear staff area.</p></div>
      <div className="pastoralRoleCard"><span>Signed-in role</span><strong>{STAFF_ROLE_LABELS[role]}</strong><small>{canManageAll ? "Whole-school pastoral management" : canContribute ? "Can contribute pastoral resources" : "Pastoral resources view"}</small></div>
    </section>

    <section className="pastoralFilters">
      <div><span>MY TUTOR VIEW</span><p>Set this once to prioritise relevant weekly content. It only changes your view.</p></div>
      <label><span>Year group</span><input value={yearFilter} onChange={(e) => updateFilter("year", e.target.value)} placeholder="e.g. Year 9" /></label>
      <label><span>Tutor group</span><input value={groupFilter} onChange={(e) => updateFilter("group", e.target.value)} placeholder="e.g. 9A" /></label>
    </section>

    <section className="pastoralStats">
      <div><strong>{thisWeek.length}</strong><span>items this week</span></div>
      <div><strong>{upcomingDates.length}</strong><span>upcoming dates</span></div>
      <div><strong>{openInterventions}</strong><span>my open interventions</span></div>
      <div><strong>{recentCheckins}</strong><span>my check-ins this week</span></div>
    </section>

    {message && <div className="pastoralMessage">{message}</div>}

    <section className="pastoralWeek">
      <div className="pastoralSectionHeading"><div><span>THIS WEEK</span><h2>Week beginning {dateLabel(currentWeek)}</h2></div><small>{yearFilter || groupFilter ? `Filtered for ${[yearFilter, groupFilter].filter(Boolean).join(" · ")}` : "Whole-school pastoral content"}</small></div>
      {thisWeek.length ? <div className="pastoralWeekGrid">{thisWeek.map((item) => <article key={item.id} className={item.priority === "high" ? "high" : ""}><div className="pastoralItemMeta"><span>{meta[item.item_type].label}</span>{item.priority === "high" && <b>Priority</b>}</div><h3>{item.title}</h3><p>{item.summary || item.body}</p>{item.resource_url && <a href={item.resource_url} target="_blank" rel="noreferrer">Open resource →</a>}</article>)}</div> : <div className="pastoralEmpty">No targeted resources have been scheduled for this week yet. The starter toolkit below is always available.</div>}
    </section>

    <section className="pastoralQuickLinks">
      <Link href="/send-eal"><span>◇</span><div><strong>SEND & EAL</strong><small>Inclusive classroom support</small></div></Link>
      <Link href="/regulation-behaviour"><span>◆</span><div><strong>Regulation & Behaviour</strong><small>Consistent response guidance</small></div></Link>
      <Link href="/safeguarding"><span>✓</span><div><strong>Safeguarding</strong><small>Training and approved guidance</small></div></Link>
      <Link href="/safeguarding/documents"><span>▤</span><div><strong>Safeguarding documents</strong><small>Policies and supporting documents</small></div></Link>
    </section>

    <section className="pastoralStarter">
      <div className="pastoralSectionHeading"><div><span>STARTER TOOLKIT</span><h2>Useful tutor-time structures</h2></div><small>Generic prompts — adapt to your school policy and pupils</small></div>
      <div className="pastoralStarterGrid">{starterCards.map((card) => <article key={card.title}><span>{card.type}</span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>
    </section>

    <section className="pastoralLibrary">
      <aside>{types.map((type) => <button key={type} className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)}><span>{meta[type].icon}</span><div><strong>{meta[type].label}</strong><small>{meta[type].helper}</small></div></button>)}</aside>
      <div className="pastoralItems">
        <div className="pastoralSectionHeading"><div><span>{meta[activeType].label.toUpperCase()}</span><h2>{meta[activeType].helper}</h2></div><small>{visibleItems.length} saved</small></div>
        {visibleItems.length ? visibleItems.map((item) => <article className="pastoralSaved" key={item.id}><div><div className="pastoralItemMeta">{item.year_group && <span>{item.year_group}</span>}{item.tutor_group && <span>{item.tutor_group}</span>}{item.week_start && <span>Week {dateLabel(item.week_start)}</span>}{item.event_date && <span>{dateLabel(item.event_date)}</span>}{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}{item.body && <details><summary>View details</summary><p>{item.body}</p></details>}</div><div className="pastoralSavedActions">{item.resource_url && <a href={item.resource_url} target="_blank" rel="noreferrer">Open link</a>}{(canManageAll || item.created_by === userId) && <button onClick={() => deleteItem(item)}>Delete</button>}</div></article>) : <div className="pastoralEmpty">No school-specific items have been added here yet.</div>}
      </div>
    </section>

    <section className="pastoralDates"><div className="pastoralSectionHeading"><div><span>UPCOMING</span><h2>Pastoral dates & deadlines</h2></div></div>{upcomingDates.length ? <div>{upcomingDates.map((item) => <p key={item.id}><strong>{dateLabel(item.event_date)}</strong><span>{item.title}</span><small>{item.summary}</small></p>)}</div> : <div className="pastoralEmpty">No upcoming pastoral dates are recorded.</div>}</section>

    {canContribute && <section className="pastoralCreate">
      <div><span className="pastoralEyebrow">ADD SCHOOL CONTENT</span><h2>Create a pastoral resource</h2><p>Tutors can manage resources they create. Pastoral/leadership roles can manage the wider school library.</p>{activeType === "safeguarding" && <div className="pastoralSafeguardingNote">Do not enter pupil names, disclosures or safeguarding case notes here. Use the school's approved safeguarding reporting system.</div>}</div>
      <div className="pastoralForm">
        <label><span>Type</span><select value={activeType} onChange={(e) => setActiveType(e.target.value as PastoralType)}>{types.map((type) => <option key={type} value={type}>{meta[type].label}</option>)}</select></label>
        <label><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" /></label>
        <label className="wide"><span>Short summary</span><input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What is this for?" /></label>
        <label className="wide"><span>Content / instructions</span><textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Activity steps, mentoring prompts, guidance or follow-up…" /></label>
        <label><span>Year group <small>optional</small></span><input value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} placeholder="e.g. Year 8" /></label>
        <label><span>Tutor group <small>optional</small></span><input value={tutorGroup} onChange={(e) => setTutorGroup(e.target.value)} placeholder="e.g. 8B" /></label>
        <label><span>Week beginning</span><input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} /></label>
        <label><span>Event / deadline <small>optional</small></span><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></label>
        <label><span>Resource link <small>optional</small></span><input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://…" /></label>
        <label><span>Priority</span><select value={priority} onChange={(e) => setPriority(e.target.value as "normal" | "high")}><option value="normal">Normal</option><option value="high">High</option></select></label>
        <label className="wide"><span>Tags <small>optional</small></span><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="attendance, year 9, careers…" /></label>
        <button className="wide" onClick={createItem}>Add to pastoral hub</button>
      </div>
    </section>}
  </main>;
}
