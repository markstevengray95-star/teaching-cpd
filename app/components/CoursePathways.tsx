"use client";

import { useState } from "react";
import { courses, type Course } from "@/lib/catalogue";
import { learningPathways, pathwayRoles, pathwayState, type LearningProgress } from "@/lib/coursePathways";

export default function CoursePathways({ progress, openCourse }: { progress: LearningProgress; openCourse: (course: Course)=>void }) {
  const [role,setRole] = useState("All"), [selected,setSelected] = useState("");
  const visible = learningPathways.filter(p=>role==="All" || p.roles.some(r=>r===role));
  const pathway = visible.find(p=>p.id===selected), state = pathway && pathwayState(pathway,courses,progress);
  return <section className="learningPathways" aria-labelledby="pathway-heading">
    <div className="pathwayHeading"><div><span className="eyebrow">CONNECTED LEARNING</span><h2 id="pathway-heading">Choose a pathway, not just a course</h2><p>Suggested sequences, not prerequisites. Open any step; existing course progress counts automatically.</p></div>
      <label>Pathways for your role<select value={role} onChange={e=>{setRole(e.target.value);setSelected("");}}><option value="All">All roles</option>{pathwayRoles.map(r=><option key={r}>{r}</option>)}</select></label>
    </div>
    <div className="pathwayGrid">{visible.map(p=>{const s=pathwayState(p,courses,progress);return <button type="button" key={p.id} className={"pathwayCard"+(p.id===selected?" selected":"")} aria-pressed={p.id===selected} onClick={()=>setSelected(p.id)}><strong>{p.title}</strong><span>{p.outcome}</span><small>{s.completed}/{s.steps.length} courses complete · {s.minutes} min across the whole pathway</small><span className="textButton">View connected steps →</span></button>;})}</div>
    {pathway && state && <div className="pathwayDetail" aria-live="polite"><div className="pathwayHeading"><div><h3>{pathway.title}</h3><p>{pathway.outcome}</p></div><button type="button" className="secondary" onClick={()=>setSelected("")}>Close pathway</button></div>
      <ol>{state.steps.map((step,i)=><li key={step.courseId}><div><strong>{i+1}. {step.course.title}</strong><p>{step.purpose}</p><span>{step.course.duration} min · {step.complete?"Completed":step===state.next?"Your next unfinished step":"Not yet completed"}</span></div><button type="button" className="secondary" onClick={()=>openCourse(step.course)}>{step.complete?"Revisit course":"Open course"}</button></li>)}</ol>
      {state.next?<button type="button" className="primary" onClick={()=>openCourse(state.next!.course)}>Continue pathway: {state.next.course.title}</button>:<p role="status">All courses in this pathway are complete. Use your course takeaways and scheduled reviews to test the learning in practice.</p>}
    </div>}
  </section>;
}
