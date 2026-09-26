"use client";

import { useEffect, useMemo, useState } from "react";
import { courses, type Course, type Module } from "@/lib/catalogue";
import { buildCourseExperience, suggestedMode } from "@/lib/courseExperience";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type ProgressRow = {
  course_id: string;
  completed_modules: string[];
  reflections: Record<string, string>;
  completed_at: string | null;
};

type ActionPlan = {
  id: string;
  title: string;
  action: string;
  intended_outcome: string;
  evidence_plan: string;
  status: string;
  review_date: string | null;
  course_id: string | null;
};

type PortfolioEntry = {
  id: string;
  title: string;
  description: string;
  evidence_type: string;
  occurred_on: string;
  course_id: string | null;
};

type StudioView = "micro" | "notes" | "search" | "present" | "evidence";

function moduleText(module: Module) {
  if (module.type === "content") return `${module.title} ${module.body} ${(module.keyPoints || []).join(" ")}`;
  if (module.type === "quiz") return `${module.title} ${module.question} ${module.options.join(" ")} ${module.feedback}`;
  if (module.type === "scenario") return `${module.title} ${module.prompt} ${module.options.map(o => `${o.label} ${o.feedback}`).join(" ")}`;
  if (module.type === "reflection") return `${module.title} ${module.prompt}`;
  if (module.type === "visual") return `${module.title} ${module.caption || ""} ${module.items.map(i => `${i.heading} ${i.text}`).join(" ")}`;
  if (module.type === "checklist") return `${module.title} ${module.prompt} ${module.items.join(" ")}`;
  return `${module.title} ${module.prompt} ${module.instructions.join(" ")}`;
}

function chunkModules(course: Course) {
  const chunks: Module[][] = [];
  let current: Module[] = [];
  let weight = 0;
  const moduleWeight = (m: Module) => m.type === "content" || m.type === "visual" ? 2 : 1;
  for (const module of course.modules) {
    const nextWeight = moduleWeight(module);
    if (current.length && weight + nextWeight > 4) {
      chunks.push(current);
      current = [];
      weight = 0;
    }
    current.push(module);
    weight += nextWeight;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function safeJsonArray(value?: string) {
  try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed.filter(x => typeof x === "string") : []; }
  catch { return []; }
}
function esc(value: string) { return value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c] || c)); }

export default function CourseStudioPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selectedId, setSelectedId] = useState(courses[0]?.id || "");
  const [rows, setRows] = useState<Record<string, ProgressRow>>({});
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [view, setView] = useState<StudioView>("micro");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [chunkIndex, setChunkIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const course = useMemo(() => courses.find(c => c.id === selectedId) || courses[0], [selectedId]);
  const row = course ? rows[course.id] : undefined;
  const reflections = row?.reflections || {};
  const bookmarks = useMemo(() => new Set(safeJsonArray(reflections.__studio_bookmarks)), [reflections.__studio_bookmarks]);
  const chunks = useMemo(() => course ? chunkModules(course) : [], [course]);
  const experience = useMemo(() => course ? buildCourseExperience(course, courses) : null, [course]);
  const courseActions = useMemo(() => course ? actions.filter(a => a.course_id === course.id) : [], [actions, course]);
  const coursePortfolio = useMemo(() => course ? portfolio.filter(p => p.course_id === course.id) : [], [portfolio, course]);
  const completedCount = row?.completed_modules?.length || 0;
  const progress = course?.modules.length ? Math.round(completedCount / course.modules.length * 100) : 0;
  const diagnostic = Number(reflections.__diagnostic_score ?? -1);
  const mastery = Number(reflections.__mastery_score ?? -1);
  const recommendedMode = diagnostic >= 0 ? suggestedMode(diagnostic) : "Standard";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth?next=/course-studio"; return; }
      if (!active) return;
      setUserId(auth.user.id);
      const [{ data: progressRows, error: progressError }, { data: actionRows, error: actionError }, { data: portfolioRows, error: portfolioError }] = await Promise.all([
        supabase.from("course_progress").select("course_id,completed_modules,reflections,completed_at").eq("user_id", auth.user.id),
        supabase.from("action_plans").select("id,title,action,intended_outcome,evidence_plan,status,review_date,course_id").eq("user_id", auth.user.id),
        supabase.from("portfolio_entries").select("id,title,description,evidence_type,occurred_on,course_id").eq("user_id", auth.user.id).order("occurred_on", { ascending: false }),
      ]);
      if (!active) return;
      if (progressError || actionError || portfolioError) setMessage([progressError?.message, actionError?.message, portfolioError?.message].filter(Boolean).join(" · "));
      const map: Record<string, ProgressRow> = {};
      for (const item of progressRows || []) map[item.course_id] = { course_id: item.course_id, completed_modules: item.completed_modules || [], reflections: (item.reflections || {}) as Record<string,string>, completed_at: item.completed_at || null };
      setRows(map);
      setActions((actionRows || []).map(a => ({ id:a.id,title:a.title,action:a.action,intended_outcome:a.intended_outcome,evidence_plan:a.evidence_plan,status:a.status,review_date:a.review_date,course_id:a.course_id || null })) as ActionPlan[]);
      setPortfolio((portfolioRows || []).map(p => ({ id:p.id,title:p.title,description:p.description,evidence_type:p.evidence_type,occurred_on:p.occurred_on,course_id:p.course_id || null })) as PortfolioEntry[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!course) return;
    setChunkIndex(0);
    setSlideIndex(0);
    const drafts: Record<string,string> = {};
    for (const module of course.modules) drafts[module.id] = row?.reflections?.[`__studio_note:${module.id}`] || "";
    setNoteDrafts(drafts);
  }, [course?.id, row?.reflections]);

  async function updateMeta(patch: Record<string,string>) {
    if (!course || !userId) return false;
    const supabase = getSupabaseBrowserClient();
    const current = rows[course.id] || { course_id: course.id, completed_modules: [], reflections: {}, completed_at: null };
    const nextReflections = { ...current.reflections, ...patch };
    setSaving(true);
    const { data, error } = await supabase.from("course_progress").upsert({
      user_id: userId,
      course_id: course.id,
      completed_modules: current.completed_modules,
      reflections: nextReflections,
      completed_at: current.completed_at,
    }, { onConflict: "user_id,course_id" }).select("course_id,completed_modules,reflections,completed_at").single();
    setSaving(false);
    if (error) { setMessage(error.message); return false; }
    setRows(prev => ({ ...prev, [course.id]: { course_id:data.course_id, completed_modules:data.completed_modules || [], reflections:(data.reflections || {}) as Record<string,string>, completed_at:data.completed_at || null } }));
    return true;
  }

  async function toggleBookmark(moduleId: string) {
    const next = new Set(bookmarks);
    if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
    if (await updateMeta({ __studio_bookmarks: JSON.stringify([...next]) })) setMessage(next.has(moduleId) ? "Module bookmarked." : "Bookmark removed.");
  }

  async function saveNote(moduleId: string) {
    const value = (noteDrafts[moduleId] || "").trim();
    if (value && value.length < 10) { setMessage("Add a little more detail before saving the note."); return; }
    if (await updateMeta({ [`__studio_note:${moduleId}`]: value })) setMessage("Private course note saved.");
  }

  const searchResults = useMemo(() => {
    if (!course || !query.trim()) return [];
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return course.modules.filter(m => terms.every(t => moduleText(m).toLowerCase().includes(t)));
  }, [course, query]);

  const nextGuidance = useMemo(() => {
    if (!course) return [];
    const guidance: string[] = [];
    if (diagnostic < 0) guidance.push("Take the diagnostic in Course Lab before deciding which sections to prioritise.");
    else if (diagnostic < 55) guidance.push("Use ECT/guided mode and revisit content, visuals and worked examples before independent application.");
    else if (diagnostic < 80) guidance.push("Use Standard mode and concentrate on scenarios, misconceptions and the implementation activity.");
    else guidance.push("Use Challenge mode and focus on critique, transfer, leadership implications and impact evidence.");
    if (progress < 100) guidance.push(`Complete the remaining ${course.modules.length - completedCount} core module${course.modules.length - completedCount === 1 ? "" : "s"}.`);
    if (mastery >= 0 && mastery < 80) guidance.push("Retry the mastery check after a spaced retrieval interval; prioritise missed concepts rather than rereading everything.");
    if (mastery >= 80) guidance.push("Knowledge evidence is secure enough to move the emphasis towards implementation and impact review.");
    if (!courseActions.length) guidance.push("Create one small implementation action and set a review date so the course leads to a testable change in practice.");
    return guidance;
  }, [course, diagnostic, mastery, progress, completedCount, courseActions.length]);

  function exportEvidencePack() {
    if (!course || !experience) return;
    const notes = course.modules.map(m => ({ title:m.title, note:reflections[`__studio_note:${m.id}`] || reflections[m.id] || "" })).filter(n => n.note);
    const actionHtml = courseActions.length ? courseActions.map(a => `<div class="card"><strong>${esc(a.title)}</strong><p>${esc(a.action)}</p><p><b>Status:</b> ${esc(a.status)}${a.review_date ? ` · review ${esc(a.review_date)}` : ""}</p>${a.intended_outcome ? `<p><b>Intended outcome:</b> ${esc(a.intended_outcome)}</p>` : ""}</div>`).join("") : "<p>No linked implementation action plans yet.</p>";
    const portfolioHtml = coursePortfolio.length ? coursePortfolio.map(p => `<div class="card"><strong>${esc(p.title)}</strong><p>${esc(p.description || "No summary added.")}</p><p><b>${esc(p.evidence_type.replaceAll("_"," "))}</b> · ${esc(p.occurred_on)}</p></div>`).join("") : "<p>No linked portfolio evidence yet.</p>";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(course.title)} CPD evidence pack</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;line-height:1.55;color:#17212b}h1{font-size:30px}h2{margin-top:30px;border-bottom:1px solid #ddd;padding-bottom:6px}.meta{color:#667085}.card{border:1px solid #ddd;border-radius:10px;padding:14px;margin:10px 0}.score{font-size:22px;font-weight:700}li{margin:6px 0}@media print{button{display:none}}</style></head><body><p class="meta">Teaching CPD Hub · Personal evidence pack</p><h1>${esc(course.title)}</h1><p>${esc(course.summary)}</p><p class="meta">${course.duration} minutes · ${esc(course.category)} · progress ${progress}%</p><h2>Learning objectives</h2><ul>${course.objectives.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h2>Learning evidence</h2><div class="card"><div class="score">Diagnostic: ${diagnostic >= 0 ? `${diagnostic}%` : "not completed"}</div><div class="score">Mastery: ${mastery >= 0 ? `${mastery}%` : "not completed"}</div><p>Recommended route: ${esc(recommendedMode)}</p></div><h2>Completed modules</h2><ul>${course.modules.map(m=>`<li>${row?.completed_modules?.includes(m.id) ? "✓" : "○"} ${esc(m.title)}</li>`).join("")}</ul><h2>Private reflections and notes</h2>${notes.length ? notes.map(n=>`<div class="card"><strong>${esc(n.title)}</strong><p>${esc(n.note)}</p></div>`).join("") : "<p>No saved course notes yet.</p>"}<h2>Implementation guidance</h2><ul>${nextGuidance.map(g=>`<li>${esc(g)}</li>`).join("")}</ul><h2>Linked action plans</h2>${actionHtml}<h2>Linked portfolio evidence</h2>${portfolioHtml}<h2>Course toolkit</h2><ul>${experience.implementationChecklist.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="meta">Generated ${new Date().toLocaleString("en-GB")}. Keep this document secure if it contains professional reflections.</p></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${course.id}-cpd-evidence-pack.html`; a.click(); URL.revokeObjectURL(url);
    setMessage("Personal CPD evidence pack downloaded.");
  }

  async function startPresentation() {
    const el = document.getElementById("studio-presentation");
    if (el?.requestFullscreen) { try { await el.requestFullscreen(); } catch {} }
  }

  if (loading) return <main className="studioPage"><div className="studioCard">Loading Course Studio…</div></main>;
  if (!course) return <main className="studioPage"><div className="studioCard">No courses are available.</div></main>;

  const currentChunk = chunks[Math.min(chunkIndex, Math.max(0, chunks.length - 1))] || [];
  const slide = course.modules[Math.min(slideIndex, course.modules.length - 1)];

  return <main className="studioPage">
    <section className="studioHero">
      <div><span className="eyebrow">COURSE STUDIO</span><h1>Turn any CPD course into a flexible learning workspace.</h1><p>Use short micro-learning chunks, private notes and bookmarks, searchable course knowledge, full-screen facilitator slides and a personal evidence pack.</p></div>
      <a className="secondary phaseLinkButton" href="/">Back to courses</a>
    </section>

    {message && <div className="studioNotice">{message}</div>}

    <section className="studioControls studioCard">
      <label>Course<select value={course.id} onChange={e => setSelectedId(e.target.value)}>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      <div className="studioProgress"><div><strong>{progress}%</strong><span>{completedCount}/{course.modules.length} modules</span></div><div className="studioProgressBar"><span style={{width:`${clamp(progress)}%`}} /></div></div>
      <div className="studioScores"><span>Diagnostic <b>{diagnostic >= 0 ? `${diagnostic}%` : "—"}</b></span><span>Mastery <b>{mastery >= 0 ? `${mastery}%` : "—"}</b></span><span>Route <b>{recommendedMode}</b></span></div>
    </section>

    <nav className="studioTabs" aria-label="Course Studio tools">
      {([["micro","Micro-learning"],["notes","Notes & bookmarks"],["search","Knowledge search"],["present","Presentation"],["evidence","Evidence pack"]] as [StudioView,string][]).map(([value,label]) => <button key={value} className={view===value?"active":""} onClick={()=>setView(value)}>{label}</button>)}
    </nav>

    {view === "micro" && <section className="studioGrid two">
      <div className="studioCard">
        <span className="eyebrow">5–10 MINUTE MODE</span><h2>Micro-learning chunk {chunkIndex + 1} of {chunks.length}</h2><p>Use a short chunk when there is not enough time for the full course. Core completion still happens in the main course.</p>
        <div className="microModules">{currentChunk.map(m => <article key={m.id} className={row?.completed_modules?.includes(m.id)?"microModule done":"microModule"}><div><span>{row?.completed_modules?.includes(m.id)?"✓":"○"}</span><div><strong>{m.title}</strong><small>{m.type}</small></div></div><p>{moduleText(m).replace(m.title,"").trim().slice(0,360)}{moduleText(m).length>390?"…":""}</p><div className="microActions"><button className="textButton" onClick={()=>toggleBookmark(m.id)}>{bookmarks.has(m.id)?"★ Bookmarked":"☆ Bookmark"}</button></div></article>)}</div>
        <div className="studioActions"><button className="secondary" disabled={chunkIndex===0} onClick={()=>setChunkIndex(i=>Math.max(0,i-1))}>Previous chunk</button><button className="primary" disabled={chunkIndex>=chunks.length-1} onClick={()=>setChunkIndex(i=>Math.min(chunks.length-1,i+1))}>Next chunk</button></div>
      </div>
      <div className="studioCard"><span className="eyebrow">ADAPTIVE NEXT STEP</span><h2>What should I focus on?</h2><div className="guidanceList">{nextGuidance.map(g=><p key={g}>→ {g}</p>)}</div><a className="secondary phaseLinkButton" href="/actions">Open implementation tracker</a></div>
    </section>}

    {view === "notes" && <section className="studioCard"><span className="eyebrow">PRIVATE COURSE NOTEBOOK</span><h2>Notes and bookmarks</h2><p>Notes are stored inside your private course-progress record. Avoid pupil-identifiable information.</p><div className="noteList">{course.modules.map(m => <article key={m.id} className={bookmarks.has(m.id)?"noteCard bookmarked":"noteCard"}><header><div><strong>{m.title}</strong><small>{m.type}</small></div><button className="bookmarkButton" aria-pressed={bookmarks.has(m.id)} onClick={()=>toggleBookmark(m.id)}>{bookmarks.has(m.id)?"★":"☆"}</button></header><textarea rows={4} value={noteDrafts[m.id] || ""} onChange={e=>setNoteDrafts(prev=>({...prev,[m.id]:e.target.value}))} placeholder="Private professional note…"/><button className="secondary" disabled={saving} onClick={()=>saveNote(m.id)}>Save note</button></article>)}</div></section>}

    {view === "search" && <section className="studioGrid two">
      <div className="studioCard"><span className="eyebrow">KNOWLEDGE NAVIGATOR</span><h2>Search this course</h2><input className="studioSearch" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search for a concept, strategy or key term…"/><p className="muted">Searches the authored course content, questions, scenarios, visuals, checklists and activities—not the wider internet.</p>{query.trim() && <div className="searchResults"><strong>{searchResults.length} matching module{searchResults.length===1?"":"s"}</strong>{searchResults.map(m=><article key={m.id}><h3>{m.title}</h3><span>{m.type}</span><p>{moduleText(m).replace(m.title,"").trim().slice(0,520)}{moduleText(m).length>550?"…":""}</p><button className="textButton" onClick={()=>toggleBookmark(m.id)}>{bookmarks.has(m.id)?"★ Bookmarked":"☆ Bookmark result"}</button></article>)}</div>}</div>
      <div className="studioCard"><span className="eyebrow">BOOKMARKED KNOWLEDGE</span><h2>Quick return list</h2><div className="bookmarkList">{course.modules.filter(m=>bookmarks.has(m.id)).map(m=><div key={m.id}><strong>{m.title}</strong><p>{moduleText(m).replace(m.title,"").trim().slice(0,240)}…</p></div>)}{bookmarks.size===0 && <p className="muted">Bookmark useful sections from Micro-learning, Notes or Search.</p>}</div></div>
    </section>}

    {view === "present" && <section className="studioGrid presentGrid">
      <div className="studioCard"><span className="eyebrow">FACILITATOR PRESENTATION</span><h2>Turn course modules into meeting slides</h2><p>Use this for department CPD or staff meetings. The presentation shows authored content only and hides private notes/reflections.</p><div className="studioActions"><button className="primary" onClick={startPresentation}>Enter full screen</button><a className="secondary phaseLinkButton" href={`/live?course=${encodeURIComponent(course.id)}`}>Add live phone activities</a></div></div>
      <div id="studio-presentation" className="studioPresentation">
        <div className="presentationTop"><span>{course.title}</span><b>{slideIndex+1}/{course.modules.length}</b></div>
        <div className="presentationBody"><span className="presentationType">{slide.type}</span><h2>{slide.title}</h2><PresentationContent module={slide}/></div>
        <div className="presentationControls"><button disabled={slideIndex===0} onClick={()=>setSlideIndex(i=>Math.max(0,i-1))}>← Previous</button><button disabled={slideIndex>=course.modules.length-1} onClick={()=>setSlideIndex(i=>Math.min(course.modules.length-1,i+1))}>Next →</button></div>
      </div>
    </section>}

    {view === "evidence" && <section className="studioGrid two">
      <div className="studioCard"><span className="eyebrow">PERSONAL CPD EVIDENCE PACK</span><h2>Export your learning record</h2><p>The evidence pack combines the course overview, objectives, progress, diagnostic/mastery results, saved course notes, linked implementation plans and linked portfolio evidence into a portable HTML document that can be opened or printed to PDF.</p><div className="evidenceSummary"><div><strong>{progress}%</strong><span>core progress</span></div><div><strong>{diagnostic>=0?`${diagnostic}%`:"—"}</strong><span>diagnostic</span></div><div><strong>{mastery>=0?`${mastery}%`:"—"}</strong><span>mastery</span></div><div><strong>{Object.keys(noteDrafts).filter(k=>(noteDrafts[k]||"").trim()).length}</strong><span>course notes</span></div></div><button className="primary" onClick={exportEvidencePack}>Download evidence pack</button></div>
      <div className="studioCard"><span className="eyebrow">IMPLEMENTATION EVIDENCE</span><h2>Linked to this course</h2><h3>Action plans</h3>{courseActions.length?<div className="linkedList">{courseActions.slice(0,5).map(a=><div key={a.id}><strong>{a.title}</strong><span>{a.status}{a.review_date?` · review ${new Date(`${a.review_date}T12:00:00`).toLocaleDateString("en-GB")}`:""}</span></div>)}</div>:<p className="muted">No action plans linked to this course yet.</p>}<h3>Portfolio evidence</h3>{coursePortfolio.length?<div className="linkedList">{coursePortfolio.slice(0,5).map(p=><div key={p.id}><strong>{p.title}</strong><span>{p.evidence_type.replaceAll("_"," ")} · {new Date(`${p.occurred_on}T12:00:00`).toLocaleDateString("en-GB")}</span></div>)}</div>:<p className="muted">No portfolio evidence linked to this course yet.</p>}</div>
    </section>}
  </main>;
}

function PresentationContent({module}:{module:Module}) {
  if(module.type==="content") return <><p>{module.body}</p>{module.keyPoints&&<ul>{module.keyPoints.map(x=><li key={x}>{x}</li>)}</ul>}</>;
  if(module.type==="quiz") return <><p>{module.question}</p><ol>{module.options.map(x=><li key={x}>{x}</li>)}</ol></>;
  if(module.type==="scenario") return <><p>{module.prompt}</p><ul>{module.options.map(x=><li key={x.label}>{x.label}</li>)}</ul></>;
  if(module.type==="reflection") return <p>{module.prompt}</p>;
  if(module.type==="visual") return <><p>{module.caption}</p><div className="presentationCards">{module.items.map(i=><div key={i.heading}><strong>{i.heading}</strong><p>{i.text}</p></div>)}</div></>;
  if(module.type==="checklist") return <><p>{module.prompt}</p><ul>{module.items.map(x=><li key={x}>{x}</li>)}</ul></>;
  return <><p>{module.prompt}</p><ol>{module.instructions.map(x=><li key={x}>{x}</li>)}</ol></>;
}
