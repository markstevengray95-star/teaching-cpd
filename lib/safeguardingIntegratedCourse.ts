import type { Course } from "./data";

export const safeguardingIntegratedCourse: Course = {
  id: "safeguarding-essentials",
  title: "Safeguarding Essentials: KCSIE 2026 & Your School",
  category: "Safeguarding",
  duration: 120,
  level: "Foundation",
  summary: "A school-integrated safeguarding course aligned to Keeping Children Safe in Education 2026. Staff connect national expectations to their own safeguarding policy, DSL arrangements, reporting routes, online-safety systems and local procedures.",
  objectives: [
    "Understand the all-staff safeguarding expectations in KCSIE 2026",
    "Read and acknowledge KCSIE 2026 Part One in full",
    "Know the school safeguarding policy, DSL/deputy arrangements and reporting route",
    "Respond appropriately to concerns and disclosures without investigating",
    "Record and share safeguarding information factually through approved systems",
    "Understand child-on-child safeguarding, online safety, filtering and monitoring responsibilities",
    "Know how to respond to concerns about adults, low-level concerns and whistleblowing",
    "Connect Prevent and other safeguarding duties to the school's local procedures"
  ],
  recommendedFor: ["All staff", "ECT", "Teaching Assistant", "Pastoral", "Support staff", "Volunteers where appropriate"],
  modules: [
    {
      id: "sg26-1",
      type: "content",
      title: "Start with KCSIE 2026 and your own school",
      body: "Safeguarding training only becomes useful when staff can connect national guidance to the procedures they must use in their own setting. KCSIE 2026 is the statutory starting point for schools and colleges in England. All staff should read Part One in full and follow their school's safeguarding and child-protection procedures. This course therefore combines national expectations with actions staff should complete in the Safeguarding Compliance Centre and School Documents area.",
      keyPoints: [
        "KCSIE 2026 Part One is required reading for all staff",
        "The short overview is a quick reference and does not replace Part One",
        "Your school's current safeguarding policy and DSL instructions must be easy to locate",
        "Generic CPD never replaces a school's live reporting procedure",
        "When local arrangements change, staff need the updated version"
      ]
    },
    {
      id: "sg26-2",
      type: "visual",
      title: "The school safeguarding system",
      layout: "flow",
      caption: "Safeguarding works as a connected system rather than a single annual course.",
      items: [
        { heading: "National guidance", text: "KCSIE, Working Together, Prevent and relevant DfE standards set the wider expectations.", icon: "1" },
        { heading: "School policy", text: "The school translates those expectations into local procedures, contacts and reporting routes.", icon: "2" },
        { heading: "Staff knowledge", text: "Staff know what to notice, how to respond and exactly where to report.", icon: "3" },
        { heading: "DSL action", text: "The DSL/deputy considers the concern and coordinates the appropriate safeguarding response.", icon: "4" },
        { heading: "Review", text: "Leaders monitor training, acknowledgements, online-safety systems and changes in guidance.", icon: "5" }
      ]
    },
    {
      id: "sg26-3",
      type: "activity",
      title: "Build your school safeguarding map",
      prompt: "Use your school's live documents and Safeguarding Compliance Centre to record the practical information you need before a concern arises. Do not enter confidential pupil information.",
      instructions: [
        "Locate your school's current safeguarding/child-protection policy and record its version or review date.",
        "Identify the DSL and deputy DSL arrangements for your setting.",
        "Record the exact system or route used to report a concern.",
        "Locate the procedure for concerns or allegations about adults and low-level concerns.",
        "Locate the whistleblowing/escalation route.",
        "Check where online-safety, filtering and monitoring responsibilities are explained.",
        "Note what you would do if the usual safeguarding contact were unavailable."
      ],
      placeholder: "Policy/version…\nDSL/deputy arrangements…\nReporting route…\nAdult-concern route…\nWhistleblowing route…\nOnline-safety arrangements…\nAlternative contact…",
      minimumCharacters: 220
    },
    {
      id: "sg26-4",
      type: "quiz",
      title: "KCSIE reading check",
      question: "Which statement best reflects the 2026 all-staff reading expectation?",
      options: [
        "Only the DSL needs to read KCSIE",
        "Staff can read the short overview instead of Part One",
        "All staff should read KCSIE 2026 Part One in full and follow their school's safeguarding procedures",
        "Only staff who teach lessons need safeguarding guidance"
      ],
      answer: 2,
      feedback: "KCSIE 2026 requires all staff to read Part One in full. The overview is complementary and does not replace it."
    },
    {
      id: "sg26-5",
      type: "content",
      title: "From concern to action",
      body: "Staff do not need to prove that harm has occurred before sharing a safeguarding concern. The professional task is to notice relevant information, respond appropriately, make a factual record and pass it through the school's agreed safeguarding route. The DSL and safeguarding partners determine what action follows. If a concern is not being addressed, staff should know how to escalate it.",
      keyPoints: [
        "Do not wait for certainty before using the safeguarding route",
        "Do not investigate independently",
        "Act promptly and follow the school's current procedure",
        "Use professional curiosity without assuming a cause",
        "Escalate appropriately if a concern remains unresolved"
      ]
    },
    {
      id: "sg26-6",
      type: "scenario",
      title: "Responding to a disclosure",
      prompt: "A pupil begins to share information that may indicate a safeguarding concern. What is the strongest response?",
      options: [
        { label: "Promise that you will keep everything secret", feedback: "Staff should not promise confidentiality they may not be able to keep." },
        { label: "Listen calmly, avoid leading questions, explain that information may need to be shared, then use the school's reporting route", feedback: "This supports the pupil while keeping the response within safeguarding procedure." },
        { label: "Question other pupils so you can establish exactly what happened", feedback: "Staff should not conduct their own safeguarding investigation." }
      ]
    },
    {
      id: "sg26-7",
      type: "content",
      title: "Recording and information sharing",
      body: "Safeguarding records should be timely, factual and stored through approved school systems. Staff should distinguish what they observed, what was said and what action they took. Relevant information should be shared with the people who need it for safeguarding purposes in line with school procedure and current guidance, rather than being kept in personal notes or informal messaging channels.",
      keyPoints: [
        "Record promptly and factually",
        "Distinguish observation from interpretation",
        "Use the pupil's own words where relevant",
        "Use approved safeguarding systems",
        "Do not keep parallel personal records",
        "Seek DSL advice when unsure about information sharing"
      ]
    },
    {
      id: "sg26-8",
      type: "scenario",
      title: "A pattern rather than one event",
      prompt: "You notice several small changes over time that concern you, but no single observation proves what is happening. What should you do?",
      options: [
        { label: "Ignore the pattern until there is definite proof", feedback: "Staff do not need proof before sharing a genuine safeguarding concern." },
        { label: "Record the relevant observations factually and use the school's safeguarding route", feedback: "Patterns can matter. Share the evidence without diagnosing the cause." },
        { label: "Create your own investigation plan", feedback: "Investigation is not the role of ordinary staff." }
      ]
    },
    {
      id: "sg26-9",
      type: "content",
      title: "Child-on-child safeguarding",
      body: "Harmful behaviour between children should not be minimised as an inevitable part of growing up. Staff should understand how safeguarding, behaviour and pastoral systems connect, recognise that barriers can make reporting difficult, and use the school's safeguarding route when behaviour raises a safeguarding concern.",
      keyPoints: [
        "Take concerns between children seriously",
        "Do not normalise harmful behaviour",
        "Use safeguarding procedures where the concern meets that threshold",
        "Keep the needs and safety of all involved children in view",
        "Avoid informal investigation or public discussion of sensitive concerns"
      ]
    },
    {
      id: "sg26-10",
      type: "content",
      title: "Online safety, filtering, monitoring and AI",
      body: "KCSIE treats online safety as part of safeguarding. Schools need appropriate filtering and monitoring arrangements, and staff should know how their own responsibilities fit into those systems. Online concerns may overlap with offline safeguarding. New digital and AI tools should be considered through the school's safeguarding, data-protection and technology-governance processes rather than introduced without review.",
      keyPoints: [
        "Online safety is part of safeguarding, not a separate optional topic",
        "Know how to report online concerns and filtering/monitoring issues",
        "Staff supervision remains important alongside technical controls",
        "Do not upload sensitive safeguarding information into unapproved tools",
        "Report failures or gaps in filtering and monitoring through the school's route"
      ]
    },
    {
      id: "sg26-11",
      type: "scenario",
      title: "Filtering and monitoring concern",
      prompt: "You become aware that a school device can access material that appears inconsistent with the school's filtering controls. What is the strongest response?",
      options: [
        { label: "Assume the technical team will notice eventually", feedback: "Known safeguarding-related control gaps should be reported promptly." },
        { label: "Use the school's agreed safeguarding/IT reporting route so the issue can be assessed and addressed", feedback: "Filtering and monitoring work best when staff report concerns into the agreed system." },
        { label: "Share the material widely with colleagues to demonstrate the issue", feedback: "Avoid unnecessary sharing of potentially harmful material." }
      ]
    },
    {
      id: "sg26-12",
      type: "content",
      title: "Concerns about adults and low-level concerns",
      body: "Staff should know the school's procedure for concerns or allegations about adults working with children, including the route to use when the concern involves the person who would normally receive it. Low-level concerns should be handled through the school's defined process rather than ignored, normalised or investigated informally by colleagues.",
      keyPoints: [
        "Know the named route for concerns about adults",
        "Know the alternative route if the usual contact is involved",
        "Use the school's low-level-concerns procedure",
        "Do not confront or investigate independently",
        "Keep information within authorised channels"
      ]
    },
    {
      id: "sg26-13",
      type: "scenario",
      title: "Concern about an adult",
      prompt: "You have a safeguarding concern about the conduct of an adult working with children. What should you do?",
      options: [
        { label: "Investigate by interviewing pupils or colleagues", feedback: "Use the formal procedure rather than carrying out an independent investigation." },
        { label: "Use the school's concerns/allegations or low-level-concerns procedure and the correct senior or alternative contact", feedback: "The concern should enter the proper safeguarding process promptly." },
        { label: "Wait for a formal complaint before reporting", feedback: "Staff should act on relevant concerns rather than wait for certainty or a complaint." }
      ]
    },
    {
      id: "sg26-14",
      type: "content",
      title: "Prevent as a safeguarding responsibility",
      body: "The Prevent duty is delivered through safeguarding approaches. Staff should understand the school's local procedure for raising concerns about a learner who may be susceptible to radicalisation and should use the safeguarding route rather than making their own determination or conducting an investigation. DSLs and designated leads require deeper role-specific knowledge and guidance.",
      keyPoints: [
        "Treat Prevent as part of the safeguarding system",
        "Use the school's concern and referral route",
        "Do not label a pupil on the basis of one comment or characteristic",
        "DSLs and Prevent leads need role-appropriate training",
        "Use current DfE/local safeguarding-partnership guidance"
      ]
    },
    {
      id: "sg26-15",
      type: "checklist",
      title: "School-integrated safeguarding readiness",
      prompt: "Confirm that you can access the practical information needed in your own school.",
      items: [
        "I have read KCSIE 2026 Part One in full",
        "I can open the current school safeguarding/child-protection policy",
        "I know the DSL and deputy arrangements",
        "I know exactly how to report a concern",
        "I know the route for concerns about adults and low-level concerns",
        "I know the whistleblowing/escalation route",
        "I know how online-safety and filtering/monitoring concerns are reported",
        "I know where current safeguarding guidance and school documents are stored",
        "I understand that this course does not replace school-specific induction or specialist DSL training"
      ],
      completionText: "School safeguarding readiness check complete."
    },
    {
      id: "sg26-16",
      type: "quiz",
      title: "Final safeguarding mastery check",
      question: "Which statement best summarises an all-staff safeguarding response?",
      options: [
        "Investigate until you are certain before reporting",
        "Notice, respond appropriately, record facts, report through the school's route and follow safeguarding guidance",
        "Keep the matter private unless a parent asks for action",
        "Use whichever reporting route feels most convenient"
      ],
      answer: 1,
      feedback: "The consistent all-staff approach is to notice, respond appropriately, record, report through the authorised route and follow safeguarding guidance."
    },
    {
      id: "sg26-17",
      type: "reflection",
      title: "Implementation commitment",
      prompt: "Without entering confidential pupil information, identify one part of your school's safeguarding system you will make easier to access or remember, and state how you will keep your KCSIE and local-policy knowledge current."
    }
  ]
};
