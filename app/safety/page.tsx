import { courses } from "@/lib/catalogue";

const safetyPattern = /(health|safety|first aid|fire|accident|near-miss|medical|allergy|security|coshh|asbestos|laboratory|educational visits|physical activity|workshop)/i;
const coreTitles = new Set([
  "Health & Safety Essentials for School Staff",
  "Fire Safety & Emergency Evacuation Awareness",
  "Accident, Incident & Near-Miss Reporting",
  "Supporting Pupils with Medical Conditions",
  "Allergy Safety in Schools: 2026 Requirements",
  "School Security & Emergency Response Awareness",
]);

export default function SafetyPage(){
  const safetyCourses = courses.filter(c => safetyPattern.test(c.title));
  const core = safetyCourses.filter(c => coreTitles.has(c.title));
  const specialist = safetyCourses.filter(c => !coreTitles.has(c.title));
  const regulation = courses.find(c => c.id === "regulation-support-academy");

  return <main className="stagePage">
    <section className="stageHero">
      <span className="eyebrow">WHOLE-SCHOOL COMPLIANCE</span>
      <h1>Safety & Compliance Hub</h1>
      <p>One place for the school's core staff-awareness training and role-specific safety CPD. Generic online learning supports local induction; it does not replace the school's current policies, risk assessments, drills, competent advice or specialist/certified training where those are required.</p>
      <div className="stageHeroActions"><a className="primary phaseLinkButton" href="/">Open course library</a><a className="secondary phaseLinkButton" href="/safeguarding">Safeguarding compliance</a></div>
    </section>

    <section className="stageStatGrid">
      <div className="stageStat"><strong>{core.length}</strong><span>core safety courses</span></div>
      <div className="stageStat"><strong>{specialist.length}</strong><span>role-specific courses</span></div>
      <div className="stageStat"><strong>2026</strong><span>allergy duty tracked</span></div>
      <div className="stageStat"><strong>1</strong><span>regulation pathway</span></div>
    </section>

    <section className="stageCard">
      <span className="eyebrow">CORE WHOLE-SCHOOL TRAINING</span>
      <h2>Useful for most or all staff</h2>
      <p>Schools can make these mandatory through the existing CPD Admin assignment tools and monitor completion in the training/leadership dashboards.</p>
      <div className="stageGrid">
        {core.map(course => <article className="stageCard" key={course.id}>
          <span className="eyebrow">{course.duration} MIN · {course.level}</span>
          <h3>{course.title}</h3>
          <p>{course.summary}</p>
          <small>{course.recommendedFor.join(" · ")}</small>
        </article>)}
      </div>
    </section>

    <section className="stageCard">
      <span className="eyebrow">ROLE-SPECIFIC / HIGHER-RISK AREAS</span>
      <h2>Assign according to role and school risk assessment</h2>
      <p>These awareness courses should sit alongside the school's approved subject, estate, educational-visit and specialist training arrangements.</p>
      <div className="stageGrid">
        {specialist.map(course => <article className="stageCard" key={course.id}>
          <span className="eyebrow">{course.duration} MIN · {course.level}</span>
          <h3>{course.title}</h3>
          <p>{course.summary}</p>
          <small>{course.recommendedFor.join(" · ")}</small>
        </article>)}
      </div>
    </section>

    {regulation && <section className="stageCard">
      <span className="eyebrow">RELATED WHOLE-SCHOOL PATHWAY</span>
      <h2>{regulation.title}</h2>
      <p>{regulation.summary}</p>
      <div className="stageGrid">
        <div className="stageCard"><strong>8-part pathway</strong><p>Foundations → signals/co-regulation → teacher language → environment/routines → subjects → SEND/EAL → structured interventions → whole-school implementation.</p></div>
        <div className="stageCard"><strong>Important boundary</strong><p>This is an independent regulation-support pathway adapted from your Regulation Hub. It is not presented as the proprietary Zones of Regulation curriculum or as an official certification.</p></div>
      </div>
    </section>}

    <section className="stageCard">
      <span className="eyebrow">IMPLEMENTATION PRINCIPLES</span>
      <h2>What the app should evidence</h2>
      <div className="schoolAccessSteps">
        <div><span>1</span><strong>Assign</strong><p>Match training to all-staff, department, site or specialist roles.</p></div>
        <div><span>2</span><strong>Complete</strong><p>Use interactive CPD, scenarios, checks and reflections.</p></div>
        <div><span>3</span><strong>Record</strong><p>Keep completion evidence and distinguish internal records from external certification.</p></div>
        <div><span>4</span><strong>Review</strong><p>Reassign when guidance, school policy, role or risk changes.</p></div>
      </div>
    </section>
  </main>;
}
