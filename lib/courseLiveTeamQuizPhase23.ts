import type { Course, CourseCategory } from "./data";

export const PRESENTATION_OVERHAUL_PHASE23_VERSION = "2026.24";

export type Phase23RoundKind = "quiz" | "scenario_vote" | "reveal_discuss";
export type Phase23Option = { id: string; label: string; correct: boolean };
export type Phase23Round = { id: string; kind: Phase23RoundKind; title: string; prompt: string; options: Phase23Option[]; reveal: string; discussion: string; seconds: number };
export type Phase23Pack = { id: string; title: string; subtitle: string; rounds: Phase23Round[]; teamRules: string[] };
export type Phase23Audit = { courseId: string; title: string; rounds: number; kinds: number; individualLeaderboards: number; discussionRounds: number; ready: boolean; score: number };

function safeId(value:string){return value.replace(/[^a-z0-9-]/gi,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").toLowerCase();}

function lens(category:CourseCategory, course:Course){
  if(category==="Safeguarding") return {
    quiz:["Which staff response is most defensible when a pupil shares an incomplete concern?",["Listen, record factually and use the school safeguarding route promptly","Investigate until the full account is clear","Share widely so colleagues can watch for signs","Wait until the concern can be proved"],0],
    vote:["A colleague asks for details because they teach the pupil tomorrow. What should the team prioritise?",["Need-to-know information through the correct safeguarding process","A full informal briefing so everyone understands the story","Ask the pupil to repeat the disclosure to several staff","Delay action until the team agrees on what probably happened"],0],
    discuss:["Which part of a safeguarding response is easiest for well-meaning staff to overstep?",["Listening without investigating","Keeping factual records","Using the designated route","Maintaining appropriate confidentiality"],0],
    reveal:"Safe professional judgement protects the pupil and the evidence trail by staying factual, prompt and inside the staff role.",
  };
  if(category==="SEND") return {
    quiz:["A learner understands verbally but stalls on a multi-step written task. What is the strongest first move?",["Identify the access barrier and test a small scaffold while preserving the goal","Lower the learning goal immediately","Add permanent adult prompting to every step","Assume motivation is the main problem"],0],
    vote:["The scaffold improves completion but the learner waits for it every time. What next?",["Review independence and fade or alter support using evidence","Keep the support permanently because completion improved","Make the task easier again","Add a second adult prompt"],0],
    discuss:["What should a team protect when adapting work?",["The intended learning outcome and growing independence","Maximum task completion at any cost","Identical support in every lesson","A fixed strategy attached to the label"],0],
    reveal:"Adaptive teaching works best when teams identify the barrier, preserve ambition and review whether support is helping access without creating dependence.",
  };
  if(category==="Leadership") return {
    quiz:["Implementation is inconsistent. What should a leader diagnose first?",["Clarity, capability and capacity","Who is least compliant","Which staff need public comparison","How quickly monitoring can increase"],0],
    vote:["One team is struggling because the routine creates extra workload. What is the strongest next move?",["Clarify the core practice and remove avoidable burden before judging fidelity","Demand full implementation unchanged","Pause all implementation indefinitely","Add another reporting requirement"],0],
    discuss:["What makes implementation evidence useful?",["It helps decide support, adaptation and review","It ranks staff by compliance","It proves the initiative works automatically","It removes the need for professional judgement"],0],
    reveal:"Implementation quality improves when monitoring is used to diagnose and support the work, not as a substitute for clarity, modelling and capacity.",
  };
  if(category==="Wellbeing") return {
    quiz:["Staff cite duplicated processes and clustered deadlines. What is the strongest first response?",["Change a controllable system pressure and measure the effect","Add another wellbeing activity only","Tell staff to manage time better","Assume the pressure is unavoidable"],0],
    vote:["A popular wellbeing event scores highly but workload remains unchanged. What does that evidence show?",["The event may be valued, but it has not yet demonstrated workload reduction","The workload problem is solved","Staff resilience is now sufficient","More events will automatically reduce workload"],0],
    discuss:["Which evidence best tests a workload change?",["Time, duplication, deadline and staff-experience evidence together","Attendance at a wellbeing event alone","Number of posters produced","How positive the launch felt"],0],
    reveal:"Wellbeing improvement is strongest when the team changes avoidable system friction and checks whether the burden actually reduces.",
  };
  if(category==="Digital Teaching") return {
    quiz:["A digital workflow saves time and looks polished. What must happen before wider use?",["Check purpose, privacy, accessibility, accuracy and human oversight","Scale immediately because it is faster","Let every user define their own data boundary","Assume polished output is accurate"],0],
    vote:["A generated resource contains one subtle factual error. What is the strongest team response?",["Strengthen verification according to the risk of the task","Stop checking because most outputs were correct","Ban every digital tool permanently","Ask pupils to find all errors instead"],0],
    discuss:["Where should human responsibility remain?",["With the professional using and approving the output","With the tool provider","With whoever wrote the longest prompt","With the first person who notices an error"],0],
    reveal:"Digital tools can support professional work, but speed and fluency never replace verification, accessibility, privacy and human accountability.",
  };
  return {
    quiz:[`Which move best reflects the core learning principle in ${course.title}?`,["Use evidence of pupil thinking to decide the next teaching move","Treat visible engagement as proof of learning","Repeat the same explanation regardless of evidence","Judge understanding only from volunteers"],0],
    vote:["A repeated misconception appears after an apparently successful lesson. What should happen next?",["Diagnose the misconception, reteach precisely and check independent application","Add more of the same practice without diagnosis","Move on because most pupils looked engaged","Lower the task demand for everyone"],0],
    discuss:["Which signal should carry most weight when deciding whether learning is secure?",["Independent evidence of pupil thinking","How busy the room looked","How much writing was completed","How many hands went up"],0],
    reveal:"Strong teaching decisions are driven by evidence of thinking, a precise diagnosis and a reviewable next move rather than surface activity alone.",
  };
}

function makeOptions(labels:string[],correct:number):Phase23Option[]{return labels.map((label,index)=>({id:String.fromCharCode(65+index),label,correct:index===correct}));}

export function getPhase23Pack(course:Course):Phase23Pack{
  const x=lens(course.category,course);
  return {id:`phase23-${safeId(course.id)}`,title:`Live Team Quiz · ${course.title}`,subtitle:"Facilitator-led team rounds with voting, reveal and discussion. Scores exist only inside the current team session — there is no individual staff league table.",teamRules:["Discuss before committing a team answer.","One shared answer per team per round.","Reveal reasoning before awarding points.","Use the final round to discuss transfer, not just score."],rounds:[
    {id:"r1",kind:"quiz",title:"Round 1 · Knowledge under pressure",prompt:x.quiz[0] as string,options:makeOptions(x.quiz[1] as string[],x.quiz[2] as number),reveal:x.reveal,discussion:"Which course principle made the strongest option defensible?",seconds:45},
    {id:"r2",kind:"scenario_vote",title:"Round 2 · Scenario vote",prompt:x.vote[0] as string,options:makeOptions(x.vote[1] as string[],x.vote[2] as number),reveal:x.reveal,discussion:"What evidence or professional boundary rules out the tempting alternatives?",seconds:60},
    {id:"r3",kind:"reveal_discuss",title:"Round 3 · Reveal & discuss",prompt:x.discuss[0] as string,options:makeOptions(x.discuss[1] as string[],x.discuss[2] as number),reveal:x.reveal,discussion:"Agree one sentence the team would use to explain this principle to a colleague tomorrow.",seconds:90},
  ]};
}

export function validateLiveTeamQuizPhase23(course:Course){const p=getPhase23Pack(course);if(p.rounds.length!==3)throw new Error(`Phase 23 ${course.id}: requires three rounds`);if(new Set(p.rounds.map(r=>r.kind)).size!==3)throw new Error(`Phase 23 ${course.id}: requires quiz, vote and discussion rounds`);if(p.rounds.some(r=>r.options.length<4||r.options.filter(o=>o.correct).length!==1))throw new Error(`Phase 23 ${course.id}: every round needs four options and one strongest answer`);if(/individual leaderboard|rank individual/i.test(JSON.stringify(p).replace("there is no individual staff league table","")))throw new Error(`Phase 23 ${course.id}: individual ranking is not allowed`);return true;}
export function auditLiveTeamQuizPhase23(course:Course):Phase23Audit{const p=getPhase23Pack(course);let ready=true;try{validateLiveTeamQuizPhase23(course);}catch{ready=false;}const text=JSON.stringify(p);const individualLeaderboards=(text.match(/rank individual/gi)||[]).length;const kinds=new Set(p.rounds.map(r=>r.kind)).size;const discussionRounds=p.rounds.filter(r=>r.kind==="reveal_discuss").length;const score=Math.min(100,(p.rounds.length===3?25:0)+(kinds===3?25:0)+(discussionRounds===1?20:0)+(individualLeaderboards===0?20:0)+(ready?10:0));return{courseId:course.id,title:course.title,rounds:p.rounds.length,kinds,individualLeaderboards,discussionRounds,ready,score};}
export function summariseLiveTeamQuizPhase23(courses:Course[]){const reports=courses.map(auditLiveTeamQuizPhase23);return{courseCount:reports.length,ready:reports.filter(r=>r.ready).length,totalRounds:reports.reduce((s,r)=>s+r.rounds,0),individualLeaderboards:reports.reduce((s,r)=>s+r.individualLeaderboards,0),averageScore:reports.length?Math.round(reports.reduce((s,r)=>s+r.score,0)/reports.length):0,reports};}
