export type InductionRole = "ECT" | "Teacher" | "Teaching Assistant" | "Pastoral" | "Middle Leader" | "Support Staff";

export type InductionTemplateTask = {
  title: string;
  description: string;
  taskType: "course" | "policy" | "meeting" | "checklist" | "evidence";
  courseKeyword?: string;
  dueOffsetDays: number;
};

const COMMON_INDUCTION: InductionTemplateTask[] = [
  { title: "Safeguarding essentials", description: "Complete the school's safeguarding induction and confirm you know the current reporting route.", taskType: "course", courseKeyword: "safeguard", dueOffsetDays: 3 },
  { title: "Read core school policies", description: "Read the current safeguarding, behaviour, SEND, data protection and health & safety policies in the School Knowledge Base.", taskType: "policy", dueOffsetDays: 5 },
  { title: "Systems and routines orientation", description: "Confirm you can access the systems, communication routes and day-to-day routines needed for your role.", taskType: "checklist", dueOffsetDays: 7 },
  { title: "Meet your line manager or mentor", description: "Agree first priorities, support routes and a review date.", taskType: "meeting", dueOffsetDays: 10 },
  { title: "First induction review", description: "Record what is secure, what still needs support and the next action for your induction.", taskType: "evidence", dueOffsetDays: 30 },
];

const ROLE_TASKS: Record<InductionRole, InductionTemplateTask[]> = {
  ECT: [
    { title: "Behaviour and classroom routines", description: "Complete a behaviour/routines CPD activity and identify two routines to rehearse consistently.", taskType: "course", courseKeyword: "behaviour", dueOffsetDays: 14 },
    { title: "Adaptive teaching and SEND", description: "Complete an adaptive teaching or SEND course and record one classroom adaptation to trial.", taskType: "course", courseKeyword: "send", dueOffsetDays: 21 },
    { title: "ECT mentor checkpoint", description: "Review workload, classroom routines, pupil learning evidence and the next development priority with your mentor.", taskType: "meeting", dueOffsetDays: 42 },
  ],
  Teacher: [
    { title: "Teaching and learning orientation", description: "Complete one teaching-and-learning course that matches your role or department priorities.", taskType: "course", courseKeyword: "question", dueOffsetDays: 21 },
    { title: "Department curriculum meeting", description: "Meet the department lead to review curriculum sequencing, assessment routines and key resources.", taskType: "meeting", dueOffsetDays: 14 },
  ],
  "Teaching Assistant": [
    { title: "SEND and independence", description: "Complete CPD on supporting SEND while protecting pupil independence.", taskType: "course", courseKeyword: "send", dueOffsetDays: 14 },
    { title: "Classroom support routines", description: "Agree communication, prompting and feedback routines with the teacher or line manager.", taskType: "meeting", dueOffsetDays: 14 },
  ],
  Pastoral: [
    { title: "Pastoral safeguarding practice", description: "Complete safeguarding/pastoral CPD relevant to disclosures, recording and escalation.", taskType: "course", courseKeyword: "safeguard", dueOffsetDays: 10 },
    { title: "Pastoral systems orientation", description: "Review attendance, behaviour, recording, escalation and family-contact processes for your role.", taskType: "checklist", dueOffsetDays: 10 },
  ],
  "Middle Leader": [
    { title: "Leadership and implementation", description: "Complete leadership CPD focused on implementation, evidence and sustainable improvement.", taskType: "course", courseKeyword: "leadership", dueOffsetDays: 21 },
    { title: "Department improvement review", description: "Meet your line manager to connect department priorities to the school improvement plan and CPD programme.", taskType: "meeting", dueOffsetDays: 21 },
  ],
  "Support Staff": [
    { title: "Role-specific procedures", description: "Review the procedures, systems and escalation routes that apply directly to your support role.", taskType: "checklist", dueOffsetDays: 10 },
    { title: "Support-role development conversation", description: "Meet your line manager to agree role expectations and one development target.", taskType: "meeting", dueOffsetDays: 21 },
  ],
};

export function getInductionTemplate(role: InductionRole) {
  return [...COMMON_INDUCTION, ...(ROLE_TASKS[role] || [])];
}

export function addDays(date: string | Date, days: number) {
  const value = typeof date === "string" ? new Date(`${date}T12:00:00`) : new Date(date);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export function addMonths(date: string | Date, months: number) {
  const value = typeof date === "string" ? new Date(date) : new Date(date);
  value.setMonth(value.getMonth() + months);
  return value;
}

export function complianceStatus(expiresAt: Date | null, hasCompletion: boolean) {
  if (!hasCompletion) return "missing" as const;
  if (!expiresAt) return "current" as const;
  const diffDays = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return "expired" as const;
  if (diffDays <= 30) return "due_soon" as const;
  return "current" as const;
}

export function formatWorkflowDate(value?: string | null) {
  if (!value) return "Not set";
  const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
