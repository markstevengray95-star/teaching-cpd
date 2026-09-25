import type { Course, Module } from "@/lib/data";

const reflect = (id: string, prompt: string): Module => ({ id, type: "reflection", title: "Apply it to your practice", prompt });

export const phase3Courses: Course[] = [
  {
    id: "cognitive-load-theory",
    title: "Cognitive Load Theory for the Classroom",
    category: "Teaching & Learning",
    duration: 55,
    level: "Developing",
    summary: "Design explanations and tasks that protect working memory while building durable knowledge.",
    objectives: ["Distinguish intrinsic and avoidable load", "Reduce unnecessary processing", "Sequence practice effectively"],
    recommendedFor: ["Teacher", "ECT"],
    modules: [
      { id: "cl1", type: "content", title: "Working memory is limited", body: "Learners can only process a limited amount of unfamiliar information at once. Good instructional design reduces avoidable demands so attention can stay on the learning goal.", keyPoints: ["Break complex material into meaningful steps", "Avoid decorative information that competes for attention", "Connect new material to prior knowledge"] },
      { id: "cl2", type: "quiz", title: "Knowledge check", question: "Which change most directly reduces unnecessary cognitive load?", options: ["Add more decorative animations", "Split instructions across several unrelated places", "Place a worked example beside the task it supports", "Introduce several new representations at once"], answer: 2, feedback: "Keeping relevant guidance close to the task reduces avoidable search and split attention." },
      { id: "cl3", type: "scenario", title: "Planning scenario", prompt: "Pupils struggle to start a complex multi-step calculation. What is the strongest first response?", options: [{ label: "Give more questions immediately", feedback: "More practice is not useful if pupils cannot yet manage the process." }, { label: "Model a worked example and then fade support", feedback: "This reduces initial processing demand while preserving the full learning goal." }, { label: "Remove the difficult content", feedback: "The aim is to scaffold access, not lower the intended learning." }] },
      reflect("cl4", "Choose one lesson resource. What could you remove, combine or sequence differently to reduce avoidable cognitive load?")
    ]
  },
  {
    id: "rosenshine-principles",
    title: "Rosenshine's Principles in Practice",
    category: "Teaching & Learning",
    duration: 60,
    level: "Developing",
    summary: "Use review, small steps, modelling, guided practice and checking for understanding as a coherent teaching cycle.",
    objectives: ["Use daily and spaced review", "Model in small steps", "Move deliberately from guided to independent practice"],
    recommendedFor: ["Teacher", "ECT"],
    modules: [
      { id: "ro1", type: "content", title: "A practical teaching cycle", body: "Rosenshine's principles are best used as connected instructional ideas rather than a checklist. Review prior learning, present new material in manageable steps, ask many questions, guide practice and check readiness before independent work." },
      { id: "ro2", type: "quiz", title: "Knowledge check", question: "When should a teacher normally reduce scaffolding?", options: ["Immediately after explaining", "When checks show pupils can succeed with less support", "At the same point for every class", "Only at the end of a unit"], answer: 1, feedback: "Scaffolds should fade responsively as pupils demonstrate growing independence." },
      reflect("ro3", "Which part of your current lesson sequence—review, modelling, guided practice or checking—would benefit most from greater consistency?")
    ]
  },
  {
    id: "behaviour-management",
    title: "Behaviour Management: Prevention Before Correction",
    category: "Teaching & Learning",
    duration: 55,
    level: "Foundation",
    summary: "Use clear expectations, active supervision and proportionate responses to protect learning.",
    objectives: ["Set observable expectations", "Prevent predictable disruption", "Respond calmly and consistently"],
    recommendedFor: ["Teacher", "ECT", "Teaching Assistant"],
    modules: [
      { id: "bm1", type: "content", title: "Make success easy to understand", body: "Behaviour systems work best when expectations are concrete, routines are explicitly taught and corrections are predictable. Prevention reduces the need for repeated confrontation." },
      { id: "bm2", type: "scenario", title: "Low-level disruption", prompt: "A pupil repeatedly talks during independent work. What is a sensible first response within a normal school behaviour policy?", options: [{ label: "Publicly argue about motive", feedback: "Extended public debate can increase disruption." }, { label: "Use the agreed calm reminder and follow the school's stepped response", feedback: "A predictable response keeps attention on the expected behaviour." }, { label: "Ignore every recurrence", feedback: "Unaddressed repeated disruption can undermine the routine." }] },
      reflect("bm3", "Identify one behaviour expectation that could be stated more clearly or rehearsed more explicitly in your classroom.")
    ]
  },
  {
    id: "de-escalation",
    title: "De-escalation and Calm Responses",
    category: "Safeguarding",
    duration: 45,
    level: "Developing",
    summary: "Reduce conflict through calm communication, space, clear boundaries and appropriate support.",
    objectives: ["Recognise escalation cues", "Use low-arousal communication", "Know when to seek additional support"],
    recommendedFor: ["All staff"],
    modules: [
      { id: "de1", type: "content", title: "Reduce the temperature", body: "When a situation is escalating, staff should prioritise safety, use calm and concise language, avoid unnecessary audiences and follow the school's behaviour and safeguarding procedures." },
      { id: "de2", type: "scenario", title: "Corridor scenario", prompt: "A pupil is visibly upset and speaking loudly after a disagreement. Which response is most likely to reduce escalation?", options: [{ label: "Match their volume", feedback: "Increasing intensity can escalate the interaction." }, { label: "Use a calm voice, reduce the audience and offer a clear next step", feedback: "Lowering stimulation and keeping boundaries clear can support regulation." }, { label: "Demand a full explanation immediately", feedback: "Detailed processing may be difficult while the pupil is highly activated." }] },
      reflect("de3", "Which phrases or routines help you remain calm and clear when a pupil is becoming distressed or confrontational?")
    ]
  },
  {
    id: "send-inclusive-practice",
    title: "SEND: Inclusive Classroom Practice",
    category: "SEND",
    duration: 60,
    level: "Foundation",
    summary: "Plan ambitious teaching that anticipates barriers and uses pupil-specific information well.",
    objectives: ["Use pupil plans appropriately", "Identify barriers in tasks", "Select proportionate classroom adjustments"],
    recommendedFor: ["Teacher", "Teaching Assistant", "ECT"],
    modules: [
      { id: "se1", type: "content", title: "Start with the pupil and the learning goal", body: "Inclusive practice combines high expectations with knowledge of individual needs. Adjustments should remove barriers without unnecessarily changing the core learning intention." },
      { id: "se2", type: "quiz", title: "Knowledge check", question: "Which is the strongest starting point when planning support for a pupil with SEND?", options: ["Assume pupils with the same label need identical support", "Use the pupil's current information and identify barriers in this specific task", "Lower the objective automatically", "Remove all challenge"], answer: 1, feedback: "Support should respond to the individual pupil and the demands of the task." },
      reflect("se3", "Choose one upcoming task. What barrier might it create for a particular learner, and what adjustment could preserve the learning goal?")
    ]
  },
  {
    id: "dyslexia-classroom-support",
    title: "Dyslexia: Classroom Support",
    category: "SEND",
    duration: 45,
    level: "Developing",
    summary: "Reduce literacy-processing barriers while maintaining access to subject knowledge and challenge.",
    objectives: ["Recognise common literacy demands", "Improve resource accessibility", "Support independent use of strategies"],
    recommendedFor: ["Teacher", "Teaching Assistant"],
    modules: [
      { id: "dy1", type: "content", title: "Support access without assumptions", body: "Dyslexia can affect aspects of reading, spelling, sequencing and working memory, but needs vary. Helpful classroom practice can include clear layouts, explicit vocabulary teaching, manageable chunks and appropriate assistive technology." },
      { id: "dy2", type: "scenario", title: "Resource design", prompt: "A pupil understands the science orally but struggles to extract information from a dense worksheet. What is a reasonable adaptation?", options: [{ label: "Replace the science with easier content", feedback: "This changes the learning goal rather than the access barrier." }, { label: "Improve layout, chunk text and pre-teach key vocabulary", feedback: "These changes can improve access while keeping the same scientific content." }, { label: "Give no written material at all", feedback: "Blanket removal may reduce opportunities to build useful literacy strategies." }] },
      reflect("dy3", "Review one resource you use often. What change would improve readability without reducing subject challenge?")
    ]
  },
  {
    id: "eal-inclusive-teaching",
    title: "EAL: Language-Rich Classroom Practice",
    category: "SEND",
    duration: 55,
    level: "Developing",
    summary: "Support pupils learning through English with explicit language, modelling and purposeful talk.",
    objectives: ["Separate language demand from conceptual demand", "Teach key language explicitly", "Use structured talk and modelling"],
    recommendedFor: ["Teacher", "Teaching Assistant"],
    modules: [
      { id: "ea1", type: "content", title: "Language is part of subject learning", body: "Pupils using English as an additional language may understand concepts beyond what they can yet express fluently in English. Effective teaching makes key vocabulary, sentence structures and disciplinary language visible." },
      { id: "ea2", type: "quiz", title: "Knowledge check", question: "Which approach best supports ambitious learning for an EAL pupil?", options: ["Reduce every task to simple vocabulary only", "Model the subject language needed and provide structured opportunities to use it", "Avoid discussion", "Assess only spelling"], answer: 1, feedback: "Language scaffolds can support access to the full conceptual demand of the subject." },
      reflect("ea3", "Choose an upcoming lesson. Which 3–5 words or sentence structures will pupils need in order to explain the key idea successfully?")
    ]
  },
  {
    id: "disciplinary-literacy",
    title: "Disciplinary Literacy Across Subjects",
    category: "Teaching & Learning",
    duration: 55,
    level: "Developing",
    summary: "Teach pupils how experts in your subject read, write, speak and reason.",
    objectives: ["Identify subject-specific literacy demands", "Teach vocabulary in context", "Model expert reading and writing"],
    recommendedFor: ["Teacher", "Department Lead"],
    modules: [
      { id: "dl1", type: "content", title: "Literacy differs by discipline", body: "Reading a historical source, interpreting a scientific explanation and constructing a mathematical argument require different habits. Disciplinary literacy makes those subject-specific practices explicit." },
      { id: "dl2", type: "scenario", title: "Writing scenario", prompt: "Pupils give weak explanations even though they know the facts. What is a useful next step?", options: [{ label: "Tell them to write more", feedback: "Quantity alone does not make the disciplinary structure visible." }, { label: "Model the structure and language of a strong subject-specific explanation", feedback: "Explicit modelling shows pupils how knowledge is organised and expressed in the discipline." }, { label: "Mark only spelling", feedback: "This misses the reasoning and disciplinary language pupils need." }] },
      reflect("dl3", "What does a strong explanation, argument or evaluation look like in your subject? Identify one feature you could model explicitly.")
    ]
  },
  {
    id: "effective-feedback",
    title: "Feedback That Leads to Improvement",
    category: "Teaching & Learning",
    duration: 50,
    level: "Developing",
    summary: "Give feedback that is focused, usable and followed by pupil action.",
    objectives: ["Prioritise high-value feedback", "Match feedback to the task and learner", "Plan time for response"],
    recommendedFor: ["Teacher", "ECT"],
    modules: [
      { id: "fb1", type: "content", title: "Feedback needs a response", body: "Feedback has greatest potential when it identifies a manageable next step and pupils have an opportunity to act on it. More comments do not automatically mean more learning." },
      { id: "fb2", type: "quiz", title: "Knowledge check", question: "Which feature makes feedback most likely to be useful?", options: ["Maximum quantity", "A clear next step linked to the learning goal and time to respond", "A grade only", "Feedback several months later"], answer: 1, feedback: "Feedback should help the learner decide what to do next and provide an opportunity to do it." },
      reflect("fb3", "Identify one piece of recurring feedback you give. How could you turn it into a routine that makes pupils act on it?")
    ]
  },
  {
    id: "curriculum-sequencing",
    title: "Curriculum Sequencing and Coherence",
    category: "Leadership",
    duration: 70,
    level: "Advanced",
    summary: "Sequence knowledge and practice so later learning deliberately builds on secure foundations.",
    objectives: ["Identify prerequisite knowledge", "Plan purposeful revisiting", "Spot gaps and unnecessary repetition"],
    recommendedFor: ["Department Lead", "Curriculum Lead", "Teacher"],
    modules: [
      { id: "cs1", type: "content", title: "Build deliberately over time", body: "A coherent curriculum makes clear what pupils need to know before new ideas can make sense. Sequencing should consider prerequisite knowledge, conceptual development, practice and planned revisiting." },
      { id: "cs2", type: "scenario", title: "Curriculum scenario", prompt: "A later unit repeatedly stalls because pupils lack a key earlier concept. What is the best curriculum response?", options: [{ label: "Add more content to the later unit only", feedback: "This treats the symptom rather than the sequence." }, { label: "Identify where the prerequisite should first be secured and where it should be revisited", feedback: "This strengthens the curriculum pathway rather than relying on emergency reteaching." }, { label: "Remove the later concept", feedback: "The goal is to improve sequencing, not reduce ambition." }] },
      reflect("cs3", "Choose one important endpoint in your subject. What prerequisite knowledge must pupils have before they reach it?")
    ]
  },
  {
    id: "metacognition-self-regulation",
    title: "Metacognition and Self-Regulated Learning",
    category: "Teaching & Learning",
    duration: 55,
    level: "Developing",
    summary: "Teach pupils to plan, monitor and evaluate strategies within real subject tasks.",
    objectives: ["Model strategic thinking", "Use prompts that support monitoring", "Build independence gradually"],
    recommendedFor: ["Teacher", "ECT"],
    modules: [
      { id: "mc1", type: "content", title: "Make thinking processes visible", body: "Metacognition is not a generic study-skills lesson. Pupils benefit when teachers model how an expert approaches a real subject task, including how to check progress and change strategy when needed." },
      { id: "mc2", type: "quiz", title: "Knowledge check", question: "Which teacher action most directly supports metacognition?", options: ["Give the answer immediately", "Think aloud while selecting and checking a strategy", "Ask pupils to work faster", "Remove all scaffolds at once"], answer: 1, feedback: "A think-aloud can expose the planning and monitoring decisions that experts make implicitly." },
      reflect("mc3", "Which recurring task in your subject would benefit from a teacher think-aloud showing how to plan, monitor and check the work?")
    ]
  },
  {
    id: "supporting-anxious-pupils",
    title: "Supporting Anxious Pupils in School",
    category: "Wellbeing",
    duration: 45,
    level: "Foundation",
    summary: "Use predictable, supportive classroom practices while following school pastoral and safeguarding systems.",
    objectives: ["Reduce avoidable uncertainty", "Respond supportively without overstepping role boundaries", "Use school support routes appropriately"],
    recommendedFor: ["All staff"],
    modules: [
      { id: "an1", type: "content", title: "Support within your role", body: "Staff can reduce avoidable uncertainty, use calm predictable routines and listen appropriately. Persistent or significant concerns should be shared through the school's pastoral, SEND or safeguarding routes rather than managed by one teacher alone." },
      { id: "an2", type: "scenario", title: "Classroom scenario", prompt: "A pupil becomes very anxious before a presentation. What is a proportionate first step?", options: [{ label: "Dismiss the concern", feedback: "This may increase distress and does not help the pupil access the task." }, { label: "Use the agreed support plan or reasonable classroom adjustment, while keeping appropriate expectations", feedback: "Predictable support can reduce the barrier without making unplanned clinical judgements." }, { label: "Diagnose an anxiety disorder", feedback: "Diagnosis is outside the classroom teacher's role." }] },
      reflect("an3", "Which predictable classroom routine could reduce unnecessary uncertainty for pupils who find transitions, public performance or unclear expectations difficult?")
    ]
  },
  {
    id: "online-safety",
    title: "Online Safety for School Staff",
    category: "Safeguarding",
    duration: 45,
    level: "Foundation",
    summary: "Recognise online safeguarding risks and respond through current school procedures.",
    objectives: ["Identify common online risks", "Respond appropriately to concerns", "Model safe professional practice"],
    recommendedFor: ["All staff"],
    modules: [
      { id: "os1", type: "content", title: "Online and offline safeguarding connect", body: "Online concerns can involve harmful contact, content, conduct, exploitation, bullying, coercion or unsafe sharing. Staff should follow current safeguarding and acceptable-use procedures rather than investigate independently." },
      { id: "os2", type: "quiz", title: "Knowledge check", question: "A pupil shows you a concerning message received online. What should guide your next action?", options: ["Your school's current safeguarding procedure and DSL guidance", "Delete everything immediately before recording the concern", "Investigate the sender yourself", "Post about it publicly"], answer: 0, feedback: "Follow the school's safeguarding route and preserve/report information in line with policy." },
      reflect("os3", "What part of your school's online-safety or reporting procedure do you need to refresh before the next staff update?")
    ]
  },
  {
    id: "difficult-conversations",
    title: "Difficult Professional Conversations",
    category: "Leadership",
    duration: 60,
    level: "Advanced",
    summary: "Prepare clear, respectful conversations about expectations, evidence and next steps.",
    objectives: ["Separate evidence from assumptions", "Structure a clear conversation", "Agree and document next steps"],
    recommendedFor: ["Department Lead", "CPD Lead", "Senior Leader"],
    modules: [
      { id: "dc1", type: "content", title: "Clarity with respect", body: "Difficult conversations are more productive when leaders prepare the specific issue, use observable evidence, listen to relevant context and agree concrete next steps rather than relying on vague criticism." },
      { id: "dc2", type: "scenario", title: "Leadership scenario", prompt: "A colleague has repeatedly missed an agreed team process. Which opening is strongest?", options: [{ label: "Everyone thinks you are unreliable", feedback: "This is broad, personal and difficult to evidence." }, { label: "The agreed process was missed on these occasions; I want to understand the barriers and agree what happens next", feedback: "This stays specific, opens space for context and keeps the conversation focused on improvement." }, { label: "Avoid the issue indefinitely", feedback: "Unresolved ambiguity can be unfair to the individual and team." }] },
      reflect("dc3", "Write a neutral opening sentence for a real professional conversation that focuses on observable evidence and the desired next step.")
    ]
  },
  {
    id: "effective-tutoring",
    title: "Effective Form Tutoring and Pastoral Check-ins",
    category: "Wellbeing",
    duration: 45,
    level: "Foundation",
    summary: "Use tutor time to build belonging, routines, academic habits and appropriate pastoral oversight.",
    objectives: ["Create reliable tutor routines", "Use brief check-ins purposefully", "Escalate concerns through school systems"],
    recommendedFor: ["Tutor", "Pastoral staff", "Teacher"],
    modules: [
      { id: "tu1", type: "content", title: "Small routines, strong relationships", body: "Effective tutoring combines predictable routines with genuine knowledge of pupils. Attendance, organisation, communication, academic habits and brief check-ins can reveal issues that need wider pastoral or safeguarding support." },
      { id: "tu2", type: "quiz", title: "Knowledge check", question: "A tutor notices a sustained change in a pupil's attendance and presentation. What is the best next step?", options: ["Keep it entirely to yourself", "Use the school's agreed pastoral or safeguarding route and record relevant facts", "Diagnose the cause", "Discuss it publicly with the form"], answer: 1, feedback: "Patterns of concern should be shared through the appropriate school system rather than managed in isolation." },
      reflect("tu3", "Which two tutor routines would most improve consistency, belonging or organisation for your group?")
    ]
  },
  {
    id: "parent-communication",
    title: "Effective Communication with Parents and Carers",
    category: "Leadership",
    duration: 45,
    level: "Foundation",
    summary: "Communicate clearly, professionally and constructively when sharing progress, concerns or next steps.",
    objectives: ["Use factual and respectful language", "Structure difficult messages", "Keep appropriate records"],
    recommendedFor: ["Teacher", "Tutor", "Department Lead"],
    modules: [
      { id: "pc1", type: "content", title: "Be clear about purpose", body: "Good communication explains the issue, gives relevant evidence, acknowledges appropriate context and makes the next step clear. Sensitive information should only be shared through approved school systems." },
      { id: "pc2", type: "scenario", title: "Communication scenario", prompt: "You need to contact home about repeated incomplete work. Which approach is strongest?", options: [{ label: "Send an accusatory message with no examples", feedback: "This can create defensiveness and offers little clarity." }, { label: "State the pattern factually, give examples and propose a clear next step", feedback: "Specific evidence and a constructive next step make the communication easier to act on." }, { label: "Discuss another pupil for comparison", feedback: "Other pupils' information should not be used this way." }] },
      reflect("pc3", "Rewrite one common parent/carer message so the purpose, evidence and requested next step are immediately clear.")
    ]
  },
  {
    id: "ect-induction",
    title: "ECT Induction: Building Strong Classroom Habits",
    category: "Teaching & Learning",
    duration: 65,
    level: "Foundation",
    summary: "Prioritise the classroom routines, planning habits and support systems that help early-career teachers develop sustainably.",
    objectives: ["Prioritise high-leverage habits", "Use mentoring productively", "Plan manageable development steps"],
    recommendedFor: ["ECT", "Mentor"],
    modules: [
      { id: "ec1", type: "content", title: "Focus on a small number of reliable habits", body: "Early career development is easier to sustain when improvement work is specific. Strong routines for lesson starts, explanations, checking understanding and behaviour provide a foundation for later refinement." },
      { id: "ec2", type: "scenario", title: "Development scenario", prompt: "An ECT is trying to improve six areas at once and feels overwhelmed. What is the strongest mentoring response?", options: [{ label: "Add more targets", feedback: "Too many simultaneous targets can make practice diffuse." }, { label: "Agree one or two high-leverage actions, rehearse them and review evidence", feedback: "Narrow development steps are easier to practise, observe and refine." }, { label: "Stop all feedback", feedback: "The issue is focus, not the existence of support." }] },
      reflect("ec3", "What is one classroom habit you want to make automatic this half term, and what evidence would show it is becoming reliable?")
    ]
  },
  {
    id: "high-attaining-pupils",
    title: "Supporting High-Attaining Pupils",
    category: "Teaching & Learning",
    duration: 50,
    level: "Developing",
    summary: "Increase depth, independence and intellectual challenge without relying on extra volume of work.",
    objectives: ["Distinguish challenge from more work", "Plan deeper thinking", "Use scaffolds without capping attainment"],
    recommendedFor: ["Teacher", "Department Lead"],
    modules: [
      { id: "ha1", type: "content", title: "Challenge means depth, not just speed", body: "High-attaining pupils benefit from tasks that increase conceptual depth, transfer, justification and independence. Simply giving more questions of the same type may add workload without adding challenge." },
      { id: "ha2", type: "quiz", title: "Knowledge check", question: "Which task most clearly increases intellectual challenge?", options: ["Twenty more routine questions", "Explain which method is most appropriate in an unfamiliar case and justify the choice", "Copy the notes again", "Finish the same task more quickly"], answer: 1, feedback: "Transfer and justification demand deeper reasoning rather than additional repetition." },
      reflect("ha3", "Choose one upcoming task. How could you deepen it through transfer, justification, comparison or independent decision-making?")
    ]
  }
];
