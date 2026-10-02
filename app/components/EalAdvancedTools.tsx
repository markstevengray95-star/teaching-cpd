"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";
import {
  interventionSummary,
  monthsOld,
  newCase,
  readingChange,
  strandMean,
  today,
  validateCase,
  type CaseRow,
  type EalAssessment,
  type Intervention,
  type SenCase,
} from "@/lib/senWorkspace";
import "./EalWorkspace.css";

type Tab = "domains" | "reading" | "interventions" | "timeline" | "analytics" | "import" | "integrations";
const tabs: { id: Tab; label: string }[] = [
  { id: "domains", label: "8-domain profile" },
  { id: "reading", label: "Reading progress" },
  { id: "interventions", label: "Interventions & observations" },
  { id: "timeline", label: "Timeline & passport" },
  { id: "analytics", label: "Language & data quality" },
  { id: "import", label: "CSV import" },
  { id: "integrations", label: "iSAMS & Drive" },
];
const strands = ["listening", "speaking", "reading", "writing"] as const;

function average(values: number[]) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null; }
function meanAt(a: EalAssessment | undefined, criterionIndex: number) {
  if (!a) return null;
  return average(strands.flatMap(s => {
    const v = a.scores[s]?.[criterionIndex];
    return typeof v === "number" ? [v] : [];
  }));
}
function domains(a: EalAssessment | undefined) {
  return [
    ["Listening comprehension", a ? strandMean(a.scores.listening || []) : null],
    ["Spoken interaction", a ? strandMean(a.scores.speaking || []) : null],
    ["Reading / viewing", a ? strandMean(a.scores.reading || []) : null],
    ["Writing", a ? strandMean(a.scores.writing || []) : null],
    ["Vocabulary", meanAt(a, 2)],
    ["Independence", meanAt(a, 3)],
    ["Accuracy", meanAt(a, 4)],
    ["Detail & curriculum language", meanAt(a, 1)],
  ] as [string, number | null][];
}
function fmtMonths(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  const n = Math.abs(Math.round(value));
  return `${sign}${Math.floor(n / 12)}y ${n % 12}m`;
}
function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim()));
}
function norm(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function uid() { return crypto.randomUUID(); }

export default function EalAdvancedTools() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [org, setOrg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState<Tab>("domains");
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [interventionId, setInterventionId] = useState("");

  const active = useMemo(() => rows.filter(r => !r.archived_at), [rows]);
  const selected = rows.find(r => r.id === selectedId) || null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) { window.location.assign("/auth?next=/sen/eal/advanced"); return; }
      const access = await resolveStaffAccess(client, user);
      if (!mounted) return;
      if (!access.organizationId) { setMessage("No authorised school is selected for this account."); setReady(true); return; }
      const check = await client.rpc("sen_workspace_access", { org_id: access.organizationId });
      if (check.error || check.data !== true) { setMessage("This account does not have access to restricted SEN/EAL records."); setReady(true); return; }
      const result = await client.from("sen_department_cases").select("id,organization_id,body,version,archived_at,updated_at").eq("organization_id", access.organizationId).is("archived_at", null).order("updated_at", { ascending: false }).limit(1000);
      if (!mounted) return;
      if (result.error) { setMessage("The EAL records could not be loaded."); setReady(true); return; }
      const loaded = (result.data || []) as CaseRow[];
      setOrg(access.organizationId); setRows(loaded); setSelectedId(loaded[0]?.id || ""); setReady(true);
    })().catch(() => { if (mounted) { setMessage("The EAL tools could not be loaded."); setReady(true); } });
    return () => { mounted = false; };
  }, []);

  async function save(row: CaseRow, body: SenCase, success: string) {
    const errors = validateCase(body);
    if (errors.length) { setMessage(errors.join(" ")); return false; }
    if (!org) return false;
    setBusy(true); setMessage("");
    try {
      const result = await getSupabaseBrowserClient().from("sen_department_cases").update({ body }).eq("id", row.id).eq("organization_id", org).eq("version", row.version).select("id,organization_id,body,version,archived_at,updated_at").single();
      if (result.error || !result.data) throw new Error("The record changed elsewhere or could not be saved. Reload and try again.");
      const updated = result.data as CaseRow;
      setRows(old => old.map(r => r.id === updated.id ? updated : r));
      setMessage(success); return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); return false; }
    finally { setBusy(false); }
  }

  async function addIntervention(form: HTMLFormElement) {
    if (!selected) return;
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const intervention: Intervention = {
      id: uid(), title: v.title, owner: v.owner, baseline: v.baseline, goal: v.goal, measure: v.measure,
      strategy: v.strategy, frequency: v.frequency, minutes: Number(v.minutes), weeklySessions: Number(v.weeklySessions),
      hourlyCost: Number(v.hourlyCost || 0), startDate: v.startDate, reviewDate: v.reviewDate, status: "Active", sessions: [],
    };
    const ok = await save(selected, { ...selected.body, interventions: [...selected.body.interventions, intervention] }, "EAL intervention added.");
    if (ok) { form.reset(); setInterventionId(intervention.id); }
  }

  async function addSession(form: HTMLFormElement) {
    if (!selected || !interventionId) return;
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const interventions = selected.body.interventions.map(i => i.id !== interventionId ? i : { ...i, sessions: [...i.sessions, { id: uid(), date: v.date, minutes: Number(v.minutes), outcome: Number(v.outcome), fidelity: Number(v.fidelity), usefulness: v.usefulness === "" ? null : Number(v.usefulness), evidence: v.evidence }] });
    const ok = await save(selected, { ...selected.body, interventions }, "Intervention evidence added."); if (ok) form.reset();
  }

  async function addObservation(form: HTMLFormElement) {
    if (!selected) return;
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const contacts = [...selected.body.contacts, { id: uid(), date: v.date, type: "EAL teacher observation", participants: v.participants, summary: v.summary, actions: v.actions }];
    const ok = await save(selected, { ...selected.body, contacts }, "Teacher observation added."); if (ok) form.reset();
  }

  async function importCsv(file: File | null) {
    if (!file || !org) return;
    setBusy(true); setMessage("");
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length < 2) throw new Error("The CSV needs a header row and at least one pupil row.");
      const headers = parsed[0].map(norm);
      const idx = (names: string[]) => names.map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;
      const columns = {
        reference: idx(["reference", "pupil_reference", "student_id", "pupil_id", "admission_number"]),
        name: idx(["name", "display_name", "pupil_name", "student_name"]),
        year: idx(["year", "year_group"]), className: idx(["class", "class_name", "tutor_group", "form"]),
        languages: idx(["languages", "home_language", "home_languages", "language_background"]),
        dob: idx(["dob", "date_of_birth"]), arrival: idx(["arrival", "arrival_date", "date_of_arrival"]),
      };
      if (columns.reference < 0 || columns.name < 0) throw new Error("CSV must include reference and name columns.");
      if (parsed.length - 1 > 500) throw new Error("Import at most 500 pupils at a time.");
      const bodies = parsed.slice(1).map(values => {
        const body = newCase();
        body.reference = values[columns.reference]?.trim() || ""; body.name = values[columns.name]?.trim() || "";
        body.year = columns.year >= 0 ? values[columns.year]?.trim() || "" : "";
        body.className = columns.className >= 0 ? values[columns.className]?.trim() || "" : "";
        body.languages = columns.languages >= 0 ? values[columns.languages]?.trim() || "" : "";
        body.dob = columns.dob >= 0 ? values[columns.dob]?.trim() || "" : "";
        body.arrival = columns.arrival >= 0 ? values[columns.arrival]?.trim() || "" : "";
        body.status = "No SEN identified";
        const errors = validateCase(body); if (errors.length) throw new Error(`${body.reference || "A row"}: ${errors[0]}`);
        return body;
      });
      const result = await getSupabaseBrowserClient().from("sen_department_cases").insert(bodies.map(body => ({ organization_id: org, body }))).select("id,organization_id,body,version,archived_at,updated_at");
      if (result.error) throw new Error(result.error.message);
      const added = (result.data || []) as CaseRow[]; setRows(old => [...added, ...old]); setSelectedId(added[0]?.id || selectedId); setMessage(`${added.length} pupils imported from CSV.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "CSV import failed."); }
    finally { setBusy(false); }
  }

  const latest = selected ? [...selected.body.assessments].sort((a, b) => b.date.localeCompare(a.date))[0] : undefined;
  const domainRows = domains(latest);
  const latestReading = selected ? [...selected.body.reading].sort((a, b) => b.date.localeCompare(a.date))[0] : undefined;
  const chronological = selected && latestReading ? monthsOld(selected.body.dob, latestReading.date) : null;
  const readingDelta = latestReading && chronological !== null ? latestReading.ageMonths - chronological : null;
  const change = selected ? readingChange(selected.body.reading) : null;
  const progressRate = change && change.elapsedMonths > 0 ? change.gain / change.elapsedMonths : null;
  const selectedIntervention = selected?.body.interventions.find(i => i.id === interventionId) || selected?.body.interventions[0] || null;

  const timeline = useMemo(() => {
    if (!selected) return [];
    const items = [
      ...selected.body.assessments.map(a => ({ date: a.date, type: "EAL assessment", text: `Band ${a.band}: ${a.evidence}` })),
      ...selected.body.reading.map(r => ({ date: r.date, type: "Reading age", text: `${Math.floor(r.ageMonths / 12)}y ${r.ageMonths % 12}m · ${r.tool}` })),
      ...selected.body.reviews.map(r => ({ date: r.date, type: "Review", text: r.actions })),
      ...selected.body.contacts.map(c => ({ date: c.date, type: c.type, text: c.summary })),
      ...selected.body.interventions.flatMap(i => i.sessions.map(s => ({ date: s.date, type: `Intervention · ${i.title}`, text: s.evidence }))),
    ];
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [selected]);

  const languageCounts = useMemo(() => {
    const map = new Map<string, number>();
    active.forEach(r => r.body.languages.split(/[;,/]/).map(v => v.trim()).filter(Boolean).forEach(language => map.set(language, (map.get(language) || 0) + 1)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [active]);
  const dataQuality = useMemo(() => ({
    missingDob: active.filter(r => !r.body.dob).length,
    missingLanguages: active.filter(r => !r.body.languages).length,
    missingYear: active.filter(r => !r.body.year).length,
    noAssessment: active.filter(r => !r.body.assessments.length).length,
    noReading: active.filter(r => !r.body.reading.length).length,
    overdueReview: active.filter(r => r.body.plan.reviewDate && r.body.plan.reviewDate < today()).length,
  }), [active]);

  function name(row: CaseRow) { return privacy ? `Pupil ${active.findIndex(r => r.id === row.id) + 1}` : row.body.name; }
  if (!ready) return <main className="ealWorkspace"><div className="ealLoading">Loading advanced EAL tools…</div></main>;

  return <main className="ealWorkspace">
    <header className="ealHeader"><div><p className="ealEyebrow">EAL PROGRESS HUB · ADVANCED</p><h1>Progress, intervention and school-data tools</h1><p>Eight-domain proficiency, reading-age comparison, intervention evidence, pupil timelines, passports, data-quality checks and school-system transfer tools.</p></div><div className="ealHeaderActions"><Link href="/sen/eal">← Core EAL hub</Link><Link href="/sen">SEN department</Link></div></header>
    {message && <p className="ealMessage" role="status">{message}</p>}
    <section className="ealPicker"><label>Current pupil<select value={selectedId} onChange={e => { setSelectedId(e.target.value); setInterventionId(""); }}><option value="">Choose…</option>{active.map(r => <option key={r.id} value={r.id}>{name(r)} · {r.body.year || r.body.reference}</option>)}</select></label><button onClick={() => setPrivacy(v => !v)}>{privacy ? "Show names" : "Privacy mode"}</button></section>
    <nav className="ealTabs">{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}><strong>{t.label}</strong></button>)}</nav>
    <section className="ealContent">
      {tab === "domains" && <><div className="ealTitle"><div><p>EIGHT LANGUAGE DOMAINS</p><h2>{selected ? name(selected) : "Choose a pupil"}</h2></div></div>{selected ? <div className="ealGrid"><article className="ealCard"><h3>Latest evidence profile</h3><p>These eight indicators are derived from the latest twenty-criterion four-strand assessment. They support planning; they are not a standardised score.</p>{domainRows.map(([label, score]) => <div className="ealBarRow" key={label}><span style={{width:"auto"}}>{label}</span><div><i style={{width:`${score === null ? 0 : score / 5 * 100}%`}} /></div><strong>{score === null ? "—" : score.toFixed(1)}</strong></div>)}</article><article className="ealCard"><h3>Assessment context</h3>{latest ? <><p><strong>Teacher-confirmed band:</strong> {latest.band}</p><p><strong>Confidence:</strong> {latest.confidence}</p><p><strong>Evidence:</strong> {latest.evidence}</p><p><strong>Adjustments:</strong> {latest.adjustments || "Not recorded"}</p><p><strong>Next steps:</strong> {latest.nextSteps || "Not recorded"}</p></> : <p>No four-strand assessment has been recorded.</p>}</article></div> : <article className="ealEmpty">Choose a pupil to view an eight-domain profile.</article>}</>}

      {tab === "reading" && <><div className="ealTitle"><div><p>READING PROGRESS</p><h2>Reading age vs chronological age</h2></div></div>{selected ? <div className="ealGrid"><article className="ealCard"><h3>Latest comparison</h3><div className="ealStats four"><article><strong>{latestReading ? `${Math.floor(latestReading.ageMonths/12)}y ${latestReading.ageMonths%12}m` : "—"}</strong><span>Reading age</span></article><article><strong>{fmtMonths(chronological)}</strong><span>Chronological age</span></article><article><strong>{fmtMonths(readingDelta)}</strong><span>Reading-age difference</span></article><article><strong>{progressRate === null ? "—" : progressRate.toFixed(2)}</strong><span>Months gained per month elapsed</span></article></div><p>Progress rate is only calculated when the first and latest reading-age result use the same named assessment tool.</p></article><article className="ealCard"><h3>History</h3>{[...selected.body.reading].sort((a,b)=>b.date.localeCompare(a.date)).map(r => <div className="ealRow" key={r.id}><span><strong>{Math.floor(r.ageMonths/12)}y {r.ageMonths%12}m</strong><small>{r.tool} · {r.notes}</small></span><time>{r.date}</time></div>)}{!selected.body.reading.length && <p>No reading-age results yet. Add them in the core EAL hub.</p>}</article></div> : <article className="ealEmpty">Choose a pupil.</article>}</>}

      {tab === "interventions" && <><div className="ealTitle"><div><p>INTERVENTION & OBSERVATION</p><h2>Plan, deliver and review support</h2></div></div>{selected ? <div className="ealGrid"><article className="ealCard"><h3>Add intervention</h3><form onSubmit={e=>{e.preventDefault();void addIntervention(e.currentTarget);}}><fieldset disabled={busy}><label>Intervention title<input name="title" required /></label><label>Lead<input name="owner" required /></label><label>Baseline<textarea name="baseline" required /></label><label>Measurable goal<textarea name="goal" required /></label><label>Success measure<textarea name="measure" required /></label><label>Strategy<textarea name="strategy" required /></label><label>Frequency<input name="frequency" required /></label><div className="ealFormGrid"><label>Minutes/session<input type="number" name="minutes" min="0" max="480" required /></label><label>Sessions/week<input type="number" name="weeklySessions" min="0" max="35" required /></label><label>Hourly cost £<input type="number" name="hourlyCost" min="0" max="1000" step="0.01" defaultValue="0" /></label><label>Start<input type="date" name="startDate" required defaultValue={today()} /></label><label>Review<input type="date" name="reviewDate" required /></label></div><button type="submit">Add intervention</button></fieldset></form></article><article className="ealCard"><h3>Intervention evidence</h3><label>Intervention<select value={interventionId || selected.body.interventions[0]?.id || ""} onChange={e=>setInterventionId(e.target.value)}><option value="">Choose…</option>{selected.body.interventions.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label>{selectedIntervention && <><p><strong>{selectedIntervention.goal}</strong></p>{(()=>{const s=interventionSummary(selectedIntervention);return <p>{s.count} sessions · outcome change {s.change ?? "—"} · mean fidelity {s.fidelity ?? "—"}% · {s.weeklyMinutes} min/week</p>;})()}<form onSubmit={e=>{e.preventDefault();void addSession(e.currentTarget);}}><fieldset disabled={busy}><div className="ealFormGrid"><label>Date<input type="date" name="date" required defaultValue={today()} /></label><label>Minutes<input type="number" name="minutes" min="0" max="480" required /></label><label>Outcome 0–4<select name="outcome" required>{[0,1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label><label>Fidelity %<input type="number" name="fidelity" min="0" max="100" required /></label><label>Pupil usefulness<select name="usefulness" defaultValue=""><option value="">Not recorded</option>{[0,1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label></div><label>Evidence<textarea name="evidence" required /></label><button type="submit">Add session evidence</button></fieldset></form></>}</article><article className="ealCard"><h3>Teacher observation</h3><form onSubmit={e=>{e.preventDefault();void addObservation(e.currentTarget);}}><fieldset disabled={busy}><label>Date<input type="date" name="date" required defaultValue={today()} /></label><label>Teacher / class<input name="participants" required /></label><label>Observation<textarea name="summary" required /></label><label>Action / next step<textarea name="actions" /></label><button type="submit">Save observation</button></fieldset></form></article><article className="ealCard"><h3>Recent observations</h3>{selected.body.contacts.filter(c=>c.type==="EAL teacher observation").slice().reverse().map(c=><div className="ealRow" key={c.id}><span><strong>{c.summary}</strong><small>{c.participants} · {c.actions}</small></span><time>{c.date}</time></div>)}{!selected.body.contacts.some(c=>c.type==="EAL teacher observation")&&<p>No teacher observations yet.</p>}</article></div> : <article className="ealEmpty">Choose a pupil.</article>}</>}

      {tab === "timeline" && <><div className="ealTitle"><div><p>TIMELINE & PASSPORT</p><h2>One chronological evidence record</h2></div><button onClick={()=>window.print()} disabled={!selected}>Print passport</button></div>{selected ? <div className="ealGrid"><article className="ealCard"><h3>Progress timeline</h3>{timeline.map((item,index)=><div className="ealRow" key={`${item.date}-${item.type}-${index}`}><span><strong>{item.type}</strong><small>{item.text}</small></span><time>{item.date}</time></div>)}{!timeline.length&&<p>No timeline evidence yet.</p>}</article><article className="ealCard ealReport"><h3>Student passport</h3><p><strong>{name(selected)}</strong> · {selected.body.year} · {selected.body.className}</p><p><strong>Language background:</strong> {selected.body.languages || "Not recorded"}</p><p><strong>Strengths:</strong> {selected.body.strengths || "Not recorded"}</p><p><strong>Current EAL evidence:</strong> {latest ? `Band ${latest.band} — ${latest.evidence}` : "No assessment recorded"}</p><p><strong>Helpful adjustments:</strong> {selected.body.plan.adjustments || latest?.adjustments || "Not recorded"}</p><p><strong>Current provision:</strong> {selected.body.plan.provision || "Not recorded"}</p><p><strong>Pupil voice:</strong> {selected.body.plan.pupilVoice || "Not recorded"}</p><p><strong>Next steps:</strong> {latest?.nextSteps || selected.body.plan.outcome || "Not recorded"}</p><p><strong>Review date:</strong> {selected.body.plan.reviewDate || "Not set"}</p></article></div> : <article className="ealEmpty">Choose a pupil.</article>}</>}

      {tab === "analytics" && <><div className="ealTitle"><div><p>COHORT & DATA QUALITY</p><h2>Languages, coverage and missing data</h2></div></div><div className="ealGrid"><article className="ealCard"><h3>Languages recorded</h3>{languageCounts.slice(0,20).map(([language,count])=><div className="ealRow" key={language}><span>{language}</span><strong>{count}</strong></div>)}{!languageCounts.length&&<p>No languages recorded.</p>}</article><article className="ealCard"><h3>Data-quality checks</h3>{Object.entries(dataQuality).map(([key,count])=><div className="ealRow" key={key}><span>{key.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase())}</span><strong>{count}</strong></div>)}<p>Use these counts to find incomplete records. They are not pupil performance measures.</p></article></div></>}

      {tab === "import" && <><div className="ealTitle"><div><p>CSV IMPORT</p><h2>Bring pupil identity data into the EAL register</h2></div></div><article className="ealCard"><p>Accepted header names include <strong>reference/name</strong> plus optional year, class/tutor group, languages, DOB and arrival date. Imported pupils are created as “No SEN identified”; EAL evidence remains separate from SEN identification.</p><label className="ealFile">Choose CSV<input type="file" accept=".csv,text/csv" disabled={busy||!org} onChange={e=>void importCsv(e.target.files?.[0]||null)} /></label><p>For recurring pupil updates, use the school MIS integration rather than repeated file imports.</p></article></>}

      {tab === "integrations" && <><div className="ealTitle"><div><p>SCHOOL INTEGRATIONS</p><h2>iSAMS and protected evidence storage</h2></div></div><div className="ealGrid"><article className="ealCard"><h3>iSAMS / MIS</h3><p>The source EAL app supports a configurable iSAMS adapter. In this combined platform, school credentials should be configured centrally rather than embedded in this pupil-facing page.</p><Link className="ealLinkButton" href="/admin-centre">Open school administration</Link></article><article className="ealCard"><h3>Google Drive evidence</h3><p>Use the existing Google integration area for approved Drive evidence links. Keep pupil database fields in Supabase and store only the minimum evidence link/metadata needed by staff.</p><Link className="ealLinkButton" href="/integrations">Open Google integrations</Link></article><article className="ealCard"><h3>Google Workspace sign-in</h3><p>Staff access remains controlled by the main platform account and school role, so the EAL area does not introduce a second login.</p><Link className="ealLinkButton" href="/integrations">Check sign-in integration</Link></article><article className="ealCard"><h3>Implementation note</h3><p>A live iSAMS pull or Drive upload still requires the school-owned API/OAuth credentials. Those secrets should be added through the central integration configuration, not entered into pupil records.</p></article></div></>}
    </section>
  </main>;
}
