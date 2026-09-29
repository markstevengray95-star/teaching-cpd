import { courses, type Course } from "./catalogue";

const ROLE_KEYWORDS: Record<string,string[]> = {
  ECT: ["classroom","behaviour","question","assessment","planning","retrieval","feedback","adaptive","SEND"],
  Teacher: ["teaching","learning","question","assessment","feedback","retrieval","SEND","behaviour"],
  TA: ["SEND","scaffold","communication","adaptive","inclusion","autism","dyslexia","support"],
  Pastoral: ["wellbeing","behaviour","safeguarding","regulation","attendance","relationships","mental health"],
  "Middle Leader": ["leadership","implementation","department","coaching","quality","curriculum","monitoring"],
  SLT: ["leadership","school","implementation","culture","quality","safeguarding","strategy","impact"],
  SEND: ["SEND","inclusion","autism","dyslexia","ADHD","adaptive","communication","sensory"],
  Safeguarding: ["safeguarding","online safety","Prevent","child protection","wellbeing"],
};

const SIGNAL_KEYWORDS: Record<string,string[]> = {
  checking_understanding: ["question","checking","assessment","misconception","feedback"],
  challenge: ["challenge","adaptive","scaffold","high expectations","stretch"],
  participation: ["participation","question","engagement","discussion","inclusive"],
  independence: ["independence","scaffold","metacognition","self regulation","adaptive"],
  behaviour_climate: ["behaviour","relationships","routines","regulation","classroom"],
  SEND_access: ["SEND","adaptive","inclusion","autism","dyslexia","communication"],
  retrieval: ["retrieval","memory","cognitive","practice"],
  feedback: ["feedback","assessment","responsive teaching"],
  literacy: ["literacy","reading","vocabulary","oracy","writing"],
  leadership: ["leadership","implementation","coaching","quality"],
};

function normalise(value:string){ return value.toLowerCase().replace(/[^a-z0-9\s-]/g," "); }
function searchable(course:Course){ return normalise([course.title,course.summary,course.category,...course.objectives,...course.modules.slice(0,8).map(m=>m.title)].join(" ")); }

export function recommendCourses(query:string, options:{ role?:string; signals?:string[]; excludeIds?:string[]; limit?:number } = {}){
  const terms = new Set(normalise(query).split(/\s+/).filter(term=>term.length>3));
  (ROLE_KEYWORDS[options.role||""]||[]).forEach(term=>terms.add(normalise(term)));
  (options.signals||[]).flatMap(signal=>SIGNAL_KEYWORDS[signal]||[]).forEach(term=>terms.add(normalise(term)));
  const excluded = new Set(options.excludeIds||[]);
  return courses
    .filter(course=>!excluded.has(course.id))
    .map(course=>{
      const haystack=searchable(course); let score=0; const reasons:string[]=[];
      for(const term of terms){ if(!term)continue; const exact=haystack.includes(term); if(exact){ score += term.includes(" ") ? 4 : 2; if(reasons.length<3)reasons.push(term); } }
      if(options.role && course.recommendedFor.some(role=>normalise(role).includes(normalise(options.role!)))) score+=5;
      return { course, score, reason: reasons.length?`Matches ${reasons.join(", ")}.`:`Useful supporting development for ${options.role||"this priority"}.` };
    })
    .sort((a,b)=>b.score-a.score || a.course.title.localeCompare(b.course.title))
    .slice(0,options.limit||6);
}

export function buildPersonalPathway(role:string, goal:string, completedIds:string[]=[]){
  const recommendations=recommendCourses(goal,{role,excludeIds:completedIds,limit:6});
  const selected=recommendations.filter(item=>item.score>0).slice(0,5);
  const final=selected.length>=3?selected:recommendations.slice(0,Math.min(5,recommendations.length));
  return {
    role,
    goal,
    courseIds:final.map(item=>item.course.id),
    rationale:Object.fromEntries(final.map(item=>[item.course.id,item.reason])),
  };
}

export function suggestFromLearningWalk(focus:string, signals:string[], developmentPoints:string[]){
  return recommendCourses([focus,...developmentPoints].join(" "),{signals,limit:4});
}

export function suggestForImprovementPriority(title:string, description:string){
  return recommendCourses(`${title} ${description}`,{limit:6});
}
