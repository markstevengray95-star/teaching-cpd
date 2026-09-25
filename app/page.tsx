"use client";

import { useEffect, useMemo, useState } from "react";
import { categoryOrder, courses, type Course, type Module, type Role } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Profile = { id: string; name: string; email: string; role: Role; department: string };
type ProgressItem = { completedModules: string[]; reflections: Record<string, string>; completedAt?: string };
type ProgressState = Record<string, ProgressItem>;
type View = "dashboard" | "courses" | "mycpd" | "certificates" | "profile";

function initials(name: string) { return name.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase(); }

export default function Home() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressState>({});
  const [view, setView] = useState<View>("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setReady(true); return; }
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/auth"; return; }
      const [{ data: p, error: profileError }, { data: rows, error: progressError }] = await Promise.all([
        supabase.from("staff_profiles").select("id,full_name,role,department").eq("id", auth.user.id).single(),
        supabase.from("course_progress").select("course_id,completed_modules,reflections,completed_at").eq("user_id", auth.user.id),
      ]);
      if (!active) return;
      if (profileError) { notify(profileError.message); setReady(true); return; }
      if (progressError) notify(progressError.message);
      setProfile({ id: p.id, name: p.full_name || auth.user.email?.split("@")[0] || "Staff member", email: auth.user.email || "", role: p.role as Role, department: p.department || "" });
      const state: ProgressState = {};
      for (const row of rows || []) state[row.course_id] = { completedModules: row.completed_modules || [], reflections: (row.reflections || {}) as Record<string, string>, ...(row.completed_at ? { completedAt: row.completed_at } : {}) };
      setProgress(state);
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const completed = courses.filter(c => isCourseComplete(c, progress[c.id])).length;
    const mins = courses.filter(c => isCourseComplete(c, progress[c.id])).reduce((sum, c) => sum + c.duration, 0);
    const started = courses.filter(c => (progress[c.id]?.completedModules.length || 0) > 0 && !isCourseComplete(c, progress[c.id])).length;
    return { completed, hours: (mins / 60).toFixed(1), started };
  }, [progress]);

  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(""), 3000); };

  async function completeModule(course: Course, module: Module, reflection?: string) {
    if (!profile) return;
    const current = progress[course.id] || { completedModules: [], reflections: {} };
    const completedModules = current.completedModules.includes(module.id) ? current.completedModules : [...current.completedModules, module.id];
    const reflections = reflection !== undefined ? { ...current.reflections, [module.id]: reflection } : current.reflections;
    const finished = completedModules.length === course.modules.length;
    const next: ProgressItem = { completedModules, reflections, ...(finished ? { completedAt: current.completedAt || new Date().toISOString() } : current.completedAt ? { completedAt: current.completedAt } : {}) };
    setProgress(prev => ({ ...prev, [course.id]: next }));
    setSyncing(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase!.from("course_progress").upsert({
      user_id: profile.id,
      course_id: course.id,
      completed_modules: next.completedModules,
      reflections: next.reflections,
      completed_at: next.completedAt || null,
    }, { onConflict: "user_id,course_id" });
    setSyncing(false);
    if (error) notify(`Could not save progress: ${error.message}`);
    else notify(finished ? "Course completed and saved to your CPD record." : "Progress saved to your account.");
  }

  async function saveProfile(next: Profile) {
    const supabase = getSupabaseBrowserClient();
    setSyncing(true);
    const { error } = await supabase!.from("staff_profiles").update({ full_name: next.name.trim(), department: next.department.trim() }).eq("id", next.id);
    setSyncing(false);
    if (error) notify(error.message); else { setProfile(next); notify("Profile saved."); }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
    window.location.href = "/auth";
  }

  if (!ready) return <main className="loading">Loading your CPD account…</main>;
  if (!getSupabaseBrowserClient()) return <main className="loginPage"><section className="loginHero"><div className="heroKicker">PROFESSIONAL LEARNING</div><h1>Teaching CPD</h1><p>The app is ready, but the Supabase connection is unavailable.</p></section><section className="loginCard"><h2>Backend connection required</h2><p className="muted">Check the CPD Supabase configuration before continuing.</p></section></main>;
  if (!profile) return <main className="loading">Opening your staff account…</main>;

  const openCourse = (course: Course) => { setSelectedCourse(course); setToast(""); };
  const leader = ["Department Lead", "CPD Lead", "Admin"].includes(profile.role);

  return <div className="appShell">
    <aside className="sidebar">
      <div className="brand"><div className="brandMark">CPD</div><div><strong>Teaching CPD</strong><span>Professional Learning Hub</span></div></div>
      <nav>
        <NavButton icon="⌂" label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
        <NavButton icon="▦" label="Courses" active={view === "courses"} onClick={() => setView("courses")} />
        <NavButton icon="✓" label="My CPD" active={view === "mycpd"} onClick={() => setView("mycpd")} />
        <NavButton icon="◇" label="Certificates" active={view === "certificates"} onClick={() => setView("certificates")} />
        <NavButton icon="○" label="Profile" active={view === "profile"} onClick={() => setView("profile")} />
        {leader && <NavButton icon="◉" label="Live CPD" active={false} onClick={() => { window.location.href = "/live"; }} />}
      </nav>
      <div className="sidebarFoot"><span className="modeBadge">CLOUD SYNC</span><small>{syncing ? "Saving changes…" : "Progress, reflections and profile changes are saved to your staff account."}</small></div>
    </aside>

    <main className="main">
      <header className="topbar"><button className="mobileBrand" onClick={() => setView("dashboard")}>CPD</button><div className="topbarSpacer" /><div className="profileMini"><div className="avatar">{initials(profile.name)}</div><div><strong>{profile.name}</strong><span>{profile.role} · {profile.department || "No department"}</span></div></div></header>
      <div className="content">
        {view === "dashboard" && <Dashboard profile={profile} progress={progress} stats={stats} openCourse={openCourse} setView={setView} leader={leader} />}
        {view === "courses" && <CourseLibrary progress={progress} search={search} setSearch={setSearch} category={category} setCategory={setCategory} openCourse={openCourse} />}
        {view === "mycpd" && <MyCPD progress={progress} openCourse={openCourse} />}
        {view === "certificates" && <Certificates profile={profile} progress={progress} notify={notify} />}
        {view === "profile" && <ProfileView profile={profile} onSave={saveProfile} onSignOut={signOut} />}
      </div>
    </main>

    {selectedCourse && <CourseModal course={selectedCourse} state={progress[selectedCourse.id]} onClose={() => setSelectedCourse(null)} onComplete={completeModule} />}
    <nav className="mobileNav">
      <NavButton icon="⌂" label="Home" active={view === "dashboard"} onClick={() => setView("dashboard")} />
      <NavButton icon="▦" label="Courses" active={view === "courses"} onClick={() => setView("courses")} />
      <NavButton icon="✓" label="My CPD" active={view === "mycpd"} onClick={() => setView("mycpd")} />
      <NavButton icon="○" label="Profile" active={view === "profile"} onClick={() => setView("profile")} />
    </nav>
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function Dashboard({ profile, progress, stats, openCourse, setView, leader }: { profile: Profile; progress: ProgressState; stats: { completed: number; hours: string; started: number }; openCourse: (c: Course) => void; setView: (v: View) => void; leader: boolean }) {
  const continueCourses = courses.filter(c => (progress[c.id]?.completedModules.length || 0) > 0 && !isCourseComplete(c, progress[c.id])).slice(0, 2);
  const recommended = courses.filter(c => !isCourseComplete(c, progress[c.id]) && !(progress[c.id]?.completedModules.length)).slice(0, 4);
  return <>
    <section className="pageTitle"><div><span className="eyebrow">YOUR PROFESSIONAL LEARNING</span><h1>Good to see you, {profile.name.split(" ")[0]}.</h1><p>Your CPD record now follows you across devices.</p></div><div className="phaseActions"><button className="secondary" onClick={() => setView("courses")}>Browse all courses</button>{leader && <button className="primary" onClick={() => { window.location.href = "/live"; }}>Run live CPD</button>}</div></section>
    <section className="statGrid"><Stat value={stats.hours} label="CPD hours" sub="completed" /><Stat value={String(stats.completed)} label="Courses" sub="completed" /><Stat value={String(stats.started)} label="In progress" sub="continue anywhere" /><Stat value={`${stats.completed}/${courses.length}`} label="Library progress" sub="current catalogue" /></section>
    <section className="dashboardGrid"><div className="panel span2"><PanelHeading title="Continue learning" link="My CPD" onClick={() => setView("mycpd")} />{continueCourses.length ? <div className="courseRows">{continueCourses.map(c => <CourseRow key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div> : <EmptyState title="Nothing in progress" text="Start a course and it will appear here automatically." action="Browse courses" onClick={() => setView("courses")} />}</div><div className="panel"><PanelHeading title="Your focus" /><div className="focusCard"><span className="focusIcon">◎</span><strong>Build consistent practice</strong><p>Complete a course, record a reflection and choose one change to test in your classroom.</p><button className="textButton" onClick={() => setView("courses")}>Choose a course →</button></div></div></section>
    <section className="sectionBlock"><PanelHeading title="Recommended next" link="View library" onClick={() => setView("courses")} /><div className="cardGrid">{recommended.map(c => <CourseCard key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div></section>
  </>;
}

function CourseLibrary({ progress, search, setSearch, category, setCategory, openCourse }: { progress: ProgressState; search: string; setSearch: (s: string) => void; category: string; setCategory: (s: string) => void; openCourse: (c: Course) => void }) {
  const filtered = courses.filter(c => (category === "All" || c.category === category) && `${c.title} ${c.summary} ${c.category}`.toLowerCase().includes(search.toLowerCase()));
  return <><section className="pageTitle"><div><span className="eyebrow">COURSE LIBRARY</span><h1>Professional learning, built for practice.</h1><p>Interactive courses with knowledge checks, scenarios and reflection.</p></div></section><div className="filters"><input className="search" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} /><div className="chips"><button className={category === "All" ? "chip active" : "chip"} onClick={() => setCategory("All")}>All</button>{categoryOrder.map(cat => <button key={cat} className={category === cat ? "chip active" : "chip"} onClick={() => setCategory(cat)}>{cat}</button>)}</div></div><div className="libraryMeta"><strong>{filtered.length} courses</strong><span>Cloud-saved progress</span></div><div className="cardGrid">{filtered.map(c => <CourseCard key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div></>;
}

function MyCPD({ progress, openCourse }: { progress: ProgressState; openCourse: (c: Course) => void }) {
  const active = courses.filter(c => (progress[c.id]?.completedModules.length || 0) > 0 && !isCourseComplete(c, progress[c.id]));
  const complete = courses.filter(c => isCourseComplete(c, progress[c.id]));
  return <><section className="pageTitle"><div><span className="eyebrow">MY CPD</span><h1>Your learning record.</h1><p>Pick up on any device and review completed professional learning.</p></div></section><section className="sectionBlock"><PanelHeading title={`In progress (${active.length})`} />{active.length ? <div className="courseRows">{active.map(c => <CourseRow key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div> : <EmptyState title="No courses in progress" text="Your active learning will appear here." />}</section><section className="sectionBlock"><PanelHeading title={`Completed (${complete.length})`} />{complete.length ? <div className="courseRows">{complete.map(c => <CourseRow key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div> : <EmptyState title="No completed courses yet" text="Complete every module in a course to add it to your CPD record." />}</section></>;
}

function Certificates({ profile, progress, notify }: { profile: Profile; progress: ProgressState; notify: (s: string) => void }) {
  const complete = courses.filter(c => isCourseComplete(c, progress[c.id]));
  return <><section className="pageTitle"><div><span className="eyebrow">CERTIFICATES</span><h1>Your CPD certificates.</h1><p>Certificates are generated from your cloud-saved completion record.</p></div></section>{complete.length ? <div className="certificateGrid">{complete.map(c => <div className="certificate" key={c.id}><div className="certSeal">✓</div><span className="eyebrow">CERTIFICATE OF CPD</span><h3>{c.title}</h3><p>Awarded to <strong>{profile.name}</strong></p><div className="certMeta"><span>{c.duration} minutes</span><span>{new Date(progress[c.id].completedAt!).toLocaleDateString("en-GB")}</span></div><button className="secondary full" onClick={() => { notify("Print dialog opened — choose Save as PDF for a digital copy."); setTimeout(() => window.print(), 150); }}>Print / Save PDF</button></div>)}</div> : <EmptyState title="No certificates yet" text="Finish a course to generate your first CPD certificate." />}</>;
}

function ProfileView({ profile, onSave, onSignOut }: { profile: Profile; onSave: (p: Profile) => Promise<void>; onSignOut: () => void }) {
  const [draft, setDraft] = useState(profile);
  useEffect(() => setDraft(profile), [profile]);
  return <><section className="pageTitle"><div><span className="eyebrow">PROFILE</span><h1>Your professional profile.</h1><p>Your role is controlled by the school; you can update your name and department.</p></div></section><div className="panel profilePanel"><div className="profileHero"><div className="avatar big">{initials(draft.name)}</div><div><h2>{draft.name}</h2><p>{draft.role} · {draft.department || "No department"}</p></div></div><div className="formGrid"><label>Name<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label><label>Email<input value={draft.email} readOnly /></label><label>Role<input value={draft.role} readOnly /></label><label>Department<input value={draft.department} onChange={e => setDraft({ ...draft, department: e.target.value })} /></label></div><div className="profileActions"><button className="primary" onClick={() => onSave(draft)}>Save profile</button><button className="danger" onClick={onSignOut}>Sign out</button></div></div></>;
}

function CourseModal({ course, state, onClose, onComplete }: { course: Course; state?: ProgressItem; onClose: () => void; onComplete: (c: Course, m: Module, reflection?: string) => Promise<void> }) {
  const completed = state?.completedModules || [];
  const firstIncomplete = course.modules.findIndex(m => !completed.includes(m.id));
  const [index, setIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);
  const module = course.modules[index];
  const [answer, setAnswer] = useState<number | null>(null);
  const [reflection, setReflection] = useState(state?.reflections[module.id] || "");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const moduleComplete = completed.includes(module.id);
  useEffect(() => { setAnswer(null); setFeedback(""); setReflection(state?.reflections[course.modules[index].id] || ""); }, [index, course.modules, state?.reflections]);
  async function mark() { if (module.type === "reflection" && reflection.trim().length < 10) { setFeedback("Add a little more detail so this reflection is useful when you return to it."); return; } setBusy(true); await onComplete(course, module, module.type === "reflection" ? reflection.trim() : undefined); setBusy(false); setFeedback(module.type === "reflection" ? "Reflection saved to your account." : "Module complete and saved."); }
  const percent = Math.round((completed.length / course.modules.length) * 100);
  return <div className="modalBackdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="courseModal"><header className="courseModalHead"><div><span className="eyebrow">{course.category} · {course.duration} MIN</span><h2>{course.title}</h2></div><button className="iconButton" onClick={onClose}>×</button></header><div className="courseProgress"><div><span>{completed.length} of {course.modules.length} modules complete</span><strong>{percent}%</strong></div><Progress value={percent} /></div><div className="moduleLayout"><aside className="moduleNav">{course.modules.map((m, i) => <button key={m.id} className={`${i === index ? "current" : ""} ${completed.includes(m.id) ? "done" : ""}`} onClick={() => setIndex(i)}><span>{completed.includes(m.id) ? "✓" : i + 1}</span><div><strong>{m.title}</strong><small>{m.type}</small></div></button>)}</aside><article className="moduleContent"><span className="moduleType">{module.type.toUpperCase()}</span><h2>{module.title}</h2>{module.type === "content" && <><p className="lead">{module.body}</p>{module.keyPoints && <div className="keyPoints"><strong>Key points</strong>{module.keyPoints.map(k => <div key={k}>✓ {k}</div>)}</div>}</>}{module.type === "quiz" && <><p className="lead">{module.question}</p><div className="optionList">{module.options.map((opt, i) => <button key={opt} className={answer === i ? "option selected" : "option"} onClick={() => { setAnswer(i); setFeedback(i === module.answer ? `Correct. ${module.feedback}` : "Not quite. Review the options and try again."); }}>{opt}</button>)}</div></>}{module.type === "scenario" && <><div className="scenarioBox">{module.prompt}</div><div className="optionList">{module.options.map((opt, i) => <button key={opt.label} className={answer === i ? "option selected" : "option"} onClick={() => { setAnswer(i); setFeedback(opt.feedback); }}>{opt.label}</button>)}</div></>}{module.type === "reflection" && <><p className="lead">{module.prompt}</p><textarea className="reflectionBox" rows={7} placeholder="Write a useful professional reflection…" value={reflection} onChange={e => setReflection(e.target.value)} /><small className="muted">Your reflection is saved privately to your staff CPD account.</small></>}{feedback && <div className="feedback">{feedback}</div>}<div className="moduleActions"><button className="secondary" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>Back</button><div className="actionSpacer" />{!moduleComplete && <button className="primary" onClick={mark} disabled={busy || ((module.type === "quiz" || module.type === "scenario") && answer === null)}>{busy ? "Saving…" : module.type === "reflection" ? "Save reflection" : "Mark complete"}</button>}{moduleComplete && index < course.modules.length - 1 && <button className="primary" onClick={() => setIndex(index + 1)}>Next module</button>}{moduleComplete && index === course.modules.length - 1 && <button className="primary" onClick={onClose}>Finish course</button>}</div></article></div></section></div>;
}

function CourseCard({ course, state, onClick }: { course: Course; state?: ProgressItem; onClick: () => void }) { const count = state?.completedModules.length || 0; const pct = Math.round(count / course.modules.length * 100); const complete = count === course.modules.length; return <button className="courseCard" onClick={onClick}><div className="courseCardTop"><span className={`categoryDot cat-${course.category.replace(/[^a-z]/gi, "").toLowerCase()}`} /><span>{course.category}</span><span className="courseLevel">{course.level}</span></div><h3>{course.title}</h3><p>{course.summary}</p><div className="courseCardFoot"><span>{course.duration} min</span><span>{course.modules.length} modules</span></div>{count > 0 && <div className="miniProgress"><Progress value={pct} /><span>{complete ? "Completed" : `${pct}%`}</span></div>}</button>; }
function CourseRow({ course, state, onClick }: { course: Course; state?: ProgressItem; onClick: () => void }) { const count = state?.completedModules.length || 0; const pct = Math.round(count / course.modules.length * 100); return <button className="courseRow" onClick={onClick}><div className="rowIcon">{pct === 100 ? "✓" : "▶"}</div><div className="rowMain"><div><strong>{course.title}</strong><span>{course.category} · {course.duration} min</span></div><div className="rowProgress"><Progress value={pct} /><span>{pct}%</span></div></div></button>; }
function Progress({ value }: { value: number }) { return <div className="progress"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
function Stat({ value, label, sub }: { value: string; label: string; sub: string }) { return <div className="stat"><strong>{value}</strong><div><span>{label}</span><small>{sub}</small></div></div>; }
function PanelHeading({ title, link, onClick }: { title: string; link?: string; onClick?: () => void }) { return <div className="panelHeading"><h2>{title}</h2>{link && <button className="textButton" onClick={onClick}>{link} →</button>}</div>; }
function EmptyState({ title, text, action, onClick }: { title: string; text: string; action?: string; onClick?: () => void }) { return <div className="emptyState"><div>＋</div><strong>{title}</strong><p>{text}</p>{action && <button className="secondary" onClick={onClick}>{action}</button>}</div>; }
function NavButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) { return <button className={active ? "navButton active" : "navButton"} onClick={onClick}><span>{icon}</span>{label}</button>; }
function isCourseComplete(course: Course, state?: ProgressItem) { return (state?.completedModules.length || 0) === course.modules.length; }
