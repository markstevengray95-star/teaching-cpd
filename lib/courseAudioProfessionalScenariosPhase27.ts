import type { Course, CourseCategory } from "./data";

export const PRESENTATION_OVERHAUL_PHASE27_VERSION = "2026.28";

export type Phase27Turn={speaker:string;role:string;line:string;tone:"calm"|"uncertain"|"direct"|"reflective"};
export type Phase27Option={id:string;label:string;best:boolean};
export type Phase27Analysis={id:string;prompt:string;options:Phase27Option[];feedback:string};
export type Phase27Pack={id:string;anchorId:string;title:string;context:string;turns:Phase27Turn[];analysis:Phase27Analysis[]};
export type Phase27Audit={courseId:string;title:string;turns:number;analysisQuestions:number;audioReady:boolean;transcript:boolean;anchorFound:boolean;ready:boolean;score:number};

type AnalysisTuple=[string,string,string[],number,string];
type Lens={title:string;context:string;turns:Phase27Turn[];analysis:AnalysisTuple[]};

function safeId(v:string){return v.replace(/[^a-z0-9-]/gi,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").toLowerCase();}
function options(labels:string[],best:number){return labels.map((label,index)=>({id:String.fromCharCode(65+index),label,best:index===best}));}
function anchor(course:Course){return course.modules.find(m=>m.type==="reflection")?.id||course.modules.find(m=>m.type==="scenario")?.id||course.modules.find(m=>m.type==="content")?.id||course.modules[0]?.id||"";}
function a(id:string,prompt:string,labels:string[],best:number,feedback:string):AnalysisTuple{return[id,prompt,labels,best,feedback];}
function t(speaker:string,role:string,line:string,tone:Phase27Turn["tone"]):Phase27Turn{return{speaker,role,line,tone};}

function lens(category:CourseCategory,course:Course):Lens{
  if(category==="Safeguarding")return{title:"Professional listening: after the disclosure",context:"Listen to a short staff conversation after a pupil has shared a concern. Analyse professional boundaries, recording and escalation.",turns:[
    t("Teacher","Class teacher","A pupil told me something worrying at the end of lesson. I listened, kept my questions minimal and said I would need to pass it on.","calm"),
    t("Colleague","Nearby colleague","Do you want me to speak to the pupil as well so we can work out exactly what happened?","uncertain"),
    t("Teacher","Class teacher","I do not think we should investigate it ourselves. I have written down what was said and what I observed.","direct"),
    t("Colleague","Nearby colleague","That makes sense. Are you going straight to the school's safeguarding route now?","reflective"),
    t("Teacher","Class teacher","Yes. I will follow the current procedure and pass on any further factual information if it emerges.","calm"),
  ],analysis:[
    a("boundary","Which part of the conversation best protects professional boundaries?",["Avoiding staff-led investigation","Trying to establish the full story before reporting","Sharing details widely so colleagues can help"],0,"The member of staff should listen and report through the designated safeguarding route rather than investigate."),
    a("record","What makes the teacher's recording approach stronger?",["It separates what was said or observed from interpretation","It explains what probably happened","It waits for another adult to confirm the concern"],0,"A factual record preserves useful information without turning assumptions into facts."),
    a("next","What is the strongest next step?",["Use the school's current safeguarding procedure promptly","Keep the note privately until more evidence appears","Ask the pupil to repeat the account to several staff"],0,"Current school safeguarding procedures and designated safeguarding staff guide the next response."),
  ]};
  if(category==="SEND")return{title:"Professional dialogue: planning an adaptive response",context:"A teacher and teaching assistant discuss a learner who can explain the idea but struggles to begin a written task.",turns:[
    t("Teacher","Class teacher","She explained the concept accurately when I asked her, but the page stayed blank for several minutes.","reflective"),
    t("TA","Teaching assistant","I could sit beside her and tell her each step as she goes.","uncertain"),
    t("Teacher","Class teacher","That might get the work completed, but I want to know which part of starting the task is the barrier.","direct"),
    t("TA","Teaching assistant","The instructions are all in one paragraph. A short visible sequence might let her start without me prompting every step.","reflective"),
    t("Teacher","Class teacher","Let's try that, keep the same learning goal and check whether she needs less support next time.","calm"),
  ],analysis:[
    a("diagnosis","What is strongest about the teacher's response?",["The teacher identifies the specific access barrier before changing the task","The teacher assumes the learning goal is too difficult","The teacher treats task completion as the only evidence needed"],0,"Adaptive teaching is stronger when support responds to a specific barrier rather than a broad label or assumption."),
    a("scaffold","Why is the visible sequence preferable to continuous adult prompting?",["It can reduce the access barrier while preserving pupil thinking and independence","It guarantees the learner will never need support again","It makes the task easier by changing the learning goal"],0,"A good scaffold supports access without doing the cognitive work for the learner."),
    a("review","What should the team look for next time?",["Whether the learner can start more independently and accurately","Whether the worksheet is completed faster than everyone else's","Whether the same scaffold can be made permanent without review"],0,"The review should test whether support is improving independent access and whether it can be faded or adapted."),
  ]};
  if(category==="Leadership")return{title:"Leadership conversation: support before surveillance",context:"A middle leader and senior leader discuss inconsistent implementation of a department routine.",turns:[
    t("Middle leader","Head of department","The routine is happening in some lessons, but staff are using it in very different ways.","uncertain"),
    t("Senior leader","Line manager","Before we increase monitoring, can everyone describe the core practice and why it matters?","reflective"),
    t("Middle leader","Head of department","Not consistently. I think our original guidance left too much open to interpretation.","direct"),
    t("Senior leader","Line manager","Then clarify the smallest non-negotiable part, model it and ask the team what is getting in the way.","calm"),
    t("Middle leader","Head of department","That will help me separate a clarity problem from a capability or workload problem before deciding the next action.","reflective"),
  ],analysis:[
    a("sequence","Why does the senior leader resist increasing monitoring immediately?",["Because clarity and support should come before using monitoring to diagnose implementation","Because monitoring should never be used in schools","Because staff should choose any version of the routine they prefer"],0,"Monitoring is more informative when the expected practice is clear and staff have had a fair opportunity to develop capability."),
    a("diagnose","Which distinction is most useful after clarification?",["Whether the barrier is capability, capacity or system design","Whether individual staff can be ranked from best to worst","Whether the initiative is popular"],0,"Different barriers require different responses; diagnosis prevents blanket solutions."),
    a("culture","What professional culture does the conversation model?",["Specific expectations combined with support, evidence and professional dialogue","Vague expectations followed by punitive checking","Avoiding difficult implementation conversations entirely"],0,"Strong implementation combines clarity with proportionate support and evidence-led review."),
  ]};
  if(category==="Wellbeing")return{title:"Workload conversation: fix the system, not the person",context:"A team leader and colleague discuss a recurring workload pressure and decide whether the solution should be individual or systemic.",turns:[
    t("Colleague","Teacher","The weekly tracking task is taking me nearly an hour because I copy the same information into two places.","uncertain"),
    t("Leader","Team leader","Is that happening to other people too, or is it specific to your classes?","reflective"),
    t("Colleague","Teacher","Most of the team mentioned the same duplication at our meeting.","direct"),
    t("Leader","Team leader","Then this looks like a process problem we can test, not something solved by telling people to be more resilient.","calm"),
    t("Colleague","Teacher","Could we remove one entry step for a month and compare time saved and any effect on the information we actually need?","reflective"),
  ],analysis:[
    a("signal","What makes this a plausible system-level workload issue?",["The same duplicated process affects several staff repeatedly","One person dislikes a task","The team is busy during a particular week"],0,"Repeated patterns across people and workflow are stronger evidence of avoidable system friction."),
    a("test","Why is the proposed one-month change useful?",["It creates a bounded test with a clear before-and-after comparison","It guarantees the process will never need reviewing again","It adds another wellbeing activity without changing workload"],0,"A bounded process change makes the effect easier to evaluate."),
    a("review","What should the review include?",["Time/process evidence plus staff experience across everyone affected","Only whether the change was popular","Only whether the leader thinks the new process looks simpler"],0,"Good workload review checks both system performance and staff experience, including displaced burden."),
  ]};
  if(category==="Digital Teaching")return{title:"Digital judgement: when an AI draft sounds convincing",context:"Two colleagues review an AI-assisted resource before it is used with pupils.",turns:[
    t("Teacher","Subject teacher","The draft is clear and saved me time, but it includes three factual explanations I have not checked yet.","reflective"),
    t("Colleague","Digital lead","The wording sounds confident, but that does not tell us whether the claims are accurate.","direct"),
    t("Teacher","Subject teacher","I will verify the factual content against reliable sources and check the examples fit the age group.","calm"),
    t("Colleague","Digital lead","Also make sure no sensitive pupil data was used and that the resource is accessible to the learners who need it.","reflective"),
    t("Teacher","Subject teacher","Then I will make the final professional judgement about whether it is suitable to use.","calm"),
  ],analysis:[
    a("accuracy","What misconception does the colleague challenge?",["That fluent language is evidence of factual accuracy","That digital tools can ever save time","That teachers should use reliable sources"],0,"Generated content can sound authoritative while still being wrong, incomplete or unsuitable."),
    a("boundary","Which checks extend beyond factual accuracy?",["Privacy, accessibility and educational suitability","Only spelling and punctuation","Whether the tool produced the answer quickly"],0,"Responsible digital use includes privacy, accessibility and professional suitability, not only correctness."),
    a("ownership","Who remains accountable for the final resource?",["The professional who checks and approves it","The AI system","The colleague who suggested the tool"],0,"Digital tools can assist work, but professional accountability remains human."),
  ]};
  return{title:`Professional conversation: ${course.title}`,context:"Listen to colleagues reason through a professional decision, then analyse the evidence, teaching move and follow-up check.",turns:[
    t("Teacher A","Teacher","The class looked busy, but the exit responses show several pupils still hold the same misconception.","reflective"),
    t("Teacher B","Colleague","So the activity itself is not enough evidence that the learning is secure.","calm"),
    t("Teacher A","Teacher","Exactly. I want to identify the specific error before deciding whether to re-explain, contrast examples or add practice.","direct"),
    t("Teacher B","Colleague","After that, use a short independent check so you know whether the response actually changed their thinking.","reflective"),
    t("Teacher A","Teacher","That gives me a clearer evidence-to-action cycle rather than just adding another task.","calm"),
  ],analysis:[
    a("evidence","What evidence changes the teacher's view of the lesson?",["Pupil responses showing the misconception remains","How busy the class looked","The amount of work completed"],0,"Evidence of pupil thinking is more useful than surface activity when deciding what to teach next."),
    a("response","Why identify the specific error before choosing a strategy?",["It makes the teaching response more likely to match the problem","It guarantees one strategy will work for every pupil","It removes the need for follow-up assessment"],0,"Diagnosis creates a clearer link between the learning problem and the teaching response."),
    a("check","Why use an independent follow-up check?",["To test whether the learning transfers without the same support","To make the lesson feel more demanding","To increase the amount of written work"],0,"Independent transfer evidence helps distinguish secure learning from guided success."),
  ]};
}

export function getPhase27Pack(course:Course):Phase27Pack{const l=lens(course.category,course);return{id:`phase27-${safeId(course.id)}`,anchorId:anchor(course),title:l.title,context:l.context,turns:l.turns,analysis:l.analysis.map(([id,prompt,labels,best,feedback])=>({id,prompt,options:options(labels,best),feedback}))};}
export function validateAudioProfessionalScenariosPhase27(course:Course){const pack=getPhase27Pack(course);if(!pack.anchorId)throw new Error(`Phase 27 ${course.id}: missing audio scenario anchor`);if(pack.turns.length<5)throw new Error(`Phase 27 ${course.id}: requires a substantial professional conversation`);if(pack.analysis.length!==3)throw new Error(`Phase 27 ${course.id}: requires three analysis questions`);if(pack.analysis.some(item=>item.options.length<3||item.options.filter(o=>o.best).length!==1))throw new Error(`Phase 27 ${course.id}: every analysis question needs one strongest answer`);if(pack.turns.some(turn=>!turn.speaker||!turn.role||!turn.line))throw new Error(`Phase 27 ${course.id}: incomplete transcript turn`);return true;}
export function auditAudioProfessionalScenariosPhase27(course:Course):Phase27Audit{const pack=getPhase27Pack(course);let ready=true;try{validateAudioProfessionalScenariosPhase27(course);}catch{ready=false;}const anchorFound=course.modules.some(m=>m.id===pack.anchorId);const score=Math.min(100,(pack.turns.length>=5?25:0)+(pack.analysis.length===3?25:0)+(pack.analysis.every(a=>a.options.length>=3)?20:0)+(anchorFound?20:0)+(ready?10:0));return{courseId:course.id,title:course.title,turns:pack.turns.length,analysisQuestions:pack.analysis.length,audioReady:true,transcript:true,anchorFound,ready,score};}
export function summariseAudioProfessionalScenariosPhase27(courses:Course[]){const reports=courses.map(auditAudioProfessionalScenariosPhase27);return{courseCount:reports.length,ready:reports.filter(r=>r.ready).length,totalTurns:reports.reduce((sum,r)=>sum+r.turns,0),totalAnalysisQuestions:reports.reduce((sum,r)=>sum+r.analysisQuestions,0),audioReady:reports.filter(r=>r.audioReady).length,transcriptReady:reports.filter(r=>r.transcript).length,averageScore:reports.length?Math.round(reports.reduce((sum,r)=>sum+r.score,0)/reports.length):0,reports};}
