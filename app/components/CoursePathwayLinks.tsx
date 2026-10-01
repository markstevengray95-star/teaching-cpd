"use client";
import { courses, type Course } from "@/lib/catalogue";
import { learningPathways } from "@/lib/coursePathways";

export default function CoursePathwayLinks({course,onOpenCourse}:{course:Course;onOpenCourse:(course:Course)=>void}) {
  const paths=learningPathways.filter(p=>p.steps.some(s=>s.courseId===course.id));
  if(!paths.length) return null;
  return <details className="coursePathwayLinks"><summary>Connected pathways ({paths.length})</summary>{paths.map(p=>{
    const index=p.steps.findIndex(s=>s.courseId===course.id), next=courses.find(c=>c.id===p.steps[index+1]?.courseId);
    return <div key={p.id}><h3>{p.title} · step {index+1} of {p.steps.length}</h3><p>{p.steps[index].purpose}</p><p>Suggested sequence — no course is locked by this pathway.</p>{next?<button type="button" className="secondary" onClick={()=>onOpenCourse(next)}>Next in sequence: {next.title} · {next.duration} min</button>:<p>This is the final course in this sequence. Return to the library to review your pathway progress.</p>}</div>;
  })}</details>;
}
