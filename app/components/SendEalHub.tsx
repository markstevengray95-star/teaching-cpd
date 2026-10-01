"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, type StaffRole } from "@/lib/rolePermissions";
import "./SendEalHub.css";

type Area = "universal" | "send" | "eal";
type Category =
  | "communication_interaction"
  | "cognition_learning"
  | "social_emotional_regulation"
  | "sensory_physical"
  | "executive_independence"
  | "new_to_english"
  | "spoken_language"
  | "vocabulary"
  | "reading_writing"
  | "academic_language"
  | "assessment_access"
  | "transition"
  | "inclusive_classroom";
type Phase = "all" | "ks3" | "ks4" | "sixth_form";

type Resource = {
  id: string;
  area: Area;
  category: Category;
  phase: Phase;
  title: string;
  summary: string;
  barrier: string;
  strategies: string[];
  check_understanding: string;
  avoid: string[];
  resource_url: string | null;
  priority: "normal" | "high";
  updated_at: string;
};

type SupportScenario = {
  id: string;
  area: Area;
  title: string;
  cue: string;
  supports: string[];
  check: string;
};

const managerRoles: StaffRole[] = ["pastoral", "send-eal", "slt", "administrator", "super-admin"];

const categoryMeta: Record<Category, string> = {
  communication_interaction: "Communication & interaction",
  cognition_learning: "Cognition & learning",
  social_emotional_regulation: "Regulation & participation",
  sensory_physical: "Sensory & physical access",
  executive_independence: "Executive skills & independence",
  new_to_english: "New to English",
  spoken_language: "Speaking & listening",
  vocabulary: "Vocabulary",
  reading_writing: "Reading & writing",
  academic_language: "Academic language",
  assessment_access: "Assessment access",
  transition: "Transition",
  inclusive_classroom: "Inclusive classroom",
};

const phaseLabels: Record<Phase, string> = {
  all: "All phases",
  ks3: "KS3",
  ks4: "KS4",
  sixth_form: "Sixth Form",
};

const supportScenarios: SupportScenario[] = [
  {
    id: "communication",
    area: "send",
    title: "Communication feels like the barrier",
    cue: "The pupil may need more processing time, simpler language or a clearer way to respond.",
    supports: [
      "Give one instruction at a time and reduce unnecessary wording.",
      "Use a visual example, model or written checklist alongside spoken directions.",
      "Allow processing time before repeating or rephrasing the question.",
      "Offer an appropriate response route such as pointing, choosing, speaking or writing.",
    ],
    check: "Ask the pupil to show the first step rather than simply asking whether they understand.",
  },
  {
    id: "cognition",
    area: "send",
    title: "The learning load is too high",
    cue: "The pupil understands some of the content but loses track when too much information is held at once.",
    supports: [
      "Chunk the task into visible, numbered stages.",
      "Keep worked examples available while the pupil begins independent practice.",
      "Pre-select the essential information and remove decorative or competing material.",
      "Use short retrieval checks before moving to the next step.",
    ],
    check: "Check one small piece of learning at a time and adapt before adding more demand.",
  },
  {
    id: "regulation",
    area: "send",
    title: "Regulation or executive skills are blocking participation",
    cue: "Starting, switching, organising or sustaining attention appears harder than the curriculum content itself.",
    supports: [
      "Make the start point obvious and keep the first action small.",
      "Use a visible timer, checklist or now-next structure where appropriate.",
      "Give advance notice of transitions and changes to the routine.",
      "Reduce repeated verbal prompting by making the routine visible.",
    ],
    check: "Review whether the support increased independence rather than simply increasing adult prompting.",
  },
  {
    id: "sensory",
    area: "send",
    title: "Sensory or physical access is getting in the way",
    cue: "The environment, presentation or physical demands may be limiting access to the task.",
    supports: [
      "Check seating, visibility, noise, movement space and access to equipment.",
      "Use uncluttered layouts and clear contrast where this supports access.",
      "Offer appropriate alternative ways to record or demonstrate learning.",
      "Follow any agreed school plan or specialist advice already in place.",
    ],
    check: "Ask whether the adaptation improved access to the same learning goal rather than lowering the goal unnecessarily.",
  },
  {
    id: "new-english",
    area: "eal",
    title: "A pupil is new to English",
    cue: "The pupil may understand concepts that they cannot yet express confidently in English.",
    supports: [
      "Use visuals, demonstrations, concrete examples and key vocabulary together.",
      "Model the exact language structure needed for the task.",
      "Build in paired rehearsal before whole-class response or extended writing.",
      "Allow bilingual resources or first-language thinking where appropriate.",
    ],
    check: "Separate language difficulty from subject understanding by allowing the pupil to show knowledge in more than one way.",
  },
  {
    id: "academic-language",
    area: "eal",
    title: "Everyday English is secure but academic language is not",
    cue: "The pupil can converse socially but struggles with subject vocabulary, explanations or exam-style language.",
    supports: [
      "Pre-teach a small number of high-value subject words and revisit them repeatedly.",
      "Use sentence stems that expose the structure of explanations, comparisons and evaluations.",
      "Model an answer, annotate why it works, then gradually remove the scaffold.",
      "Use structured talk before writing so the pupil rehearses the language of the answer.",
    ],
    check: "Check whether the pupil can use the key language independently in a new example, not only copy the model.",
  },
];

const universalStrategies = [
  "Visible routines",
  "Chunked instructions",
  "Worked examples",
  "Pre-taught vocabulary",
  "Structured talk",
  "Processing time",
  "Multiple response routes",
  "Frequent understanding checks",
];

const ealSequence = [
  ["1", "Understand", "Make meaning accessible with visuals, modelling and key vocabulary."],
  ["2", "Rehearse", "Let pupils practise the language orally before public response or extended writing."],
  ["3", "Model", "Show the structure of a successful answer and make the language choices visible."],
  ["4", "Produce", "Remove scaffolds gradually so the pupil uses the language independently."],
];

export default function SendEalHub() {
  const [role, setRole] = useState<StaffRole>("teacher");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [scenarioId, setScenarioId] = useState("communication");
  const [areaFilter, setAreaFilter] = useState<"all" | Area>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [phaseFilter, setPhaseFilter] = useState<Phase>("all");
  const [search, setSearch] = useState("");

  const [newArea, setNewArea] = useState<Area>("universal");
  const [newCategory, setNewCategory] = useState<Category>("inclusive_classroom");
  const [newPhase, setNewPhase] = useState<Phase>("all");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [barrier, setBarrier] = useState("");
  const [strategies, setStrategies] = useState("");
  const [checkUnderstanding, setCheckUnderstanding] = useState("");
  const [avoid, setAvoid] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [priority, setPriority] = useState<"normal" | "high">("normal");

  const canManage = managerRoles.includes(role);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data } = await client.auth.getUser();
      if (!data.user) {
        window.location.assign("/auth?next=/send-eal");
        return;
      }
      const access = await resolveStaffAccess(client, data.user);
      if (!mounted) return;
      setRole(access.role);
      setUserId(data.user.id);
      setOrganizationId(access.organizationId);
      if (access.organizationId) await loadResources(access.organizationId);
      if (mounted) setLoading(false);
    })().catch((error) => {
      console.error("SEND and EAL hub load failed", error);
      if (mounted) {
        setMessage("The SEND & EAL Hub could not be loaded yet.");
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  async function loadResources(org: string) {
    const client = getSupabaseBrowserClient();
    const { data, error } = await client
      .from("send_eal_resources")
      .select("id,area,category,phase,title,summary,barrier,strategies,check_understanding,avoid,resource_url,priority,updated_at")
      .eq("organization_id", org)
      .order("priority", { ascending: true })
      .order("updated_at", { ascending: false });
    if (error) {
      setMessage(error.message);
      return;
    }
    setResources((data || []) as Resource[]);
  }

  const selectedScenario = supportScenarios.find((item) => item.id === scenarioId) || supportScenarios[0];
  const filteredResources = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return resources.filter((resource) => {
      if (areaFilter !== "all" && resource.area !== areaFilter) return false;
      if (categoryFilter !== "all" && resource.category !== categoryFilter) return false;
      if (phaseFilter !== "all" && resource.phase !== "all" && resource.phase !== phaseFilter) return false;
      if (!needle) return true;
      return [resource.title, resource.summary, resource.barrier, categoryMeta[resource.category]].join(" ").toLowerCase().includes(needle);
    });
  }, [resources, areaFilter, categoryFilter, phaseFilter, search]);

  const sendCount = resources.filter((item) => item.area === "send").length;
  const ealCount = resources.filter((item) => item.area === "eal").length;
  const highPriorityCount = resources.filter((item) => item.priority === "high").length;

  async function addResource() {
    if (!organizationId || !userId || !canManage) return;
    if (!title.trim()) { setMessage("Add a title before saving the guidance."); return; }
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("send_eal_resources").insert({
      organization_id: organizationId, area: newArea, category: newCategory, phase: newPhase,
      title: title.trim(), summary: summary.trim(), barrier: barrier.trim(),
      strategies: strategies.split("\n").map((value) => value.trim()).filter(Boolean),
      check_understanding: checkUnderstanding.trim(),
      avoid: avoid.split("\n").map((value) => value.trim()).filter(Boolean),
      resource_url: resourceUrl.trim() || null, priority, created_by: userId,
    });
    if (error) { setMessage(error.message); return; }
    setTitle(""); setSummary(""); setBarrier(""); setStrategies(""); setCheckUnderstanding(""); setAvoid(""); setResourceUrl(""); setPriority("normal");
    setMessage("School inclusion guidance added.");
    await loadResources(organizationId);
  }

  async function deleteResource(resource: Resource) {
    if (!canManage || !window.confirm(`Delete “${resource.title}”?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("send_eal_resources").delete().eq("id", resource.id);
    if (error) { setMessage(error.message); return; }
    setResources((current) => current.filter((item) => item.id !== resource.id));
  }

  if (loading) return <main className="sePage"><div className="seLoading">Loading SEND & EAL Hub…</div></main>;

  return (
    <main className="sePage">
      <header className="seTopbar"><Link href="/students">← Students</Link><div><span>PHASE 37</span><strong>SEND & EAL Hub</strong></div><Link href="/regulation-behaviour">Regulation & Behaviour →</Link></header>
      <section className="seHero"><div><span className="seEyebrow">INCLUSIVE TEACHING · ACCESS · LANGUAGE</span><h1>Start with the barrier, then choose the support.</h1><p>Give staff one practical place for inclusive classroom adaptations, SEND support and EAL scaffolds without turning classroom guidance into diagnosis or pupil casework.</p></div><div className="seHeroCard"><strong>Needs-led support</strong><span>Barrier → Adapt → Check → Review</span><small>Keep the learning goal ambitious while changing how pupils access it.</small></div></section>
      <section className="seScope"><div><strong>Important distinction</strong><p>Difficulty caused only by learning English as an additional language is not SEND. Consider language proficiency, prior schooling and subject knowledge separately from possible special educational needs.</p></div><div><strong>Needs-led practice</strong><p>Use broad areas of need as context, but focus classroom decisions on barriers, access and the impact of adaptations.</p></div><div><strong>Not a diagnostic tool</strong><p>Use school SENCO/EAL processes, specialist advice and safeguarding systems for assessment, referrals, plans and sensitive pupil information.</p></div></section>
      <section className="seStats"><div><strong>{resources.length}</strong><span>school inclusion guides</span></div><div><strong>{sendCount}</strong><span>SEND-focused resources</span></div><div><strong>{ealCount}</strong><span>EAL-focused resources</span></div><div><strong>{highPriorityCount}</strong><span>high-priority guides</span></div></section>
      <section className="seSupportSection"><div className="seSectionHeading"><span>QUICK CLASSROOM SUPPORT</span><h2>What is getting in the way right now?</h2><p>Choose the closest barrier and use the suggestions as a starting point alongside the pupil's existing plan and your professional judgement.</p></div><div className="seSupportLayout"><aside>{supportScenarios.map((scenario) => <button key={scenario.id} className={scenarioId === scenario.id ? "active" : ""} onClick={() => setScenarioId(scenario.id)}><span>{scenario.area === "eal" ? "EAL" : "SEND"}</span><strong>{scenario.title}</strong><small>{scenario.cue}</small></button>)}</aside><article className="seSupportDetail"><span className="seEyebrow">{selectedScenario.area.toUpperCase()} SUPPORT</span><h3>{selectedScenario.title}</h3><p>{selectedScenario.cue}</p><ol>{selectedScenario.supports.map((support) => <li key={support}>{support}</li>)}</ol><div className="seCheck"><strong>Check impact</strong><span>{selectedScenario.check}</span></div></article></div></section>
      <section className="seUniversal"><div className="seSectionHeading"><span>UNIVERSAL FIRST</span><h2>Inclusive routines that help many pupils</h2><p>Good universal practice can remove barriers before additional support is needed.</p></div><div className="sePills">{universalStrategies.map((strategy) => <span key={strategy}>{strategy}</span>)}</div></section>
      <section className="seEalSequence"><div className="seSectionHeading"><span>EAL LANGUAGE SCAFFOLD</span><h2>Move from meaning to independence</h2></div><div className="seSequenceGrid">{ealSequence.map(([number, titleText, copy]) => <article key={number}><span>{number}</span><h3>{titleText}</h3><p>{copy}</p></article>)}</div></section>
      <section className="seLibrary"><div className="seSectionHeading"><span>SCHOOL RESOURCE BANK</span><h2>Shared SEND & EAL guidance</h2><p>Search school-specific strategies, adaptations, transition guidance and assessment-access information.</p></div><div className="seFilters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guidance…" aria-label="Search SEND and EAL guidance" /><select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as "all" | Area)}><option value="all">All areas</option><option value="universal">Universal</option><option value="send">SEND</option><option value="eal">EAL</option></select><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | Category)}><option value="all">All categories</option>{(Object.keys(categoryMeta) as Category[]).map((key) => <option key={key} value={key}>{categoryMeta[key]}</option>)}</select><select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value as Phase)}>{(Object.keys(phaseLabels) as Phase[]).map((key) => <option key={key} value={key}>{phaseLabels[key]}</option>)}</select></div>
        {message && <div className="seMessage">{message}</div>}
        <div className="seResourceGrid">{filteredResources.map((resource) => <article key={resource.id} className={resource.priority === "high" ? "high" : ""}><div className="seResourceMeta"><span>{resource.area.toUpperCase()}</span><span>{categoryMeta[resource.category]}</span><span>{phaseLabels[resource.phase]}</span>{resource.priority === "high" && <b>Priority</b>}</div><h3>{resource.title}</h3>{resource.summary && <p>{resource.summary}</p>}{resource.barrier && <div><strong>Barrier</strong><span>{resource.barrier}</span></div>}{resource.strategies.length > 0 && <div><strong>Strategies</strong><ul>{resource.strategies.map((item) => <li key={item}>{item}</li>)}</ul></div>}{resource.check_understanding && <div><strong>Check understanding</strong><span>{resource.check_understanding}</span></div>}{resource.avoid.length > 0 && <div><strong>Avoid</strong><ul>{resource.avoid.map((item) => <li key={item}>{item}</li>)}</ul></div>}<footer>{resource.resource_url ? <a href={resource.resource_url} target="_blank" rel="noreferrer">Open resource ↗</a> : <span />}{canManage && <button onClick={() => deleteResource(resource)}>Delete</button>}</footer></article>)}</div>
        {filteredResources.length === 0 && <div className="seEmpty">No school-specific resources match these filters yet. The built-in classroom support above is still available.</div>}
      </section>
      {canManage && <section className="seManager"><div className="seSectionHeading"><span>INCLUSION LEAD TOOLS</span><h2>Add school guidance</h2><p>Create concise, practical guidance that staff can find quickly. Do not add identifiable pupil notes here.</p></div><div className="seFormGrid"><label>Area<select value={newArea} onChange={(event) => setNewArea(event.target.value as Area)}><option value="universal">Universal</option><option value="send">SEND</option><option value="eal">EAL</option></select></label><label>Category<select value={newCategory} onChange={(event) => setNewCategory(event.target.value as Category)}>{(Object.keys(categoryMeta) as Category[]).map((key) => <option key={key} value={key}>{categoryMeta[key]}</option>)}</select></label><label>Phase<select value={newPhase} onChange={(event) => setNewPhase(event.target.value as Phase)}>{(Object.keys(phaseLabels) as Phase[]).map((key) => <option key={key} value={key}>{phaseLabels[key]}</option>)}</select></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as "normal" | "high")}><option value="normal">Normal</option><option value="high">High</option></select></label><label className="wide">Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Supporting extended writing in Year 10" /></label><label className="wide">Summary<textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={2} /></label><label className="wide">Barrier or need<textarea value={barrier} onChange={(event) => setBarrier(event.target.value)} rows={2} /></label><label className="wide">Strategies — one per line<textarea value={strategies} onChange={(event) => setStrategies(event.target.value)} rows={5} /></label><label className="wide">How staff should check understanding<textarea value={checkUnderstanding} onChange={(event) => setCheckUnderstanding(event.target.value)} rows={2} /></label><label className="wide">Avoid — one per line<textarea value={avoid} onChange={(event) => setAvoid(event.target.value)} rows={3} /></label><label className="wide">Resource link<input value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://…" /></label></div><button className="sePrimary" onClick={addResource}>Save school guidance</button></section>}
      <section className="seFooterLinks"><Link href="/pastoral">Pastoral Hub</Link><Link href="/regulation-behaviour">Regulation & Behaviour</Link><Link href="/teaching-learning">Teaching & Learning</Link><Link href="/safeguarding">Safeguarding</Link></section>
    </main>
  );
}
