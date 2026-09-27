import type { Course } from "./catalogue";

const STOP = new Set(["about","after","again","also","and","are","because","been","being","but","can","class","could","from","have","into","just","more","need","needs","not","our","pupil","pupils","student","students","that","the","their","them","then","there","these","they","this","through","using","very","want","with","would"]);

const CONCEPTS: Record<string,string[]> = {
  question:["questioning","questions","checking","understanding","assessment","hinge","response"],
  assess:["assessment","feedback","checking","understanding","diagnostic","moderation"],
  feedback:["feedback","assessment","responsive","marking","improvement"],
  behaviour:["behaviour","routines","relationships","regulation","classroom","expectations"],
  routine:["routines","behaviour","classroom","expectations"],
  retrieval:["retrieval","memory","spacing","practice","recall"],
  memory:["memory","retrieval","cognitive","study","spacing"],
  explain:["explanations","modelling","worked","examples","instruction"],
  model:["modelling","worked","examples","instruction","scaffold"],
  scaffold:["scaffolds","adaptive","send","support","independence"],
  adaptive:["adaptive","send","scaffold","access","inclusion"],
  send:["send","inclusive","adaptive","communication","sensory","semh"],
  autism:["send","sensory","communication","inclusive","adaptive"],
  adhd:["executive","function","send","attention","adaptive"],
  eal:["language","vocabulary","oracy","reading","communication"],
  vocabulary:["vocabulary","literacy","reading","language"],
  reading:["reading","literacy","vocabulary"],
  writing:["writing","literacy","modelling"],
  oracy:["oracy","talk","discussion","collaborative"],
  challenge:["challenge","high-attaining","questioning","independence"],
  group:["group","collaborative","discussion","oracy"],
  parent:["parent","carer","conversation","communication"],
  safeguarding:["safeguarding","abuse","prevent","professional","boundaries"],
  attendance:["attendance","absence","ebsa","pastoral"],
  wellbeing:["wellbeing","mental","health","regulation","bereavement"],
  leadership:["leadership","subject","department","change","meeting"],
  observation:["observation","learning","walk","feedback","development"],
  curriculum:["curriculum","intent","implementation","subject","planning"],
  digital:["digital","ai","cybersecurity","technology"],
  ai:["ai","digital","integrity","safe","technology"],
};

export type CourseRecommendation = { course: Course; score: number; matched: string[] };

export function recommendCourses(input: string, courses: Course[], limit = 5): CourseRecommendation[] {
  const source = normalize(input);
  const rawTokens = tokenize(source);
  const expanded = new Set(rawTokens);
  for (const token of rawTokens) {
    for (const [concept, words] of Object.entries(CONCEPTS)) {
      if (token.startsWith(concept) || concept.startsWith(token)) words.forEach(word => expanded.add(word));
    }
  }

  const ranked = courses.map(course => {
    const searchable = normalize([course.title, course.category, course.summary, ...course.objectives, ...course.recommendedFor].join(" "));
    const matched: string[] = [];
    let score = 0;
    for (const token of expanded) {
      if (token.length < 3) continue;
      if (searchable.includes(token)) {
        matched.push(token);
        score += course.title.toLowerCase().includes(token) ? 4 : 2;
      }
    }
    const titleWords = tokenize(course.title);
    for (const sourceToken of rawTokens) if (titleWords.some(word => sameStem(word, sourceToken))) score += 3;
    if (course.category === "Teaching & Learning" && /teach|lesson|classroom|learn|instruction|practice/.test(source)) score += 1;
    if (course.category === "SEND" && /send|adapt|inclus|sensory|communication|semh|executive/.test(source)) score += 2;
    if (course.category === "Safeguarding" && /safeguard|abuse|prevent|boundary|concern/.test(source)) score += 3;
    if (course.category === "Leadership" && /lead|department|subject|team|meeting|change/.test(source)) score += 2;
    return { course, score, matched: [...new Set(matched)].slice(0, 4) };
  }).filter(item => item.score > 0).sort((a,b) => b.score-a.score || a.course.duration-b.course.duration || a.course.title.localeCompare(b.course.title));

  if (ranked.length) return ranked.slice(0, limit);
  return courses
    .filter(course => course.category === "Teaching & Learning")
    .sort((a,b) => a.duration-b.duration)
    .slice(0, limit)
    .map(course => ({ course, score: 1, matched: ["general teaching practice"] }));
}

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9\s-]/g," ").replace(/\s+/g," ").trim(); }
function tokenize(value: string) { return normalize(value).split(/[\s-]+/).filter(token => token.length >= 3 && !STOP.has(token)); }
function sameStem(a:string,b:string){const x=a.replace(/(ing|ed|es|s)$/,""),y=b.replace(/(ing|ed|es|s)$/,"" );return x.length>=4&&y.length>=4&&(x===y||x.startsWith(y)||y.startsWith(x));}
