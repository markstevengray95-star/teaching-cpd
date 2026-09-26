"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type PortfolioEntry = { id: string; title: string; description: string; evidence_type: string; course_id: string | null; external_link: string | null; evidence_path: string | null; cpd_hours: number | string; occurred_on: string; created_at: string };
type CourseRecord = { course_id: string; completed_at: string };
type LiveRecord = { session_id: string; checked_out_at: string | null };
type LiveSession = { id: string; title: string; presenter_name: string; starts_at: string; ends_at: string | null };

const evidenceLabels: Record<string, string> = {
  reflection: "Reflection",
  course: "Course evidence",
  live_cpd: "Live CPD",
  external_cpd: "External CPD",
  classroom_evidence: "Classroom evidence",
  coaching: "Coaching",
  other: "Other",
};

export default function PortfolioPage() {
  const [userId, setUserId] = useState("");
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [courseRecords, setCourseRecords] = useState<CourseRecord[]>([]);
  const [liveRecords, setLiveRecords] = useState<(LiveRecord & { session?: LiveSession })[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), []);
  const manualHours = entries.reduce((sum, e) => sum + Number(e.cpd_hours || 0), 0);
  const courseHours = courseRecords.reduce((sum, r) => sum + (courseMap.get(r.course_id)?.duration || 0) / 60, 0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/portfolio"; return; }
      setUserId(auth.user.id);
      const [{ data: portfolio, error: portfolioError }, { data: completed, error: completedError }, { data: live, error: liveError }] = await Promise.all([
        supabase.from("portfolio_entries").select("id,title,description,evidence_type,course_id,external_link,evidence_path,cpd_hours,occurred_on,created_at").eq("user_id", auth.user.id).order("occurred_on", { ascending: false }),
        supabase.from("course_progress").select("course_id,completed_at").eq("user_id", auth.user.id).not("completed_at", "is", null).order("completed_at", { ascending: false }),
        supabase.from("live_participants").select("session_id,checked_out_at").eq("user_id", auth.user.id).eq("status", "completed").order("checked_out_at", { ascending: false }),
      ]);
      if (portfolioError) setMessage(portfolioError.message);
      if (completedError) setMessage(completedError.message);
      if (liveError) setMessage(liveError.message);
      setEntries((portfolio || []) as PortfolioEntry[]);
      setCourseRecords((completed || []).filter(r => r.completed_at) as CourseRecord[]);

      const liveRows = (live || []) as LiveRecord[];
      if (liveRows.length) {
        const ids = [...new Set(liveRows.map(r => r.session_id))];
        const { data: sessions } = await supabase.from("live_sessions").select("id,title,presenter_name,starts_at,ends_at").in("id", ids);
        const sessionMap = new Map(((sessions || []) as LiveSession[]).map(s => [s.id, s]));
        setLiveRecords(liveRows.map(r => ({ ...r, session: sessionMap.get(r.session_id) })));
      }
      setLoading(false);
    })();
  }, []);

  async function addEntry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    const form = new FormData(e.currentTarget);
    const linkText = String(form.get("external_link") || "").trim();
    let externalLink: string | null = null;
    if (linkText) {
      try {
        const parsed = new URL(linkText);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
        externalLink = parsed.toString();
      } catch {
        setMessage("Use a valid http or https evidence link, or leave the link blank.");
        return;
      }
    }
    const payload = {
      user_id: userId,
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      evidence_type: String(form.get("evidence_type") || "reflection"),
      course_id: String(form.get("course_id") || "") || null,
      external_link: externalLink,
      cpd_hours: Math.max(0, Number(form.get("cpd_hours") || 0)),
      occurred_on: String(form.get("occurred_on") || today()),
    };
    const { data, error } = await supabase.from("portfolio_entries").insert(payload).select("id,title,description,evidence_type,course_id,external_link,evidence_path,cpd_hours,occurred_on,created_at").single();
    if (error) { setMessage(error.message); return; }
    setEntries(prev => [data as PortfolioEntry, ...prev]);
    setShowForm(false);
    setMessage("Evidence added to your CPD portfolio.");
    e.currentTarget.reset();
  }

  async function openEvidence(entry: PortfolioEntry) {
    if (!entry.evidence_path) return;
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.storage.from("cpd-evidence").createSignedUrl(entry.evidence_path, 300);
    if (error || !data?.signedUrl) { setMessage(error?.message || "Unable to open evidence."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeEntry(entry: PortfolioEntry) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("portfolio_entries").delete().eq("id", entry.id).eq("user_id", userId);
    if (error) { setMessage(error.message); return; }
    if (entry.evidence_path) await supabase.storage.from("cpd-evidence").remove([entry.evidence_path]);
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    setMessage("Portfolio entry removed.");
  }

  if (loading) return <main className="phasePage"><div className="phaseCard">Loading your CPD portfolio…</div></main>;

  return <main className="phasePage">
    <section className="phaseHero compactHero">
      <a className="phaseBack" href="/">← Teaching CPD</a>
      <span className="eyebrow">PROFESSIONAL PORTFOLIO</span>
      <h1>A single evidence record for your professional learning.</h1>
      <p>Completed app courses and live sessions appear automatically. Add external training, coaching, classroom evidence or other professional development when useful.</p>
      <div className="phaseActions"><button className="primary" onClick={() => setShowForm(v => !v)}>{showForm ? "Close form" : "Add evidence"}</button></div>
    </section>

    {message && <div className="phaseNotice">{message}</div>}
    <div className="privacyNote">Your portfolio entries are private to your account in this phase. Avoid entering confidential pupil-identifiable information in reflective evidence.</div>

    <section className="developmentStats">
      <div className="developmentStat"><strong>{courseRecords.length}</strong><span>completed courses</span></div>
      <div className="developmentStat"><strong>{liveRecords.length}</strong><span>live CPD sessions</span></div>
      <div className="developmentStat"><strong>{entries.length}</strong><span>manual evidence entries</span></div>
      <div className="developmentStat"><strong>{(courseHours + manualHours).toFixed(1)}</strong><span>recorded hours + courses</span></div>
    </section>

    {showForm && <section className="phaseCard" style={{ marginBottom: 18 }}>
      <div className="phaseCardHead"><div><span className="eyebrow">NEW EVIDENCE</span><h2>Add to portfolio</h2></div></div>
      <form className="phase4Form" onSubmit={addEntry}>
        <label>Title<input name="title" required placeholder="e.g. Local subject network meeting" /></label>
        <label>Evidence type<select name="evidence_type" defaultValue="external_cpd">{Object.entries(evidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Date<input type="date" name="occurred_on" defaultValue={today()} required /></label>
        <label>CPD hours<input type="number" name="cpd_hours" min="0" max="999" step="0.25" defaultValue="0" /></label>
        <label>Related course (optional)<select name="course_id" defaultValue=""><option value="">None</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label>Evidence link (optional)<input type="url" name="external_link" placeholder="https://…" /></label>
        <label className="span2">Reflection / evidence summary<textarea name="description" rows={5} placeholder="What did you learn, observe or apply? Do not include confidential pupil-identifiable information." /></label>
        <div className="span2"><button className="primary">Save evidence</button></div>
      </form>
    </section>}

    <section className="sectionSplit">
      <div className="phaseCard">
        <div className="phaseCardHead"><div><span className="eyebrow">AUTOMATIC RECORD</span><h2>Completed learning</h2></div></div>
        <div className="entryList">
          {courseRecords.map(record => { const course = courseMap.get(record.course_id); return <div className="entryRow" key={`course-${record.course_id}`}><div><h3>✓ {course?.title || record.course_id}</h3><p>Completed interactive CPD course.</p><div className="entryMeta"><span>Course</span><span>{course ? `${course.duration} min` : "Completed"}</span><span>{new Date(record.completed_at).toLocaleDateString("en-GB")}</span></div></div></div>; })}
          {liveRecords.map(record => <div className="entryRow" key={`live-${record.session_id}`}><div><h3>✓ {record.session?.title || "Live CPD session"}</h3><p>{record.session?.presenter_name ? `Facilitated by ${record.session.presenter_name}.` : "Completed live CPD participation and reflection."}</p><div className="entryMeta"><span>Live CPD</span>{record.checked_out_at && <span>{new Date(record.checked_out_at).toLocaleDateString("en-GB")}</span>}</div></div></div>)}
          {!courseRecords.length && !liveRecords.length && <div className="emptyDevelopment">Complete a course or live CPD session and it will appear here automatically.</div>}
        </div>
      </div>

      <div className="phaseCard">
        <div className="phaseCardHead"><div><span className="eyebrow">YOUR EVIDENCE</span><h2>Additional portfolio entries</h2></div></div>
        <div className="entryList">
          {entries.map(entry => <div className="entryRow" key={entry.id}><div><h3>{entry.title}</h3><p>{entry.description || "No summary added."}</p><div className="entryMeta"><span>{evidenceLabels[entry.evidence_type] || entry.evidence_type}</span><span>{Number(entry.cpd_hours || 0).toFixed(1)} h</span><span>{new Date(`${entry.occurred_on}T12:00:00`).toLocaleDateString("en-GB")}</span>{entry.external_link && <a className="smallLink" href={entry.external_link} target="_blank" rel="noreferrer">Evidence link ↗</a>}{entry.evidence_path && <button className="smallLink evidenceLinkButton" onClick={() => openEvidence(entry)}>Private evidence ↗</button>}</div></div><button className="textButton" onClick={() => removeEntry(entry)}>Remove</button></div>)}
          {!entries.length && <div className="emptyDevelopment">No additional evidence yet. Add external CPD, coaching or classroom evidence when it is useful.</div>}
        </div>
      </div>
    </section>
  </main>;
}

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
