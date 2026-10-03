"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./WholeSiteDemo.css";

type Role = "teacher" | "hod" | "send" | "slt" | "admin";
type Area = "home" | "courses" | "teaching" | "tracking" | "timetable" | "school" | "reports" | "tools";
type TimetableView = "teacher" | "maker";

type Course = {
  id: string;
  title: string;
  category: string;
  duration: string;
  progress: number;
  summary: string;
  lesson: string;
  activity: string;
  takeaway: string;
};

const roles: Record<Role, { label: string; subtitle: string }> = {
  teacher: { label: "Teacher", subtitle: "Teaching, CPD, planning and pupil support" },
  hod: { label: "Head of Department", subtitle: "Department planning, staff development and oversight" },
  send: { label: "SEND / EAL", subtitle: "Inclusion, interventions and pupil support" },
  slt: { label: "SLT", subtitle: "Whole-school priorities, reporting and operations" },
  admin: { label: "School Admin", subtitle: "Accounts, setup, timetable and school systems" },
};

const areas: { id: Area; label: string; hint: string }[] = [
  { id: "home", label: "Home", hint: "Start the product tour" },
  { id: "courses", label: "CPD courses", hint: "Try a sample course" },
  { id: "teaching", label: "Teaching", hint: "Planner and classroom tools" },
  { id: "tracking", label: "Tracking", hint: "Pupil, intervention and CPD progress" },
  { id: "timetable", label: "Timetable", hint: "Teacher planner + Time Maker" },
  { id: "school", label: "School tools", hint: "Notices, calendar, forms and policies" },
  { id: "reports", label: "Reports", hint: "Leadership and department intelligence" },
  { id: "tools", label: "Setup & tools", hint: "Everything included and how to start" },
];

const courses: Course[] = [
  {
    id: "adaptive",
    title: "Adaptive Teaching",
    category: "Teaching & learning",
    duration: "55 min",
    progress: 72,
    summary: "Practical adaptations that maintain ambition while reducing unnecessary barriers.",
    lesson: "Chunk instructions, model success and adapt the support rather than lowering the goal.",
    activity: "Choose which classroom adaptation best preserves the learning objective for a pupil who is struggling to organise a long written response.",
    takeaway: "Use a writing frame first, then fade the scaffold as independence improves.",
  },
  {
    id: "questioning",
    title: "Questioning for Deeper Thinking",
    category: "Classroom practice",
    duration: "45 min",
    progress: 38,
    summary: "Plan questioning sequences that expose misconceptions and increase participation.",
    lesson: "Move from retrieval to explanation to challenge, and build in thinking time before taking answers.",
    activity: "Reorder four questions so they move from recall to application to evaluation.",
    takeaway: "Plan one hinge question before the lesson and decide what each possible answer tells you.",
  },
  {
    id: "safeguarding",
    title: "Safeguarding Refresher",
    category: "Required training",
    duration: "20 min",
    progress: 40,
    summary: "Short refresher covering reporting routes, professional curiosity and school procedure reminders.",
    lesson: "Follow your school safeguarding policy and designated safeguarding routes; the platform supports training records rather than replacing local procedure.",
    activity: "Review a short professional scenario and identify the correct school reporting route.",
    takeaway: "Know the current DSL route and where the latest school policy is stored.",
  },
  {
    id: "eal",
    title: "Supporting Academic Language",
    category: "SEND & EAL",
    duration: "50 min",
    progress: 15,
    summary: "Build subject vocabulary, talk structures and writing support for multilingual learners.",
    lesson: "Pre-teach the small number of words pupils need to access the next task, then rehearse them in context.",
    activity: "Turn a dense exam question into a vocabulary preview, sentence stem and model response sequence.",
    takeaway: "Teach vocabulary through examples and retrieval rather than giving a long glossary.",
  },
];

const pupils = [
  { name: "Amelia R.", year: "Year 8", need: "Literacy support", baseline: 42, latest: 67, review: "16 Oct", intervention: "Reading fluency · Week 5 of 8", support: "Chunked instructions, vocabulary preview and retrieval starter." },
  { name: "Hana K.", year: "Year 10", need: "EAL", baseline: 48, latest: 71, review: "9 Oct", intervention: "Academic language · Review due", support: "Sentence stems, model answers and pre-teaching of tier 3 vocabulary." },
  { name: "Daniel M.", year: "Year 7", need: "Regulation", baseline: 35, latest: 62, review: "20 Oct", intervention: "Regulation support · Week 3 of 6", support: "Predictable routines, movement break card and calm re-entry script." },
];

const timetableSizes = [
  { label: "Small", staff: 18, pupils: "300–500", departments: 7 },
  { label: "Medium", staff: 40, pupils: "600–900", departments: 9 },
  { label: "Large", staff: 75, pupils: "1,000–1,500", departments: 11 },
  { label: "Very large", staff: 120, pupils: "1,500+", departments: 14 },
];

const lessons = [
  ["08:55", "Year 10 Physics", "Energy transfers", "Lab 1"],
  ["09:55", "Year 8 Science", "Cells", "S2"],
  ["11:10", "Free period", "Planning / feedback", ""],
  ["12:10", "Year 12 Physics", "Electric fields", "Lab 1"],
  ["14:05", "Year 9 Science", "Forces", "S3"],
];

function Progress({ value }: { value: number }) {
  return <div className="wsdProgress" aria-label={`${value}%`}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="wsdStat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

export default function WholeSiteDemo() {
  const [role, setRole] = useState<Role>("teacher");
  const [area, setArea] = useState<Area>("home");
  const [courseId, setCourseId] = useState("adaptive");
  const [courseStep, setCourseStep] = useState(0);
  const [quizChoice, setQuizChoice] = useState("");
  const [pupil, setPupil] = useState(0);
  const [timetableSize, setTimetableSize] = useState(1);
  const [timetableView, setTimetableView] = useState<TimetableView>("teacher");
  const [noticeRead, setNoticeRead] = useState(false);
  const [taskDone, setTaskDone] = useState(false);

  const currentRole = roles[role];
  const currentCourse = courses.find(item => item.id === courseId) || courses[0];
  const currentPupil = pupils[pupil];
  const selectedSize = timetableSizes[timetableSize];

  const homeStats = useMemo(() => {
    if (role === "teacher") return [["Today", "5 lessons", "2 free periods"], ["My CPD", "68%", "2 active courses"], ["Pupil actions", "3", "1 review due"], ["Planning", "4 lessons", "Ready for this week"]];
    if (role === "hod") return [["Department", "11 staff", "Science"], ["CPD completion", "82%", "Across department"], ["Curriculum", "94%", "Mapped for autumn"], ["Workload", "2 flags", "Review this week"]];
    if (role === "send") return [["Open plans", "18", "6 reviews this month"], ["Interventions", "12", "8 improving"], ["EAL reviews", "5", "2 due"], ["Check-ins", "7", "Today"]];
    if (role === "slt") return [["Staff active", "64", "This week"], ["Mandatory CPD", "91%", "Whole school"], ["SIP actions", "14", "3 need attention"], ["Timetable", "97%", "Scheduled"]];
    return [["Accounts", "78", "74 active"], ["Onboarding", "86%", "Launch readiness"], ["Integrations", "3", "Connected"], ["Timetable staff", "75", "Large demo available"]];
  }, [role]);

  function openArea(next: Area) {
    setArea(next);
    if (next === "courses") setCourseStep(0);
  }

  return <main className="wsdShell">
    <header className="wsdTopbar">
      <div className="wsdBrand"><span>TCPD</span><div><strong>Teaching CPD</strong><small>Interactive whole-school demo</small></div></div>
      <div className="wsdDemoFlag">FICTIONAL DATA · NOTHING SAVED TO A REAL SCHOOL</div>
      <div className="wsdTopActions"><Link href="/demo/setup">Setup & tools</Link><Link href="/auth">Sign in</Link><Link className="primary" href="/procurement">Purchase information</Link></div>
    </header>

    <section className="wsdHero">
      <div>
        <span className="eyebrow">TRY THE PLATFORM BEFORE YOU BUY</span>
        <h1>See how a school would actually use Teaching CPD</h1>
        <p>Open a sample CPD course, plan a lesson, inspect pupil and intervention tracking, switch between a teacher timetable and the whole-school Time Maker, then see the reporting and school tools that sit around them.</p>
        <div className="wsdHeroTour">
          <button onClick={() => openArea("courses")}>1. Try a CPD course</button>
          <button onClick={() => openArea("teaching")}>2. Open teacher tools</button>
          <button onClick={() => openArea("tracking")}>3. Inspect tracking</button>
          <button onClick={() => openArea("timetable")}>4. Try timetabling</button>
          <button onClick={() => openArea("reports")}>5. View leadership data</button>
        </div>
      </div>
      <div className="wsdRolePicker">
        <span>View the demo as</span>
        <select value={role} onChange={event => setRole(event.target.value as Role)}>{Object.entries(roles).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select>
        <strong>{currentRole.label}</strong><small>{currentRole.subtitle}</small>
      </div>
    </section>

    <div className="wsdLayout">
      <aside className="wsdNav">
        <div className="wsdSchool"><span>OA</span><div><strong>Oakfield Academy</strong><small>Demo School · 2026/27</small></div></div>
        <nav>{areas.map(item => <button key={item.id} onClick={() => openArea(item.id)} className={area === item.id ? "active" : ""}><strong>{item.label}</strong><small>{item.hint}</small></button>)}</nav>
        <div className="wsdNavFoot"><span>Demo role</span><strong>{currentRole.label}</strong><small>Change role at the top to see different priorities.</small></div>
      </aside>

      <section className="wsdWorkspace">
        {area === "home" && <>
          <div className="wsdPageHead"><div><span className="eyebrow">START HERE</span><h2>Oakfield Academy demo dashboard</h2><p>This is a guided sandbox. Every record is fictional, but the workflows show how the live platform is organised.</p></div><button onClick={() => openArea(role === "send" ? "tracking" : role === "slt" ? "reports" : "courses")}>Open my priority area →</button></div>
          <div className="wsdStats">{homeStats.map(([label, value, note]) => <Stat key={label} label={label} value={value} note={note} />)}</div>
          <div className="wsdDemoJourney">
            <article className="wsdCard wsdJourneyCard"><span>01</span><div><h3>Professional development</h3><p>Open a real-looking course, move through content and answer a sample knowledge check.</p><button onClick={() => openArea("courses")}>Try CPD</button></div></article>
            <article className="wsdCard wsdJourneyCard"><span>02</span><div><h3>Teacher workflow</h3><p>See a day timetable, lesson planning workflow, curriculum links and quick classroom tools.</p><button onClick={() => openArea("teaching")}>Open teacher tools</button></div></article>
            <article className="wsdCard wsdJourneyCard"><span>03</span><div><h3>Support & tracking</h3><p>Follow baseline → intervention → review → impact using fictional pupil records.</p><button onClick={() => openArea("tracking")}>View tracking</button></div></article>
            <article className="wsdCard wsdJourneyCard"><span>04</span><div><h3>Timetabling</h3><p>Switch between an individual teacher planner and the whole-school Time Maker with 18–120 staff demos.</p><button onClick={() => openArea("timetable")}>Try timetabling</button></div></article>
          </div>
          <div className="wsdTwoCol">
            <article className="wsdCard"><span className="eyebrow">TODAY</span><h3>Teacher day</h3><div className="wsdTimeline">{lessons.map(item => <div key={item[0]}><b>{item[0]}</b><span>{item[1]} · {item[2]}{item[3] ? ` · ${item[3]}` : ""}</span></div>)}</div></article>
            <article className="wsdCard"><span className="eyebrow">NEEDS ATTENTION</span><h3>Actions</h3><button className={`wsdAction ${taskDone ? "done" : ""}`} onClick={() => setTaskDone(value => !value)}><span>{taskDone ? "✓" : "○"}</span><div><strong>Complete safeguarding refresher</strong><small>{taskDone ? "Marked complete in this demo" : "Due Monday · 12 min remaining"}</small></div></button><button className={`wsdAction ${noticeRead ? "done" : ""}`} onClick={() => setNoticeRead(true)}><span>{noticeRead ? "✓" : "!"}</span><div><strong>Read staff briefing notice</strong><small>{noticeRead ? "Read in this demo" : "Updated fire drill arrangements"}</small></div></button></article>
          </div>
        </>}

        {area === "courses" && <>
          <div className="wsdPageHead"><div><span className="eyebrow">SAMPLE CPD COURSE</span><h2>Try the learning experience</h2><p>Choose a course, move through a short content example and complete a knowledge check. The live platform stores progress, reflections, certificates and follow-up actions.</p></div></div>
          <div className="wsdCourseBrowser">
            <aside className="wsdCourseChooser">{courses.map(course => <button key={course.id} className={course.id === courseId ? "active" : ""} onClick={() => { setCourseId(course.id); setCourseStep(0); setQuizChoice(""); }}><strong>{course.title}</strong><small>{course.category} · {course.duration}</small><Progress value={course.progress} /></button>)}</aside>
            <article className="wsdCard wsdCoursePlayer">
              <div className="wsdCourseHead"><div><span className="eyebrow">{currentCourse.category}</span><h3>{currentCourse.title}</h3><p>{currentCourse.summary}</p></div><strong>{currentCourse.progress}%</strong></div>
              <div className="wsdCourseSteps"><button className={courseStep === 0 ? "active" : ""} onClick={() => setCourseStep(0)}>Learn</button><button className={courseStep === 1 ? "active" : ""} onClick={() => setCourseStep(1)}>Practise</button><button className={courseStep === 2 ? "active" : ""} onClick={() => setCourseStep(2)}>Check</button><button className={courseStep === 3 ? "active" : ""} onClick={() => setCourseStep(3)}>Apply</button></div>
              {courseStep === 0 && <div className="wsdCourseContent"><span className="eyebrow">KEY IDEA</span><h4>{currentCourse.lesson}</h4><p>Course content is broken into short chunks with examples, reflection prompts and interactive tasks rather than a long page of text.</p><button onClick={() => setCourseStep(1)}>Continue to practice →</button></div>}
              {courseStep === 1 && <div className="wsdCourseContent"><span className="eyebrow">PRACTICE TASK</span><h4>{currentCourse.activity}</h4><div className="wsdChoiceGrid"><button onClick={() => setQuizChoice("A")}>A · Add more instructions and extra tasks</button><button onClick={() => setQuizChoice("B")}>B · Keep the learning goal but add a scaffold</button><button onClick={() => setQuizChoice("C")}>C · Remove the difficult part of the objective</button></div>{quizChoice && <p className="wsdDemoFeedback">{quizChoice === "B" ? "Good choice — support access while preserving the learning goal." : "Try again: the strongest option keeps the intended learning while changing the support."}</p>}<button onClick={() => setCourseStep(2)}>Open knowledge check →</button></div>}
              {courseStep === 2 && <div className="wsdCourseContent"><span className="eyebrow">KNOWLEDGE CHECK</span><h4>Which approach best supports durable professional learning?</h4><div className="wsdChoiceGrid"><button onClick={() => setQuizChoice("review")}>Complete once and never revisit</button><button onClick={() => setQuizChoice("apply")}>Learn, apply in practice, gather evidence and review</button></div>{quizChoice === "apply" && <p className="wsdDemoFeedback success">Correct. The platform connects learning to classroom implementation and later review.</p>}<button onClick={() => setCourseStep(3)}>See implementation step →</button></div>}
              {courseStep === 3 && <div className="wsdCourseContent"><span className="eyebrow">CLASSROOM IMPLEMENTATION</span><h4>{currentCourse.takeaway}</h4><p>In the live platform, this can become an action plan, coaching goal, appraisal evidence item or follow-up reminder.</p><div className="wsdInlineActions"><button onClick={() => openArea("teaching")}>See teacher workflow</button><button onClick={() => openArea("reports")}>See how leaders track CPD</button></div></div>}
            </article>
          </div>
        </>}

        {area === "teaching" && <>
          <div className="wsdPageHead"><div><span className="eyebrow">TEACHER WORKSPACE</span><h2>Plan the week without jumping between systems</h2><p>Timetable, curriculum, lesson sequence, resources and CPD follow-up can sit in one teacher workflow.</p></div></div>
          <div className="wsdTeacherGrid">
            <article className="wsdCard wsdTeacherDay"><span className="eyebrow">TODAY'S TIMETABLE</span><h3>Monday 5 October</h3>{lessons.map(item => <div className="wsdLessonRow" key={item[0]}><b>{item[0]}</b><div><strong>{item[1]}</strong><small>{item[2]} {item[3] && `· ${item[3]}`}</small></div><button>Plan</button></div>)}</article>
            <article className="wsdCard"><span className="eyebrow">NEXT LESSON</span><h3>Year 10 Physics · Energy transfers</h3><div className="wsdPlanSteps"><div><b>1</b><span><strong>Retrieval</strong><small>Four questions from last lesson</small></span></div><div><b>2</b><span><strong>Explain</strong><small>Energy stores and pathways</small></span></div><div><b>3</b><span><strong>Apply</strong><small>Sankey diagram calculation</small></span></div><div><b>4</b><span><strong>Check</strong><small>Exit question linked to AQA objective</small></span></div></div><button onClick={() => openArea("courses")}>Link a CPD strategy</button></article>
          </div>
          <div className="wsdFeatureGrid">
            {[["Curriculum planner", "Map subjects, topics and lessons and link them to specifications."], ["Resource generator", "Create retrieval tasks, quizzes, worksheets and exit tickets."], ["Department hub", "Share assessment plans, resources, meeting notes and improvement actions."], ["AI CPD tutor", "Turn a classroom problem into planning, reflection and professional learning."], ["Learning walks", "Capture evidence and themes without pupil or staff ranking."], ["Lesson resources", "Keep files, notes and next-lesson planning beside the timetable."]].map(([title, text]) => <article className="wsdCard" key={title}><h3>{title}</h3><p>{text}</p><button onClick={() => setArea(title === "Curriculum planner" ? "teaching" : "tools")}>Explore</button></article>)}
          </div>
        </>}

        {area === "tracking" && <>
          <div className="wsdPageHead"><div><span className="eyebrow">PROGRESS & INTERVENTION TRACKING</span><h2>See whether support is actually helping</h2><p>Use the fictional records below to see how a school can connect support plans, interventions, evidence, EAL information and review dates.</p></div></div>
          <div className="wsdStudentLayout">
            <aside className="wsdStudentList">{pupils.map((item, index) => <button key={item.name} className={pupil === index ? "active" : ""} onClick={() => setPupil(index)}><strong>{item.name}</strong><small>{item.year} · {item.need}</small><span>{item.review === "9 Oct" ? "Review due" : "On track"}</span></button>)}</aside>
            <article className="wsdCard wsdStudentProfile"><div className="wsdProfileHead"><div className="wsdAvatar">{currentPupil.name[0]}</div><div><h3>{currentPupil.name}</h3><p>{currentPupil.year} · Fictional pupil</p></div><span>{currentPupil.need}</span></div><div className="wsdProfileGrid"><div><small>Current support</small><strong>{currentPupil.support}</strong></div><div><small>Intervention</small><strong>{currentPupil.intervention}</strong></div><div><small>Next review</small><strong>{currentPupil.review}</strong></div><div><small>Evidence status</small><strong>Teacher notes + review measure recorded</strong></div></div><div className="wsdTrackingTrend"><div><span>Baseline</span><strong>{currentPupil.baseline}%</strong></div><Progress value={currentPupil.latest} /><div><span>Latest review</span><strong>{currentPupil.latest}%</strong></div></div></article>
          </div>
          <div className="wsdThreeCol"><article className="wsdCard"><span className="eyebrow">INTERVENTION REVIEW</span><h3>Baseline → action → review</h3><p>Evidence suggests progress. Continue the strategy for two weeks, then review whether the improvement is secure.</p></article><article className="wsdCard"><span className="eyebrow">CPD TRACKING</span><h3>Staff learning impact</h3><p>Leaders can see completion and implementation evidence without reading private staff reflections.</p><Progress value={82} /></article><article className="wsdCard"><span className="eyebrow">EAL / READING</span><h3>Language profile</h3><p>Listening C · Speaking C · Reading B · Writing B. Teacher-confirmed best fit remains the professional judgement.</p></article></div>
        </>}

        {area === "timetable" && <>
          <div className="wsdPageHead"><div><span className="eyebrow">TIMETABLE & PLANNING</span><h2>Individual teacher planner and whole-school Time Maker</h2><p>The staff planner handles the day-to-day teaching view. The Time Maker handles whole-school staffing, rooms, curriculum requirements, constraints, review and publishing.</p></div></div>
          <div className="wsdModeSwitch"><button className={timetableView === "teacher" ? "active" : ""} onClick={() => setTimetableView("teacher")}>Teacher timetable & lesson planner</button><button className={timetableView === "maker" ? "active" : ""} onClick={() => setTimetableView("maker")}>Whole-school Time Maker</button></div>
          {timetableView === "teacher" ? <div className="wsdTeacherGrid"><article className="wsdCard"><span className="eyebrow">WEEK VIEW</span><h3>Mark Gray · Science</h3><div className="wsdMiniWeek">{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => <div key={day}><strong>{day}</strong><span>{index === 2 ? "4 lessons" : "5 lessons"}</span><small>{index === 2 ? "2 frees" : "1 free"}</small></div>)}</div></article><article className="wsdCard"><span className="eyebrow">PLANNER</span><h3>What sits beside each lesson</h3><div className="wsdActionList"><div><span>TOPIC</span><strong>National curriculum / specification-linked topic</strong></div><div><span>NEXT</span><strong>Next lesson in the sequence</strong></div><div><span>FILES</span><strong>Lesson resources and notes</strong></div><div><span>HW</span><strong>Homework / assessment reminder</strong></div><div><span>SYNC</span><strong>Published whole-school allocation</strong></div></div></article></div> : <>
            <div className="wsdSizeGrid">{timetableSizes.map((item, index) => <button key={item.label} className={index === timetableSize ? "active" : ""} onClick={() => setTimetableSize(index)}><strong>{item.label} school</strong><span>{item.staff} staff</span><small>{item.pupils} pupils · {item.departments} departments</small></button>)}</div>
            <div className="wsdTwoCol"><article className="wsdCard"><span className="eyebrow">TIME MAKER</span><h3>{selectedSize.label} school demo</h3><div className="wsdMakerFlow"><span>1. Staff & contracts</span><span>2. Curriculum needs</span><span>3. Rooms & constraints</span><span>4. Generate</span><span>5. Review workload</span><span>6. Publish</span></div><p>Demo includes full-time staff plus realistic 2, 3 and 4-day part-time contracts. The scheduler respects non-working days.</p></article><article className="wsdCard"><span className="eyebrow">GENERATED OPTION</span><h3>Option 1 · 97% scheduled</h3><div className="wsdActionList"><div><span>STAFF</span><strong>{selectedSize.staff} fictional teachers</strong></div><div><span>ROOMS</span><strong>Specialist rooms + general classrooms</strong></div><div><span>CHECKS</span><strong>Workload, clashes and availability</strong></div><div><span>PUBLISH</span><strong>Send allocations to staff planners</strong></div></div></article></div>
          </>}
          <div className="wsdInlineActions"><button onClick={() => setTimetableView("maker")}>Try school-size demos</button><button onClick={() => openArea("tools")}>See timetable setup steps</button></div>
        </>}

        {area === "school" && <>
          <div className="wsdPageHead"><div><span className="eyebrow">SCHOOL OPERATIONS</span><h2>Useful everyday tools beyond CPD</h2><p>The platform is designed to become a practical staff homepage rather than a course library that staff only visit occasionally.</p></div></div>
          <div className="wsdFeatureGrid">
            {[["Calendar", "Meetings, deadlines, trips, CPD and reminders."], ["Notices", "Targeted updates with acknowledgement where needed."], ["Forms & approvals", "Requests with clear status and approval history."], ["Trips & visits", "Planning, approvals and supporting documents."], ["Policy centre", "Current policy, review date and staff summary."], ["Staff directory", "Find people by department, role or expertise."], ["School improvement", "Priorities, owners, milestones and evidence."], ["Staff voice", "Ideas, suggestions and barriers."], ["Resource library", "Trusted files, links and school guidance."]].map(([title, text]) => <article className="wsdCard" key={title}><h3>{title}</h3><p>{text}</p><button onClick={() => title === "Calendar" ? setNoticeRead(true) : openArea("tools")}>Try example</button></article>)}
          </div>
        </>}

        {area === "reports" && <>
          <div className="wsdPageHead"><div><span className="eyebrow">LEADERSHIP INTELLIGENCE</span><h2>Useful evidence, not just completion percentages</h2><p>Bring together CPD, interventions, school priorities, timetable capacity and review activity without ranking individual staff or pupils.</p></div></div>
          <div className="wsdStats"><Stat label="Mandatory CPD" value="91%" note="Whole-school completion" /><Stat label="CPD applied" value="76%" note="Implementation evidence" /><Stat label="Interventions" value="8 / 12" note="Showing improvement" /><Stat label="Timetable" value="97%" note="Periods scheduled" /></div>
          <div className="wsdTwoCol"><article className="wsdCard"><span className="eyebrow">CPD BY AREA</span><h3>Completion and application</h3>{[["Safeguarding", 96], ["Teaching & learning", 82], ["SEND / EAL", 74], ["Leadership", 68]].map(([label, value]) => <div className="wsdBarRow" key={String(label)}><span>{label}</span><Progress value={Number(value)} /><b>{value}%</b></div>)}</article><article className="wsdCard"><span className="eyebrow">WHAT NEEDS ATTENTION</span><h3>Leadership review queue</h3><div className="wsdActionList"><div><span>CPD</span><strong>6 staff have required training due this month</strong></div><div><span>SEND</span><strong>2 intervention reviews need updating</strong></div><div><span>TT</span><strong>2 workload flags in the draft timetable</strong></div><div><span>SIP</span><strong>3 school improvement actions need evidence</strong></div></div></article></div>
          <div className="wsdThreeCol"><article className="wsdCard"><h3>Department view</h3><p>Compare completion, current priorities and curriculum work by department.</p></article><article className="wsdCard"><h3>Impact view</h3><p>See which CPD has moved into action plans, coaching goals or implementation evidence.</p></article><article className="wsdCard"><h3>Workload view</h3><p>Review timetable load and constraints before publication.</p></article></div>
        </>}

        {area === "tools" && <>
          <div className="wsdPageHead"><div><span className="eyebrow">SETUP & TOOL DIRECTORY</span><h2>See what is included and how a school gets started</h2><p>Use this page as a product map, then open the full setup guide for a step-by-step rollout.</p></div><Link className="wsdPrimaryLink" href="/demo/setup">Open full setup guide →</Link></div>
          <div className="wsdToolDirectory">
            {[
              ["Learn & develop", "CPD catalogue, pathways, short courses, required training, coaching, appraisal, certificates and impact."],
              ["Teach", "Teacher timetable, lesson planner, curriculum, resource generator, teaching strategies and department hub."],
              ["Support pupils", "Unified pupil profile, SEND/EAL, interventions, reading, regulation and pastoral tools."],
              ["Run the school", "Calendar, notices, forms, trips, policies, directory, improvement planning and staff voice."],
              ["Build the timetable", "Staff contracts, curriculum needs, rooms, constraints, generation, review, cover and publishing."],
              ["Lead & report", "CPD reporting, department analytics, intervention review, school priorities and launch readiness."],
              ["Admin & access", "School setup, accounts, roles, Google sign-in, integrations and staff sync."],
              ["Resources", "Resource library, files, policy centre, knowledge base and school AI assistant."],
            ].map(([title, text], index) => <article className="wsdCard" key={title}><span className="wsdToolNumber">0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="wsdTwoCol wsdSetupPreview"><article className="wsdCard"><span className="eyebrow">TYPICAL SCHOOL SETUP</span><h3>Six clear steps</h3><div className="wsdActionList"><div><span>01</span><strong>Create the school workspace</strong></div><div><span>02</span><strong>Add staff and permissions</strong></div><div><span>03</span><strong>Connect sign-in / integrations</strong></div><div><span>04</span><strong>Choose CPD, policies and school tools</strong></div><div><span>05</span><strong>Build or import the timetable</strong></div><div><span>06</span><strong>Pilot with a small staff group, then launch</strong></div></div></article><article className="wsdCard"><span className="eyebrow">TRY NEXT</span><h3>Recommended demo route</h3><div className="wsdInlineActions vertical"><button onClick={() => openArea("courses")}>Open a CPD course</button><button onClick={() => openArea("tracking")}>View progress tracking</button><button onClick={() => { openArea("timetable"); setTimetableView("maker"); }}>Open Time Maker</button><button onClick={() => openArea("reports")}>Open leadership reports</button><Link href="/demo/setup">Read setup instructions</Link></div></article></div>
        </>}
      </section>
    </div>

    <section className="wsdClosing"><div><span className="eyebrow">READY FOR A REAL SCHOOL SETUP?</span><h2>The demo stays fictional. Your live school gets its own secure workspace.</h2><p>Review the setup guide and buyer information, then create a school account when you are ready to test the real workflows with your own staff.</p></div><div><Link className="secondary" href="/demo/setup">Setup guide</Link><Link className="secondary" href="/auth">Staff sign in</Link><Link className="primary" href="/procurement">Purchase information</Link></div></section>
  </main>;
}
