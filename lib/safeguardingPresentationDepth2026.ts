import type { Course, Module } from "./data";

const safeguardingPresentationModules: Module[] = [
  {
    id: "sg26-p1",
    type: "visual",
    title: "The all-staff safeguarding response",
    layout: "flow",
    caption: "When something does not feel right, staff need a simple sequence they can recall under pressure.",
    items: [
      { heading: "Notice", text: "Pay attention to disclosures, changes, patterns, injuries, attendance, behaviour, online concerns and anything that creates a safeguarding worry.", icon: "1" },
      { heading: "Respond", text: "Stay calm, listen, avoid promising secrecy and do not investigate the concern yourself.", icon: "2" },
      { heading: "Record", text: "Write a timely factual account using the school's approved system and distinguish fact from interpretation.", icon: "3" },
      { heading: "Report", text: "Pass the concern to the DSL or deputy without delay using the school's agreed route.", icon: "4" },
      { heading: "Escalate", text: "If the concern is not being addressed, or a child is in immediate danger, use the school's escalation route and emergency procedures.", icon: "5" },
    ],
  },
  {
    id: "sg26-p2",
    type: "content",
    title: "Recognising abuse, neglect and exploitation",
    body: "Safeguarding concerns do not always arrive as a clear disclosure. Staff should know that abuse, neglect and exploitation can be physical, emotional, sexual, online, within families, between children, or connected to wider contexts. Indicators may include changes in behaviour, attendance, presentation, relationships, emotional wellbeing, unexplained injuries, concerning online activity, repeated missing episodes or a child saying something that worries you. One sign rarely proves a cause: staff notice the evidence, remain professionally curious and report concerns rather than diagnosing or investigating.",
    keyPoints: [
      "Look for patterns as well as single incidents",
      "A change in attendance, behaviour or presentation can matter",
      "Online and offline harm can overlap",
      "Do not decide that a child is safe because one possible explanation seems reassuring",
      "Do not wait for proof before using the safeguarding route",
    ],
  },
  {
    id: "sg26-p3",
    type: "scenario",
    title: "The concern that looks like behaviour",
    prompt: "A previously settled pupil has become tired, frequently late, withdrawn from friends and unusually defensive when adults ask if everything is okay. No single event proves harm. What is the strongest staff response?",
    options: [
      { label: "Treat it only as a behaviour issue until the pupil gives a clear disclosure", feedback: "Safeguarding concerns can emerge through patterns. Waiting for a disclosure may delay help." },
      { label: "Record the relevant pattern factually and share the concern through the school's safeguarding route", feedback: "This keeps the response evidence-based and allows the DSL to consider the wider safeguarding picture." },
      { label: "Question the pupil repeatedly until they explain what is happening", feedback: "Supportive listening is appropriate, but staff should not conduct their own investigation." },
    ],
  },
  {
    id: "sg26-p4",
    type: "visual",
    title: "Early help, safeguarding concern or immediate danger?",
    layout: "compare",
    caption: "Staff do not need to make complex threshold decisions alone, but they should recognise when speed and escalation matter.",
    items: [
      { heading: "Emerging need", text: "A child or family may benefit from support before difficulties become more serious. Follow the school's early-help and DSL procedures.", icon: "A" },
      { heading: "Safeguarding concern", text: "There is information suggesting a child may need help or protection. Report to the DSL/deputy without delay.", icon: "B" },
      { heading: "Immediate danger", text: "A child appears to be at immediate risk of serious harm. Follow emergency safeguarding procedures immediately, including emergency services where required.", icon: "C" },
      { heading: "Uncertain", text: "If you are unsure which category applies, do not hold the concern yourself. Seek DSL/deputy advice promptly.", icon: "?" },
    ],
  },
  {
    id: "sg26-p5",
    type: "scenario",
    title: "A disclosure in the corridor",
    prompt: "A pupil asks to speak privately and begins to tell you something worrying just before your next lesson. What is the strongest response?",
    options: [
      { label: "Tell them you cannot talk now and ask them to come back tomorrow", feedback: "A safeguarding disclosure should not be delayed simply because the timing is inconvenient." },
      { label: "Make space to listen, explain that you may need to share the information, avoid leading questions, then report promptly", feedback: "This balances support for the pupil with the need to follow safeguarding procedure." },
      { label: "Promise complete confidentiality so they feel safe enough to continue", feedback: "Staff should not promise secrecy that could prevent necessary safeguarding action." },
    ],
  },
  {
    id: "sg26-p6",
    type: "activity",
    title: "Rehearse a disclosure response",
    prompt: "Write the short sequence you would use if a pupil disclosed a safeguarding concern. Keep the language calm, child-centred and suitable for your role.",
    instructions: [
      "Write your opening response so the child knows you are listening.",
      "Write how you would explain that you cannot promise to keep the information secret.",
      "Write two neutral prompts you could use without leading the child.",
      "State what you would record immediately afterwards.",
      "State exactly who or what system you would report to in your school.",
      "Add what you would do if the usual safeguarding contact were unavailable.",
    ],
    placeholder: "Opening words…\nConfidentiality explanation…\nNeutral prompts…\nWhat I would record…\nReporting route…\nIf the usual contact is unavailable…",
    minimumCharacters: 260,
  },
  {
    id: "sg26-p7",
    type: "content",
    title: "Children who may face additional barriers to being heard",
    body: "Some children may find it harder to recognise harm, communicate a concern or be believed. Barriers can relate to age, communication, disability, SEND, language, fear of consequences, dependence on adults, discrimination, previous experiences, family circumstances or the nature of the harm. Staff should avoid assumptions, use accessible communication, notice changes from the child's usual presentation and use the safeguarding route when concerned.",
    keyPoints: [
      "Behaviour may communicate distress when words are difficult",
      "Do not assume a child with SEND is displaying behaviour only because of their SEND",
      "Use communication approaches the child can access",
      "Consider the child's lived experience and any barriers to reporting",
      "Keep a child-centred approach while following school procedure",
    ],
  },
  {
    id: "sg26-p8",
    type: "scenario",
    title: "Do not explain away the concern",
    prompt: "A pupil with communication needs becomes distressed around a particular routine. A colleague says, 'That is just part of their SEND.' What should you do?",
    options: [
      { label: "Accept the explanation because the colleague knows the pupil well", feedback: "Familiarity should not replace professional curiosity when there is a safeguarding concern." },
      { label: "Record the change or pattern, consider accessible ways to support communication, and share the concern through safeguarding procedures", feedback: "This avoids diagnostic overshadowing and keeps the child's safety central." },
      { label: "Ask other pupils to find out what is happening", feedback: "Peers should not be used to investigate a safeguarding concern." },
    ],
  },
  {
    id: "sg26-p9",
    type: "content",
    title: "Child-on-child abuse and harmful behaviour",
    body: "Harm between children must not be normalised as banter, part of growing up or simply a behaviour issue. Concerns can involve bullying, discriminatory abuse, sexual harassment or violence, coercive behaviour, harmful online behaviour, exploitation or other abuse. Staff should respond according to the school's safeguarding procedures, consider the safety and needs of all children involved and avoid informal investigation or public discussion of sensitive information.",
    keyPoints: [
      "It can happen inside or outside school and online",
      "Harmful behaviour should not be dismissed because both children are pupils",
      "A child may minimise what happened or fear consequences of reporting",
      "Safeguarding and behaviour procedures may both be relevant",
      "Use the DSL route for safeguarding decisions",
    ],
  },
  {
    id: "sg26-p10",
    type: "scenario",
    title: "When 'banter' becomes a safeguarding concern",
    prompt: "A pupil reports repeated sexualised comments and humiliating messages from peers. Another pupil describes it as a joke. What is the strongest response?",
    options: [
      { label: "Treat it as ordinary friendship conflict because the pupils know each other", feedback: "Potentially harmful behaviour should not be minimised simply because it occurs between peers." },
      { label: "Take the report seriously, ensure immediate safety, record facts and follow the school's safeguarding route", feedback: "This keeps the response child-centred while allowing the DSL to coordinate the appropriate next steps." },
      { label: "Bring everyone together immediately and ask them to agree what happened", feedback: "A spontaneous confrontation can compromise safeguarding and may increase distress or pressure." },
    ],
  },
  {
    id: "sg26-p11",
    type: "visual",
    title: "Specific safeguarding harms: what staff need to recognise",
    layout: "ladder",
    caption: "All-staff training should build recognition and reporting, while specialist assessment and investigation sit with the appropriate safeguarding professionals.",
    items: [
      { heading: "Domestic abuse", text: "Children can be affected by abuse in their household or intimate relationships, including coercive and controlling behaviour.", icon: "1" },
      { heading: "Exploitation", text: "Children may be manipulated, coerced or rewarded into harmful situations, including criminal or sexual exploitation.", icon: "2" },
      { heading: "Serious violence", text: "Changes in peer groups, attendance, behaviour, injuries or unexplained possessions can form part of a wider concern.", icon: "3" },
      { heading: "So-called honour-based abuse", text: "Concerns can include forced marriage or FGM. Follow the school's safeguarding procedure and any role-specific legal duties.", icon: "4" },
      { heading: "Radicalisation", text: "Notice concerning changes or influences and use the school's safeguarding/Prevent route rather than labelling or investigating a pupil yourself.", icon: "5" },
      { heading: "Missing or absent education", text: "Repeated or unexplained absence can be a safeguarding indicator and should connect with attendance and safeguarding systems.", icon: "6" },
    ],
  },
  {
    id: "sg26-p12",
    type: "scenario",
    title: "A contextual safeguarding pattern",
    prompt: "A pupil's attendance drops, their friendship group changes suddenly and staff notice unexplained expensive items. What is the strongest interpretation?",
    options: [
      { label: "Assume the pupil is simply making poor choices", feedback: "The pattern may have several explanations, including exploitation. Staff should avoid blame and share the concern." },
      { label: "Record the observable facts and report the pattern through safeguarding procedures so the wider context can be considered", feedback: "This uses professional curiosity without making an unsupported diagnosis." },
      { label: "Search the pupil's belongings yourself to prove exploitation", feedback: "Staff should follow school procedures rather than conduct an independent safeguarding investigation." },
    ],
  },
  {
    id: "sg26-p13",
    type: "content",
    title: "Information sharing in 2026",
    body: "Information sharing is an essential part of safeguarding. KCSIE 2026 makes clear that data protection is not a barrier to appropriate safeguarding information sharing. Updated statutory information-sharing guidance came into force in September 2026. Staff should use the school's approved systems, share relevant information with the right people for safeguarding purposes and seek DSL advice where necessary rather than withholding a genuine concern because they are uncertain about data protection.",
    keyPoints: [
      "Share relevant safeguarding information through authorised routes",
      "Do not use personal messaging, private notes or unapproved AI tools for safeguarding records",
      "Record what was shared, with whom and why where your procedure requires it",
      "Do not share sensitive information more widely than necessary",
      "If in doubt, seek safeguarding advice rather than simply withholding the concern",
    ],
  },
  {
    id: "sg26-p14",
    type: "quiz",
    title: "Information-sharing decision",
    question: "Which statement best reflects current safeguarding practice?",
    options: [
      "Data protection means safeguarding information should never be shared without parental consent",
      "Relevant safeguarding information can be shared through lawful and authorised routes when necessary to protect a child",
      "Safeguarding information should be copied into personal notes in case the school system is unavailable",
      "Only senior leaders are allowed to pass any safeguarding information to the DSL",
    ],
    answer: 1,
    feedback: "Data protection is not a barrier to appropriate safeguarding information sharing. Staff should use authorised school procedures and seek advice when unsure.",
  },
  {
    id: "sg26-p15",
    type: "visual",
    title: "Write a safeguarding record that another professional can use",
    layout: "flow",
    caption: "A strong record makes clear what happened, what was said and what action followed without turning assumptions into facts.",
    items: [
      { heading: "Context", text: "State when and where the concern arose and who was present where relevant.", icon: "1" },
      { heading: "Observation", text: "Describe what you directly saw, heard or were told.", icon: "2" },
      { heading: "Own words", text: "Where relevant, preserve the child's wording accurately rather than rewriting it into adult language.", icon: "3" },
      { heading: "Action", text: "Record what you did and who you informed.", icon: "4" },
      { heading: "Avoid assumptions", text: "Separate professional concern from unsupported conclusions about the cause.", icon: "5" },
    ],
  },
  {
    id: "sg26-p16",
    type: "activity",
    title: "Turn a weak note into a safeguarding-quality record",
    prompt: "Practise improving a fictional note. Do not use a real pupil or real safeguarding case. Start from this weak note: 'Student was acting strange again. I think something bad is happening at home. Told safeguarding.'",
    instructions: [
      "Replace vague language with observable facts.",
      "Separate what was observed from what you are concerned might be happening.",
      "Add the date/time/context that would make the record usable.",
      "Include any exact words that would matter if this were a fictional disclosure.",
      "Record the action taken and reporting route.",
      "Remove unnecessary judgement or speculation.",
    ],
    placeholder: "Rewrite the fictional record here…",
    minimumCharacters: 240,
  },
  {
    id: "sg26-p17",
    type: "scenario",
    title: "Concern about an adult who works with children",
    prompt: "You observe conduct by an adult that makes you uncomfortable and may be inconsistent with expected professional boundaries, but you are unsure whether it reaches the threshold for an allegation. What should you do?",
    options: [
      { label: "Say nothing unless you can prove misconduct", feedback: "Staff should use the school's procedure for concerns about adults, including low-level concerns where applicable." },
      { label: "Use the school's concerns/allegations or low-level-concerns procedure and the correct alternative contact if necessary", feedback: "The concern should enter the authorised safeguarding process rather than being informally investigated or ignored." },
      { label: "Ask colleagues informally whether they have noticed the same thing before reporting", feedback: "Informal circulation can breach confidentiality and delay the formal safeguarding route." },
    ],
  },
  {
    id: "sg26-p18",
    type: "checklist",
    title: "Safeguarding presentation exit check",
    prompt: "Before completing the course, confirm that you can act on these all-staff essentials without needing to search for them during an incident.",
    items: [
      "I know my DSL and deputy arrangements",
      "I know the exact route for reporting a concern in my school",
      "I can respond to a disclosure without promising secrecy or investigating",
      "I can recognise that abuse, neglect and exploitation may appear as patterns rather than one clear event",
      "I understand early help, safeguarding concerns and immediate danger at an all-staff level",
      "I know that child-on-child harm must not be normalised",
      "I know that online and offline safeguarding can overlap",
      "I can create a factual safeguarding record using the approved system",
      "I understand that appropriate information sharing supports safeguarding",
      "I know the route for concerns about adults, low-level concerns and whistleblowing",
      "I have read KCSIE 2026 Part One in full and know where my current school policy is stored",
    ],
    completionText: "Safeguarding presentation exit check complete.",
  },
];

export function addSafeguardingPresentationDepth2026(course: Course): Course {
  if (course.id !== "safeguarding-essentials") return course;

  const existingIds = new Set(course.modules.map(module => module.id));
  const additions = safeguardingPresentationModules.filter(module => !existingIds.has(module.id));
  if (!additions.length) return course;

  const modules = [...course.modules];
  const finalCheckIndex = modules.findIndex(module => module.id === "sg26-15");
  const insertAt = finalCheckIndex >= 0 ? finalCheckIndex : Math.max(1, modules.length - 2);
  modules.splice(insertAt, 0, ...additions);

  const extraObjectives = [
    "Recognise common indicators and patterns associated with abuse, neglect and exploitation",
    "Understand early help, safeguarding concerns and immediate-danger responses at an all-staff level",
    "Recognise barriers that can make it harder for some children to communicate or be heard",
    "Respond to child-on-child and contextual safeguarding concerns without normalising or investigating them",
    "Apply the 2026 information-sharing expectations through authorised school systems",
    "Produce clear factual safeguarding records that distinguish evidence from assumption",
  ];

  return {
    ...course,
    duration: Math.max(course.duration, 165),
    summary: "A guided, presentation-style all-staff safeguarding course aligned to KCSIE 2026 and current information-sharing expectations. Staff work through recognition, response, recording, reporting, scenarios and school-specific action one section at a time.",
    objectives: [...new Set([...course.objectives, ...extraObjectives])],
    modules,
  };
}
