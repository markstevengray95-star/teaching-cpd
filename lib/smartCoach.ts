import { courses } from "./catalogue";

export type CoachRecommendation = { type:string; title:string; reason:string; href:string; priority:"high"|"medium"|"low" };
export type CoachInputs = {
  auditCourseIds:string[];
  completedCourseIds:string[];
  targets:{ title:string; linked_course_id:string|null; review_date:string|null; status:string }[];
  actions:{ title:string; review_date:string|null; status:string }[];
  assignments:{ title_snapshot:string; target_type:string; target_id:string; due_date:string|null; mandatory:boolean; status:string }[];
};

export function buildCoachPlan(input:CoachInputs) {
  const done = new Set(input.completedCourseIds);
  const recommendations:CoachRecommendation[]=[];
  const now=Date.now();
  const push=(item:CoachRecommendation)=>{ if(!recommendations.some(r=>r.title===item.title&&r.href===item.href)) recommendations.push(item); };

  input.assignments.filter(a=>!["completed","waived"].includes(a.status)).sort((a,b)=>Number(Boolean(b.mandatory))-Number(Boolean(a.mandatory))).forEach(a=>{
    const overdue=a.due_date&&new Date(a.due_date).getTime()<now;
    const href=a.target_type==="custom"?`/course/${a.target_id}`:a.target_type==="pathway"?"/pathways":"/training";
    push({type:"assignment",title:a.title_snapshot,reason:overdue?"This assigned CPD is overdue.":a.mandatory?"This is a mandatory CPD assignment.":"This has been assigned as part of your development plan.",href,priority:overdue||a.mandatory?"high":"medium"});
  });

  input.targets.filter(t=>t.status==="active").forEach(t=>{
    const course=t.linked_course_id?courses.find(c=>c.id===t.linked_course_id):null;
    push({type:"target",title:t.title,reason:t.review_date&&new Date(t.review_date).getTime()<=now?"This development target is ready for review.":course?`Continue the linked course: ${course.title}.`:"Keep this target visible and gather evidence of impact.",href:course?`/?course=${encodeURIComponent(course.id)}`:"/coaching",priority:t.review_date&&new Date(t.review_date).getTime()<=now?"high":"medium"});
  });

  input.actions.filter(a=>["planned","in_progress","review_due"].includes(a.status)).forEach(a=>{
    const due=a.review_date&&new Date(a.review_date).getTime()<=now;
    push({type:"implementation",title:a.title,reason:due?"Your implementation review is due. Record what changed and what evidence you saw.":"Keep collecting evidence before the planned review.",href:"/actions",priority:due?"high":"medium"});
  });

  input.auditCourseIds.filter(id=>!done.has(id)).forEach(id=>{
    const course=courses.find(c=>c.id===id); if(!course)return;
    push({type:"course",title:course.title,reason:"Recommended from your latest CPD needs audit.",href:`/?course=${encodeURIComponent(course.id)}`,priority:"medium"});
  });

  if(!recommendations.length){
    const fallback=courses.find(c=>!done.has(c.id));
    if(fallback) push({type:"course",title:fallback.title,reason:"A useful next course based on what you have not yet completed.",href:`/?course=${encodeURIComponent(fallback.id)}`,priority:"low"});
  }

  const ordered=recommendations.sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]).slice(0,6);
  const high=ordered.filter(r=>r.priority==="high").length;
  const summary=high?`You have ${high} item${high===1?"":"s"} needing attention first. Prioritise deadlines and review points, then move to your audit-led development learning.`:"Your current plan has no urgent items. Focus on one development priority at a time, complete the learning, test one change and review its impact.";
  return {summary,recommendations:ordered};
}
