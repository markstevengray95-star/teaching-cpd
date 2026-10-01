"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resolveStaffAccess, type StaffRole } from "@/lib/rolePermissions";
import "./RegulationBehaviourHub.css";

type Category =
  | "regulation"
  | "classroom_routine"
  | "de_escalation"
  | "restorative"
  | "return_to_learning"
  | "behaviour_policy"
  | "staff_script";

type Resource = {
  id: string;
  category: Category;
  title: string;
  summary: string;
  when_to_use: string;
  steps: string[];
  avoid: string[];
  resource_url: string | null;
  priority: "normal" | "high";
  updated_at: string;
};

type Situation = {
  id: string;
  title: string;
  cue: string;
  steps: string[];
  avoid: string[];
};

const categoryMeta: Record<Category, { label: string; description: string }> = {
  regulation: { label: "Regulation", description: "Support pupils to regain readiness for learning." },
  classroom_routine: { label: "Classroom routines", description: "Prevent avoidable friction through clear, predictable routines." },
  de_escalation: { label: "De-escalation", description: "Reduce intensity and keep communication calm and simple." },
  restorative: { label: "Restorative response", description: "Repair impact and relationships after everyone is calm." },
  return_to_learning: { label: "Return to learning", description: "Help pupils re-enter learning with dignity and clarity." },
  behaviour_policy: { label: "Behaviour policy", description: "Keep school expectations and escalation routes easy to find." },
  staff_script: { label: "Staff scripts", description: "Short, consistent wording for common situations." },
};

const situations: Situation[] = [
  {
    id: "overwhelmed",
    title: "Dysregulated or overwhelmed",
    cue: "The pupil is struggling to process demands or communicate calmly.",
    steps: [
      "Reduce unnecessary language, audience and competing demands.",
      "Use a calm tone and give processing time rather than repeating instructions rapidly.",
      "Offer a small number of safe, realistic choices and use the school's agreed regulation supports.",
      "When the pupil is ready, identify one clear next step back towards learning.",
    ],
    avoid: ["Public debate or lengthy questioning", "Adding multiple new demands at once", "Trying to resolve the full incident before the pupil is ready"],
  },
  {
    id: "disruption",
    title: "Low-level disruption",
    cue: "Learning is being interrupted but the situation is not escalating.",
    steps: [
      "Use the least intrusive reminder that is likely to work.",
      "Restate the expected behaviour briefly and neutrally.",
      "Give a clear opportunity to reset and acknowledge the return to learning.",
      "If the pattern continues, follow the school's behaviour policy consistently.",
    ],
    avoid: ["Extended public exchanges", "Changing consequences in the moment", "Turning a minor correction into a confrontation"],
  },
  {
    id: "withdrawal",
    title: "Refusal or withdrawal",
    cue: "The pupil is not engaging, has stopped work or is avoiding the task.",
    steps: [
      "Check whether the barrier is understanding, regulation, confidence or another immediate need.",
      "Reduce the next task to one clear, achievable action without removing the core learning goal.",
      "Offer brief help or a choice between two appropriate ways to begin.",
      "Notice re-engagement and build momentum from the first completed step.",
    ],
    avoid: ["Assuming the reason without checking", "Removing all challenge automatically", "Repeated demands without changing the support"],
  },
  {
    id: "conflict",
    title: "Peer conflict",
    cue: "A disagreement is affecting safety, regulation or learning.",
    steps: [
      "Create enough space for everyone to settle and resume safe behaviour.",
      "Keep immediate instructions short and focused on what needs to happen now.",
      "Gather perspectives later, when pupils can communicate calmly.",
      "Use the school's restorative or pastoral process to repair impact where appropriate.",
    ],
    avoid: ["Forcing an immediate apology", "Investigating every detail in front of peers", "Using restorative conversation while emotions are still high"],
  },
  {
    id: "return",
    title: "Return to learning",
    cue: "The immediate issue has settled and the pupil is ready to rejoin.",
    steps: [
      "Welcome the return without making it a public event.",
      "Give one concise reminder of the current learning task and what success looks like.",
      "Provide any essential catch-up information or scaffold.",
      "Arrange a later follow-up if repair, reflection or further support is needed.",
    ],
    avoid: ["Replaying the incident before learning restarts", "Public commentary about the pupil's return", "Withholding access to the learning task as a new consequence"],
  },
];

const responseSteps = [
  ["1", "Stabilise", "Check immediate safety and reduce unnecessary audience, noise and language."],
  ["2", "Regulate", "Use calm communication, processing time and the school's agreed regulation supports."],
  ["3", "Reconnect", "Identify one clear, safe and achievable next step."],
  ["4", "Restore", "Once calm, address impact, repair relationships and clarify expectations."],
  ["5", "Review", "If the pattern repeats, use pastoral and intervention processes rather than relying on repeated in-the-moment responses."],
];

const managerRoles: StaffRole[] = ["pastoral", "send-eal", "slt", "administrator", "super-admin"];

export default function RegulationBehaviourHub() {
  const [role, setRole] = useState<StaffRole>("teacher");
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [category, setCategory] = useState<"all" | Category>("all");
  const [situationId, setSituationId] = useState("overwhelmed");
  const [checkins, setCheckins] = useState(0);
  const [activeInterventions, setActiveInterventions] = useState(0);
  const [reviewsDue, setReviewsDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [newCategory, setNewCategory] = useState<Category>("regulation");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [whenToUse, setWhenToUse] = useState("");
  const [steps, setSteps] = useState("");
  const [avoid, setAvoid] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [priority, setPriority] = useState<"normal" | "high">("normal");

  const canManage = managerRoles.includes(role);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getSupabaseBrowserClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        window.location.assign("/auth?next=/regulation-behaviour");
        return;
      }
      const access = await resolveStaffAccess(client, auth.user);
      if (!mounted) return;
      setRole(access.role);
      setUserId(auth.user.id);
      setOrganizationId(access.organizationId);
      if (access.organizationId) await loadHub(access.organizationId);
      setLoading(false);
    })().catch((error) => {
      console.error("Regulation and behaviour hub load failed", error);
      if (mounted) {
        setMessage("The regulation and behaviour hub could not be loaded yet.");
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  async function loadHub(org: string) {
    const client = getSupabaseBrowserClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().slice(0, 10);
    const [resourceResult, checkinResult, interventionResult] = await Promise.all([
      client
        .from("regulation_behaviour_resources")
        .select("id,category,title,summary,when_to_use,steps,avoid,resource_url,priority,updated_at")
        .eq("organization_id", org)
        .order("priority", { ascending: true })
        .order("updated_at", { ascending: false }),
      client
        .from("staff_development_checkins")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org)
        .gte("created_at", sevenDaysAgo),
      client
        .from("staff_development_interventions")
        .select("id,status,review_date")
        .eq("organization_id", org)
        .limit(200),
    ]);

    if (resourceResult.error) setMessage(resourceResult.error.message);
    setResources((resourceResult.data || []) as Resource[]);
    setCheckins(checkinResult.count || 0);

    const interventions = interventionResult.data || [];
    const active = interventions.filter((item) => !["closed", "complete", "completed", "ended"].includes(String(item.status || "").toLowerCase()));
    setActiveInterventions(active.length);
    setReviewsDue(active.filter((item) => item.review_date && item.review_date <= today).length);
  }

  const filteredResources = useMemo(
    () => resources.filter((item) => category === "all" || item.category === category),
    [category, resources],
  );
  const selectedSituation = situations.find((item) => item.id === situationId) || situations[0];
  const highPriorityCount = resources.filter((item) => item.priority === "high").length;

  async function addResource() {
    if (!organizationId || !userId || !canManage) return;
    if (!title.trim()) {
      setMessage("Add a title before saving the guidance.");
      return;
    }
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("regulation_behaviour_resources").insert({
      organization_id: organizationId,
      category: newCategory,
      title: title.trim(),
      summary: summary.trim(),
      when_to_use: whenToUse.trim(),
      steps: steps.split("\n").map((value) => value.trim()).filter(Boolean),
      avoid: avoid.split("\n").map((value) => value.trim()).filter(Boolean),
      resource_url: resourceUrl.trim() || null,
      priority,
      created_by: userId,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setTitle(""); setSummary(""); setWhenToUse(""); setSteps(""); setAvoid(""); setResourceUrl(""); setPriority("normal");
    setMessage("School guidance added to the Regulation & Behaviour Hub.");
    await loadHub(organizationId);
  }

  async function deleteResource(resource: Resource) {
    if (!canManage || !window.confirm(`Delete “${resource.title}”?`)) return;
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("regulation_behaviour_resources").delete().eq("id", resource.id);
    if (error) return setMessage(error.message);
    setResources((current) => current.filter((item) => item.id !== resource.id));
  }

  if (loading) return <main className="rbPage"><div className="rbLoading">Loading Regulation & Behaviour Hub…</div></main>;

  return <main className="rbPage">
    <header className="rbTopbar">
      <Link href="/students">← Students</Link>
      <div><span>PHASE 36</span><strong>Regulation & Behaviour</strong></div>
      <Link href="/pastoral">Pastoral Hub →</Link>
    </header>

    <section className="rbHero">
      <div>
        <span className="rbEyebrow">CALM · CONSISTENT · RESTORATIVE</span>
        <h1>One clear workflow for regulation and behaviour.</h1>
        <p>Bring classroom routines, regulation support, restorative practice and return-to-learning guidance together without replacing your school's behaviour or safeguarding procedures.</p>
      </div>
      <div className="rbHeroCard">
        <strong>5-step response</strong>
        <span>Stabilise → Regulate → Reconnect → Restore → Review</span>
        <small>Use professional judgement and your school's agreed policy at every stage.</small>
      </div>
    </section>

    <section className="rbSafetyNote">
      <strong>Scope of this hub</strong>
      <p>This area supports day-to-day behaviour and regulation. Record safeguarding concerns in your school's approved safeguarding system. If there is immediate danger, follow trained school emergency procedures. This hub does not provide physical intervention instructions.</p>
    </section>

    <section className="rbStats">
      <div><strong>{checkins}</strong><span>regulation check-ins visible to you · 7 days</span></div>
      <div><strong>{activeInterventions}</strong><span>active interventions visible to you</span></div>
      <div><strong>{reviewsDue}</strong><span>intervention reviews due</span></div>
      <div><strong>{highPriorityCount}</strong><span>high-priority school guides</span></div>
    </section>

    <section className="rbResponse">
      <div className="rbSectionHeading"><span>CONSISTENT RESPONSE</span><h2>A shared five-step sequence</h2><p>The aim is to reduce escalation, preserve dignity and get back to safe learning as soon as reasonably possible.</p></div>
      <div className="rbResponseGrid">{responseSteps.map(([number, heading, copy]) => <article key={number}><span>{number}</span><h3>{heading}</h3><p>{copy}</p></article>)}</div>
    </section>

    <section className="rbSituationSection">
      <div className="rbSectionHeading"><span>IN THE MOMENT</span><h2>Choose the situation</h2><p>Use these as short staff prompts, then apply the school's policy and your knowledge of the pupil.</p></div>
      <div className="rbSituationLayout">
        <aside>{situations.map((item) => <button key={item.id} className={situationId === item.id ? "active" : ""} onClick={() => setSituationId(item.id)}><strong>{item.title}</strong><small>{item.cue}</small></button>)}</aside>
        <article className="rbSituationDetail">
          <span className="rbEyebrow">{selectedSituation.title.toUpperCase()}</span>
          <h3>{selectedSituation.cue}</h3>
          <div className="rbSituationColumns">
            <div><strong>Helpful next steps</strong><ol>{selectedSituation.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
            <div><strong>Avoid</strong><ul>{selectedSituation.avoid.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
        </article>
      </div>
    </section>

    <section className="rbScripts">
      <div className="rbSectionHeading"><span>SHORT STAFF SCRIPTS</span><h2>Keep language calm and brief</h2></div>
      <div className="rbScriptGrid">
        <blockquote>“I can see this is difficult. We’ll focus on the next safe step.”</blockquote>
        <blockquote>“You have two safe options. You can choose which one helps you get started.”</blockquote>
        <blockquote>“We can talk about what happened once things are calm. For now, the next step is…”</blockquote>
        <blockquote>“Welcome back. Here is where the class is up to, and this is the first thing to do.”</blockquote>
      </div>
    </section>

    <section className="rbQuickLinks">
      <Link href="/send-eal"><span>◇</span><strong>SEND & EAL</strong><small>Inclusive classroom support</small></Link>
      <Link href="/interventions"><span>↻</span><strong>Interventions</strong><small>Track support and review</small></Link>
      <Link href="/pastoral"><span>◎</span><strong>Pastoral Hub</strong><small>Tutor and pastoral support</small></Link>
      <Link href="/safeguarding"><span>✓</span><strong>Safeguarding</strong><small>Approved guidance and training</small></Link>
    </section>

    <section className="rbLibrary">
      <div className="rbSectionHeading"><span>SCHOOL PLAYBOOK</span><h2>Your school's regulation & behaviour guidance</h2><p>Leadership-managed guidance appears here alongside the built-in response workflow.</p></div>
      <div className="rbFilters"><button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>All</button>{(Object.keys(categoryMeta) as Category[]).map((key) => <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)}>{categoryMeta[key].label}</button>)}</div>
      {filteredResources.length ? <div className="rbResourceGrid">{filteredResources.map((item) => <article key={item.id} className={item.priority === "high" ? "priority" : ""}>
        <div className="rbResourceTop"><span>{categoryMeta[item.category].label}</span>{item.priority === "high" && <strong>Priority</strong>}</div>
        <h3>{item.title}</h3>
        {item.summary && <p>{item.summary}</p>}
        {item.when_to_use && <div><b>When to use</b><p>{item.when_to_use}</p></div>}
        {item.steps.length > 0 && <details><summary>Steps</summary><ol>{item.steps.map((step) => <li key={step}>{step}</li>)}</ol></details>}
        {item.avoid.length > 0 && <details><summary>Avoid</summary><ul>{item.avoid.map((value) => <li key={value}>{value}</li>)}</ul></details>}
        <footer>{item.resource_url && <a href={item.resource_url} target="_blank" rel="noreferrer">Open school resource ↗</a>}{canManage && <button onClick={() => deleteResource(item)}>Delete</button>}</footer>
      </article>)}</div> : <div className="rbEmpty"><strong>No school-specific guidance has been added in this category yet.</strong><p>The built-in five-step response and situation prompts above remain available to all staff.</p></div>}
    </section>

    {canManage && <section className="rbManage">
      <div className="rbSectionHeading"><span>LEADERSHIP EDITING</span><h2>Add school-specific guidance</h2><p>Use this for agreed staff guidance and policy-linked prompts, not individual pupil case notes.</p></div>
      <div className="rbForm">
        <label><span>Category</span><select value={newCategory} onChange={(event) => setNewCategory(event.target.value as Category)}>{(Object.keys(categoryMeta) as Category[]).map((key) => <option key={key} value={key}>{categoryMeta[key].label}</option>)}</select></label>
        <label><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as "normal" | "high")}><option value="normal">Normal</option><option value="high">High</option></select></label>
        <label className="wide"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Classroom reset routine" /></label>
        <label className="wide"><span>Summary</span><input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Short description for staff" /></label>
        <label className="wide"><span>When to use</span><textarea rows={3} value={whenToUse} onChange={(event) => setWhenToUse(event.target.value)} placeholder="When should staff use this guidance?" /></label>
        <label><span>Steps · one per line</span><textarea rows={7} value={steps} onChange={(event) => setSteps(event.target.value)} placeholder={"State the expectation calmly\nGive processing time\nReinforce the return to learning"} /></label>
        <label><span>Avoid · one per line</span><textarea rows={7} value={avoid} onChange={(event) => setAvoid(event.target.value)} placeholder={"Public debate\nMultiple instructions at once"} /></label>
        <label className="wide"><span>Optional school resource link</span><input value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://…" /></label>
        <button className="wide" onClick={addResource}>Add to school playbook</button>
      </div>
    </section>}

    {message && <div className="rbMessage" role="status">{message}</div>}
  </main>;
}
