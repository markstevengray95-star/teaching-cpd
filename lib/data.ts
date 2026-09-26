export type Role = "Staff" | "Department Lead" | "CPD Lead" | "Admin";
export type CourseCategory = "Teaching & Learning" | "Safeguarding" | "SEND" | "Leadership" | "Wellbeing" | "Digital Teaching";

export type Module =
  | { id: string; type: "content"; title: string; body: string; keyPoints?: string[] }
  | { id: string; type: "quiz"; title: string; question: string; options: string[]; answer: number; feedback: string }
  | { id: string; type: "scenario"; title: string; prompt: string; options: { label: string; feedback: string }[] }
  | { id: string; type: "reflection"; title: string; prompt: string }
  | { id: string; type: "visual"; title: string; caption?: string; layout: "flow" | "cycle" | "ladder" | "pyramid" | "compare" | "timeline"; items: { heading: string; text: string; icon?: string }[] }
  | { id: string; type: "checklist"; title: string; prompt: string; items: string[]; completionText?: string }
  | { id: string; type: "activity"; title: string; prompt: string; instructions: string[]; placeholder?: string; minimumCharacters?: number };

export type Course = {
  id: string;
  title: string;
  category: CourseCategory;
  duration: number;
  level: "Foundation" | "Developing" | "Advanced";
  summary: string;
  objectives: string[];
  recommendedFor: string[];
  modules: Module[];
};

const commonReflection = (id: string, prompt: string): Module => ({ id, type: "reflection", title: "Apply it to your practice", prompt });

export const courses: Course[] = [
  {
    id: "effective-questioning",
    title: "Effective Questioning",
    category: "Teaching & Learning",
    duration: 45,
    level: "Foundation",
    summary: "Use purposeful questions, wait time and checking strategies to make pupil thinking visible.",
    objectives: ["Plan questions around learning goals", "Increase participation", "Use responses to adapt teaching"],
    recommendedFor: ["Teacher", "ECT", "Teaching Assistant"],
    modules: [
      { id: "q1", type: "content", title: "Why questioning matters", body: "Strong questioning is not about asking more questions. It is about deliberately eliciting evidence of what pupils understand, then responding to that evidence.", keyPoints: ["Plan hinge questions", "Give thinking time", "Sample broadly across the class"] },
      { id: "q2", type: "quiz", title: "Knowledge check", question: "Which approach gives the teacher the strongest evidence about whole-class understanding?", options: ["Ask for volunteers only", "Ask one high-attaining pupil", "Use a hinge question answered by everyone", "Repeat the explanation immediately"], answer: 2, feedback: "Whole-class response techniques reduce sampling bias and make misconceptions easier to spot." },
      { id: "q3", type: "scenario", title: "Classroom scenario", prompt: "You ask a challenging question and nobody responds after two seconds. What is the strongest next move?", options: [{ label: "Answer it yourself", feedback: "This can remove productive thinking time too quickly." }, { label: "Give structured thinking time, then sample responses", feedback: "A short pause plus a clear response routine gives more pupils access to the question." }, { label: "Move to an easier topic", feedback: "Changing topic does not help you diagnose the difficulty." }] },
      commonReflection("q4", "Choose one class. What questioning routine will you try, and what evidence will tell you whether participation or understanding improved?")
    ]
  },
  {
    id: "retrieval-practice",
    title: "Retrieval Practice That Improves Learning",
    category: "Teaching & Learning",
    duration: 40,
    level: "Foundation",
    summary: "Design low-stakes retrieval that strengthens memory without turning every lesson into a test.",
    objectives: ["Distinguish retrieval from re-reading", "Select useful retrieval prompts", "Use feedback effectively"],
    recommendedFor: ["Teacher", "ECT"],
    modules: [
      { id: "r1", type: "content", title: "Retrieval with purpose", body: "Retrieval practice asks pupils to bring information to mind from memory. It works best when prompts are aligned to important knowledge and feedback follows promptly.", keyPoints: ["Keep it low stakes", "Mix recent and older content", "Correct errors after retrieval"] },
      { id: "r2", type: "quiz", title: "Knowledge check", question: "Which task is an example of retrieval practice?", options: ["Re-reading notes", "Copying a model answer", "Answering questions from memory before checking", "Highlighting a textbook"], answer: 2, feedback: "Retrieval requires bringing information to mind rather than simply seeing it again." },
      commonReflection("r3", "Identify 3–5 pieces of knowledge from your subject that would benefit from spaced retrieval over the next month.")
    ]
  },
  {
    id: "adaptive-teaching",
    title: "Adaptive Teaching in Practice",
    category: "Teaching & Learning",
    duration: 60,
    level: "Developing",
    summary: "Keep ambitious goals while adapting explanations, scaffolds and checks in response to pupil need.",
    objectives: ["Separate adaptation from lowered expectations", "Plan temporary scaffolds", "Use assessment responsively"],
    recommendedFor: ["Teacher", "ECT", "Teaching Assistant"],
    modules: [
      { id: "a1", type: "content", title: "Keep the goal, change the route", body: "Adaptive teaching maintains a shared learning intention while varying support. Useful adaptations include worked examples, vocabulary support, chunking, guided practice and carefully chosen representations." },
      { id: "a2", type: "scenario", title: "Planning scenario", prompt: "Several pupils cannot start an extended task independently, but they can explain the idea verbally. What is a sensible adaptation?", options: [{ label: "Give them a simpler learning objective", feedback: "This may lower the goal unnecessarily." }, { label: "Provide a temporary writing scaffold linked to the same objective", feedback: "This preserves ambition while supporting access." }, { label: "Complete the task for them", feedback: "Over-support can remove the thinking pupils need to do." }] },
      commonReflection("a3", "Select one upcoming task. Which scaffold could you add, and how will you fade it as pupils become more independent?")
    ]
  },
  {
    id: "safeguarding-essentials",
    title: "Safeguarding Essentials",
    category: "Safeguarding",
    duration: 50,
    level: "Foundation",
    summary: "Refresh professional responsibilities for recognising, recording and reporting safeguarding concerns.",
    objectives: ["Recognise potential indicators", "Respond appropriately to a disclosure", "Follow school reporting procedures"],
    recommendedFor: ["All staff"],
    modules: [
      { id: "s1", type: "content", title: "Your responsibility", body: "Safeguarding is everyone's responsibility. Staff should know their school's current policy, how to contact the DSL or deputy, and how to record concerns promptly and factually.", keyPoints: ["Listen without investigating", "Record facts and the pupil's own words where appropriate", "Report through the school's agreed route"] },
      { id: "s2", type: "scenario", title: "Disclosure scenario", prompt: "A pupil begins to tell you something that may indicate a safeguarding concern. What should you prioritise?", options: [{ label: "Promise to keep it secret", feedback: "Do not promise confidentiality you cannot keep." }, { label: "Listen, avoid leading questions, explain you may need to share with safeguarding staff", feedback: "This supports the pupil while keeping the response within professional safeguarding procedure." }, { label: "Investigate by questioning other pupils", feedback: "Investigation is not the classroom member of staff's role." }] },
      { id: "s3", type: "quiz", title: "Knowledge check", question: "What should take precedence if generated training content differs from your school's safeguarding policy?", options: ["The generated content", "The school's current safeguarding policy and DSL guidance", "Whichever is shorter", "A colleague's personal preference"], answer: 1, feedback: "Current school policy, DSL guidance and statutory requirements take precedence." },
      commonReflection("s4", "Without recording confidential pupil information here, note one action you will take to keep your knowledge of school safeguarding procedures current.")
    ]
  },
  {
    id: "autism-inclusive-classroom",
    title: "Autism: Inclusive Classroom Practice",
    category: "SEND",
    duration: 55,
    level: "Developing",
    summary: "Use predictable routines, clear communication and responsive support without making assumptions about individual pupils.",
    objectives: ["Recognise variation in autistic pupils' needs", "Reduce avoidable barriers", "Plan practical classroom supports"],
    recommendedFor: ["Teacher", "Teaching Assistant", "Pastoral"],
    modules: [
      { id: "au1", type: "content", title: "Individual needs first", body: "Autistic pupils are not a single group with identical needs. Effective support starts with knowing the pupil, the plan in place, and which classroom demands create barriers for that individual.", keyPoints: ["Make routines visible", "Use clear and literal language where helpful", "Prepare pupils for significant changes"] },
      { id: "au2", type: "scenario", title: "Change of routine", prompt: "A room change is announced shortly before a lesson. One pupil finds unexpected change particularly difficult. What is the most useful response?", options: [{ label: "Say nothing so they learn to cope", feedback: "Avoidable surprise may create an unnecessary barrier." }, { label: "Give clear advance information and explain what will stay the same", feedback: "Predictability can reduce uncertainty while keeping expectations intact." }, { label: "Excuse the pupil from all future room changes", feedback: "Blanket avoidance may not match the pupil's plan or needs." }] },
      commonReflection("au3", "Choose one routine or instruction in your classroom that could be made more predictable or explicit for pupils who benefit from clarity.")
    ]
  },
  {
    id: "adhd-classroom-strategies",
    title: "ADHD: Practical Classroom Strategies",
    category: "SEND",
    duration: 45,
    level: "Developing",
    summary: "Reduce executive-function barriers through clear routines, chunking and supportive classroom design.",
    objectives: ["Identify common executive-function demands", "Use concise task structures", "Support independence"],
    recommendedFor: ["Teacher", "Teaching Assistant"],
    modules: [
      { id: "ad1", type: "content", title: "Design the task, not the label", body: "Support should respond to the learner rather than a stereotype. Clear starts, short task chunks, visible steps and consistent routines can reduce unnecessary executive-function load." },
      { id: "ad2", type: "quiz", title: "Knowledge check", question: "Which adjustment most directly reduces working-memory demand during a multi-step task?", options: ["Give all instructions once verbally", "Display the steps and tick them off", "Increase the amount of copying", "Remove the learning objective"], answer: 1, feedback: "Visible steps reduce the need to hold the whole sequence in working memory." },
      commonReflection("ad3", "Which recurring classroom task could benefit from visible steps, a checklist or a clearer starting routine?")
    ]
  },
  {
    id: "middle-leadership",
    title: "Middle Leadership Fundamentals",
    category: "Leadership",
    duration: 70,
    level: "Developing",
    summary: "Translate school priorities into clear team routines, supportive follow-up and manageable improvement work.",
    objectives: ["Set clear expectations", "Run focused professional conversations", "Plan sustainable improvement"],
    recommendedFor: ["Department Lead", "Aspiring leader"],
    modules: [
      { id: "m1", type: "content", title: "Clarity before monitoring", body: "Effective middle leadership starts with a small number of clear priorities. Teams need to know what good practice looks like, why it matters and what support is available before monitoring becomes useful." },
      { id: "m2", type: "scenario", title: "Team improvement scenario", prompt: "A department initiative is being implemented inconsistently. What should you do first?", options: [{ label: "Add several new initiatives", feedback: "More change can increase ambiguity and workload." }, { label: "Re-establish the agreed practice, gather barriers from staff and plan targeted support", feedback: "This combines clarity with diagnosis and support." }, { label: "Publish a ranking of teachers", feedback: "Public ranking is unlikely to support professional learning and can distort behaviour." }] },
      commonReflection("m3", "Name one team routine you could make clearer, simpler or easier to sustain this term.")
    ]
  },
  {
    id: "instructional-coaching",
    title: "Instructional Coaching Basics",
    category: "Leadership",
    duration: 60,
    level: "Advanced",
    summary: "Use specific goals, modelling, rehearsal and feedback to support teacher development.",
    objectives: ["Set narrow development steps", "Use rehearsal productively", "Separate coaching from judgement"],
    recommendedFor: ["Department Lead", "CPD Lead", "Coach"],
    modules: [
      { id: "ic1", type: "content", title: "Small steps, repeated practice", body: "Instructional coaching is strongest when the development step is small enough to practise, observe and refine. The coach's role is to help the teacher improve a specific aspect of practice rather than produce a broad judgement." },
      commonReflection("ic2", "Turn a broad goal such as 'improve questioning' into one specific behaviour that could be practised and reviewed.")
    ]
  },
  {
    id: "staff-wellbeing",
    title: "Sustainable Workload & Staff Wellbeing",
    category: "Wellbeing",
    duration: 35,
    level: "Foundation",
    summary: "Identify practical workload pressures and improve routines at individual and team level.",
    objectives: ["Spot avoidable workload", "Prioritise high-value tasks", "Use team routines to reduce duplication"],
    recommendedFor: ["All staff"],
    modules: [
      { id: "w1", type: "content", title: "Focus on controllable systems", body: "Wellbeing is influenced by many factors. CPD should not reduce it to personal resilience alone. Reviewing workload, clarity, duplication and team systems can identify practical changes within a school's control." },
      commonReflection("w2", "Identify one recurring task that could be removed, simplified, automated or shared without reducing educational value.")
    ]
  },
  {
    id: "ai-in-education",
    title: "Responsible AI in Education",
    category: "Digital Teaching",
    duration: 50,
    level: "Foundation",
    summary: "Use generative AI thoughtfully while protecting privacy, maintaining professional judgement and checking outputs.",
    objectives: ["Identify appropriate uses", "Check accuracy and bias", "Protect sensitive information"],
    recommendedFor: ["All staff"],
    modules: [
      { id: "ai1", type: "content", title: "AI as an assistant, not authority", body: "Generative AI can help draft, adapt and brainstorm, but outputs can be inaccurate. Staff remain responsible for checking educational suitability, factual accuracy, policy compliance and data protection." },
      { id: "ai2", type: "quiz", title: "Knowledge check", question: "Which practice is safest when using a general-purpose AI tool?", options: ["Paste identifiable pupil medical details", "Treat every output as fact", "Remove sensitive data and verify important claims", "Let AI make safeguarding decisions"], answer: 2, feedback: "Sensitive data should be protected and important outputs independently checked." },
      commonReflection("ai3", "Choose one low-risk task where AI might save time, and write the checks you would apply before using the output.")
    ]
  },
  {
    id: "behaviour-routines",
    title: "Calm, Consistent Classroom Routines",
    category: "Teaching & Learning",
    duration: 45,
    level: "Foundation",
    summary: "Build predictable routines that reduce ambiguity and protect learning time.",
    objectives: ["Teach routines explicitly", "Use consistent cues", "Review routines when they break down"],
    recommendedFor: ["Teacher", "ECT"],
    modules: [
      { id: "b1", type: "content", title: "Routines are taught", body: "A routine becomes reliable when pupils know exactly what to do, have practised it and receive consistent cues. Re-teaching a routine can be more effective than repeatedly correcting individuals after expectations become unclear." },
      { id: "b2", type: "scenario", title: "Entry routine", prompt: "Your class takes too long to settle after lunch. What is a productive first step?", options: [{ label: "Change the rule each lesson", feedback: "Inconsistent expectations make routines harder to learn." }, { label: "Define, teach and practise a simple entry routine", feedback: "Clarity plus rehearsal gives pupils a repeatable sequence." }, { label: "Start teaching over the noise every time", feedback: "This can normalise an unclear start to the lesson." }] },
      commonReflection("b3", "Write the first three actions pupils should take when entering one of your lessons. Are they currently explicit and consistent?")
    ]
  },
  {
    id: "assessment-for-learning",
    title: "Assessment for Learning",
    category: "Teaching & Learning",
    duration: 55,
    level: "Developing",
    summary: "Gather useful evidence of learning and use it to decide what happens next.",
    objectives: ["Elicit evidence efficiently", "Interpret common errors", "Adapt the next teaching move"],
    recommendedFor: ["Teacher", "ECT"],
    modules: [
      { id: "afl1", type: "content", title: "Evidence that changes teaching", body: "Formative assessment is useful when evidence of learning affects what the teacher or pupils do next. The goal is not simply to collect more data, but to make better instructional decisions." },
      { id: "afl2", type: "quiz", title: "Knowledge check", question: "Which example is most clearly formative?", options: ["Record a score and move on", "Use a hinge question and reteach after a common misconception appears", "Add another grade to a spreadsheet", "Set the same follow-up regardless of responses"], answer: 1, feedback: "The evidence is being used immediately to adapt teaching." },
      commonReflection("afl3", "Where in one upcoming lesson will you deliberately check understanding before deciding whether to move on?")
    ]
  }
];

export const categoryOrder: CourseCategory[] = ["Teaching & Learning", "Safeguarding", "SEND", "Leadership", "Wellbeing", "Digital Teaching"];
