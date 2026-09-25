"use client";

import { useEffect, useMemo, useState } from "react";
import { categoryOrder, courses, type Course, type Module, type Role } from "@/lib/data";

type Profile = { name: string; email: string; role: Role; department: string };
type ProgressState = Record<string, { completedModules: string[]; reflections: Record<string, string>; completedAt?: string }>;
type View = "dashboard" | "courses" | "mycpd" | "certificates" | "profile";

const demoProfile: Profile = { name: "Alex Morgan", email: "alex.morgan@school.org", role: "Staff", department: "Science" };
const roleOptions: Role[] = ["Staff", "Department Lead", "CPD Lead", "Admin"];

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

function initials(name: string) { return name.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase(); }

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile>(demoProfile);
  const [progress, setProgress] = useState<ProgressState>({});
  const [view, setView] = useState<View>("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setProfile(loadJson("cpd-profile", demoProfile));
    setProgress(loadJson("cpd-progress", {}));
    setSignedIn(loadJson("cpd-signed-in", false));
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem("cpd-profile", JSON.stringify(profile)); }, [profile, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("cpd-progress", JSON.stringify(progress)); }, [progress, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("cpd-signed-in", JSON.stringify(signedIn)); }, [signedIn, hydrated]);

  const stats = useMemo(() => {
    const completed = courses.filter(c => isCourseComplete(c, progress[c.id])).length;
    const mins = courses.filter(c => isCourseComplete(c, progress[c.id])).reduce((sum, c) => sum + c.duration, 0);
    const started = courses.filter(c => (progress[c.id]?.completedModules.length || 0) > 0 && !isCourseComplete(c, progress[c.id])).length;
    return { completed, hours: (mins / 60).toFixed(1), started };
  }, [progress]);

  if (!hydrated) return <main className="loading">Loading CPD Hub…</main>;
  if (!signedIn) return <Login profile={profile} setProfile={setProfile} onSignIn={() => setSignedIn(true)} />;

  const completeModule = (course: Course, module: Module, reflection?: string) => {
    setProgress(prev => {
      const current = prev[course.id] || { completedModules: [], reflections: {} };
      const completedModules = current.completedModules.includes(module.id) ? current.completedModules : [...current.completedModules, module.id];
      const reflections = reflection !== undefined ? { ...current.reflections, [module.id]: reflection } : current.reflections;
      const finished = completedModules.length === course.modules.length;
      return { ...prev, [course.id]: { completedModules, reflections, ...(finished && !current.completedAt ? { completedAt: new Date().toISOString() } : current.completedAt ? { completedAt: current.completedAt } : {}) } };
    });
  };

  const openCourse = (course: Course) => { setSelectedCourse(course); setToast(""); };
  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(""), 2600); };

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">CPD</div><div><strong>Teaching CPD</strong><span>Professional Learning Hub</span></div></div>
        <nav>
          <NavButton icon="⌂" label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
          <NavButton icon="▦" label="Courses" active={view === "courses"} onClick={() => setView("courses")} />
          <NavButton icon="✓" label="My CPD" active={view === "mycpd"} onClick={() => setView("mycpd")} />
          <NavButton icon="◇" label="Certificates" active={view === "certificates"} onClick={() => setView("certificates")} />
          <NavButton icon="○" label="Profile" active={view === "profile"} onClick={() => setView("profile")} />
        </nav>
        <div className="sidebarFoot"><span className="modeBadge">DEMO MODE</span><small>Progress saves on this device. Production accounts will connect to the school database.</small></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobileBrand" onClick={() => setView("dashboard")}>CPD</button>
          <div className="topbarSpacer" />
          <div className="profileMini"><div className="avatar">{initials(profile.name)}</div><div><strong>{profile.name}</strong><span>{profile.role} · {profile.department}</span></div></div>
        </header>

        <div className="content">
          {view === "dashboard" && <Dashboard profile={profile} progress={progress} stats={stats} openCourse={openCourse} setView={setView} />}
          {view === "courses" && <CourseLibrary progress={progress} search={search} setSearch={setSearch} category={category} setCategory={setCategory} openCourse={openCourse} />}
          {view === "mycpd" && <MyCPD progress={progress} openCourse={openCourse} />}
          {view === "certificates" && <Certificates profile={profile} progress={progress} notify={notify} />}
          {view === "profile" && <ProfileView profile={profile} setProfile={setProfile} onSignOut={() => setSignedIn(false)} />}
        </div>
      </main>

      {selectedCourse && <CourseModal course={selectedCourse} state={progress[selectedCourse.id]} onClose={() => setSelectedCourse(null)} onComplete={completeModule} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Login({ profile, setProfile, onSignIn }: { profile: Profile; setProfile: (p: Profile) => void; onSignIn: () => void }) {
  return <main className="loginPage">
    <section className="loginHero"><div className="heroKicker">PROFESSIONAL LEARNING</div><h1>Teaching CPD that leads to action.</h1><p>Learn, reflect, apply and keep a clear professional development record — all in one place.</p><div className="heroFeatures"><span>Interactive learning</span><span>Saved progress</span><span>CPD certificates</span></div></section>
    <section className="loginCard"><div className="brand loginBrand"><div className="brandMark">CPD</div><div><strong>Teaching CPD</strong><span>Professional Learning Hub</span></div></div><h2>Welcome</h2><p className="muted">Phase 1 demo sign-in. Your progress is stored securely in this browser only until the production database is connected.</p>
      <label>Name<input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></label>
      <label>Email<input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></label>
      <label>Role<select value={profile.role} onChange={e => setProfile({ ...profile, role: e.target.value as Role })}>{roleOptions.map(r => <option key={r}>{r}</option>)}</select></label>
      <label>Department<input value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} /></label>
      <button className="primary full" onClick={onSignIn} disabled={!profile.name.trim() || !profile.email.trim()}>Enter CPD Hub</button>
    </section>
  </main>;
}

function Dashboard({ profile, progress, stats, openCourse, setView }: { profile: Profile; progress: ProgressState; stats: { completed: number; hours: string; started: number }; openCourse: (c: Course) => void; setView: (v: View) => void }) {
  const continueCourses = courses.filter(c => (progress[c.id]?.completedModules.length || 0) > 0 && !isCourseComplete(c, progress[c.id])).slice(0, 2);
  const recommended = courses.filter(c => !isCourseComplete(c, progress[c.id]) && !(progress[c.id]?.completedModules.length)).slice(0, 4);
  return <>
    <section className="pageTitle"><div><span className="eyebrow">YOUR PROFESSIONAL LEARNING</span><h1>Good to see you, {profile.name.split(" ")[0]}.</h1><p>Continue your learning and turn CPD into practical classroom action.</p></div><button className="secondary" onClick={() => setView("courses")}>Browse all courses</button></section>
    <section className="statGrid"><Stat value={stats.hours} label="CPD hours" sub="completed" /><Stat value={String(stats.completed)} label="Courses" sub="completed" /><Stat value={String(stats.started)} label="In progress" sub="continue anytime" /><Stat value={`${stats.completed}/${courses.length}`} label="Library progress" sub="current catalogue" /></section>
    <section className="dashboardGrid">
      <div className="panel span2"><PanelHeading title="Continue learning" link="My CPD" onClick={() => setView("mycpd")} />{continueCourses.length ? <div className="courseRows">{continueCourses.map(c => <CourseRow key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div> : <EmptyState title="Nothing in progress" text="Start a course and it will appear here automatically." action="Browse courses" onClick={() => setView("courses")} />}</div>
      <div className="panel"><PanelHeading title="Your focus" /><div className="focusCard"><span className="focusIcon">◎</span><strong>Build consistent practice</strong><p>Complete a course, record a reflection and choose one change to test in your classroom.</p><button className="textButton" onClick={() => setView("courses")}>Choose a course →</button></div></div>
    </section>
    <section className="sectionBlock"><PanelHeading title="Recommended next" link="View library" onClick={() => setView("courses")} /><div className="cardGrid">{recommended.map(c => <CourseCard key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div></section>
  </>;
}

function CourseLibrary({ progress, search, setSearch, category, setCategory, openCourse }: { progress: ProgressState; search: string; setSearch: (s: string) => void; category: string; setCategory: (s: string) => void; openCourse: (c: Course) => void }) {
  const filtered = courses.filter(c => (category === "All" || c.category === category) && `${c.title} ${c.summary} ${c.category}`.toLowerCase().includes(search.toLowerCase()));
  return <><section className="pageTitle"><div><span className="eyebrow">COURSE LIBRARY</span><h1>Professional learning, built for practice.</h1><p>Short, focused courses with knowledge checks, scenarios and reflection.</p></div></section>
    <div className="filters"><input className="search" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} /><div className="chips"><button className={category === "All" ? "chip active" : "chip"} onClick={() => setCategory("All")}>All</button>{categoryOrder.map(cat => <button key={cat} className={category === cat ? "chip active" : "chip"} onClick={() => setCategory(cat)}>{cat}</button>)}</div></div>
    <div className="libraryMeta"><strong>{filtered.length} courses</strong><span>Progress saves automatically</span></div>
    <div className="cardGrid">{filtered.map(c => <CourseCard key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div>
  </>;
}

function MyCPD({ progress, openCourse }: { progress: ProgressState; openCourse: (c: Course) => void }) {
  const active = courses.filter(c => (progress[c.id]?.completedModules.length || 0) > 0 && !isCourseComplete(c, progress[c.id]));
  const complete = courses.filter(c => isCourseComplete(c, progress[c.id]));
  return <><section className="pageTitle"><div><span className="eyebrow">MY CPD</span><h1>Your learning record.</h1><p>Pick up where you left off and review completed professional learning.</p></div></section>
    <section className="sectionBlock"><PanelHeading title={`In progress (${active.length})`} />{active.length ? <div className="courseRows">{active.map(c => <CourseRow key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div> : <EmptyState title="No courses in progress" text="Your active learning will appear here." />}</section>
    <section className="sectionBlock"><PanelHeading title={`Completed (${complete.length})`} />{complete.length ? <div className="courseRows">{complete.map(c => <CourseRow key={c.id} course={c} state={progress[c.id]} onClick={() => openCourse(c)} />)}</div> : <EmptyState title="No completed courses yet" text="Complete every module in a course to add it to your CPD record." />}</section>
  </>;
}

function Certificates({ profile, progress, notify }: { profile: Profile; progress: ProgressState; notify: (s: string) => void }) {
  const complete = courses.filter(c => isCourseComplete(c, progress[c.id]));
  return <><section className="pageTitle"><div><span className="eyebrow">CERTIFICATES</span><h1>Your CPD certificates.</h1><p>Completed courses automatically generate a professional learning record.</p></div></section>
    {complete.length ? <div className="certificateGrid">{complete.map(c => <div className="certificate" key={c.id}><div className="certSeal">✓</div><span className="eyebrow">CERTIFICATE OF CPD</span><h3>{c.title}</h3><p>Awarded to <strong>{profile.name}</strong></p><div className="certMeta"><span>{c.duration} minutes</span><span>{new Date(progress[c.id].completedAt!).toLocaleDateString("en-GB")}</span></div><button className="secondary full" onClick={() => { notify("Print dialog opened — choose Save as PDF for a digital copy."); setTimeout(() => window.print(), 150); }}>Print / Save PDF</button></div>)}</div> : <EmptyState title="No certificates yet" text="Finish a course to generate your first CPD certificate." />}
  </>;
}

function ProfileView({ profile, setProfile, onSignOut }: { profile: Profile; setProfile: (p: Profile) => void; onSignOut: () => void }) {
  return <><section className="pageTitle"><div><span className="eyebrow">PROFILE</span><h1>Your professional profile.</h1><p>This information personalises your CPD experience.</p></div></section><div className="panel profilePanel"><div className="profileHero"><div className="avatar big">{initials(profile.name)}</div><div><h2>{profile.name}</h2><p>{profile.role} · {profile.department}</p></div></div><div className="formGrid"><label>Name<input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></label><label>Email<input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></label><label>Role<select value={profile.role} onChange={e => setProfile({ ...profile, role: e.target.value as Role })}>{roleOptions.map(r => <option key={r}>{r}</option>)}</select></label><label>Department<input value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} /></label></div><div className="profileActions"><span className="muted">Changes save automatically on this device.</span><button className="danger" onClick={onSignOut}>Sign out</button></div></div></>;
}

function CourseModal({ course, state, onClose, onComplete }: { course: Course; state?: ProgressState[string]; onClose: () => void; onComplete: (c: Course, m: Module, reflection?: string) => void }) {
  const completed = state?.completedModules || [];
  const firstIncomplete = course.modules.findIndex(m => !completed.includes(m.id));
  const [index, setIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);
  const module = course.modules[index];
  const [answer, setAnswer] = useState<number | null>(null);
  const [reflection, setReflection] = useState(state?.reflections[module.id] || "");
  const [feedback, setFeedback] = useState("");
  const moduleComplete = completed.includes(module.id);

  useEffect(() => { setAnswer(null); setFeedback(""); setReflection(state?.reflections[course.modules[index].id] || ""); }, [index, course.modules, state?.reflections]);

  const mark = () => {
    if (module.type === "reflection") { if (reflection.trim().length < 10) { setFeedback("Add a little more detail so this reflection is useful when you return to it."); return; } onComplete(course, module, reflection.trim()); setFeedback("Reflection saved."); }
    else { onComplete(course, module); setFeedback("Module complete."); }
  };

  const next = () => { if (index < course.modules.length - 1) setIndex(index + 1); };
  const percent = Math.round((completed.length / course.modules.length) * 100);

  return <div className="modalBackdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="courseModal"><header className="courseModalHead"><div><span className="eyebrow">{course.category} · {course.duration} MIN</span><h2>{course.title}</h2></div><button className="iconButton" onClick={onClose}>×</button></header><div className="courseProgress"><div><span>{completed.length} of {course.modules.length} modules complete</span><strong>{percent}%</strong></div><Progress value={percent} /></div>
    <div className="moduleLayout"><aside className="moduleNav">{course.modules.map((m, i) => <button key={m.id} className={`${i === index ? "current" : ""} ${completed.includes(m.id) ? "done" : ""}`} onClick={() => setIndex(i)}><span>{completed.includes(m.id) ? "✓" : i + 1}</span><div><strong>{m.title}</strong><small>{m.type}</small></div></button>)}</aside>
      <article className="moduleContent"><span className="moduleType">{module.type.toUpperCase()}</span><h2>{module.title}</h2>
        {module.type === "content" && <><p className="lead">{module.body}</p>{module.keyPoints && <div className="keyPoints"><strong>Key points</strong>{module.keyPoints.map(k => <div key={k}>✓ {k}</div>)}</div>}</>}
        {module.type === "quiz" && <><p className="lead">{module.question}</p><div className="optionList">{module.options.map((opt, i) => <button key={opt} className={answer === i ? "option selected" : "option"} onClick={() => { setAnswer(i); setFeedback(i === module.answer ? `Correct. ${module.feedback}` : "Not quite. Review the options and try again."); }}>{opt}</button>)}</div></>}
        {module.type === "scenario" && <><div className="scenarioBox">{module.prompt}</div><div className="optionList">{module.options.map((opt, i) => <button key={opt.label} className={answer === i ? "option selected" : "option"} onClick={() => { setAnswer(i); setFeedback(opt.feedback); }}>{opt.label}</button>)}</div></>}
        {module.type === "reflection" && <><p className="lead">{module.prompt}</p><textarea className="reflectionBox" rows={7} placeholder="Write a useful professional reflection…" value={reflection} onChange={e => setReflection(e.target.value)} /><small className="muted">Your reflection is private to this demo profile and saves when you complete the module.</small></>}
        {feedback && <div className="feedback">{feedback}</div>}
        <div className="moduleActions"><button className="secondary" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>Back</button><div className="actionSpacer" />{!moduleComplete && <button className="primary" onClick={mark} disabled={(module.type === "quiz" || module.type === "scenario") && answer === null}>{module.type === "reflection" ? "Save reflection" : "Mark complete"}</button>}{moduleComplete && index < course.modules.length - 1 && <button className="primary" onClick={next}>Next module</button>}{moduleComplete && index === course.modules.length - 1 && <button className="primary" onClick={onClose}>Finish course</button>}</div>
      </article></div></section></div>;
}

function CourseCard({ course, state, onClick }: { course: Course; state?: ProgressState[string]; onClick: () => void }) {
  const count = state?.completedModules.length || 0; const pct = Math.round(count / course.modules.length * 100); const complete = count === course.modules.length;
  return <button className="courseCard" onClick={onClick}><div className="courseCardTop"><span className={`categoryDot cat-${course.category.replace(/[^a-z]/gi, "").toLowerCase()}`} /><span>{course.category}</span><span className="courseLevel">{course.level}</span></div><h3>{course.title}</h3><p>{course.summary}</p><div className="courseCardFoot"><span>{course.duration} min</span><span>{course.modules.length} modules</span></div>{count > 0 && <div className="miniProgress"><Progress value={pct} /><span>{complete ? "Completed" : `${pct}%`}</span></div>}</button>;
}

function CourseRow({ course, state, onClick }: { course: Course; state?: ProgressState[string]; onClick: () => void }) {
  const count = state?.completedModules.length || 0; const pct = Math.round(count / course.modules.length * 100); return <button className="courseRow" onClick={onClick}><div className="rowIcon">{pct === 100 ? "✓" : "▶"}</div><div className="rowMain"><div><strong>{course.title}</strong><span>{course.category} · {course.duration} min</span></div><div className="rowProgress"><Progress value={pct} /><span>{pct}%</span></div></div></button>;
}

function Progress({ value }: { value: number }) { return <div className="progress"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
function Stat({ value, label, sub }: { value: string; label: string; sub: string }) { return <div className="stat"><strong>{value}</strong><div><span>{label}</span><small>{sub}</small></div></div>; }
function PanelHeading({ title, link, onClick }: { title: string; link?: string; onClick?: () => void }) { return <div className="panelHeading"><h2>{title}</h2>{link && <button className="textButton" onClick={onClick}>{link} →</button>}</div>; }
function EmptyState({ title, text, action, onClick }: { title: string; text: string; action?: string; onClick?: () => void }) { return <div className="emptyState"><div>＋</div><strong>{title}</strong><p>{text}</p>{action && <button className="secondary" onClick={onClick}>{action}</button>}</div>; }
function NavButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) { return <button className={active ? "navButton active" : "navButton"} onClick={onClick}><span>{icon}</span>{label}</button>; }
function isCourseComplete(course: Course, state?: ProgressState[string]) { return (state?.completedModules.length || 0) === course.modules.length; }
