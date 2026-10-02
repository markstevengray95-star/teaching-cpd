"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import resources from "@/lib/senResources.json";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess } from "@/lib/rolePermissions";
import { demoCases, today, validateCase, type CaseRow, type EalAssessment } from "@/lib/senWorkspace";
import "./EalWorkspace.css";

const strandKeys = ["listening", "speaking", "reading", "writing"] as const;
type StrandKey = (typeof strandKeys)[number];
type TaskKey = keyof typeof resources.eal.tasks;
type Phase = "KS3" | "KS4" | "KS5";
type Mode = "loading" | "live" | "demo" | "unavailable";
type ScoreMap = Record<StrandKey, (number | null)[]>;

function emptyScores(): ScoreMap {
  return { listening: [null, null, null, null, null], speaking: [null, null, null, null, null], reading: [null, null, null, null, null], writing: [null, null, null, null, null] };
}
function mean(values: (number | null)[]) {
  const scored = values.filter((value): value is number => typeof value === "number");
  return scored.length ? scored.reduce((sum, value) => sum + value, 0) / scored.length : null;
}
function suggestedBand(scores: ScoreMap) {
  const value = mean(strandKeys.flatMap((strand) => scores[strand]));
  if (value === null) return null;
  if (value < 1.5) return "A";
  if (value < 2.5) return "B";
  if (value < 3.5) return "C";
  if (value < 4.5) return "D";
  return "E";
}
function readingEstimate(scores: (number | null)[]) {
  const value = mean(scores);
  const observed = scores.filter((score) => score !== null).length;
  if (value === null || observed < 3) return null;
  if (value < 1.5) return { label: "approximately 7–9 years", band: "7–9", value, observed };
  if (value < 2.5) return { label: "approximately 9–11 years", band: "9–11", value, observed };
  if (value < 3.5) return { label: "approximately 11–13 years", band: "11–13", value, observed };
  if (value < 4.5) return { label: "approximately 13–15 years", band: "13–15", value, observed };
  return { label: "approximately 15+ years", band: "15+", value, observed };
}
function sixDigitCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

export default function EalFullTestCentre() {
  const [mode, setMode] = useState<Mode>("loading");
  const [org, setOrg] = useState<string | null>(null);
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [task, setTask] = useState<TaskKey>("community");
  const [phase, setPhase] = useState<Phase>("KS3");
  const [scores, setScores] = useState<ScoreMap>(() => emptyScores());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdCode, setCreatedCode] = useState("");

  const activeRows = useMemo(() => rows.filter((row) => !row.archived_at), [rows]);
  const selected = rows.find((row) => row.id === selectedId) || null;
  const pack = resources.eal.tasks[task];
  const suggested = suggestedBand(scores);
  const estimate = readingEstimate(scores.reading);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const client = getSupabaseBrowserClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) { window.location.assign("/auth?next=/sen/eal/full-tests"); return; }
        const access = await resolveStaffAccess(client, user);
        if (!mounted) return;
        if (!access.organizationId) { setMode("unavailable"); return; }
        const check = await client.rpc("sen_workspace_access", { org_id: access.organizationId });
        if (!mounted) return;
        if (check.error || check.data !== true) { setMode("unavailable"); return; }
        const result = await client.from("sen_department_cases").select("id,organization_id,body,version,archived_at,updated_at").eq("organization_id", access.organizationId).order("updated_at", { ascending: false }).limit(1000);
        if (!mounted) return;
        if (result.error) { setMode("unavailable"); return; }
        const loaded = (result.data || []) as CaseRow[];
        setOrg(access.organizationId);
        setRows(loaded);
        setSelectedId(loaded.find((row) => !row.archived_at)?.id || "");
        setMode("live");
      } catch { if (mounted) setMode("unavailable"); }
    })();
    return () => { mounted = false; };
  }, []);

  function startDemo() {
    const demo = demoCases();
    setRows(demo);
    setSelectedId(demo.find((row) => row.body.assessments.length)?.id || demo[0]?.id || "");
    setMode("demo");
    setMessage("Fictional demonstration only. Test-code creation is disabled in demo mode.");
  }

  function setCriterion(strand: StrandKey, index: number, raw: string) {
    const value = raw ? Number(raw) : null;
    setScores((current) => ({ ...current, [strand]: current[strand].map((score, i) => i === index ? value : score) }));
  }

  async function saveBody(body: CaseRow["body"], success: string) {
    if (!selected) return false;
    const errors = validateCase(body);
    if (errors.length) { setMessage(errors.join(" ")); return false; }
    setBusy(true);
    try {
      if (mode === "demo") {
        const updated: CaseRow = { ...selected, body: structuredClone(body), version: selected.version + 1, updated_at: new Date().toISOString() };
        setRows((current) => current.map((row) => row.id === updated.id ? updated : row));
        setMessage(`${success} Demo changes disappear on reload.`);
        return true;
      }
      if (!org) throw new Error("No authorised school is selected.");
      const result = await getSupabaseBrowserClient().from("sen_department_cases").update({ body }).eq("id", selected.id).eq("organization_id", org).eq("version", selected.version).select("id,organization_id,body,version,archived_at,updated_at").single();
      if (result.error || !result.data) throw new Error("The pupil record changed elsewhere or could not be saved. Reload before trying again.");
      const updated = result.data as CaseRow;
      setRows((current) => current.map((row) => row.id === updated.id ? updated : row));
      setMessage(success);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save the EAL test.");
      return false;
    } finally { setBusy(false); }
  }

  async function saveAssessment(form: HTMLFormElement) {
    if (!selected) { setMessage("Choose a pupil first."); return; }
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (strandKeys.every((strand) => scores[strand].every((score) => score === null))) { setMessage("Record at least one observed criterion before saving."); return; }
    const assessment: EalAssessment = {
      id: crypto.randomUUID(),
      date: values.date,
      assessor: values.assessor,
      task: `${task}|${phase}`,
      band: values.band,
      confidence: values.confidence,
      scores,
      evidence: values.evidence,
      adjustments: values.adjustments,
      nextSteps: values.nextSteps,
    };
    const ok = await saveBody({ ...selected.body, assessments: [...selected.body.assessments, assessment] }, `Full ${pack.name} assessment saved for ${selected.body.name}.`);
    if (ok) { form.reset(); setScores(emptyScores()); }
  }

  async function saveReadingEstimate() {
    if (!selected || !estimate) { setMessage("Score at least three reading criteria to create an estimate."); return; }
    const summary = `Internal EAL reading-age estimate: ${estimate.label}. Reading criterion mean ${estimate.value.toFixed(1)}/5 (${estimate.observed}/5 criteria observed), ${pack.name}, ${phase}. This is an indicative, non-standardised estimate and is not a formal reading-age result.`;
    const contact = { id: crypto.randomUUID(), date: today(), type: "Internal EAL reading-age estimate", participants: "EAL assessment", summary, actions: "Use a school-approved standardised reading assessment when a formal age-equivalent score is required." };
    await saveBody({ ...selected.body, contacts: [...selected.body.contacts, contact] }, "Indicative reading-age estimate added to the pupil timeline without changing the formal reading-age history.");
  }

  async function createStudentTest() {
    if (!selected) { setMessage("Choose a pupil first."); return; }
    if (mode !== "live" || !org) { setMessage("Six-digit student test codes are available only with the live school database."); return; }
    setBusy(true); setCreatedCode("");
    try {
      const prompts = {
        listening: `[${phase}] ${pack.listening}`,
        speaking: `[${phase}] ${pack.speaking}`,
        reading: `[${phase}] ${pack.reading}`,
        writing: `[${phase}] ${pack.writing}`,
      };
      let created: { code: string } | null = null;
      for (let attempt = 0; attempt < 4 && !created; attempt++) {
        const code = sixDigitCode();
        const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();
        const result = await getSupabaseBrowserClient().from("eal_student_tests").insert({ organization_id: org, pupil_case_id: selected.id, code, title: `${pack.name} · ${phase}`, prompts, expires_at: expiresAt }).select("code").single();
        if (!result.error && result.data) created = result.data as { code: string };
      }
      if (!created) throw new Error("Could not generate a unique six-digit test code.");
      setCreatedCode(created.code);
      setMessage(`Full EAL student test created. Code ${created.code}. It will also appear in the EAL Student Tests area.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create the student test."); }
    finally { setBusy(false); }
  }

  if (mode === "loading") return <main className="ealWorkspace"><div className="ealLoading">Loading full EAL tests…</div></main>;

  return <main className="ealWorkspace">
    <header className="ealHeader"><div><p className="ealEyebrow">EAL PROGRESS HUB · FULL TEST CENTRE</p><h1>Full EAL assessment and reading-age detector</h1><p>The complete task packs from the original EAL app: listening, speaking, reading/viewing and writing, all 20 assessment criteria, KS3–KS5 routes, six-digit student tests and an automatic indicative reading-age estimate.</p></div><div className="ealHeaderActions"><Link href="/sen/eal">← EAL hub</Link><Link href="/sen/eal/advanced">Advanced progress tools</Link></div></header>

    <div className={`ealStatus ${mode === "demo" ? "demo" : ""}`}>{mode === "live" ? "Restricted EAL pupil records · authorised staff only" : mode === "demo" ? "DEMONSTRATION · fictional pupils only" : "Live pupil records are unavailable for this account or school."} {mode === "unavailable" && <button type="button" onClick={startDemo}>Try fictional demo</button>}</div>
    {message && <p className="ealMessage" role="status">{message}</p>}

    <section className="ealPicker"><label>Pupil<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setScores(emptyScores()); setCreatedCode(""); }}><option value="">Choose pupil…</option>{activeRows.map((row) => <option key={row.id} value={row.id}>{row.body.name} · {row.body.reference} · {row.body.year || "Year not set"}</option>)}</select></label><label>Phase<select value={phase} onChange={(event) => setPhase(event.target.value as Phase)}><option>KS3</option><option>KS4</option><option>KS5</option></select></label><label>Full task pack<select value={task} onChange={(event) => { setTask(event.target.value as TaskKey); setScores(emptyScores()); setCreatedCode(""); }}>{Object.entries(resources.eal.tasks).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select></label></section>

    <section className="ealContent">
      <div className="ealTitle"><div><p>ORIGINAL EAL APP MATERIALS</p><h2>{pack.name}</h2></div><span className="ealPill">{phase} · {pack.theme}</span></div>

      <div className="ealGrid">
        {strandKeys.map((strand) => <article className="ealCard" key={strand}><h3>{resources.eal.strands[strand].label}</h3><p className="ealPrompt">{pack[strand]}</p></article>)}
      </div>

      <article className="ealCard"><div className="ealTitle"><div><p>FULL 20-CRITERION ASSESSMENT</p><h2>Score observed language evidence</h2></div>{suggested && <span className="ealPill">Suggested best-fit band {suggested}</span>}</div><p className="ealLead">Use 1–5 only where there is evidence. The suggested band is a prompt, not an automatic decision; the teacher-confirmed A–E band remains the recorded judgement.</p>
        <form onSubmit={(event) => { event.preventDefault(); void saveAssessment(event.currentTarget); }}><fieldset disabled={busy || !selected}>
          <div className="ealFormGrid"><label>Assessment date<input name="date" type="date" required defaultValue={today()}/></label><label>Assessor<input name="assessor" required maxLength={150}/></label><label>Teacher-confirmed best-fit band<select name="band" required defaultValue=""><option value="">Choose after reviewing evidence…</option>{["A", "B", "C", "D", "E"].map((band) => <option key={band}>{band}</option>)}</select></label><label>Evidence confidence<select name="confidence" required defaultValue="Developing — two contexts"><option>Provisional — one context</option><option>Developing — two contexts</option><option>Secure — repeated evidence</option></select></label></div>
          {strandKeys.map((strand) => <section className="ealStrand" key={strand}><h3>{resources.eal.strands[strand].label}</h3><div>{resources.eal.strands[strand].criteria.map((criterion, index) => <label key={criterion.name}>{criterion.name}<small>{criterion.detail}</small><select value={scores[strand][index] ?? ""} onChange={(event) => setCriterion(strand, index, event.target.value)}><option value="">Not observed</option>{[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score} — {(["A · New to English", "B · Early acquisition", "C · Developing competence", "D · Competent", "E · Fluent"])[score - 1]}</option>)}</select><small>Possible next step: {criterion.next}</small></label>)}</div></section>)}
          <label>Evidence and language-background context<textarea name="evidence" required maxLength={5000}/></label><label>Adjustments / support used<textarea name="adjustments" maxLength={3000}/></label><label>Agreed language targets / next steps<textarea name="nextSteps" maxLength={3000}/></label><button type="submit">Save full EAL assessment</button>
        </fieldset></form>
      </article>

      <div className="ealGrid">
        <article className="ealCard"><h3>Automatic reading-age detector</h3><p>As the five <strong>Reading and viewing</strong> criteria are scored above, this detector updates automatically. It needs at least three observed reading criteria.</p>{estimate ? <><div className="ealStats"><article><strong>{estimate.label}</strong><span>indicative reading-access range</span></article><article><strong>{estimate.value.toFixed(1)}/5</strong><span>mean reading criteria</span></article></div><p><strong>Important:</strong> this is an internal, non-standardised estimate from the EAL task. It is not a formal reading-age score and should not replace a school-approved standardised reading assessment.</p><button type="button" disabled={!selected || busy} onClick={() => void saveReadingEstimate()}>Add estimate to pupil timeline</button></> : <p className="ealNote">Score at least three of the five reading criteria to generate the estimate. Formal reading-age results remain separate in the EAL reading-age tracker.</p>}<Link className="ealLinkButton" href="/sen/eal/advanced">Open formal reading-age comparison →</Link></article>
        <article className="ealCard"><h3>Send the full test to a pupil</h3><p>Create the existing six-digit student-test workflow using the complete selected task pack rather than the simplified practice prompts. The test remains linked to this pupil and appears in the EAL Student Tests tab for submission and marking.</p><button type="button" disabled={!selected || busy || mode !== "live"} onClick={() => void createStudentTest()}>{busy ? "Working…" : `Create ${pack.name} student test`}</button>{createdCode && <div className="ealTestMode"><h4>Student code</h4><strong style={{fontSize:"30px",letterSpacing:".14em"}}>{createdCode}</strong><p>Valid for 14 days. Share through your approved school channel.</p></div>}</article>
      </div>

      <article className="ealCard"><h3>What has been restored from the original EAL app</h3><div className="ealGrid"><div><strong>Three complete task packs</strong><p>School Community, Learning & Technology, and Local Environment.</p></div><div><strong>20 detailed criteria</strong><p>Five criteria for each of listening, speaking, reading/viewing and writing, including criterion descriptions and possible next steps.</p></div><div><strong>KS3, KS4 and KS5 routes</strong><p>Record the phase alongside each saved assessment and use the phase-appropriate writing expectations already included in the source materials.</p></div><div><strong>Connected progress tracking</strong><p>Saved assessments feed the existing eight-domain profile, pupil timeline, reporting and intervention tools.</p></div></div></article>
    </section>
  </main>;
}
