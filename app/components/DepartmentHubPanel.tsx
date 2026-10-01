"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, type StaffRole } from "@/lib/rolePermissions";
import "./DepartmentHubPanel.css";

type HubItemType = "notice" | "resource" | "assessment" | "meeting_note" | "key_date";
type HubItem = {
  id: string;
  organization_id: string;
  department: string;
  item_type: HubItemType;
  title: string;
  summary: string;
  body: string;
  resource_url: string | null;
  event_date: string | null;
  tags: string[];
  updated_at: string;
};
type StaffRow = { id: string; full_name: string; department: string; role: string; active: boolean };

const typeMeta: Record<HubItemType, { label: string; helper: string }> = {
  notice: { label: "Notices", helper: "Department updates and announcements" },
  resource: { label: "Resources", helper: "Shared files, links and guidance" },
  assessment: { label: "Assessments", helper: "Assessment dates, papers and moderation notes" },
  meeting_note: { label: "Meeting notes", helper: "Actions and decisions from department meetings" },
  key_date: { label: "Key dates", helper: "Deadlines, trips, reviews and department events" },
};

const manageRoles: StaffRole[] = ["hod", "slt", "administrator", "super-admin"];
const wholeSchoolRoles: StaffRole[] = ["slt", "administrator", "super-admin"];

export default function DepartmentHubPanel() {
  const [role, setRole] = useState<StaffRole>("teacher");
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [ownDepartment, setOwnDepartment] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [items, setItems] = useState<HubItem[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [curriculumCount, setCurriculumCount] = useState(0);
  const [planCount, setPlanCount] = useState(0);
  const [activeType, setActiveType] = useState<HubItemType>("notice");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tags, setTags] = useState("");

  const canManage = manageRoles.includes(role);
  const canSwitchDepartment = wholeSchoolRoles.includes(role);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.assign("/auth?next=/department-hub");
        return;
      }
      const access = await resolveStaffAccess(client, auth.user);
      const [{ data: modernProfile }, { data: legacyProfile }] = await Promise.all([
        client.from("staff_development_profiles").select("department,preferred_organization_id").eq("user_id", auth.user.id).maybeSingle(),
        client.from("staff_profiles").select("department,organisation_id").eq("id", auth.user.id).maybeSingle(),
      ]);
      if (!mounted) return;
      const dept = modernProfile?.department || legacyProfile?.department || "Whole school";
      const org = access.organizationId || modernProfile?.preferred_organization_id || legacyProfile?.organisation_id || null;
      setUserId(auth.user.id);
      setRole(access.role);
      setOrganizationId(org);
      setOwnDepartment(dept);
      setDepartment(dept);

      if (org) {
        if (wholeSchoolRoles.includes(access.role)) {
          const [directoryResult, curriculumResult, hubResult] = await Promise.all([
            client.from("organisation_staff_directory").select("department").eq("organisation_id", org).eq("active", true),
            client.from("school_curriculum_units").select("department").eq("organization_id", org),
            client.from("department_hub_items").select("department").eq("organization_id", org),
          ]);
          const options = new Set<string>([dept]);
          (directoryResult.data || []).forEach((row) => row.department && options.add(row.department));
          (curriculumResult.data || []).forEach((row) => row.department && options.add(row.department));
          (hubResult.data || []).forEach((row) => row.department && options.add(row.department));
          setDepartmentOptions(Array.from(options).filter(Boolean).sort());
        } else {
          setDepartmentOptions([dept]);
        }
        await loadDepartment(org, dept, access.role);
      }
      setLoading(false);
    })().catch((error) => {
      console.error("Department hub load failed", error);
      if (mounted) { setMessage("The department hub could not be loaded yet."); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  async function loadDepartment(org: string, dept: string, currentRole = role) {
    const client = getSupabaseBrowserClient();
    const canSeeDirectory = wholeSchoolRoles.includes(currentRole) || currentRole === "hod";
    const [hub, directory, units, plans] = await Promise.all([
      client.from("department_hub_items").select("id,organization_id,department,item_type,title,summary,body,resource_url,event_date,tags,updated_at").eq("organization_id", org).eq("department", dept).order("updated_at", { ascending: false }),
      canSeeDirectory ? client.from("organisation_staff_directory").select("id,full_name,department,role,active").eq("organisation_id", org).eq("department", dept).eq("active", true).order("full_name") : Promise.resolve({ data: [], error: null }),
      client.from("school_curriculum_units").select("id", { count: "exact", head: true }).eq("organization_id", org).eq("department", dept),
      client.from("department_cpd_plans").select("id", { count: "exact", head: true }).eq("organisation_id", org).eq("department", dept),
    ]);
    setItems((hub.data || []) as HubItem[]);
    setStaff((directory.data || []) as StaffRow[]);
    setCurriculumCount(units.count || 0);
    setPlanCount(plans.count || 0);
    const error = hub.error || directory.error || units.error || plans.error;
    if (error) setMessage(error.message);
  }

  async function switchDepartment(next: string) {
    if (!organizationId) return;
    setDepartment(next);
    setMessage("");
    await loadDepartment(organizationId, next);
  }

  const departments = useMemo(() => {
    const values = new Set<string>([ownDepartment, department, ...departmentOptions]);
    staff.forEach((person) => person.department && values.add(person.department));
    return Array.from(values).filter(Boolean).sort();
  }, [department, departmentOptions, ownDepartment, staff]);

  const visibleItems = items.filter((item) => item.item_type === activeType);
  const upcoming = items.filter((item) => item.event_date && item.event_date >= new Date().toISOString().slice(0, 10)).sort((a, b) => String(a.event_date).localeCompare(String(b.event_date))).slice(0, 4);

  async function createItem() {
    if (!organizationId || !userId || !canManage || !title.trim()) {
      setMessage("Add a title before saving.");
      return;
    }
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("department_hub_items").insert({
      organization_id: organizationId,
      department,
      item_type: activeType,
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim(),
      resource_url: resourceUrl.trim() || null,
      event_date: eventDate || null,
      tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
      created_by: userId,
    });
    if (error) return setMessage(error.message);
    setTitle(""); setSummary(""); setBody(""); setResourceUrl(""); setEventDate(""); setTags("");
    setMessage(`${typeMeta[activeType].label.slice(0, -1) || "Item"} added to ${department}.`);
    await loadDepartment(organizationId, department);
  }

  async function deleteItem(item: HubItem) {
    if (!canManage || !window.confirm(`Delete “${item.title}”?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("department_hub_items").delete().eq("id", item.id);
    if (error) return setMessage(error.message);
    setItems((current) => current.filter((row) => row.id !== item.id));
  }

  if (loading) return <main className="dhPage"><div className="dhLoading">Loading department hub…</div></main>;

  return <main className="dhPage">
    <header className="dhTopbar"><Link href="/teach">← Teach</Link><div><span>PHASE 33</span><strong>Department Hub</strong></div><Link href="/curriculum">Curriculum →</Link></header>

    <section className="dhHero">
      <div><span className="dhEyebrow">DEPARTMENT WORKSPACE</span><h1>{department || "Department"}</h1><p>Notices, resources, assessment information, meeting notes, key dates, curriculum and development work in one place.</p></div>
      <div className="dhHeroActions">
        {canSwitchDepartment && departments.length > 1 && <label><span>Department</span><select value={department} onChange={(event) => switchDepartment(event.target.value)}>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>}
        <Link href={`/curriculum?department=${encodeURIComponent(department)}`}>Open curriculum</Link>
      </div>
    </section>

    <section className="dhStats">
      <div><strong>{staff.length}</strong><span>staff listed</span></div>
      <div><strong>{items.filter((i) => i.item_type === "notice").length}</strong><span>notices</span></div>
      <div><strong>{curriculumCount}</strong><span>curriculum units</span></div>
      <div><strong>{planCount}</strong><span>development plans</span></div>
    </section>

    {message && <div className="dhMessage">{message}</div>}

    <section className="dhQuickGrid">
      <article><span>CURRICULUM</span><h2>Subject planning</h2><p>Browse year groups, topics, lessons, objectives, vocabulary, assessments and knowledge organisers.</p><Link href={`/curriculum?department=${encodeURIComponent(department)}`}>Open curriculum hub →</Link></article>
      <article><span>DEVELOPMENT</span><h2>CPD & improvement</h2><p>Keep department development plans, learning-walk themes and implementation evidence connected.</p><div><Link href="/departments">Development dashboard</Link><Link href="/learning-walks">Learning walks</Link></div></article>
      <article><span>UPCOMING</span><h2>Next department dates</h2>{upcoming.length ? upcoming.map((item) => <p key={item.id}><strong>{new Date(`${item.event_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</strong> {item.title}</p>) : <p>No key dates have been added yet.</p>}</article>
    </section>

    <section className="dhWorkspace">
      <div className="dhTabs">{(Object.keys(typeMeta) as HubItemType[]).map((type) => <button key={type} className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)}><strong>{typeMeta[type].label}</strong><small>{typeMeta[type].helper}</small></button>)}</div>
      <div className="dhItems">
        <div className="dhSectionHeading"><div><span>{typeMeta[activeType].label.toUpperCase()}</span><h2>{typeMeta[activeType].helper}</h2></div>{canManage && <small>HoD / leadership editing enabled</small>}</div>
        {visibleItems.length ? visibleItems.map((item) => <article key={item.id} className="dhItem">
          <div><div className="dhItemMeta">{item.event_date && <span>{new Date(`${item.event_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}{item.body && <details><summary>View details</summary><p>{item.body}</p></details>}</div>
          <div className="dhItemActions">{item.resource_url && <a href={item.resource_url} target="_blank" rel="noreferrer">Open link</a>}{canManage && <button onClick={() => deleteItem(item)}>Delete</button>}</div>
        </article>) : <div className="dhEmpty">Nothing has been added to this section yet.</div>}
      </div>
    </section>

    <section className="dhBottomGrid">
      <article className="dhStaff"><span className="dhEyebrow">DEPARTMENT TEAM</span><h2>Staff</h2>{staff.length ? <div>{staff.map((person) => <p key={person.id}><strong>{person.full_name}</strong><span>{person.role || "Staff"}</span></p>)}</div> : <p>Staff directory information is not available for this role yet.</p>}</article>
      {canManage && <article className="dhCreate"><span className="dhEyebrow">ADD TO DEPARTMENT HUB</span><h2>New {typeMeta[activeType].label.toLowerCase().replace(/s$/, "")}</h2><div className="dhForm"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"/><input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Short summary"/><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details / meeting actions / guidance" rows={5}/><input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="Optional link"/><label><span>Optional date</span><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}/></label><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, separated by commas"/><button onClick={createItem}>Add to {department}</button></div></article>}
    </section>
  </main>;
}
