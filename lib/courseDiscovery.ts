import type { Course } from "./data";
import { shortCourseParents } from "./shortCourses";
import { courseFinished, learningPathways, type LearningProgress, type PathwayRole } from "./coursePathways";

export const learningNeeds = [
  ...learningPathways.map(p=>({id:p.id,label:p.title})),
  {id:"literacy-language",label:"Develop literacy and language"},
  {id:"digital",label:"Use technology safely and effectively"},
] as const;
const literacy = new Set(["disciplinary-literacy","eal-inclusive-teaching","speech-language-communication-needs","explicit-vocabulary-teaching","reading-across-curriculum","oracy-classroom-talk","writing-across-curriculum","dyslexia-classroom-support"]);
const additionalNeeds: Record<string,readonly string[]> = {
  "classroom-start":["ect-induction","cover-supply-classroom-management","regulation-support-academy"],
  "visible-thinking":["assessment-for-learning","assessment-moderation-reliability"],
  "inclusive-access":["universal-design-learning","high-attaining-pupils","supporting-disadvantaged-pupils","gender-participation-learning","maslow-needs"],
  "durable-learning":["rosenshine-principles","effective-explanations","memory-study-strategies","effective-group-work","numeracy-across-curriculum"],
  "safeguarding-response":["bullying-cyberbullying-peer-abuse","child-on-child-abuse-awareness","prevent-duty-awareness","self-harm-suicide-awareness-staff","professional-boundaries-staff-conduct"],
  "safe-school":["fire-safety-emergency-evacuation","accident-near-miss-riddor-awareness","medical-conditions-schools","allergy-safety-schools-2026","school-security-emergency-awareness","coshh-hazardous-substances-awareness","asbestos-awareness-schools","educational-visits-trip-safety","first-aid-awareness-non-first-aiders","science-laboratory-safety-awareness","pe-safety-awareness","dt-workshop-safety-awareness","staff-induction-school"],
  "pastoral-support":["trauma-informed-practice","attachment-aware-practice","supporting-bereaved-pupils","looked-after-previously-looked-after","supporting-young-carers","parent-communication","difficult-parent-conversations","semh-classroom-practice"],
  "lead-team":["staff-wellbeing","difficult-conversations","curriculum-sequencing","curriculum-intent-implementation-impact","subject-leadership","effective-learning-walks","developmental-lesson-feedback"],
  "digital":["school-data-protection-gdpr","cybersecurity-school-staff","ai-in-education","academic-integrity-ai"],
};

export function courseNeeds(course: Course) {
  const id=shortCourseParents[course.id] || course.id;
  const needs=learningPathways.filter(p=>p.steps.some(s=>s.courseId===course.id || s.courseId===id)).map(p=>p.id);
  for(const [need,ids] of Object.entries(additionalNeeds)) if(ids.includes(id) && !needs.includes(need)) needs.push(need);
  if(course.category==="SEND" && !needs.includes("inclusive-access")) needs.push("inclusive-access");
  if(literacy.has(id)) needs.push("literacy-language");
  if(course.category==="Digital Teaching") needs.push("digital");
  return needs;
}

export function suitsRole(course: Course, role: string): boolean {
  if(role==="All") return true;
  const audience=course.recommendedFor.join(" ").toLowerCase();
  if(/all staff/.test(audience)) return true;
  const patterns: Record<PathwayRole,RegExp> = {
    Teacher:/teacher|teachers|ect|tutor|cover|supply/,
    ECT:/ect|new staff|teacher/,
    "Teaching assistant":/teaching assistant|send staff|support staff/,
    "Pastoral staff":/pastoral|tutor|attendance|send staff/,
    Leader:/lead|leadership|leader|coach|mentor/,
    "Support staff":/support staff|site staff|estates|technician|reception|cleaning|catering|volunteer/,
  };
  return patterns[role as PathwayRole]?.test(audience) || false;
}

export function searchText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/\bta\b/g,"teaching assistant").replace(/\bafl\b/g,"assessment for learning")
    .replace(/\bbehavior\b/g,"behaviour").replace(/&/g," and ").replace(/[^a-z0-9]+/g," ")
    .trim();
}
export type DiscoveryFilters = {search:string;category:string;role:string;need:string;maxMinutes:string;kind:string;level:string;status:string;sort:string};
export const defaultDiscoveryFilters: DiscoveryFilters = {search:"",category:"All",role:"All",need:"All",maxMinutes:"All",kind:"All",level:"All",status:"All",sort:"suggested"};
const searchIndex = new WeakMap<Course,string>();
function indexedText(course: Course) {
  const cached=searchIndex.get(course);if(cached) return cached;
  const text=searchText([course.title,course.summary,course.category,...course.objectives,...course.recommendedFor,
    ...courseNeeds(course).map(id=>learningNeeds.find(n=>n.id===id)?.label||""),
    ...course.modules.filter(m=>m.type==="content").flatMap(m=>m.type==="content"?[m.title,m.body]:[]),
  ].join(" "));
  searchIndex.set(course,text);return text;
}
export function learningStatus(course: Course, progress: LearningProgress) {
  return courseFinished(course,progress) ? "completed" : course.modules.some(m=>progress[course.id]?.completedModules.includes(m.id)) ? "in-progress" : "not-started";
}
export function discoverCourses(catalogue: readonly Course[], filters: DiscoveryFilters, progress: LearningProgress): Course[] {
  const terms=searchText(filters.search).split(" ").filter(t=>t && !["and","the","for","in","of"].includes(t));
  const found=catalogue.filter(c=>{
    const needs=courseNeeds(c), status=learningStatus(c,progress);
    const haystack=indexedText(c);
    return terms.every(term=>haystack.includes(term))
      && (filters.category==="All" || c.category===filters.category)
      && suitsRole(c,filters.role)
      && (filters.need==="All" || needs.includes(filters.need))
      && (filters.maxMinutes==="All" || c.duration<=Number(filters.maxMinutes))
      && (filters.kind==="All" || (filters.kind==="short")===Boolean(shortCourseParents[c.id]))
      && (filters.level==="All" || c.level===filters.level)
      && (filters.status==="All" || status===filters.status);
  });
  return found.sort((a,b)=>{
    if(filters.sort==="shortest") return a.duration-b.duration || a.title.localeCompare(b.title);
    if(filters.sort==="title") return a.title.localeCompare(b.title);
    if(terms.length) {
      const relevance=(c:Course)=>terms.every(t=>searchText(c.title).includes(t))?0:terms.every(t=>searchText(c.summary).includes(t))?1:2;
      const difference=relevance(a)-relevance(b);if(difference) return difference;
    }
    // An explicit, explainable order, not an inferred competence score:
    // unfinished work first, then short primers, then title.
    const score=(c:Course)=>learningStatus(c,progress)==="in-progress"?0:learningStatus(c,progress)==="completed"?3:shortCourseParents[c.id]?1:2;
    return score(a)-score(b) || a.title.localeCompare(b.title);
  });
}
