"use client";

import { useEffect, useMemo, useState } from "react";
import {
  courses,
  getPhase7FacilitatorPlan,
  PHASE7_SESSION_ROUTES,
  type Phase7RouteMinutes,
} from "@/lib/catalogue";

function validRoute(value: number): Phase7RouteMinutes {
  return PHASE7_SESSION_ROUTES.includes(value as Phase7RouteMinutes) ? value as Phase7RouteMinutes : 60;
}

export default function FacilitatorPage() {
  const [selectedId, setSelectedId] = useState(courses[0]?.id || "");
  const [route, setRoute] = useState<Phase7RouteMinutes>(60);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedCourse = params.get("course");
    const requestedRoute = Number(params.get("route") || "60");
    if (requestedCourse && courses.some(course => course.id === requestedCourse)) setSelectedId(requestedCourse);
    setRoute(validRoute(requestedRoute));
  }, []);

  const course = useMemo(() => courses.find(item => item.id === selectedId) || courses[0], [selectedId]);
  const plan = useMemo(() => course ? getPhase7FacilitatorPlan(course, route) : null, [course, route]);
  if (!course || !plan) return <main className="stagePage"><div className="stageCard">No courses are available.</div></main>;

  const selectedModules = plan.slides.map(slide => ({ slide, module: course.modules.find(item => item.id === slide.moduleId) })).filter(item => item.module);
  const interactiveCount = selectedModules.filter(item => item.module && ["quiz", "scenario", "activity", "reflection", "checklist"].includes(item.module.type)).length;

  return <main className="stagePage facilitatorPage">
    <section className="stageHero facilitatorHero noPrint">
      <span className="eyebrow">PHASE 7 · FACILITATOR PACK</span>
      <h1>Run any CPD course without rebuilding the session.</h1>
      <p>Choose the course and available session length. The pack generates a paced live route, discussion prompts, misconception checks, inclusive delivery moves, optional extensions and the hand-off into individual mastery and Phase 6 follow-through.</p>
      <div className="stageHeroActions"><button className="primary" onClick={() => window.print()}>Print / save PDF</button><a className="secondary phaseLinkButton" href={`/cpd?course=${encodeURIComponent(course.id)}`}>Open course</a></div>
    </section>

    <section className="stageCard facilitatorSelector noPrint">
      <label><span>Course</span><select value={course.id} onChange={event => setSelectedId(event.target.value)}>{courses.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <label><span>Session length</span><select value={route} onChange={event => setRoute(validRoute(Number(event.target.value)))}>{PHASE7_SESSION_ROUTES.map(item => <option value={item} key={item}>{item} minutes</option>)}</select></label>
      <button className="secondary" onClick={() => window.print()}>Print pack</button>
    </section>

    <article className="facilitatorPrintSheet">
      <header className="facilitatorPrintTitle"><span>{course.category} · {course.level} · Phase 7 facilitator route</span><h1>{course.title}</h1><p>{course.summary}</p></header>

      <div className="facilitatorOverview">
        <div><strong>{route}</strong><span>minutes</span></div>
        <div><strong>{plan.slides.length}</strong><span>live slides</span></div>
        <div><strong>{interactiveCount}</strong><span>interactive moments</span></div>
        <div><strong>{plan.independentFollowUpCount}</strong><span>mastery slides after live CPD</span></div>
      </div>

      <section>
        <h2>Learning outcomes</h2>
        <ol>{course.objectives.map(objective => <li key={objective}>{objective}</li>)}</ol>
      </section>

      <section>
        <h2>Before the session</h2>
        <div className="facilitatorChecklist">
          <div>Open the course and switch on Facilitator mode.</div>
          <div>Select the same {route}-minute route shown in this pack.</div>
          <div>Check display, audio and any links or practical resources needed.</div>
          <div>Decide how staff will participate: individual thinking, pairs, tables or whole group.</div>
          <div>Have current school policy or local procedure available where the topic requires it.</div>
          <div>Protect time at the end for one implementation commitment and explain the Phase 6 follow-up.</div>
        </div>
      </section>

      <section>
        <h2>{route}-minute session agenda</h2>
        <table className="facilitatorAgenda"><thead><tr><th>Time</th><th>Slide</th><th>Delivery focus</th></tr></thead><tbody>{plan.slides.map((slide, index) => <tr key={slide.moduleId}><td>{slide.suggestedMinutes} min</td><td>{index + 1}. {slide.title}</td><td>{slide.facilitatorMove}</td></tr>)}</tbody></table>
      </section>

      <section>
        <h2>Slide-by-slide facilitator notes</h2>
        {plan.slides.map((slide, index) => <article className="facilitatorGuideCard" key={slide.moduleId}>
          <header><div><span>Route slide {index + 1} of {plan.slides.length}</span><strong>{slide.title}</strong></div><b>{slide.suggestedMinutes} min</b></header>
          <div className="facilitatorGuideGrid">
            <div><span>Purpose</span><p>{slide.purpose}</p></div>
            <div><span>Facilitator move</span><p>{slide.facilitatorMove}</p></div>
            <div><span>Ask the room</span><p>{slide.discussionQuestion}</p></div>
            <div><span>Watch for</span><p>{slide.misconception}</p></div>
            <div><span>Access & inclusion</span><p>{slide.accessibilityMove}</p></div>
            <div><span>Optional extension</span><p>{slide.extension}</p></div>
          </div>
        </article>)}
      </section>

      <section className="facilitatorHandoff">
        <h3>After the live session</h3>
        <p>Do not use group discussion as a substitute for individual mastery. Staff complete the Phase 5 diagnostic/retrieval/application checks in their own account, then Phase 6 schedules the 7-day transfer, 30-day impact and 90-day sustain reviews. Evidence and impact remain attached to the same CPD record.</p>
      </section>

      <section>
        <h2>Facilitator notes</h2>
        <div className="facilitatorNotesLines"><i/><i/><i/><i/><i/><i/></div>
      </section>
    </article>
  </main>;
}
