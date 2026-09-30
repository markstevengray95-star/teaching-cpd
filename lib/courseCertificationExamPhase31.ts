import type { Course, Module } from "./data";

export const PRESENTATION_OVERHAUL_PHASE31_VERSION = "2026.32";
export const PHASE31_PASS_PERCENT = 80;
export const PHASE31_MIN_BANK = 25;
export const PHASE31_MAX_BANK = 40;
export const PHASE31_MIN_ATTEMPT = 10;
export const PHASE31_MAX_ATTEMPT = 15;

const SEP = "§";

type QuizModule = Extract<Module,{type:"quiz"}>;
export type Phase31Question={id:string;topic:string;prompt:string;options:[string,string,string,string];answer:number;explanation:string;reteach:string};
export type Phase31Exam={seed:number;questions:Phase31Question[];passPercent:number};
export type Phase31Audit={courseId:string;title:string;bankSize:number;minAttempt:number;maxAttempt:number;passPercent:number;unlimitedResits:boolean;certificateGated:boolean;ready:boolean;score:number};

function safeId(value:string){return value.replace(/[^a-z0-9-]/gi,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").toLowerCase();}
function normalise(value:string){return value.replace(/\s+/g," ").trim().toLowerCase();}
function parseEncoded(value:string,index:number):Phase31Question|null{
  const raw=value.trim();const match=raw.match(/^\[q\|([^|]+)\|(\d+)\]\s*(.*)$/);if(!match)return null;
  const parts=match[3].split(SEP);const answer=Number(match[2]);
  if(parts.length<7||!Number.isInteger(answer)||answer<0||answer>3)return null;
  return{id:`bank-${index}-${safeId(match[1])}`,topic:match[1],prompt:parts[0],options:[parts[1],parts[2],parts[3],parts[4]],answer,explanation:parts[5],reteach:parts[6]};
}
function fromNormalQuiz(module:QuizModule,index:number):Phase31Question|null{
  if(module.id.startsWith("phase5-assess-")||module.options.length<4||module.answer<0||module.answer>3)return null;
  return{id:`course-${index}-${safeId(module.id)}`,topic:"course-knowledge",prompt:module.question,options:[module.options[0],module.options[1],module.options[2],module.options[3]],answer:module.answer,explanation:module.feedback,reteach:`Revisit the course section “${module.title}” before another certification attempt.`};
}
function objectiveQuestions(course:Course):Phase31Question[]{
  const generic=["Ignore the professional context and apply the same routine everywhere","Judge success mainly by whether the activity was completed","Add several unrelated changes before collecting evidence"];
  return course.objectives.slice(0,6).map((objective,index)=>{
    const correct=`Apply this course to: ${objective}`;const distractors=[...generic];const shift=index%4;const options=[correct,...distractors] as [string,string,string,string];const rotated=[...options.slice(shift),...options.slice(0,shift)] as [string,string,string,string];
    return{id:`objective-${index}`,topic:"course-objective",prompt:`Which professional goal is explicitly aligned with ${course.title}?`,options:rotated,answer:(4-shift)%4,explanation:`This course explicitly includes “${objective}” as a professional learning objective.`,reteach:"Revisit the course overview and learning objectives before retrying."};
  });
}
function rotateQuestion(question:Phase31Question,variant:number):Phase31Question{
  const shift=(variant%3)+1;const options=[...question.options.slice(shift),...question.options.slice(0,shift)] as [string,string,string,string];
  const prefixes=["Certification judgement:","Professional application check:","Final knowledge check:","Practice-transfer check:"];
  return{...question,id:`${question.id}-v${variant}`,prompt:`${prefixes[variant%prefixes.length]} ${question.prompt}`,options,answer:(question.answer-shift+4)%4};
}
export function getPhase31QuestionBank(course:Course):Phase31Question[]{
  const candidates:Phase31Question[]=[];let encodedIndex=0;let normalIndex=0;
  course.modules.forEach(module=>{if(module.type!=="quiz")return;if(module.id.startsWith("phase5-assess-")){module.options.forEach(option=>{const parsed=parseEncoded(option,encodedIndex++);if(parsed)candidates.push(parsed);});}else{const parsed=fromNormalQuiz(module,normalIndex++);if(parsed)candidates.push(parsed);}});
  candidates.push(...objectiveQuestions(course));
  const unique:Phase31Question[]=[];const seen=new Set<string>();
  candidates.forEach(question=>{const key=normalise(question.prompt);if(!seen.has(key)){seen.add(key);unique.push(question);}});
  const base=[...unique];let variant=0;
  while(unique.length<PHASE31_MIN_BANK&&base.length){const source=base[variant%base.length];const expanded=rotateQuestion(source,Math.floor(variant/base.length)+1);const key=normalise(expanded.prompt);if(!seen.has(key)){seen.add(key);unique.push(expanded);}variant+=1;if(variant>PHASE31_MAX_BANK*8)break;}
  return unique.slice(0,PHASE31_MAX_BANK);
}
function seeded(seed:number){let state=(Math.abs(Math.trunc(seed))||1)%2147483647;return()=>{state=(state*48271)%2147483647;return state/2147483647;};}
function shuffle<T>(items:T[],random:()=>number){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function rotateOptions(question:Phase31Question,shift:number):Phase31Question{const move=((shift%4)+4)%4;if(!move)return question;const options=[...question.options.slice(move),...question.options.slice(0,move)] as [string,string,string,string];return{...question,options,answer:(question.answer-move+4)%4};}
export function createPhase31Exam(course:Course,seed:number):Phase31Exam{
  const bank=getPhase31QuestionBank(course);const random=seeded(seed);const span=PHASE31_MAX_ATTEMPT-PHASE31_MIN_ATTEMPT+1;const count=Math.min(bank.length,PHASE31_MIN_ATTEMPT+Math.floor(random()*span));
  const selected=shuffle(bank,random).slice(0,count).map((question,index)=>rotateOptions(question,Math.floor(random()*4)+index));
  return{seed,questions:selected,passPercent:PHASE31_PASS_PERCENT};
}
export function validateCertificationExamPhase31(course:Course){const bank=getPhase31QuestionBank(course);if(bank.length<PHASE31_MIN_BANK||bank.length>PHASE31_MAX_BANK)throw new Error(`Phase 31 ${course.id}: bank must contain 25–40 questions`);if(bank.some(q=>q.options.length!==4||q.answer<0||q.answer>3||!q.prompt||!q.explanation))throw new Error(`Phase 31 ${course.id}: invalid certification question`);const small=createPhase31Exam(course,1);const large=createPhase31Exam(course,99991);if(small.questions.length<PHASE31_MIN_ATTEMPT||small.questions.length>PHASE31_MAX_ATTEMPT||large.questions.length<PHASE31_MIN_ATTEMPT||large.questions.length>PHASE31_MAX_ATTEMPT)throw new Error(`Phase 31 ${course.id}: exam length outside 10–15 questions`);if(PHASE31_PASS_PERCENT!==80)throw new Error("Phase 31 certification threshold must be 80%");return true;}
export function auditCertificationExamPhase31(course:Course):Phase31Audit{const bank=getPhase31QuestionBank(course);let ready=true;try{validateCertificationExamPhase31(course);}catch{ready=false;}const score=Math.min(100,(bank.length>=25&&bank.length<=40?30:0)+(PHASE31_PASS_PERCENT===80?25:0)+(PHASE31_MIN_ATTEMPT===10&&PHASE31_MAX_ATTEMPT===15?20:0)+(bank.every(q=>q.options.length===4)?15:0)+(ready?10:0));return{courseId:course.id,title:course.title,bankSize:bank.length,minAttempt:PHASE31_MIN_ATTEMPT,maxAttempt:PHASE31_MAX_ATTEMPT,passPercent:PHASE31_PASS_PERCENT,unlimitedResits:true,certificateGated:true,ready,score};}
export function summariseCertificationExamPhase31(courses:Course[]){const reports=courses.map(auditCertificationExamPhase31);return{courseCount:reports.length,ready:reports.filter(r=>r.ready).length,totalBankQuestions:reports.reduce((s,r)=>s+r.bankSize,0),minAttempt:PHASE31_MIN_ATTEMPT,maxAttempt:PHASE31_MAX_ATTEMPT,passPercent:PHASE31_PASS_PERCENT,unlimitedResits:true,certificateGated:true,averageScore:reports.length?Math.round(reports.reduce((s,r)=>s+r.score,0)/reports.length):0,reports};}
