import { createClient } from "@supabase/supabase-js";
import { generateGemini, parseGeminiJson } from "@/lib/geminiServer";
import { getSupabasePublicConfig } from "@/lib/supabase";

export const runtime = "nodejs";

type ResourceKind =
  | "presentation"
  | "worksheet"
  | "quiz"
  | "retrieval"
  | "homework"
  | "exam-practice"
  | "knowledge-organiser";

type ResourceRequest = {
  kinds?: ResourceKind[];
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
  sequence?: string;
  assessment?: string;
  retrieval?: string;
  misconceptions?: string;
  examPractice?: string;
  teacherRequirements?: string;
};

type ResourceResult = {
  kind: ResourceKind;
  title: string;
  content: string;
};

type ResourceResponse = { resources: ResourceResult[] };

const allowedKinds = new Set<ResourceKind>([
  "presentation",
  "worksheet",
  "quiz",
  "retrieval",
  "homework",
  "exam-practice",
  "knowledge-organiser",
]);

const labels: Record<ResourceKind, string> = {
  presentation: "Lesson presentation",
  worksheet: "Worksheet",
  quiz: "Low-stakes quiz",
  retrieval: "Retrieval starter",
  homework: "Homework",
  "exam-practice": "Exam-style practice",
  "knowledge-organiser": "Knowledge organiser",
};

function fallbackOne(kind: ResourceKind, input: Required<Omit<ResourceRequest, "kinds">>): ResourceResult {
  const topic = input.topic || "the lesson topic";
  const subject = input.subject || "the subject";
  const stage = input.stage || input.className || "the class";
  const vocabulary = input.vocabulary || "Choose 6–8 essential subject terms and define them precisely.";
  const objectives = input.objectives || `Understand the core ideas in ${topic}, apply them accurately and explain reasoning using appropriate ${subject} vocabulary.`;

  const contentByKind: Record<ResourceKind, string> = {
    presentation: `SLIDE 1 — ${topic}\nLearning objective: ${objectives}\n\nSLIDE 2 — Retrieval\n1. Recall one prerequisite fact.\n2. Define one key term.\n3. Apply one idea from previous learning.\n4. Spot and correct one misconception.\n\nSLIDE 3 — Key vocabulary\n${vocabulary}\n\nSLIDE 4 — Explain\nIntroduce the core idea in short chunks and connect it explicitly to prior learning.\n\nSLIDE 5 — Model\nWork through one high-quality example while narrating the decision-making.\n\nSLIDE 6 — Guided practice\nComplete one scaffolded example together. Remove prompts gradually.\n\nSLIDE 7 — Check for understanding\nUse one hinge question with four plausible responses and respond to the class pattern.\n\nSLIDE 8 — Independent practice\nSet 3–5 questions from secure core application to one unfamiliar context.\n\nSLIDE 9 — Exam-style application\nApply ${topic} in a new context. This is teacher-created practice, not an official exam-board question.\n\nSLIDE 10 — Exit ticket\n1. State the key idea.\n2. Apply it once.\n3. Correct one likely misconception.`,
    worksheet: `${topic} — worksheet\n\nA. Retrieval\n1. State one prerequisite fact.\n2. Define two key terms.\n3. Correct one plausible error.\n\nB. Key knowledge\nSummarise the three most important ideas from the explanation.\n\nC. Guided practice\nComplete one scaffolded example, showing each step or decision.\n\nD. Independent practice\n1. Core application question.\n2. Core application question in a different representation.\n3. Explain why the method/idea works.\n4. Apply ${topic} to an unfamiliar context.\n\nE. Challenge\nCompare two possible approaches or explanations and justify which is stronger.\n\nANSWERS / SUCCESS CRITERIA\nUse the lesson objectives and precise ${subject} vocabulary. Require visible reasoning, not only final answers.`,
    quiz: `${topic} — 10-question low-stakes quiz\n\n1. Define an essential term.\n2. Multiple choice on the core idea.\n3. True/false with correction.\n4. Short recall question.\n5. Select the best explanation.\n6. Apply the idea to a familiar example.\n7. Identify the error in a worked response.\n8. Use one item of key vocabulary accurately.\n9. Apply the idea to a less familiar example.\n10. Explain one link to prior learning.\n\nANSWER GUIDE\nAccept answers that accurately match the lesson objectives, use subject vocabulary precisely and show the required reasoning.`,
    retrieval: `${topic} — retrieval starter\n\n1. Last lesson: recall one key fact.\n2. Last week: define an important term.\n3. Earlier topic: complete one short application.\n4. Prerequisite: state the idea needed for ${topic}.\n5. Spot the error: correct one plausible misconception.\n6. Bridge: predict how the retrieved idea connects to today.\n\nTeacher check: sample responses from the whole class and adapt the opening explanation before moving on.`,
    homework: `${topic} — homework\n\n1. Retrieval: answer two questions from earlier learning.\n2. Core: complete two questions directly linked to ${topic}.\n3. Explain: write one precise paragraph using at least four key terms.\n4. Apply: use the lesson idea in a new context.\n5. Reflection: identify one point to review before the next lesson.\n\nSuccess criteria: accurate knowledge, visible reasoning, precise vocabulary and corrections made after feedback/self-checking.`,
    "exam-practice": `${topic} — ${stage} exam-style practice\n\nQuestion 1 — short response\nState or identify a key idea linked to ${topic}.\n\nQuestion 2 — application\nApply your understanding of ${topic} to a new situation. Show your reasoning clearly.\n\nQuestion 3 — extended response\nExplain, analyse or evaluate an aspect of ${topic}, using precise ${subject} vocabulary and a logical chain of reasoning.\n\nTeacher-created success criteria\n- accurate subject knowledge\n- relevant application to the context\n- logical reasoning\n- precise terminology\n- conclusion/justification where required\n\nThese are teacher-created practice questions and are not official ${input.examBoard || "exam-board"} questions or mark schemes.`,
    "knowledge-organiser": `${topic} — knowledge organiser\n\nBIG IDEA\n${objectives}\n\nESSENTIAL VOCABULARY\n${vocabulary}\n\nCORE KNOWLEDGE\n1. Identify the central concept.\n2. Break it into 4–6 concise knowledge statements.\n3. Add one important relationship, process or rule.\n4. Add one worked example or model.\n\nCOMMON MISCONCEPTIONS\n${input.misconceptions || `List 2–3 likely misconceptions for ${topic} and the accurate correction for each.`}\n\nLINKS TO PRIOR LEARNING\nState the prerequisite ideas pupils should retrieve.\n\nSELF-QUIZ\nWrite five short retrieval questions covering the knowledge above.`,
  };

  return { kind, title: `${topic}: ${labels[kind]}`, content: contentByKind[kind] };
}

function validResponse(value: unknown, requested: ResourceKind[]): value is ResourceResponse {
  if (!value || typeof value !== "object") return false;
  const resources = (value as { resources?: unknown }).resources;
  if (!Array.isArray(resources)) return false;
  const requestedSet = new Set(requested);
  return resources.length > 0 && resources.every((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    return typeof record.kind === "string" && requestedSet.has(record.kind as ResourceKind) && typeof record.title === "string" && record.title.trim().length > 0 && typeof record.content === "string" && record.content.trim().length > 0;
  });
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return Response.json({ error: "Sign in is required." }, { status: 401 });

  const { url, key } = getSupabasePublicConfig();
  const authClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data: auth, error: authError } = await authClient.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: "Your session could not be verified." }, { status: 401 });

  const raw = await request.json().catch(() => ({})) as ResourceRequest;
  const requested = Array.isArray(raw.kinds) ? raw.kinds.filter((kind): kind is ResourceKind => allowedKinds.has(kind as ResourceKind)) : [];
  const kinds = [...new Set(requested)].slice(0, 7);
  if (!kinds.length) return Response.json({ error: "Choose at least one resource to generate." }, { status: 400 });

  const input: Required<Omit<ResourceRequest, "kinds">> = {
    subject: String(raw.subject || "General").trim().slice(0, 100),
    className: String(raw.className || "Mixed class").trim().slice(0, 100),
    stage: String(raw.stage || "").trim().slice(0, 80),
    examBoard: String(raw.examBoard || "").trim().slice(0, 80),
    course: String(raw.course || "").trim().slice(0, 180),
    unit: String(raw.unit || "").trim().slice(0, 180),
    subtopic: String(raw.subtopic || "").trim().slice(0, 180),
    topic: String(raw.topic || "").trim().slice(0, 200),
    objectives: String(raw.objectives || "").trim().slice(0, 1800),
    vocabulary: String(raw.vocabulary || "").trim().slice(0, 1400),
    sequence: String(raw.sequence || "").trim().slice(0, 2200),
    assessment: String(raw.assessment || "").trim().slice(0, 1800),
    retrieval: String(raw.retrieval || "").trim().slice(0, 1800),
    misconceptions: String(raw.misconceptions || "").trim().slice(0, 1800),
    examPractice: String(raw.examPractice || "").trim().slice(0, 2200),
    teacherRequirements: String(raw.teacherRequirements || "").trim().slice(0, 1600),
  };

  if (!input.topic) return Response.json({ error: "Choose or enter a lesson topic before generating resources." }, { status: 400 });

  const requestedText = kinds.map((kind) => `- ${kind}: ${labels[kind]}`).join("\n");
  const prompt = `Create a classroom-ready resource pack for one UK school lesson.\n\nLesson context\nSubject: ${input.subject}\nClass: ${input.className}\nStage: ${input.stage || "Not specified"}\nExam board: ${input.examBoard || "Not specified"}\nCourse/specification: ${input.course || "Not specified"}\nUnit: ${input.unit || "Not specified"}\nSub-topic: ${input.subtopic || "Not specified"}\nTopic: ${input.topic}\nObjectives: ${input.objectives || "Not supplied"}\nVocabulary: ${input.vocabulary || "Not supplied"}\nLesson sequence: ${input.sequence || "Not supplied"}\nChecks for understanding: ${input.assessment || "Not supplied"}\nExisting retrieval: ${input.retrieval || "Not supplied"}\nLikely misconceptions: ${input.misconceptions || "Not supplied"}\nExisting exam practice: ${input.examPractice || "Not supplied"}\nTeacher requirements: ${input.teacherRequirements || "None"}\n\nGenerate exactly these resources:\n${requestedText}\n\nRequirements\n- Make every resource specific to this lesson rather than generic advice.\n- Keep presentation content in a clear numbered slide sequence that can be pasted into a presentation tool.\n- Worksheets and quizzes must include a concise answer guide after a clear divider.\n- Retrieval must mix prerequisite, recent and older knowledge where the context allows.\n- Homework should be purposeful and proportionate.\n- Knowledge organiser should prioritise essential knowledge and misconceptions.\n- Exam-style questions must be appropriate to the stage, but never claim to be official exam-board questions and never invent an official mark scheme.\n- Do not include pupil names, diagnoses, medical information or sensitive personal data.\n\nReturn JSON only in this shape: {"resources":[{"kind":"presentation","title":"...","content":"..."}]}. Include one object per requested kind and no additional keys.`;

  const result = await generateGemini(prompt, {
    system: "You are a careful UK school teaching-resource assistant. Produce practical, editable classroom resources aligned to the supplied lesson context. Keep the teacher in control and never represent generated exam material as official.",
    temperature: 0.32,
    maxOutputTokens: 7600,
    json: true,
  });

  if (result.ok) {
    const parsed = parseGeminiJson<ResourceResponse>(result.text);
    if (validResponse(parsed, kinds)) {
      const byKind = new Map(parsed.resources.map((item) => [item.kind, item]));
      const ordered = kinds.map((kind) => byKind.get(kind)).filter((item): item is ResourceResult => Boolean(item));
      if (ordered.length === kinds.length) return Response.json({ resources: ordered, source: "ai" });
    }
  }

  return Response.json({ resources: kinds.map((kind) => fallbackOne(kind, input)), source: "template" });
}
