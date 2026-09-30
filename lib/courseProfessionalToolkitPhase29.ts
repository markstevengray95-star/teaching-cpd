import type { Course, CourseCategory } from "./data";

export const PRESENTATION_OVERHAUL_PHASE29_VERSION = "2026.30";

export type Phase29ToolKind="script"|"template"|"checklist"|"routine"|"meeting_card"|"implementation_planner";
export type Phase29Tool={id:string;kind:Phase29ToolKind;title:string;summary:string;body:string[]};
export type Phase29Pack={id:string;title:string;subtitle:string;tools:Phase29Tool[]};
export type Phase29Audit={courseId:string;title:string;tools:number;kinds:number;reusable:boolean;ready:boolean;score:number};

function tool(id:string,kind:Phase29ToolKind,title:string,summary:string,body:string[]):Phase29Tool{return{id,kind,title,summary,body};}
function categoryLens(category:CourseCategory){
  if(category==="Safeguarding")return{script:["I need to pass on a concern. I will record what I saw or heard factually and follow the school's current safeguarding route.","I cannot promise confidentiality, but I can explain what will happen next."],check:["Separate fact from interpretation","Use the pupil's words where appropriate","Report through the designated route","Do not investigate independently"]};
  if(category==="SEND")return{script:["What is the specific barrier in this task?","How can we keep the learning goal while changing the route?","What evidence will show whether support is increasing independence?"],check:["Name the barrier","Protect the learning goal","Use the smallest useful scaffold","Review accuracy and independence","Fade or adapt support"]};
  if(category==="Leadership")return{script:["What is the core practice we need everyone to understand?","Is the barrier clarity, capability, capacity or system design?","What evidence will tell us whether the change is working?"],check:["Clarify the practice","Model or rehearse where needed","Check workload and conditions","Gather implementation evidence","Make a keep/adapt/stop decision"]};
  if(category==="Wellbeing")return{script:["Which part of this pressure is created by a system we can change?","Can we remove, simplify, sequence or redesign one step before adding anything new?"],check:["Locate the recurring pressure","Trace the workflow cause","Make one bounded change","Check displaced burden","Review staff experience and process evidence"]};
  if(category==="Digital Teaching")return{script:["What is the professional purpose of using this tool?","What data boundary, verification step and accessibility check are required?","Who owns the final decision?"],check:["Define the purpose","Protect sensitive data","Verify important outputs","Check accessibility","Keep human accountability"]};
  return{script:["What does the pupil evidence show?","What is the most likely learning problem?","What is the smallest strong teaching response?","How will I check independent transfer?"],check:["Gather evidence of thinking","Diagnose precisely","Choose a targeted response","Check independent application","Adapt the next step from evidence"]};
}

export function getPhase29Pack(course:Course):Phase29Pack{
  const lens=categoryLens(course.category);
  const objective=course.objectives[0]||course.summary;
  const second=course.objectives[1]||course.summary;
  return{id:`phase29-${course.id}`,title:`Professional toolkit · ${course.title}`,subtitle:"Reusable scripts, templates and planning tools unlocked from completed professional learning.",tools:[
    tool("script","script","Professional conversation script","Useful language to make the course principle easier to use in a real conversation.",lens.script),
    tool("template","template","Evidence-to-action note","A short template for turning course learning into a professional decision.",["What I noticed:","What I think the issue or opportunity is:","The action I will take:","The evidence I will collect:","What would make me adapt or stop:"]),
    tool("checklist","checklist","Practice checklist","A compact quality check for using this idea consistently.",lens.check),
    tool("routine","routine","Five-minute implementation routine","A repeatable routine for moving from CPD to practice.",["1. Re-read one core principle","2. Choose one real context","3. Rehearse the key move or script","4. Use it once deliberately","5. Record one piece of evidence and one next step"]),
    tool("meeting-card","meeting_card","Team meeting card","A short prompt set for professional discussion without turning CPD into a long meeting.",[`${course.title}: what is the one principle we need shared language around?`, `Where would ${objective.toLowerCase()} make the biggest difference?`, `What barrier could make ${second.toLowerCase()} difficult to sustain?`,"What will we look for before deciding whether to keep or adapt the approach?"]),
    tool("planner","implementation_planner","Implementation planner","A reusable one-page plan for testing the course in practice.",["Problem or opportunity:","Chosen action:","Context and people affected:","Likely barrier:","Evidence to collect:","7-day transfer check:","30-day impact review:","90-day sustain decision:"]),
  ]};
}
export function validateProfessionalToolkitPhase29(course:Course){const p=getPhase29Pack(course);if(p.tools.length!==6)throw new Error(`Phase 29 ${course.id}: requires six reusable tools`);if(new Set(p.tools.map(t=>t.kind)).size!==6)throw new Error(`Phase 29 ${course.id}: each toolkit kind must be represented`);if(p.tools.some(t=>t.body.length<2||!t.summary))throw new Error(`Phase 29 ${course.id}: incomplete toolkit item`);return true;}
export function auditProfessionalToolkitPhase29(course:Course):Phase29Audit{const p=getPhase29Pack(course);let ready=true;try{validateProfessionalToolkitPhase29(course);}catch{ready=false;}const kinds=new Set(p.tools.map(t=>t.kind)).size;const reusable=p.tools.every(t=>t.body.length>=2);const score=Math.min(100,(p.tools.length===6?30:0)+(kinds===6?30:0)+(reusable?20:0)+(p.tools.some(t=>t.kind==="implementation_planner")?10:0)+(ready?10:0));return{courseId:course.id,title:course.title,tools:p.tools.length,kinds,reusable,ready,score};}
export function summariseProfessionalToolkitPhase29(courses:Course[]){const reports=courses.map(auditProfessionalToolkitPhase29);return{courseCount:reports.length,ready:reports.filter(r=>r.ready).length,toolsPerCourse:reports[0]?.tools||0,totalTools:reports.reduce((s,r)=>s+r.tools,0),kinds:6,averageScore:reports.length?Math.round(reports.reduce((s,r)=>s+r.score,0)/reports.length):0,reports};}
