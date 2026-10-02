"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";
import { demoCases, newCase, strandMean, today, validateCase, type CaseRow, type EalAssessment, type SenCase } from "@/lib/senWorkspace";
import "./EalWorkspace.css";

type Mode = "loading" | "live" | "demo" | "unavailable";
type TestStatus = "open" | "submitted" | "reviewed" | "closed";
type TestRow = {
  id: string;
  organization_id: string;
  pupil_case_id: string | null;
  code: string;
  title: string;
  status: TestStatus;
  prompts: Record<string, string>;
  responses: Record<string, string>;
  scores: Record<string, number>;
  teacher_notes: string;
  expires_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};
type AuditRow = { id: number; organization_id: string; actor_user_id: string; pupil_case_id: string | null; action: string; detail: string; created_at: string };
type TabId = "dashboard" | "pupils" | "assessment" | "reading" | "support" | "reviews" | "tests" | "self" | "parents" | "analytics" | "transfer" | "privacy" | "archive" | "integrations";

const tabs: { id: TabId; label: string; hint: string }[] = [
  { id: "dashboard", label: "Dashboard", hint: "Coordinator overview" },
  { id: "pupils", label: "Pupil register", hint: "Profiles & language background" },
  { id: "assessment", label: "Assessment Centre", hint: "Listening, speaking, reading, writing" },
  { id: "reading", label: "Reading age", hint: "Track reading assessments" },
  { id: "support", label: "Support Hub", hint: "Adjustments, provision & reviews" },
  { id: "reviews", label: "Reviews & reports", hint: "Evidence and next steps" },
  { id: "tests", label: "Student Tests", hint: "Six-digit codes & marking" },
  { id: "self", label: "Student voice", hint: "Self-assessment & reflection" },
  { id: "parents", label: "Parent reports", hint: "Plain-language summaries" },
  { id: "analytics", label: "Analytics", hint: "Cohort-level progress" },
  { id: "transfer", label: "Import / Export", hint: "JSON and CSV transfer" },
  { id: "privacy", label: "Privacy & audit", hint: "Recent changes & access trail" },
  { id: "archive", label: "Archive", hint: "Restore inactive records" },
  { id: "integrations", label: "Integrations", hint: "Drive, MIS & school systems" },
];

const strands = ["listening", "speaking", "reading", "writing"] as const;
const strandLabels: Record<(typeof strands)[number], string> = { listening: "Listening", speaking: "Speaking", reading: "Reading", writing: "Writing" };
const criteria = ["Meaning", "Detail", "Vocabulary", "Independence", "Accuracy"];
const testPrompts: Record<string, string> = {
  listening: "Listening: your teacher reads this once, then again: ‘The science club meets after lunch in room twelve. Bring your notebook and safety glasses.’ Explain where the club meets, when it meets, and what to bring.",
  speaking: "Speaking: give a 30–60 second explanation of something you learned recently. Try to include subject vocabulary and link your ideas clearly. Your teacher can record notes in the response box.",
  reading: "Reading: ‘Mina joined the gardening club because she wanted to learn how plants survive dry weather. The group compared shaded and sunny areas, measured the soil each week, and changed how often they watered.’ Explain why Mina joined and describe two things the group did.",
  writing: "Writing: write 4–6 sentences explaining a school activity you know well. Include what happens, when or where it happens, and one reason someone might enjoy it.",
};

function id() { return crypto.randomUUID(); }
function sixDigitCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function fmtDate(value?: string | null) { return value ? new Date(value).toLocaleDateString("en-GB") : "Not set"; }
function average(values: number[]) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null; }
function download(name: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export default function EalWorkspace() {
  const [mode, setMode] = useState<Mode>("loading");
  const [org, setOrg] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [testCode, setTestCode] = useState("");

  const activeRows = useMemo(() => rows.filter(r => !r.archived_at), [rows]);
  const selected = rows.find(r => r.id === selectedId) || null;
  const filteredRows = activeRows.filter(r => `${r.body.name} ${r.body.reference} ${r.body.year} ${r.body.className} ${r.body.languages}`.toLowerCase().includes(query.toLowerCase()));
  const selectedTests = tests.filter(t => !selectedId || t.pupil_case_id === selectedId);

  useEffect(() => {
    let active = true;
    const client = getSupabaseBrowserClient();
    (async () => {
      try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) { window.location.assign("/auth?next=/sen/eal"); return; }
        const access = await resolveStaffAccess(client, user);
        if (!active) return;
        setUserId(user.id); setOrg(access.organizationId);
        if (!access.organizationId) { setMode("unavailable"); return; }
        const accessCheck = await client.rpc("sen_workspace_access", { org_id: access.organizationId });
        if (accessCheck.error || accessCheck.data !== true) { setMode("unavailable"); return; }
        const [caseResult, testResult, auditResult] = await Promise.all([
          client.from("sen_department_cases").select("id,organization_id,body,version,archived_at,updated_at").eq("organization_id", access.organizationId).order("updated_at", { ascending: false }).limit(1000),
          client.from("eal_student_tests").select("id,organization_id,pupil_case_id,code,title,status,prompts,responses,scores,teacher_notes,expires_at,submitted_at,created_at,updated_at").eq("organization_id", access.organizationId).order("created_at", { ascending: false }).limit(1000),
          client.from("eal_audit_log").select("id,organization_id,actor_user_id,pupil_case_id,action,detail,created_at").eq("organization_id", access.organizationId).order("created_at", { ascending: false }).limit(300),
        ]);
        if (!active) return;
        if (caseResult.error || testResult.error || auditResult.error) { setMode("unavailable"); return; }
        const loaded = (caseResult.data || []) as CaseRow[];
        setRows(loaded); setTests((testResult.data || []) as TestRow[]); setAuditRows((auditResult.data || []) as AuditRow[]);
        setSelectedId(loaded.find(r => !r.archived_at)?.id || "");
        setMode("live");
      } catch { if (active) setMode("unavailable"); }
    })();
    return () => { active = false; };
  }, []);

  async function log(action: string, detail: string, pupilCaseId?: string | null) {
    if (mode !== "live" || !org) return;
    const client = getSupabaseBrowserClient();
    const result = await client.from("eal_audit_log").insert({ organization_id: org, pupil_case_id: pupilCaseId || null, action, detail }).select("id,organization_id,actor_user_id,pupil_case_id,action,detail,created_at").single();
    if (!result.error && result.data) setAuditRows(old => [result.data as AuditRow, ...old].slice(0, 300));
  }

  function startDemo() {
    const demo = demoCases();
    setRows(demo); setSelectedId(demo[1]?.id || demo[0]?.id || ""); setTests([]); setAuditRows([]); setMode("demo"); setMessage("Fictional demonstration only. Demo changes disappear when you reload.");
  }

  async function saveCase(row: CaseRow, body: SenCase, action: string, detail: string) {
    const errors = validateCase(body);
    if (errors.length) { setMessage(errors.join(" ")); return false; }
    setBusy(true); setMessage("");
    try {
      if (mode === "demo") {
        const updated: CaseRow = { ...row, body: structuredClone(body), version: row.version + 1, updated_at: new Date().toISOString() };
        setRows(old => old.map(r => r.id === row.id ? updated : r)); setMessage("Updated the fictional demo."); return true;
      }
      if (!org) throw new Error("No authorised school selected.");
      const result = await getSupabaseBrowserClient().from("sen_department_cases").update({ body }).eq("id", row.id).eq("organization_id", org).eq("version", row.version).select("id,organization_id,body,version,archived_at,updated_at").single();
      if (result.error || !result.data) throw new Error("The pupil record was not saved. Reload in case another authorised user changed it.");
      const updated = result.data as CaseRow;
      setRows(old => old.map(r => r.id === updated.id ? updated : r));
      await log(action, detail, row.id); setMessage("Saved to the restricted EAL/SEN record."); return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); return false; }
    finally { setBusy(false); }
  }

  async function addPupil(form: HTMLFormElement) {
    if (!org && mode !== "demo") return;
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const body = newCase();
    Object.assign(body, { reference: values.reference.trim(), name: values.name.trim(), year: values.year.trim(), className: values.className.trim(), languages: values.languages.trim(), status: "No SEN identified" });
    const errors = validateCase(body); if (errors.length) { setMessage(errors.join(" ")); return; }
    setBusy(true);
    try {
      if (mode === "demo") {
        const row: CaseRow = { id: id(), organization_id: "demo", body, version: 1, archived_at: null, updated_at: new Date().toISOString() };
        setRows(old => [row, ...old]); setSelectedId(row.id); form.reset(); setMessage("Added to the fictional demo."); return;
      }
      const result = await getSupabaseBrowserClient().from("sen_department_cases").insert({ organization_id: org, body }).select("id,organization_id,body,version,archived_at,updated_at").single();
      if (result.error || !result.data) throw new Error("Pupil could not be added.");
      const row = result.data as CaseRow; setRows(old => [row, ...old]); setSelectedId(row.id); form.reset(); await log("pupil_created", "EAL pupil profile created.", row.id); setMessage("Pupil added.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add pupil."); }
    finally { setBusy(false); }
  }

  async function addAssessment(form: HTMLFormElement) {
    if (!selected) { setMessage("Choose a pupil first."); return; }
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const scores: Record<string, (number | null)[]> = {};
    for (const strand of strands) scores[strand] = criteria.map((_, index) => values[`${strand}_${index}`] ? Number(values[`${strand}_${index}`]) : null);
    const assessment: EalAssessment = { id: id(), date: values.date, assessor: values.assessor, task: values.task, band: values.band, confidence: values.confidence, scores, evidence: values.evidence, adjustments: values.adjustments, nextSteps: values.nextSteps };
    const ok = await saveCase(selected, { ...selected.body, assessments: [...selected.body.assessments, assessment] }, "assessment_added", `Four-strand EAL assessment added for ${values.date}.`);
    if (ok) form.reset();
  }

  async function addReading(form: HTMLFormElement) {
    if (!selected) { setMessage("Choose a pupil first."); return; }
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const ageMonths = Number(values.years) * 12 + Number(values.months);
    const next = { ...selected.body, reading: [...selected.body.reading, { id: id(), date: values.date, tool: values.tool, ageMonths, notes: values.notes }] };
    const ok = await saveCase(selected, next, "reading_age_added", `Reading age recorded: ${Math.floor(ageMonths / 12)}y ${ageMonths % 12}m.`);
    if (ok) form.reset();
  }

  async function saveSupport(form: HTMLFormElement) {
    if (!selected) return;
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const next = { ...selected.body, plan: { ...selected.body.plan, adjustments: values.adjustments, provision: values.provision, owner: values.owner, reviewDate: values.reviewDate, outcome: values.outcome, measure: values.measure, pupilVoice: values.pupilVoice, familyVoice: values.familyVoice } };
    await saveCase(selected, next, "support_updated", "EAL adjustments, provision and review plan updated.");
  }

  async function addReview(form: HTMLFormElement) {
    if (!selected) return;
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const next = { ...selected.body, reviews: [...selected.body.reviews, { id: id(), date: v.date, attendees: v.attendees, evidence: v.evidence, pupilVoice: v.pupilVoice, familyVoice: v.familyVoice, decision: v.decision, actions: v.actions, nextDate: v.nextDate }] };
    const ok = await saveCase(selected, next, "review_added", `EAL review added for ${v.date}.`); if (ok) form.reset();
  }

  async function addSelfAssessment(form: HTMLFormElement) {
    if (!selected) return;
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const summary = `Listening ${v.listening}/5 · Speaking ${v.speaking}/5 · Reading ${v.reading}/5 · Writing ${v.writing}/5. ${v.comment}`.trim();
    const next = { ...selected.body, contacts: [...selected.body.contacts, { id: id(), date: v.date, type: "EAL self-assessment", participants: "Pupil", summary, actions: v.nextSteps }] };
    const ok = await saveCase(selected, next, "student_voice_added", "Student EAL self-assessment recorded."); if (ok) form.reset();
  }

  async function createTest() {
    if (!selected || !org || mode !== "live") { setMessage(mode === "demo" ? "Student test codes are disabled in demo mode." : "Choose a pupil first."); return; }
    setBusy(true);
    try {
      let result: Awaited<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["from"]>> | null = null;
      let created: TestRow | null = null;
      for (let attempt = 0; attempt < 4 && !created; attempt++) {
        const code = sixDigitCode();
        const expires = new Date(Date.now() + 14 * 86400000).toISOString();
        const insert = await getSupabaseBrowserClient().from("eal_student_tests").insert({ organization_id: org, pupil_case_id: selected.id, code, title: "Four-strand EAL language check", prompts: testPrompts, expires_at: expires }).select("id,organization_id,pupil_case_id,code,title,status,prompts,responses,scores,teacher_notes,expires_at,submitted_at,created_at,updated_at").single();
        result = insert as never;
        if (!insert.error && insert.data) created = insert.data as TestRow;
      }
      if (!created) throw new Error("Could not generate a unique test code.");
      setTests(old => [created!, ...old]); setTestCode(created.code); await log("test_created", `Student test code ${created.code} created; expires ${fmtDate(created.expires_at)}.`, selected.id); setMessage(`Test created. Code: ${created.code}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create test."); }
    finally { setBusy(false); }
  }

  async function submitTest(form: HTMLFormElement, test: TestRow) {
    if (mode !== "live") return;
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const responses = Object.fromEntries(strands.map(s => [s, v[s] || ""]));
    setBusy(true);
    try {
      const result = await getSupabaseBrowserClient().from("eal_student_tests").update({ responses, status: "submitted", submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", test.id).eq("organization_id", org!).select("id,organization_id,pupil_case_id,code,title,status,prompts,responses,scores,teacher_notes,expires_at,submitted_at,created_at,updated_at").single();
      if (result.error || !result.data) throw new Error("Test response could not be submitted.");
      setTests(old => old.map(t => t.id === test.id ? result.data as TestRow : t)); await log("test_submitted", `Student test ${test.code} submitted.`, test.pupil_case_id); setMessage("Test submitted for teacher review.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit test."); }
    finally { setBusy(false); }
  }

  async function reviewTest(form: HTMLFormElement, test: TestRow) {
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const scores = Object.fromEntries(strands.map(s => [s, Number(v[s]) || 0]));
    setBusy(true);
    try {
      const result = await getSupabaseBrowserClient().from("eal_student_tests").update({ scores, teacher_notes: v.notes || "", status: "reviewed", updated_at: new Date().toISOString() }).eq("id", test.id).eq("organization_id", org!).select("id,organization_id,pupil_case_id,code,title,status,prompts,responses,scores,teacher_notes,expires_at,submitted_at,created_at,updated_at").single();
      if (result.error || !result.data) throw new Error("Test review could not be saved.");
      setTests(old => old.map(t => t.id === test.id ? result.data as TestRow : t)); await log("test_reviewed", `Student test ${test.code} reviewed.`, test.pupil_case_id); setMessage("Test review saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to review test."); }
    finally { setBusy(false); }
  }

  async function toggleArchive(row: CaseRow) {
    if (mode === "demo") { const updated = { ...row, archived_at: row.archived_at ? null : new Date().toISOString(), version: row.version + 1, updated_at: new Date().toISOString() }; setRows(old => old.map(r => r.id === row.id ? updated : r)); return; }
    if (!org) return; setBusy(true);
    try {
      const archivedAt = row.archived_at ? null : new Date().toISOString();
      const result = await getSupabaseBrowserClient().from("sen_department_cases").update({ archived_at: archivedAt }).eq("id", row.id).eq("organization_id", org).eq("version", row.version).select("id,organization_id,body,version,archived_at,updated_at").single();
      if (result.error || !result.data) throw new Error("Archive change could not be saved.");
      setRows(old => old.map(r => r.id === row.id ? result.data as CaseRow : r)); await log(archivedAt ? "pupil_archived" : "pupil_restored", archivedAt ? "Pupil record archived." : "Pupil record restored.", row.id);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to change archive state."); }
    finally { setBusy(false); }
  }

  function parentReport(caseRow: CaseRow) {
    const p = caseRow.body; const latest = [...p.assessments].sort((a, b) => b.date.localeCompare(a.date))[0]; const latestReading = [...p.reading].sort((a, b) => b.date.localeCompare(a.date))[0];
    const strandText = latest ? strands.map(s => { const m = strandMean(latest.scores[s] || []); return `${strandLabels[s]} ${m === null ? "not yet evidenced" : `${m.toFixed(1)}/5`}`; }).join("; ") : "No four-strand assessment has been recorded yet.";
    return `EAL progress summary\n\nPupil: ${p.name}\nYear: ${p.year || "Not recorded"}\nLanguage background: ${p.languages || "Not recorded"}\n\nCurrent evidence: ${strandText}${latest ? `\nTeacher-confirmed band: ${latest.band}\nEvidence: ${latest.evidence}\nNext steps: ${latest.nextSteps}` : ""}${latestReading ? `\n\nReading age: ${Math.floor(latestReading.ageMonths / 12)} years ${latestReading.ageMonths % 12} months using ${latestReading.tool} (${latestReading.date}).` : ""}\n\nStrengths: ${p.strengths || "Not recorded"}\nClassroom adjustments: ${p.plan.adjustments || "Not recorded"}\nCurrent provision: ${p.plan.provision || "Not recorded"}\nReview date: ${p.plan.reviewDate || "Not set"}\n\nThis summary describes current school evidence of English-language development and support. It is not a diagnosis or a measure of overall ability.`;
  }

  async function importJson(file: File | null) {
    if (!file || !org || mode !== "live") return;
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text()) as { cases?: unknown[] } | unknown[];
      const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.cases) ? parsed.cases : [];
      if (!items.length || items.length > 200) throw new Error("Choose a JSON export containing 1–200 pupil records.");
      const bodies: SenCase[] = [];
      for (const item of items) {
        const candidate = ((item as { body?: unknown }).body || item) as SenCase;
        const errors = validateCase(candidate); if (errors.length) throw new Error(`Import stopped: ${errors[0]}`); bodies.push(candidate);
      }
      const result = await getSupabaseBrowserClient().from("sen_department_cases").insert(bodies.map(body => ({ organization_id: org, body }))).select("id,organization_id,body,version,archived_at,updated_at");
      if (result.error) throw new Error(result.error.message);
      const added = (result.data || []) as CaseRow[]; setRows(old => [...added, ...old]); await log("import_completed", `${added.length} EAL/SEN pupil records imported from JSON.`, null); setMessage(`${added.length} records imported.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Import failed."); }
    finally { setBusy(false); }
  }

  const latestAssessmentByCase = useMemo(() => new Map(activeRows.map(r => [r.id, [...r.body.assessments].sort((a, b) => b.date.localeCompare(a.date))[0]])), [activeRows]);
  const strandAverages = useMemo(() => Object.fromEntries(strands.map(s => {
    const values = activeRows.map(r => latestAssessmentByCase.get(r.id)).filter(Boolean).map(a => strandMean(a!.scores[s] || [])).filter((v): v is number => v !== null);
    return [s, average(values)];
  })), [activeRows, latestAssessmentByCase]) as Record<(typeof strands)[number], number | null>;
  const bandCounts = useMemo(() => Object.fromEntries(["A", "B", "C", "D", "E"].map(b => [b, activeRows.filter(r => latestAssessmentByCase.get(r.id)?.band === b).length])), [activeRows, latestAssessmentByCase]);
  const openTests = tests.filter(t => t.status === "open").length;
  const submittedTests = tests.filter(t => t.status === "submitted").length;
  const selfAssessments = selected?.body.contacts.filter(c => c.type === "EAL self-assessment") || [];
  const codeTest = tests.find(t => t.code === testCode.trim());

  function choose(row: CaseRow) { setSelectedId(row.id); setMessage(""); }
  function selectOrPrompt(content: React.ReactNode) { return selected ? content : <article className="ealEmpty"><h3>Choose a pupil</h3><p>Select a pupil from the register at the top of this page to use this tool.</p><button onClick={() => setTab("pupils")}>Open pupil register</button></article>; }

  if (mode === "loading") return <main className="ealWorkspace"><div className="ealLoading">Checking EAL workspace access…</div></main>;

  return <main className="ealWorkspace">
    <header className="ealHeader">
      <div><p className="ealEyebrow">SEN · EAL PROGRESS HUB</p><h1>EAL department workspace</h1><p>Assess language development, track reading age, plan support, run student tests and report progress from one secure school workspace.</p></div>
      <div className="ealHeaderActions"><Link href="/sen">← SEN department</Link><Link href="/send-eal">Classroom guidance</Link></div>
    </header>

    <div className={`ealStatus ${mode === "demo" ? "demo" : ""}`}>{mode === "live" ? "Restricted school records · changes are school-scoped and audited" : mode === "demo" ? "Fictional demo · changes disappear on reload" : "Live EAL records are unavailable for this account or school."}{mode === "unavailable" && <button onClick={startDemo}>Try fictional demo</button>}{mode === "demo" && <button onClick={() => window.location.reload()}>Exit demo</button>}</div>

    <nav className="ealTabs" aria-label="EAL tools">{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}><strong>{t.label}</strong><span>{t.hint}</span></button>)}</nav>

    {message && <p className="ealMessage" role="status">{message}</p>}

    {activeRows.length > 0 && !["dashboard", "pupils", "analytics", "transfer", "privacy", "archive", "integrations"].includes(tab) && <section className="ealPicker"><label>Current pupil<select value={selectedId} onChange={e => setSelectedId(e.target.value)}><option value="">Choose…</option>{activeRows.map(r => <option key={r.id} value={r.id}>{r.body.name} · {r.body.year || r.body.reference}</option>)}</select></label>{selected && <span>{selected.body.languages || "Language background not recorded"}</span>}</section>}

    <section className="ealContent">
      {tab === "dashboard" && <>
        <div className="ealTitle"><div><p>COORDINATOR VIEW</p><h2>What needs attention</h2></div><button onClick={() => setTab("pupils")}>Open pupil register</button></div>
        <div className="ealStats"><article><strong>{activeRows.length}</strong><span>Active pupil records</span></article><article><strong>{activeRows.filter(r => r.body.assessments.length).length}</strong><span>With EAL assessments</span></article><article><strong>{openTests}</strong><span>Open student tests</span></article><article><strong>{submittedTests}</strong><span>Tests awaiting review</span></article></div>
        <div className="ealGrid"><article className="ealCard"><h3>Recent pupil activity</h3>{auditRows.slice(0, 8).map(a => <div className="ealRow" key={a.id}><span><strong>{a.action.replaceAll("_", " ")}</strong><small>{a.detail}</small></span><time>{fmtDate(a.created_at)}</time></div>)}{!auditRows.length && <p>No audit events recorded yet.</p>}</article><article className="ealCard"><h3>Fast actions</h3><div className="ealQuick"><button onClick={() => setTab("assessment")}>New four-strand assessment</button><button onClick={() => setTab("tests")}>Create student test</button><button onClick={() => setTab("reading")}>Record reading age</button><button onClick={() => setTab("parents")}>Create parent report</button></div><p>Language learning alone does not identify SEN. Use EAL evidence separately from SEN decision-making.</p></article></div>
      </>}

      {tab === "pupils" && <>
        <div className="ealTitle"><div><p>PUPIL REGISTER</p><h2>EAL profiles</h2></div><label className="ealSearch">Search<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, year, reference or language" /></label></div>
        <div className="ealGrid ealPupilGrid"><article className="ealCard"><h3>Add EAL pupil</h3><form onSubmit={e => { e.preventDefault(); void addPupil(e.currentTarget); }}><fieldset disabled={busy || mode === "unavailable"}><label>School reference<input name="reference" required maxLength={100} /></label><label>Display name<input name="name" required maxLength={150} /></label><label>Year group<input name="year" maxLength={50} /></label><label>Class / tutor group<input name="className" maxLength={80} /></label><label>Home languages & language background<textarea name="languages" maxLength={1000} /></label><button type="submit">Add pupil</button></fieldset></form></article><article className="ealCard"><h3>{filteredRows.length} active pupils</h3><div className="ealPupilList">{filteredRows.map(r => <button key={r.id} onClick={() => { choose(r); setTab("assessment"); }}><span><strong>{r.body.name}</strong><small>{r.body.reference} · {r.body.year || "Year not set"} · {r.body.languages || "Language background not recorded"}</small></span><span>{r.body.assessments.length} assessments</span></button>)}</div>{!filteredRows.length && <p>No matching pupils.</p>}</article></div>
      </>}

      {tab === "assessment" && selectOrPrompt(<>
        <div className="ealTitle"><div><p>ASSESSMENT CENTRE</p><h2>Four-strand language assessment</h2></div><span className="ealPill">{selected!.body.name}</span></div>
        <article className="ealCard"><p>Score only observed evidence. Use 1–5 for each criterion and leave unobserved criteria blank. The teacher confirms the overall A–E band.</p><form onSubmit={e => { e.preventDefault(); void addAssessment(e.currentTarget); }}><fieldset disabled={busy || Boolean(selected!.archived_at)}><div className="ealFormGrid"><label>Date<input name="date" type="date" required defaultValue={today()} /></label><label>Assessor<input name="assessor" required maxLength={150} /></label><label>Context / task<select name="task" defaultValue="curriculum"><option value="curriculum">Curriculum lesson</option><option value="community">Everyday communication</option><option value="reading">Reading task</option><option value="writing">Writing task</option><option value="student-test">Student test</option></select></label><label>Teacher-confirmed band<select name="band" required defaultValue=""><option value="">Choose…</option>{["A", "B", "C", "D", "E"].map(b => <option key={b}>{b}</option>)}</select></label><label>Confidence<select name="confidence" defaultValue="Developing evidence"><option>Provisional — one context</option><option>Developing evidence</option><option>Secure across contexts</option></select></label></div>{strands.map(s => <div className="ealStrand" key={s}><h3>{strandLabels[s]}</h3><div>{criteria.map((c, i) => <label key={c}>{c}<select name={`${s}_${i}`} defaultValue=""><option value="">Not observed</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></label>)}</div></div>)}<label>Evidence<textarea name="evidence" required maxLength={5000} placeholder="What did the pupil understand, say, read or write?" /></label><label>Helpful adjustments<textarea name="adjustments" maxLength={3000} /></label><label>Next steps<textarea name="nextSteps" maxLength={3000} /></label><button type="submit">Save assessment</button></fieldset></form></article>
        <article className="ealCard"><h3>Assessment history</h3>{[...selected!.body.assessments].sort((a, b) => b.date.localeCompare(a.date)).map(a => <details key={a.id}><summary>{a.date} · Band {a.band} · {a.task}</summary><div className="ealStats four">{strands.map(s => <article key={s}><strong>{strandMean(a.scores[s] || [])?.toFixed(1) || "—"}</strong><span>{strandLabels[s]} /5</span></article>)}</div><p><strong>Evidence:</strong> {a.evidence}</p><p><strong>Adjustments:</strong> {a.adjustments || "Not recorded"}</p><p><strong>Next:</strong> {a.nextSteps || "Not recorded"}</p><small>{a.assessor} · {a.confidence}</small></details>)}{!selected!.body.assessments.length && <p>No EAL assessments recorded yet.</p>}</article>
      </>)}

      {tab === "reading" && selectOrPrompt(<>
        <div className="ealTitle"><div><p>READING AGE</p><h2>Track comparable reading assessments</h2></div></div><div className="ealGrid"><article className="ealCard"><form onSubmit={e => { e.preventDefault(); void addReading(e.currentTarget); }}><fieldset disabled={busy}><label>Date<input name="date" type="date" required defaultValue={today()} /></label><label>Assessment / tool<input name="tool" required maxLength={200} placeholder="Use the school-approved reading assessment" /></label><div className="ealFormGrid"><label>Reading age years<input name="years" type="number" min="1" max="25" required /></label><label>Additional months<input name="months" type="number" min="0" max="11" defaultValue="0" required /></label></div><label>Notes<textarea name="notes" maxLength={3000} /></label><button type="submit">Save reading age</button></fieldset></form></article><article className="ealCard"><h3>Reading history</h3>{[...selected!.body.reading].sort((a, b) => b.date.localeCompare(a.date)).map(r => <div className="ealRow" key={r.id}><span><strong>{Math.floor(r.ageMonths / 12)}y {r.ageMonths % 12}m</strong><small>{r.tool} · {r.notes}</small></span><time>{r.date}</time></div>)}{!selected!.body.reading.length && <p>No reading-age results recorded.</p>}</article></div>
      </>)}

      {tab === "support" && selectOrPrompt(<>
        <div className="ealTitle"><div><p>SUPPORT HUB</p><h2>Classroom adjustments and provision</h2></div><Link href="/sen">Open full SEN provision tools</Link></div><article className="ealCard"><form onSubmit={e => { e.preventDefault(); void saveSupport(e.currentTarget); }}><fieldset disabled={busy}><div className="ealFormGrid"><label>Named EAL lead<input name="owner" defaultValue={selected!.body.plan.owner} maxLength={200} /></label><label>Review date<input name="reviewDate" type="date" defaultValue={selected!.body.plan.reviewDate} /></label></div><label>Current outcome<textarea name="outcome" defaultValue={selected!.body.plan.outcome} maxLength={3000} /></label><label>How progress will be measured<textarea name="measure" defaultValue={selected!.body.plan.measure} maxLength={3000} /></label><label>Classroom adjustments<textarea name="adjustments" defaultValue={selected!.body.plan.adjustments} maxLength={5000} /></label><label>Targeted provision / support<textarea name="provision" defaultValue={selected!.body.plan.provision} maxLength={5000} /></label><label>Pupil voice<textarea name="pupilVoice" defaultValue={selected!.body.plan.pupilVoice} maxLength={3000} /></label><label>Family voice<textarea name="familyVoice" defaultValue={selected!.body.plan.familyVoice} maxLength={3000} /></label><button type="submit">Save support plan</button></fieldset></form></article>
      </>)}

      {tab === "reviews" && selectOrPrompt(<>
        <div className="ealTitle"><div><p>REVIEWS & REPORTS</p><h2>Review evidence and agree next steps</h2></div></div><div className="ealGrid"><article className="ealCard"><h3>Add review</h3><form onSubmit={e => { e.preventDefault(); void addReview(e.currentTarget); }}><fieldset disabled={busy}><label>Date<input name="date" type="date" required defaultValue={today()} /></label><label>Attendees / roles<input name="attendees" maxLength={500} /></label><label>Evidence reviewed<textarea name="evidence" required maxLength={5000} /></label><label>Pupil voice<textarea name="pupilVoice" maxLength={3000} /></label><label>Family voice<textarea name="familyVoice" maxLength={3000} /></label><label>Decision<textarea name="decision" maxLength={3000} /></label><label>Actions<textarea name="actions" required maxLength={3000} /></label><label>Next review<input name="nextDate" type="date" /></label><button type="submit">Save review</button></fieldset></form></article><article className="ealCard"><h3>Review history</h3>{[...selected!.body.reviews].sort((a, b) => b.date.localeCompare(a.date)).map(r => <details key={r.id}><summary>{r.date} · {r.decision || "Review"}</summary><p><strong>Evidence:</strong> {r.evidence}</p><p><strong>Pupil:</strong> {r.pupilVoice || "Not recorded"}</p><p><strong>Family:</strong> {r.familyVoice || "Not recorded"}</p><p><strong>Actions:</strong> {r.actions}</p><p>Next review: {r.nextDate || "Not set"}</p></details>)}{!selected!.body.reviews.length && <p>No EAL reviews recorded.</p>}</article></div>
      </>)}

      {tab === "tests" && <>
        <div className="ealTitle"><div><p>STUDENT TESTS</p><h2>Six-digit test codes</h2></div><button onClick={createTest} disabled={!selected || busy || mode !== "live"}>Create test for selected pupil</button></div><p className="ealLead">Create an original four-strand task, give the pupil the six-digit code, then open Student test mode below. Test responses stay in the school-scoped EAL database.</p>
        <div className="ealGrid"><article className="ealCard"><h3>Test register</h3>{selectedTests.map(t => <button className="ealTestRow" key={t.id} onClick={() => setTestCode(t.code)}><span><strong>{t.code}</strong><small>{rows.find(r => r.id === t.pupil_case_id)?.body.name || "Pupil record unavailable"} · created {fmtDate(t.created_at)}</small></span><span className={`ealPill ${t.status}`}>{t.status}</span></button>)}{!selectedTests.length && <p>No tests for the current selection.</p>}</article><article className="ealCard"><h3>Student test mode</h3><label>Enter six-digit code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={testCode} onChange={e => setTestCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>{codeTest ? <div className="ealTestMode"><div className="ealRow"><span><strong>{codeTest.title}</strong><small>Expires {fmtDate(codeTest.expires_at)}</small></span><span className={`ealPill ${codeTest.status}`}>{codeTest.status}</span></div>{codeTest.status === "open" && <form onSubmit={e => { e.preventDefault(); void submitTest(e.currentTarget, codeTest); }}><fieldset disabled={busy}>{strands.map(s => <label key={s}><strong>{strandLabels[s]}</strong><span className="ealPrompt">{codeTest.prompts[s]}</span><textarea name={s} required maxLength={4000} /></label>)}<button type="submit">Submit test responses</button></fieldset></form>}{["submitted", "reviewed"].includes(codeTest.status) && <><h4>Submitted responses</h4>{strands.map(s => <section key={s} className="ealResponse"><strong>{strandLabels[s]}</strong><p>{codeTest.responses[s] || "No response"}</p></section>)}<form onSubmit={e => { e.preventDefault(); void reviewTest(e.currentTarget, codeTest); }}><fieldset disabled={busy}><div className="ealFormGrid">{strands.map(s => <label key={s}>{strandLabels[s]} score<select name={s} defaultValue={String(codeTest.scores[s] || "")} required><option value="">Choose…</option>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label>)}</div><label>Teacher notes<textarea name="notes" defaultValue={codeTest.teacher_notes} maxLength={4000} /></label><button type="submit">Save review</button></fieldset></form></>}</div> : testCode.length === 6 ? <p>No test with that code is available to this authorised school account.</p> : <p>Enter a code to begin a supervised student test or review a submission.</p>}</article></div>
      </>}

      {tab === "self" && selectOrPrompt(<>
        <div className="ealTitle"><div><p>STUDENT VOICE</p><h2>Language self-assessment</h2></div></div><div className="ealGrid"><article className="ealCard"><form onSubmit={e => { e.preventDefault(); void addSelfAssessment(e.currentTarget); }}><fieldset disabled={busy}><label>Date<input name="date" type="date" required defaultValue={today()} /></label><div className="ealFormGrid">{strands.map(s => <label key={s}>{strandLabels[s]} confidence<select name={s} defaultValue="3">{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label>)}</div><label>What feels easier or harder?<textarea name="comment" required maxLength={3000} /></label><label>What would help next?<textarea name="nextSteps" maxLength={3000} /></label><button type="submit">Save student voice</button></fieldset></form></article><article className="ealCard"><h3>Previous self-assessments</h3>{[...selfAssessments].reverse().map(c => <div className="ealRow" key={c.id}><span><strong>{c.summary}</strong><small>Next: {c.actions || "Not recorded"}</small></span><time>{c.date}</time></div>)}{!selfAssessments.length && <p>No EAL self-assessments recorded.</p>}</article></div>
      </>)}

      {tab === "parents" && selectOrPrompt(<>
        <div className="ealTitle"><div><p>PARENT REPORTING</p><h2>Plain-language EAL progress summary</h2></div><div><button onClick={() => void navigator.clipboard.writeText(parentReport(selected!))}>Copy report</button><button onClick={() => window.print()}>Print / save PDF</button></div></div><article className="ealCard ealReport"><pre>{parentReport(selected!)}</pre></article>
      </>)}

      {tab === "analytics" && <>
        <div className="ealTitle"><div><p>ANALYTICS</p><h2>Cohort evidence without pupil ranking</h2></div></div><div className="ealStats four">{strands.map(s => <article key={s}><strong>{strandAverages[s] === null ? "—" : strandAverages[s]!.toFixed(1)}</strong><span>Mean latest {strandLabels[s].toLowerCase()} /5</span></article>)}</div><div className="ealGrid"><article className="ealCard"><h3>Latest teacher-confirmed bands</h3>{Object.entries(bandCounts).map(([band, count]) => <div className="ealBarRow" key={band}><span>Band {band}</span><div><i style={{ width: `${activeRows.length ? Math.max(4, count / activeRows.length * 100) : 0}%` }} /></div><strong>{count}</strong></div>)}</article><article className="ealCard"><h3>Coverage</h3><div className="ealRow"><span>Four-strand assessment recorded</span><strong>{activeRows.filter(r => r.body.assessments.length).length}/{activeRows.length}</strong></div><div className="ealRow"><span>Reading age recorded</span><strong>{activeRows.filter(r => r.body.reading.length).length}/{activeRows.length}</strong></div><div className="ealRow"><span>Support review date set</span><strong>{activeRows.filter(r => r.body.plan.reviewDate).length}/{activeRows.length}</strong></div><div className="ealRow"><span>Student voice recorded</span><strong>{activeRows.filter(r => r.body.contacts.some(c => c.type === "EAL self-assessment")).length}/{activeRows.length}</strong></div></article></div><p className="ealNote">These figures describe the records currently loaded for this school. They are not attainment rankings and should not be used to compare individual pupils.</p>
      </>}

      {tab === "transfer" && <>
        <div className="ealTitle"><div><p>IMPORT / EXPORT</p><h2>Move approved EAL records safely</h2></div></div><div className="ealGrid"><article className="ealCard"><h3>Export</h3><p>JSON includes the full EAL/SEN case bodies and test records. CSV is a summary for analysis.</p><button onClick={() => download(`eal-backup-${today()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), cases: rows, tests }, null, 2))}>Export JSON backup</button><button onClick={() => { const header = ["reference", "name", "year", "class", "languages", "latest_band", "assessments", "reading_results", "review_date"]; const lines = activeRows.map(r => { const a = latestAssessmentByCase.get(r.id); return [r.body.reference, r.body.name, r.body.year, r.body.className, r.body.languages, a?.band || "", r.body.assessments.length, r.body.reading.length, r.body.plan.reviewDate].map(csvCell).join(","); }); download(`eal-summary-${today()}.csv`, [header.join(","), ...lines].join("\n"), "text/csv"); }}>Export CSV summary</button></article><article className="ealCard"><h3>Import JSON</h3><p>Imports create new school-scoped pupil records. Nothing is overwritten automatically. Review imported records after upload.</p><label className="ealFile">Choose JSON backup<input type="file" accept="application/json,.json" disabled={mode !== "live" || busy} onChange={e => void importJson(e.target.files?.[0] || null)} /></label><p>For MIS feeds and recurring sync, use Integrations rather than manual files.</p></article></div>
      </>}

      {tab === "privacy" && <>
        <div className="ealTitle"><div><p>PRIVACY & AUDIT</p><h2>Recent EAL changes</h2></div><button onClick={() => download(`eal-audit-${today()}.json`, JSON.stringify(auditRows, null, 2))}>Export audit log</button></div><article className="ealCard"><p>Pupil records are restricted by school membership/role and Row Level Security. Audit entries are append-only through the staff interface.</p>{auditRows.map(a => <div className="ealAudit" key={a.id}><time>{new Date(a.created_at).toLocaleString("en-GB")}</time><strong>{a.action.replaceAll("_", " ")}</strong><span>{a.detail}</span><small>{rows.find(r => r.id === a.pupil_case_id)?.body.name || (a.pupil_case_id ? "Pupil record unavailable" : "School-level action")}</small></div>)}{!auditRows.length && <p>No audit events yet.</p>}</article>
      </>}

      {tab === "archive" && <>
        <div className="ealTitle"><div><p>ARCHIVE</p><h2>Inactive and restored records</h2></div></div><article className="ealCard"><h3>Active pupils</h3>{activeRows.map(r => <div className="ealRow" key={r.id}><span><strong>{r.body.name}</strong><small>{r.body.reference} · {r.body.year}</small></span><button disabled={busy} onClick={() => void toggleArchive(r)}>Archive</button></div>)}</article><article className="ealCard"><h3>Archived pupils</h3>{rows.filter(r => r.archived_at).map(r => <div className="ealRow" key={r.id}><span><strong>{r.body.name}</strong><small>Archived {fmtDate(r.archived_at)}</small></span><button disabled={busy} onClick={() => void toggleArchive(r)}>Restore</button></div>)}{!rows.some(r => r.archived_at) && <p>No archived records.</p>}</article>
      </>}

      {tab === "integrations" && <>
        <div className="ealTitle"><div><p>INTEGRATIONS & SETTINGS</p><h2>Connect the EAL workflow to school systems</h2></div></div><div className="ealGrid"><article className="ealCard"><h3>Google Drive</h3><p>Use the platform integration centre for approved Drive links and document workflows. Pupil database records remain in Supabase.</p><Link className="ealLinkButton" href="/integrations">Open Google integrations</Link></article><article className="ealCard"><h3>MIS / pupil data</h3><p>Use school-approved imports or a configured MIS connector for pupil identity data. Avoid copying unnecessary personal data into EAL notes.</p><Link className="ealLinkButton" href="/admin-centre">Open administration centre</Link></article><article className="ealCard"><h3>Classroom guidance</h3><p>The existing SEND & EAL guidance library remains available for adaptations, scaffolds and subject-specific classroom support.</p><Link className="ealLinkButton" href="/send-eal">Open inclusive guidance</Link></article><article className="ealCard"><h3>SEN department</h3><p>Use the main SEN workspace for pupil passports, interventions, regulation support and wider provision planning.</p><Link className="ealLinkButton" href="/sen">Open SEN department</Link></article></div>
      </>}
    </section>
  </main>;
}
