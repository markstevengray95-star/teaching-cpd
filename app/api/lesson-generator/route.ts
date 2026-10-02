import { createClient } from "@supabase/supabase-js";
import { generateGemini, parseGeminiJson } from "@/lib/geminiServer";
import { getSupabasePublicConfig } from "@/lib/supabase";

export const runtime = "nodejs";

type LessonGenerationRequest = {
  subject?: string;
  className?: string;
  stage?: string;
  examBoard?: string;
  course?: string;
  unit?: string;
  subtopic?: string;
  topic?: string;
  objectives?: string;
  vocabulary?: string;
  teacherRequirements?: string;
};

type GeneratedLesson = {
  objectives: string;
  vocabulary: string;
  priorKnowledge: string;
  retrieval: string;
  misconceptions: string;
  teacherExplanation: string;
  modelling: string;
  guidedPractice: string;
  independentPractice: string;
  assessment: string;
  examPractice: string;
  sendEalAdaptations: string;
  stretchChallenge: string;
  homeworkTask: string;
  exitTicket: string;
  sequence: string;
};

const keys: (keyof GeneratedLesson)[] = [
  "objectives",
  "vocabulary",
  "priorKnowledge",
  "retrieval",
  "misconceptions",
  "teacherExplanation",
  "modelling",
  "guidedPractice",
  "independentPractice",
  "assessment",
  "examPractice",
  "sendEalAdaptations",
  "stretchChallenge",
  "homeworkTask",
  "exitTicket",
  "sequence",
];

function fallback(input: Required<LessonGenerationRequest>): GeneratedLesson {
  const topic = input.topic || "the lesson topic";
  const subject = input.subject || "the subject";
  const stage = input.stage || input.className || "the class";
  const objectives = input.objectives || `Explain the key ideas in ${topic}; apply them accurately; and justify an answer using appropriate ${subject} vocabulary.`;
  const vocabulary = input.vocabulary || `Select 5–8 essential terms for ${topic}; define each in pupil-friendly language and require pupils to use them accurately.`;

  return {
    objectives,
    vocabulary,
    priorKnowledge: `Pupils should retrieve the prerequisite ideas that lead into ${topic}. Start by checking one key definition, one prior process or concept, and one link to the previous lesson.`,
    retrieval: `Do now — 6 minutes\n1. Recall one key fact needed for ${topic}.\n2. Define an important prerequisite term.\n3. Complete one short application from earlier learning.\n4. Spot and correct a plausible error linked to ${topic}.\n5. Predict how the prior learning might connect to today's lesson.`,
    misconceptions: `Check explicitly for common errors around ${topic}. Ask pupils to compare a correct and incorrect explanation, justify which is stronger, and correct the inaccurate reasoning before independent practice.`,
    teacherExplanation: `Teach ${topic} in short chunks. Begin with the core idea, connect it to prior learning, introduce the essential vocabulary, then model how an expert in ${subject} reasons through the concept. Pause after each chunk for a quick check before moving on.`,
    modelling: `Model one complete worked example for ${topic}. Narrate the decision-making, label the success criteria, deliberately show one common error, then improve the response with the class.`,
    guidedPractice: `Complete two scaffolded examples together. First use prompts and questioning; on the second, remove some scaffolds and ask pupils to explain each step or decision before revealing the next part.`,
    independentPractice: `Set 3–5 tasks that move from secure core application to a less familiar context. Require pupils to use the key vocabulary and show reasoning, not just final answers. Finish with one task that directly mirrors the lesson objective.`,
    assessment: `Use a hinge question halfway through the lesson with four plausible responses, followed by targeted cold call or mini-whiteboard checking. If fewer than roughly three quarters of pupils are secure, reteach using a different example before independent practice.`,
    examPractice: `${stage} exam-style practice\nQuestion: Apply your understanding of ${topic} to a new context and explain your reasoning using precise ${subject} vocabulary.\nTeacher use: agree the key content points before pupils answer, then compare responses against those success criteria. Avoid treating generated wording as an official exam-board question or mark scheme.`,
    sendEalAdaptations: `Keep the same ambitious learning goal. Chunk instructions; pre-teach the essential vocabulary; provide a visual or worked model; reduce unnecessary copying; allow thinking/rehearsal time; use sentence stems only where they support subject thinking; check understanding privately and fade scaffolds as security improves.`,
    stretchChallenge: `Ask pupils to justify, compare, evaluate or transfer ${topic} to an unfamiliar situation. Remove scaffolds before adding extra quantity, and require a precise explanation of why the method or interpretation works.`,
    homeworkTask: `Short consolidation: complete one retrieval question from earlier learning, two core questions on ${topic}, and one unfamiliar application. Add a final sentence identifying the part that needs most review.`,
    exitTicket: `Exit ticket\n1. State the most important idea from ${topic}.\n2. Apply it in one short example.\n3. Correct one likely misconception.\n4. Confidence 1–5 and one specific point to revisit.`,
    sequence: `0–6 min retrieval starter → 6–16 min explicit explanation → 16–26 min worked example/modelling → 26–36 min guided practice → 36–49 min independent application/exam-style practice → 49–55 min exit ticket and responsive review.`,
  };
}

function validGeneratedLesson(value: unknown): value is GeneratedLesson {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return keys.every((key) => typeof record[key] === "string" && String(record[key]).trim().length > 0);
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return Response.json({ error: "Sign in is required." }, { status: 401 });

  const { url, key } = getSupabasePublicConfig();
  const authClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data: auth, error: authError } = await authClient.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: "Your session could not be verified." }, { status: 401 });

  const raw = await request.json().catch(() => ({})) as LessonGenerationRequest;
  const input: Required<LessonGenerationRequest> = {
    subject: String(raw.subject || "General").trim().slice(0, 100),
    className: String(raw.className || "Mixed class").trim().slice(0, 100),
    stage: String(raw.stage || "").trim().slice(0, 80),
    examBoard: String(raw.examBoard || "").trim().slice(0, 80),
    course: String(raw.course || "").trim().slice(0, 180),
    unit: String(raw.unit || "").trim().slice(0, 180),
    subtopic: String(raw.subtopic || "").trim().slice(0, 180),
    topic: String(raw.topic || "").trim().slice(0, 200),
    objectives: String(raw.objectives || "").trim().slice(0, 1500),
    vocabulary: String(raw.vocabulary || "").trim().slice(0, 1200),
    teacherRequirements: String(raw.teacherRequirements || "").trim().slice(0, 1600),
  };

  if (!input.topic) return Response.json({ error: "Choose or enter a lesson topic before generating." }, { status: 400 });

  const prompt = `Create a complete, practical 55-minute UK school lesson plan for a teacher.\n\nContext\nSubject: ${input.subject}\nClass: ${input.className}\nStage: ${input.stage || "Not specified"}\nExam board: ${input.examBoard || "Not specified"}\nCourse/specification: ${input.course || "Not specified"}\nUnit: ${input.unit || "Not specified"}\nSub-topic: ${input.subtopic || "Not specified"}\nLesson topic: ${input.topic}\nExisting objectives: ${input.objectives || "None supplied"}\nExisting vocabulary: ${input.vocabulary || "None supplied"}\nTeacher requirements: ${input.teacherRequirements || "None"}\n\nProduce specific classroom-ready content rather than generic advice. The lesson must have a coherent progression from retrieval and explanation through modelling, guided practice, independent practice and review. Include diagnostic checks for understanding and likely misconceptions. Keep SEND/EAL adaptations barrier-led and lesson-focused, with the same ambitious core learning. Include purposeful stretch rather than extra quantity. Create an exam-style application task appropriate to the stated stage, but do not claim it is an official exam-board question and do not invent an official mark scheme. Do not include pupil names, diagnoses, medical information or sensitive personal data.\n\nReturn JSON only with exactly these string fields:\nobjectives, vocabulary, priorKnowledge, retrieval, misconceptions, teacherExplanation, modelling, guidedPractice, independentPractice, assessment, examPractice, sendEalAdaptations, stretchChallenge, homeworkTask, exitTicket, sequence.`;

  const result = await generateGemini(prompt, {
    system: "You are a careful UK school lesson-planning assistant. Write concise but classroom-ready teaching content. Keep the teacher in control, preserve high expectations, distinguish scaffolding from lowering the learning goal, and never claim generated exam material is official.",
    temperature: 0.35,
    maxOutputTokens: 5200,
    json: true,
  });

  if (result.ok) {
    const parsed = parseGeminiJson<GeneratedLesson>(result.text);
    if (validGeneratedLesson(parsed)) return Response.json({ lesson: parsed, source: "ai" });
  }

  return Response.json({ lesson: fallback(input), source: "template" });
}
