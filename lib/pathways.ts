export type Pathway = {
  id: string;
  title: string;
  summary: string;
  audience: string;
  outcome: string;
  courseIds: string[];
};

export const pathways: Pathway[] = [
  {
    id: "ect-new-teacher",
    title: "ECT & New Teacher",
    summary: "Build secure classroom routines, responsive teaching and confident professional practice.",
    audience: "ECTs and teachers new to the school or profession",
    outcome: "A practical foundation in routines, questioning, assessment, safeguarding and adaptive teaching.",
    courseIds: ["safeguarding-essentials", "behaviour-routines", "effective-questioning", "retrieval-practice", "adaptive-teaching", "assessment-for-learning"]
  },
  {
    id: "teaching-assistant",
    title: "Teaching Assistant Development",
    summary: "Use support, scaffolding and communication in ways that increase access without removing pupil thinking or independence.",
    audience: "Teaching assistants, learning support assistants and classroom support staff",
    outcome: "More confident support for SEND, language, behaviour and classroom independence within clear professional boundaries.",
    courseIds: ["safeguarding-essentials", "send-inclusive-practice", "adaptive-teaching", "eal-inclusive-teaching", "behaviour-routines", "supporting-anxious-pupils"]
  },
  {
    id: "excellent-teaching",
    title: "Excellent Teaching",
    summary: "Develop a coherent evidence-informed teaching toolkit focused on explanation, memory, checking and independence.",
    audience: "Teachers at any career stage",
    outcome: "More deliberate lesson design and stronger use of evidence about pupil understanding.",
    courseIds: ["cognitive-load-theory", "rosenshine-principles", "effective-questioning", "retrieval-practice", "assessment-for-learning", "metacognition-self-regulation"]
  },
  {
    id: "send-champion",
    title: "SEND Champion",
    summary: "Strengthen inclusive classroom practice while maintaining ambitious learning goals.",
    audience: "Teachers, teaching assistants and aspiring SEND champions",
    outcome: "Greater confidence identifying barriers and selecting proportionate, pupil-specific classroom support.",
    courseIds: ["send-inclusive-practice", "autism-inclusive-classroom", "adhd-classroom-strategies", "dyslexia-classroom-support", "adaptive-teaching", "supporting-anxious-pupils"]
  },
  {
    id: "safeguarding-confidence",
    title: "Safeguarding Confidence",
    summary: "Keep safeguarding knowledge active through policy-aware learning, professional scenarios and clear role boundaries.",
    audience: "All school staff, with particular value for tutors, pastoral teams and new staff",
    outcome: "Greater confidence recognising concerns, responding appropriately, recording factually and following the school's current safeguarding route.",
    courseIds: ["safeguarding-essentials", "online-safety", "effective-tutoring", "trauma-informed-practice", "parent-communication"]
  },
  {
    id: "aspiring-middle-leader",
    title: "Aspiring Middle Leader",
    summary: "Move from individual classroom practice to leading improvement across a team.",
    audience: "Aspiring and current middle leaders",
    outcome: "Sharper priorities, stronger professional conversations and more sustainable team development.",
    courseIds: ["middle-leadership", "instructional-coaching", "difficult-conversations", "effective-feedback", "curriculum-sequencing", "disciplinary-literacy"]
  },
  {
    id: "senior-leadership",
    title: "Senior Leadership Development",
    summary: "Connect implementation, staff development, curriculum, workload and evidence into sustainable whole-school improvement.",
    audience: "Aspiring and current senior leaders, CPD leads and school improvement leads",
    outcome: "Stronger implementation decisions, professional development systems and evidence-informed review across teams.",
    courseIds: ["middle-leadership", "instructional-coaching", "difficult-conversations", "curriculum-sequencing", "staff-wellbeing", "assessment-for-learning"]
  },
  {
    id: "pastoral-development",
    title: "Pastoral & Pupil Support",
    summary: "Develop calm, consistent and appropriately bounded support for pupils beyond subject teaching alone.",
    audience: "Tutors, pastoral staff, teachers and support staff",
    outcome: "Stronger responses to wellbeing, behaviour, communication and safeguarding concerns.",
    courseIds: ["safeguarding-essentials", "de-escalation", "supporting-anxious-pupils", "effective-tutoring", "parent-communication", "behaviour-management"]
  },
  {
    id: "digital-ai",
    title: "Digital & AI Teaching",
    summary: "Use digital tools and generative AI productively while protecting privacy and professional judgement.",
    audience: "All staff",
    outcome: "Safer, more purposeful use of AI and digital systems in teaching and professional work.",
    courseIds: ["ai-in-education", "online-safety", "effective-feedback", "metacognition-self-regulation"]
  },
  {
    id: "literacy-language",
    title: "Literacy & Language Across the Curriculum",
    summary: "Make subject language, reading, writing and classroom talk more explicit and accessible.",
    audience: "Teachers and teaching assistants across subjects",
    outcome: "Clearer disciplinary language teaching and stronger access for pupils with differing literacy and language needs.",
    courseIds: ["disciplinary-literacy", "eal-inclusive-teaching", "dyslexia-classroom-support", "effective-feedback", "supporting-high-attainers"]
  }
];
