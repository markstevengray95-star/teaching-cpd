import type { Course, Module, CourseCategory } from "./data";

const P7 = "overhaul7-visual-";
const P8 = "overhaul8-path-";
const P9 = "overhaul9-synthesis-";
const P10 = "overhaul10-archetype-";

export const PRESENTATION_OVERHAUL_PHASE7_VERSION = "2026.8";
export const PRESENTATION_OVERHAUL_PHASE8_VERSION = "2026.9";
export const PRESENTATION_OVERHAUL_PHASE9_VERSION = "2026.10";
export const PRESENTATION_OVERHAUL_PHASE10_VERSION = "2026.11";

export type Phase8PathRoute = { id:string; label:string; purpose:string; prompt:string };
export type Phase8AdaptivePack = { moduleId:string; kind:"role"|"context"|"access"; title:string; routes:Phase8PathRoute[]; transferPrompt:string };
export type FinalPresentationAudit = {
  courseId:string; title:string; archetype:string; instructionalVisuals:number; adaptivePathways:number; synthesisModules:number; archetypeModules:number; activeShare:number; longestPassiveRun:number; score:number; ready:boolean;
};

type VisualModule = Extract<Module,{type:"visual"}>;
type ActivityModule = Extract<Module,{type:"activity"}>;
type ChecklistModule = Extract<Module,{type:"checklist"}>;
type ReflectionModule = Extract<Module,{type:"reflection"}>;

function safeId(value:string){return value.replace(/[^a-z0-9-]/gi,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").toLowerCase();}
function short(value:string,limit=135){const clean=value.replace(/\s+/g," ").trim();return clean.length<=limit?clean:`${clean.slice(0,limit-1).trim()}…`;}
function insertAfter(modules:Module[], id:string, additions:Module[]){const index=modules.findIndex(module=>module.id===id);modules.splice(index>=0?index+1:Math.min(5,modules.length),0,...additions);}
function insertBefore(modules:Module[], id:string, additions:Module[]){const index=modules.findIndex(module=>module.id===id);modules.splice(index>=0?index:modules.length,0,...additions);}

function categoryLanguage(category:CourseCategory){
  if(category==="Safeguarding") return {principle:"Recognise, record and report within the current school procedure", boundary:"Do not investigate or improvise beyond the staff role", evidence:"Factual recording and correct use of the reporting route", archetype:"Safeguarding decision briefing"};
  if(category==="SEND") return {principle:"Identify the barrier, preserve ambition and use the smallest useful support", boundary:"Avoid labels becoming fixed teaching plans or permanent over-support", evidence:"Access, participation, independence and learning", archetype:"Inclusive practice studio"};
  if(category==="Leadership") return {principle:"Clarify the intended practice, diagnose barriers and support implementation", boundary:"Do not confuse weak system conditions with an individual staff judgement", evidence:"Clarity, capability, capacity and implementation evidence", archetype:"Implementation clinic"};
  if(category==="Wellbeing") return {principle:"Improve controllable systems as well as individual coping", boundary:"Do not make resilience the answer to avoidable workload or unclear systems", evidence:"Whether workload, duplication or friction actually reduces", archetype:"Systems and workload review"};
  if(category==="Digital Teaching") return {principle:"Start with educational purpose and retain human oversight", boundary:"Protect privacy, accessibility and professional judgement", evidence:"Learning or workload benefit alongside accuracy and safety", archetype:"Digital decision lab"};
  return {principle:"Connect the technique to the learning problem and evidence of pupil thinking", boundary:"Do not copy a visible routine without the principle and context underneath", evidence:"Participation, pupil thinking and learning evidence that informs the next teaching move", archetype:"Teaching practice lab"};
}

function phase7Modules(course:Course):Module[]{
  const id=safeId(course.id); const lens=categoryLanguage(course.category); const objectives=course.objectives.slice(0,3);
  const concept:VisualModule={id:`${P7}${id}-concept`,type:"visual",title:"Instructional visual · concept map",layout:"flow",caption:`See how the central ideas in ${course.title} connect before moving into more detail.`,items:[
    {heading:"Professional problem",text:short(course.summary,150),icon:"1"},
    {heading:"Core principle",text:lens.principle,icon:"2"},
    {heading:"Boundary",text:lens.boundary,icon:"3"},
    {heading:"Evidence",text:lens.evidence,icon:"4"},
  ]};
  const decision:VisualModule={id:`${P7}${id}-decision`,type:"visual",title:"Instructional visual · decision map",layout:"compare",caption:"Use this visual to decide whether to keep, adapt or reject a professional response rather than treating a strategy as universally correct.",items:[
    {heading:"KEEP",text:`Keep the principle when it still solves the intended problem: ${short(objectives[0]||course.summary,105)}`,icon:"✓"},
    {heading:"ADAPT",text:`Adapt the surface technique when context, access or implementation conditions change: ${short(objectives[1]||lens.boundary,105)}`,icon:"↻"},
    {heading:"STOP",text:`Stop or rethink the response when evidence no longer supports the intended outcome: ${short(objectives[2]||lens.evidence,105)}`,icon:"×"},
  ]};
  const evidence:VisualModule={id:`${P7}${id}-evidence`,type:"visual",title:"Instructional visual · evidence-to-action map",layout:"timeline",caption:"Connect an intended change to evidence and a review decision instead of assuming implementation equals impact.",items:[
    {heading:"1 · Define",text:"Name the professional problem and intended outcome precisely.",icon:"1"},
    {heading:"2 · Act",text:"Choose the smallest useful evidence-informed change you can actually implement.",icon:"2"},
    {heading:"3 · Check",text:lens.evidence,icon:"3"},
    {heading:"4 · Review",text:"Keep, adapt, fade, revisit or stop according to the evidence rather than habit.",icon:"4"},
  ]};
  return [concept,decision,evidence];
}

export function applyInstructionalVisualPhase7(course:Course):Course{
  const id=safeId(course.id); const modules=course.modules.filter(module=>!module.id.startsWith(`${P7}${id}-`)); const visuals=phase7Modules(course);
  insertAfter(modules,`overhaul2-process-${id}-1`,[visuals[0]]);
  insertAfter(modules,`overhaul3-workshop-${id}-compare`,[visuals[1]]);
  insertBefore(modules,`overhaul1-cycle-${id}-4`,[visuals[2]]);
  return {...course,duration:course.duration+6,modules};
}

function routePack(course:Course,kind:Phase8AdaptivePack["kind"]):Phase8AdaptivePack{
  const id=safeId(course.id); const lens=categoryLanguage(course.category); const recommended=course.recommendedFor.filter(role=>role!=="All staff");
  if(kind==="role"){
    const roles=[...recommended,"Teacher","Teaching Assistant","Department Lead"].filter((value,index,array)=>array.indexOf(value)===index).slice(0,4);
    return {moduleId:`${P8}${id}-role`,kind,title:"Choose your role lens",routes:roles.map((role,index)=>({id:`r${index+1}`,label:role,purpose:`Apply ${course.title} from the perspective of a ${role.toLowerCase()}.`,prompt:role.includes("Lead")?"What would you clarify, support and review at team level?":role.includes("Assistant")?"What support can you provide without taking over the learner's or teacher's thinking?":"What would change in your immediate day-to-day practice?"})),transferPrompt:"Record what stays the same across roles and what legitimately changes because responsibility is different."};
  }
  if(kind==="context") return {moduleId:`${P8}${id}-context`,kind,title:"Choose your setting",routes:[
    {id:"classroom",label:"Classroom / direct practice",purpose:"Translate the principle into an immediate interaction, task, routine or decision.",prompt:"What would a colleague actually see or hear you do?"},
    {id:"department",label:"Department / team",purpose:"Turn the principle into a shared routine without creating unnecessary uniformity.",prompt:"What needs to be common, and where should professional adaptation remain?"},
    {id:"pastoral",label:"Pastoral / support",purpose:"Apply the learning in a relationship, support or communication context.",prompt:"How does the principle transfer when the setting is not a lesson?"},
    {id:"whole-school",label:"Whole-school implementation",purpose:"Consider clarity, capacity, capability, communication and review.",prompt:"What implementation condition would most affect whether this sticks?"},
  ],transferPrompt:`Use the route to adapt ${lens.principle.toLowerCase()} without losing the principle itself.`};
  return {moduleId:`${P8}${id}-access`,kind,title:"Apply an access lens",routes:[
    {id:"send",label:"SEND / additional needs",purpose:"Identify the real barrier and preserve an ambitious goal.",prompt:"What is the smallest adaptation that improves access without creating dependence?"},
    {id:"eal",label:"EAL / language access",purpose:"Reduce avoidable language barriers while maintaining the thinking demand.",prompt:"Which vocabulary, representation or rehearsal support is needed?"},
    {id:"literacy",label:"Literacy / reading demand",purpose:"Make disciplinary reading and vocabulary demands visible.",prompt:"What does the learner need to read, say or write successfully here?"},
    {id:"accessibility",label:"Accessibility / participation",purpose:"Check whether the environment or format prevents meaningful participation.",prompt:"What change improves access without changing the intended outcome?"},
  ],transferPrompt:`Check the adaptation against this boundary: ${lens.boundary}`};
}

function pathModule(course:Course,kind:Phase8AdaptivePack["kind"]):ActivityModule{
  const pack=routePack(course,kind); return {id:pack.moduleId,type:"activity",title:pack.title,prompt:"Select the route that best matches your role or context, then adapt the learning rather than copying it unchanged.",instructions:["Choose one route in the interactive panel.","Use its prompt to make one concrete adaptation.",pack.transferPrompt,"Record the final version you would actually use."],placeholder:"My chosen route… What stays stable… What I will adapt…",minimumCharacters:100};
}

export function applyAdaptivePathwayPhase8(course:Course):Course{
  const id=safeId(course.id); const modules=course.modules.filter(module=>!module.id.startsWith(`${P8}${id}-`));
  insertAfter(modules,`overhaul1-cycle-${id}-1-activity`,[pathModule(course,"role")]);
  insertAfter(modules,`overhaul4-case-${id}-1-transfer`,[pathModule(course,"context")]);
  insertAfter(modules,`overhaul4-case-${id}-2-transfer`,[pathModule(course,"access")]);
  return {...course,duration:course.duration+9,modules};
}

export function isAdaptivePathwayPhase8Module(module:Module|undefined|null){return Boolean(module?.id.startsWith(P8));}
export function getAdaptivePathwayPhase8Pack(course:Course,module:Module|undefined|null){if(!module||!isAdaptivePathwayPhase8Module(module))return null; const kind=(module.id.endsWith("-role")?"role":module.id.endsWith("-context")?"context":"access") as Phase8AdaptivePack["kind"]; return routePack(course,kind);}

function phase9Modules(course:Course):Module[]{
  const id=safeId(course.id); const lens=categoryLanguage(course.category);
  const brief:VisualModule={id:`${P9}${id}-brief`,type:"visual",title:"Final synthesis · bring the course together",layout:"cycle",caption:"The final task combines knowledge, professional judgement, rehearsal, adaptation and implementation evidence.",items:[
    {heading:"Problem",text:"Define the professional problem you are trying to improve.",icon:"1"},{heading:"Principle",text:lens.principle,icon:"2"},{heading:"Action",text:"Design one realistic change for your own context.",icon:"3"},{heading:"Evidence",text:lens.evidence,icon:"4"},{heading:"Review",text:"Decide in advance what would make you keep, adapt or stop.",icon:"5"},
  ]};
  const product:ActivityModule={id:`${P9}${id}-product`,type:"activity",title:"Capstone task · build a usable professional product",prompt:`Create one output from ${course.title} that you can actually use after this course.`,instructions:["State the specific problem or barrier.","Name the course principle that justifies your response.","Create the actual plan, script, routine, checklist, adaptation, question sequence or implementation step.","Name one likely barrier and how you will respond.",`Specify evidence: ${lens.evidence}`,"Set a review point and a keep/adapt/stop decision rule."],placeholder:"Problem… Principle… Product… Barrier… Evidence… Review rule…",minimumCharacters:180};
  const ready:ChecklistModule={id:`${P9}${id}-ready`,type:"checklist",title:"Implementation readiness check",prompt:"Before finishing, check whether the product is specific enough to survive real practice.",items:["The intended outcome is clear.","The action is small enough to implement.","The approach fits my role and context.","Access/inclusion has been considered.","I know what evidence I will collect.","I know when I will review it.","I know what would make me adapt or stop."],completionText:"Your implementation product is ready for a real-world trial and Phase 6 follow-through."};
  const reflection:ReflectionModule={id:`${P9}${id}-commit`,type:"reflection",title:"Final professional commitment",prompt:"What will you do first, when will you do it, and what evidence will you bring to your 7/30/90-day review?"};
  return [brief,product,ready,reflection];
}

export function applySynthesisPhase9(course:Course):Course{
  const id=safeId(course.id); const modules=course.modules.filter(module=>!module.id.startsWith(`${P9}${id}-`));
  const additions=phase9Modules(course); const anchor=`overhaul1-cycle-${id}-4-activity`; insertAfter(modules,anchor,additions);
  return {...course,duration:course.duration+12,modules};
}

function phase10Modules(course:Course):Module[]{
  const id=safeId(course.id); const lens=categoryLanguage(course.category);
  const opener:VisualModule={id:`${P10}${id}-identity`,type:"visual",title:`${lens.archetype} · how to use this course`,layout:"compare",caption:`${course.title} is presented as a ${lens.archetype.toLowerCase()}, so staff know what kind of professional thinking is expected.`,items:[
    {heading:"LOOK FOR",text:lens.evidence,icon:"◎"},{heading:"PROTECT",text:lens.boundary,icon:"◇"},{heading:"DO",text:lens.principle,icon:"→"},
  ]};
  const critique:ActivityModule={id:`${P10}${id}-expert`,type:"activity",title:"Expert challenge · when would this not work?",prompt:"Finish by identifying the limits of the course rather than treating good practice as a universal recipe.",instructions:["Name one context where the approach would need substantial adaptation.","Identify one piece of evidence that could make you change your mind.","State one implementation failure that could make a sound principle look ineffective.","Write one question an experienced colleague should still be asking after this course."],placeholder:"Context limit… Evidence that would change my view… Implementation risk… Expert question…",minimumCharacters:120};
  return [opener,critique];
}

export function applyArchetypePolishPhase10(course:Course):Course{
  const id=safeId(course.id); const modules=course.modules.filter(module=>!module.id.startsWith(`${P10}${id}-`)); const additions=phase10Modules(course);
  const overviewIndex=modules.findIndex(module=>module.id===`overhaul1-cycle-${id}-overview`); modules.splice(overviewIndex>=0?overviewIndex+1:Math.min(2,modules.length),0,additions[0]);
  insertBefore(modules,`${P9}${id}-commit`,[additions[1]]);
  return {...course,duration:course.duration+5,modules};
}

function active(module:Module){return ["quiz","scenario","activity","checklist","reflection"].includes(module.type);}
function passive(module:Module){return module.type==="content"||module.type==="visual";}
function longestPassive(modules:Module[]){let run=0,longest=0; for(const module of modules){run=passive(module)?run+1:0;longest=Math.max(longest,run);}return longest;}

export function auditFinalPresentationPhases7to10(course:Course):FinalPresentationAudit{
  const id=safeId(course.id); const visuals=course.modules.filter(module=>module.id.startsWith(`${P7}${id}-`)).length; const paths=course.modules.filter(module=>module.id.startsWith(`${P8}${id}-`)).length; const synthesis=course.modules.filter(module=>module.id.startsWith(`${P9}${id}-`)).length; const archetype=course.modules.filter(module=>module.id.startsWith(`${P10}${id}-`)).length; const activeShare=course.modules.length?Math.round(course.modules.filter(active).length/course.modules.length*100):0; const longest=longestPassive(course.modules); const lens=categoryLanguage(course.category);
  const checks=[visuals>=3,paths>=3,synthesis>=4,archetype>=2,activeShare>=35,longest<=3]; const score=checks.reduce((sum,passed)=>sum+(passed?Math.round(100/checks.length):0),0);
  return {courseId:course.id,title:course.title,archetype:lens.archetype,instructionalVisuals:visuals,adaptivePathways:paths,synthesisModules:synthesis,archetypeModules:archetype,activeShare,longestPassiveRun:longest,score:Math.min(100,score),ready:checks.every(Boolean)};
}

export function validateFinalPresentationPhases7to10(course:Course){const audit=auditFinalPresentationPhases7to10(course); if(!audit.ready) throw new Error(`CPD course ${course.id} failed final presentation phases 7–10 QA`);}
export function summariseFinalPresentationPhases7to10(courses:Course[]){const reports=courses.map(auditFinalPresentationPhases7to10);return {courseCount:reports.length,ready:reports.filter(report=>report.ready).length,averageScore:reports.length?Math.round(reports.reduce((sum,report)=>sum+report.score,0)/reports.length):0,averageActiveShare:reports.length?Math.round(reports.reduce((sum,report)=>sum+report.activeShare,0)/reports.length):0,archetypes:[...new Set(reports.map(report=>report.archetype))],reports};}
