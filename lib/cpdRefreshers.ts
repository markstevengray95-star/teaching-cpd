export type CpdRefresherCheck = {
  question: string;
  options: string[];
  answer: number;
  feedback: string;
};

export type CpdRefresherSection = {
  title: string;
  minutes: number;
  intro: string;
  keyPoints: string[];
  scenario?: CpdRefresherCheck;
};

export type CpdRefresher = {
  id: string;
  title: string;
  category: string;
  minutes: 30;
  summary: string;
  boundary?: string;
  sections: CpdRefresherSection[];
  finalChecks: CpdRefresherCheck[];
  commitPrompt: string;
};

export const cpdRefreshers: CpdRefresher[] = [
  {
    id: "refresher-safeguarding-essentials",
    title: "Safeguarding Essentials Refresher",
    category: "Safeguarding",
    minutes: 30,
    summary: "A concise whole-staff refresher on recognising concerns, listening safely, recording facts and using the school's safeguarding route promptly.",
    boundary: "This refresher supports recall. It does not replace your school's current safeguarding or child-protection policy, DSL guidance, local procedure or required statutory training.",
    sections: [
      {
        title: "1. Notice and respond",
        minutes: 9,
        intro: "Safeguarding starts with noticing information that may matter and responding calmly without trying to prove what happened.",
        keyPoints: [
          "Take concerns seriously even when information is incomplete or uncertain.",
          "Listen calmly and allow the pupil to communicate in their own way.",
          "Ask only what is necessary to understand immediate safety or clarify what has been said; do not conduct an investigation.",
          "Do not promise secrecy. Explain that information may need to be shared with the people responsible for keeping pupils safe.",
        ],
        scenario: {
          question: "A pupil begins to share something worrying, then stops and says they do not want anyone else to know. What is the strongest staff response?",
          options: ["Listen calmly, avoid promising secrecy and follow the school's safeguarding route", "Promise not to tell anyone so the pupil continues", "Question the pupil until the full account is clear", "Wait to see whether the pupil raises it again"],
          answer: 0,
          feedback: "The staff role is to listen, keep appropriate boundaries and use the school's current safeguarding procedure rather than investigate or wait for proof.",
        },
      },
      {
        title: "2. Record and report",
        minutes: 10,
        intro: "A useful safeguarding record separates what was actually said or observed from interpretation and reaches the right person promptly.",
        keyPoints: [
          "Record factual information, the source and relevant timing as accurately as possible.",
          "Keep direct observations separate from your interpretation or concern.",
          "Use the school's current recording and reporting route promptly; uncertainty is not a reason to delay.",
          "Share information on a need-to-know basis through the appropriate safeguarding process.",
        ],
        scenario: {
          question: "Which note is the strongest safeguarding record?",
          options: ["The pupil looked upset and said, ‘I do not want to go home today,’ recorded with the time and context", "The pupil is clearly unsafe at home", "Something bad is probably happening", "Several colleagues think the family situation seems suspicious"],
          answer: 0,
          feedback: "The strongest record preserves what was observed or said without presenting an interpretation as fact.",
        },
      },
      {
        title: "3. Keep the boundary clear",
        minutes: 11,
        intro: "Professional curiosity means noticing, recording and passing on relevant information through the correct route — not solving the case yourself.",
        keyPoints: [
          "Continue normal professional support while the designated safeguarding process takes the concern forward.",
          "Pass on new factual information that becomes relevant.",
          "Avoid unnecessary discussion of confidential details.",
          "If training examples differ from current school procedure, follow current policy and DSL direction.",
        ],
      },
    ],
    finalChecks: [
      { question: "What should staff do when a concern is incomplete?", options: ["Use the current safeguarding route rather than waiting for proof", "Investigate first", "Ignore it unless another member of staff agrees"], answer: 0, feedback: "Incomplete information can still be relevant safeguarding information." },
      { question: "What should a safeguarding record prioritise?", options: ["Facts, source and relevant timing", "A confident diagnosis", "A theory about motive"], answer: 0, feedback: "Factual recording protects the evidence trail and professional decision-making." },
      { question: "Who should lead the next safeguarding decision after staff report a concern?", options: ["The appropriate designated safeguarding process in school", "The member of staff who first noticed it", "The whole staff team informally"], answer: 0, feedback: "Staff should use the current school safeguarding route and designated roles." },
    ],
    commitPrompt: "What one safeguarding routine or reporting step will you make sure is completely clear before you next need it?",
  },
  {
    id: "refresher-send-adaptive-practice",
    title: "SEND & Adaptive Practice Refresher",
    category: "SEND",
    minutes: 30,
    summary: "A practical refresher on identifying barriers, preserving ambition, choosing proportionate support and reviewing independence.",
    sections: [
      { title: "1. Start with the barrier", minutes: 9, intro: "A label can provide useful context, but the teaching decision should begin with the barrier in the current task, explanation or environment.", keyPoints: ["Identify the specific demand making access harder.", "Separate what the learner understands from what the task requires them to do.", "Avoid assuming pupils with the same label need the same adaptation.", "Use pupil information and existing plans alongside current classroom evidence."], scenario: { question: "A learner can explain the idea verbally but cannot begin a multi-step written task. What is the strongest first move?", options: ["Identify which task step creates the access barrier", "Lower the learning goal immediately", "Add permanent adult prompting", "Give a completely different topic"], answer: 0, feedback: "The observed barrier should drive the first adaptation." } },
      { title: "2. Adapt the route", minutes: 10, intro: "Good adaptation changes access while protecting the intended learning where appropriate.", keyPoints: ["Keep the core learning goal visible.", "Use the smallest scaffold that removes the barrier.", "Make instructions, vocabulary, sequence and success criteria explicit where useful.", "Avoid support that completes the thinking for the learner."], scenario: { question: "Which scaffold best protects independence?", options: ["A short visible sequence that helps the learner start", "An adult prompts every step", "A permanently easier objective", "A completed model to copy exactly"], answer: 0, feedback: "The smallest useful scaffold preserves more of the learner's own thinking." } },
      { title: "3. Review and fade", minutes: 11, intro: "An adaptation is not automatically successful because work was completed once.", keyPoints: ["Review accuracy, access and independence together.", "Fade or alter support when evidence shows the learner can do more independently.", "If support is not working, revisit the barrier rather than simply adding more intervention.", "Keep ambition and dignity central to the review." ] },
    ],
    finalChecks: [
      { question: "What should usually be identified before choosing an adaptation?", options: ["The barrier in the task or context", "A generic intervention list", "The easiest worksheet"], answer: 0, feedback: "Barrier-first thinking makes support more precise." },
      { question: "What should review evidence include?", options: ["Access, accuracy and independence", "Completion only", "Whether the support looked impressive"], answer: 0, feedback: "Completion alone can hide dependency or reduced challenge." },
      { question: "When should scaffolding change?", options: ["When evidence shows it should be faded, adapted or replaced", "Never once introduced", "Only at the end of the year"], answer: 0, feedback: "Adaptive practice should remain responsive to evidence." },
    ],
    commitPrompt: "Which current scaffold could you review for independence rather than simply task completion?",
  },
  {
    id: "refresher-behaviour-routines",
    title: "Behaviour & Routines Refresher",
    category: "Teaching & Learning",
    minutes: 30,
    summary: "A short refresher on calm consistency, explicit routines, correction and rebuilding successful classroom habits.",
    sections: [
      { title: "1. Make routines teachable", minutes: 9, intro: "A routine becomes reliable when pupils know exactly what it looks and sounds like, not just when the expectation has been announced.", keyPoints: ["Define the routine in observable steps.", "Teach, model and rehearse it rather than relying on reminders alone.", "Reduce ambiguity at predictable transition points.", "Use consistent cues so pupils can respond with less cognitive load."], scenario: { question: "A class repeatedly loses time during equipment transitions. What is the strongest first change?", options: ["Teach and rehearse a short observable transition routine", "Give a longer warning each lesson", "Add several new rules", "Wait for pupils to work it out"], answer: 0, feedback: "Repeated friction is usually better addressed through a clear taught routine than more verbal reminders." } },
      { title: "2. Correct calmly and predictably", minutes: 10, intro: "Correction is more effective when it is proportionate, brief and connected to the known expectation.", keyPoints: ["Use neutral, specific language about the expected behaviour.", "Avoid turning routine correction into a public argument.", "Follow the school's behaviour policy consistently.", "Notice whether a pupil understands and can enact the expected routine."], scenario: { question: "A pupil does not follow a familiar entry routine. What is the best first response?", options: ["Use the agreed calm correction and direct them back to the routine", "Start a prolonged public debate", "Ignore it every time", "Invent a new consequence outside policy"], answer: 0, feedback: "Calm predictable correction protects consistency and reduces escalation." } },
      { title: "3. Review the system", minutes: 11, intro: "Persistent behaviour friction can signal that a routine is unclear, inconsistently taught or too difficult to enact reliably.", keyPoints: ["Look for patterns by time, task and transition.", "Separate a routine problem from a learning or access barrier.", "Reteach after disruption rather than assuming previous instruction is enough.", "Review whether adult responses are consistent with agreed school policy." ] },
    ],
    finalChecks: [
      { question: "What makes a routine easier to follow?", options: ["Observable steps and consistent cues", "More vague reminders", "Changing the expectation frequently"], answer: 0, feedback: "Predictability reduces ambiguity." },
      { question: "What should correction usually be?", options: ["Calm, specific and proportionate", "Public and lengthy", "Different each time"], answer: 0, feedback: "Predictability supports a calmer learning environment." },
      { question: "If a routine repeatedly fails, what should staff review?", options: ["How clearly it was taught, practised and supported", "Only pupil motivation", "Whether more rules can be added"], answer: 0, feedback: "A routine is partly an implementation system and should be reviewed as one." },
    ],
    commitPrompt: "Which classroom routine would benefit most from being retaught in observable steps?",
  },
  {
    id: "refresher-safe-ai-digital",
    title: "Safe AI & Digital Teaching Refresher",
    category: "Digital Teaching",
    minutes: 30,
    summary: "A rapid refresher on purposeful use, data boundaries, verification, accessibility and human accountability when using digital or AI-supported tools.",
    sections: [
      { title: "1. Start with purpose", minutes: 9, intro: "A tool is useful when it solves a defined professional or learning problem, not merely because it is fast or impressive.", keyPoints: ["Define the task and intended benefit first.", "Choose tools that fit the educational purpose.", "Avoid adding technology where it creates unnecessary complexity.", "Keep a workable alternative where access requires it."], scenario: { question: "A new tool produces polished resources quickly. What should happen before wider use?", options: ["Check whether it solves the intended task safely and effectively", "Adopt it because the output looks professional", "Use it for every task", "Judge it only by speed"], answer: 0, feedback: "Purpose and evidence should come before novelty." } },
      { title: "2. Protect data and access", minutes: 10, intro: "Safe workflows set appropriate information and accessibility boundaries before routine use.", keyPoints: ["Follow school policy for personal or sensitive information.", "Do not enter information into a tool merely because the interface allows it.", "Check accessibility, device and language assumptions.", "Use approved routes and controls for school data."], scenario: { question: "What is the strongest default for sensitive school information?", options: ["Use only approved systems and the school's defined data-handling rules", "Paste it into any useful tool", "Remove a pupil's first name and assume everything else is safe", "Let each staff member decide independently"], answer: 0, feedback: "Data handling should follow approved organisational boundaries, not ad-hoc individual judgement." } },
      { title: "3. Verify and remain accountable", minutes: 11, intro: "Fluent digital output can still be inaccurate or unsuitable. Professional responsibility remains with the person using and approving it.", keyPoints: ["Verify factual and evaluative outputs according to risk.", "Check pupil-facing explanations carefully.", "Review bias, accessibility and suitability rather than accuracy alone.", "Keep human judgement in decisions that affect pupils or staff." ] },
    ],
    finalChecks: [
      { question: "What is evidence that a digital tool is useful?", options: ["It improves the defined learning or professional outcome", "It is new", "It produces long answers"], answer: 0, feedback: "Usefulness is linked to the actual purpose." },
      { question: "Who remains responsible for an important AI-supported output used in school?", options: ["The professional who checks and approves it", "The AI system", "Nobody if it was automatically generated"], answer: 0, feedback: "Digital support does not remove professional accountability." },
      { question: "When should verification be strongest?", options: ["When errors could have important consequences", "Only when the interface looks old", "Never if the wording sounds confident"], answer: 0, feedback: "Verification should be proportionate to risk and consequence." },
    ],
    commitPrompt: "Which digital or AI workflow in your work needs a clearer verification or data boundary?",
  },
  {
    id: "refresher-wellbeing-workload",
    title: "Staff Wellbeing & Workload Refresher",
    category: "Wellbeing",
    minutes: 30,
    summary: "A practical refresher on distinguishing individual support from organisational workload improvement and testing whether changes actually reduce pressure.",
    sections: [
      { title: "1. Diagnose the pressure", minutes: 9, intro: "Wellbeing concerns can have personal and organisational dimensions. Improvement should not assume every pressure is an individual resilience issue.", keyPoints: ["Look for repeated workload patterns, duplication and deadline congestion.", "Use staff experience alongside process evidence.", "Protect appropriate individual support without making disclosure a requirement.", "Identify which pressures the organisation can realistically change."], scenario: { question: "Several teams report duplicated reporting as a major pressure. What is the strongest first response?", options: ["Map the duplicated process and identify what can be removed or combined", "Add a resilience session only", "Tell staff to work faster", "Assume nothing can change"], answer: 0, feedback: "Where pressure is caused by controllable process friction, system change should be considered directly." } },
      { title: "2. Make a bounded change", minutes: 10, intro: "Small, defined changes are easier to evaluate than broad wellbeing initiatives with no clear mechanism.", keyPoints: ["Remove, simplify, sequence or automate low-value work where appropriate.", "Preserve essential safeguarding, teaching or assurance outcomes.", "Avoid adding a wellbeing initiative that itself creates extra workload.", "Be clear about whose work changes and where any burden moves."], scenario: { question: "A change saves one department time but creates extra administration for another. What should happen?", options: ["Review the whole workflow so burden is not simply displaced", "Keep it because the first department improved", "Ask the second department to absorb it", "Add a wellbeing poster campaign"], answer: 0, feedback: "System improvement should check the whole workflow, not only one local gain." } },
      { title: "3. Review the effect", minutes: 11, intro: "A popular initiative is not necessarily an effective workload intervention.", keyPoints: ["Measure time, duplication or process change where possible.", "Check staff experience after the change.", "Look for unintended burden elsewhere.", "Keep, adapt or stop the change based on evidence rather than launch enthusiasm." ] },
    ],
    finalChecks: [
      { question: "What is strongest evidence for a workload intervention?", options: ["Actual workload/process change plus staff experience", "Attendance at a launch event", "Number of emails about wellbeing"], answer: 0, feedback: "The evidence should match the workload claim." },
      { question: "What should system improvement avoid?", options: ["Moving hidden workload to another team", "Reviewing duplicated process", "Removing low-value work"], answer: 0, feedback: "Displaced burden can make a local improvement misleading." },
      { question: "Can individual support and system change coexist?", options: ["Yes — they address different parts of the problem", "No — only one can be used", "Only if staff disclose personal details"], answer: 0, feedback: "Appropriate individual support can sit alongside organisational improvement." },
    ],
    commitPrompt: "Which recurring piece of workload could your team simplify, remove or redesign without losing an important outcome?",
  },
];
