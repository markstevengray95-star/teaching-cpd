import { createClient } from "@supabase/supabase-js";
import { generateGemini, parseGeminiJson } from "@/lib/geminiServer";
import { getSupabasePublicConfig } from "@/lib/supabase";

export const runtime = "nodejs";

type ResourceRequest = {
  resourceType?: string;
  subject?: string;
  yearGroup?: string;
  topic?: string;
  details?: string;
};

type GeneratedResource = { title: string; content: string };

const allowedTypes = new Set([
  "retrieval-question",
  "quiz",
  "exit-ticket",
  "differentiation",
  "learning-objective",
  "worksheet",
  "vocabulary",
  "hinge-question",
  "lesson-starter",
]);

function fallbackResource(input: Required<ResourceRequest>): GeneratedResource {
  const topic = input.topic || "the lesson topic";
  const subject = input.subject || "the subject";
  const group = input.yearGroup || "the class";
  const header = `${subject} · ${group} · ${topic}`;
  const extra = input.details ? `\nTeacher notes: ${input.details}` : "";

  const contentByType: Record<string, string> = {
    "retrieval-question": `${header}\n\nRetrieval practice\n1. State one key fact you should remember about ${topic}.\n2. Define an important term from ${topic}.\n3. Explain one cause, process or relationship linked to ${topic}.\n4. Apply your knowledge of ${topic} to a new example.\n5. Identify and correct one likely misconception about ${topic}.\n\nTeacher check: review every response, correct misconceptions immediately and revisit weak prior knowledge.${extra}`,
    quiz: `${header}\n\nQuick quiz\n1. Multiple choice: Which statement best describes ${topic}?\n2. Short answer: Define a key term.\n3. Explain: Why is ${topic} important in ${subject}?\n4. Apply: Use the idea in a new situation.\n5. Challenge: Link ${topic} to prior learning.\n\nAnswers / success criteria\n- Accurate subject vocabulary\n- Clear explanation using evidence or reasoning\n- Correct application to the unfamiliar example${extra}`,
    "exit-ticket": `${header}\n\nExit ticket\n1. The most important thing I learned about ${topic} was…\n2. One question I can answer now is…\n3. One part I still need to practise is…\n4. Confidence: 1  2  3  4  5\n\nTeacher action: sort responses into secure / nearly secure / reteach before the next lesson.${extra}`,
    differentiation: `${header}\n\nAdaptive teaching plan\nCore goal: all pupils access the same essential learning about ${topic}.\n\nSupport\n- Pre-teach 4–6 essential words.\n- Provide one worked example or model answer.\n- Chunk the task into short steps.\n- Use a visual, diagram or concrete example where helpful.\n\nStretch\n- Ask pupils to justify a choice or compare two explanations.\n- Remove scaffolds and require independent application.\n- Add an unfamiliar context rather than simply adding more work.\n\nCheck: adapt support from pupil responses, not labels alone.${extra}`,
    "learning-objective": `${header}\n\nLearning objective\nTo understand and apply the key ideas in ${topic}.\n\nSuccess criteria\n- I can accurately describe the essential knowledge.\n- I can use subject-specific vocabulary correctly.\n- I can apply the idea to an example or problem.\n- I can explain my reasoning clearly.\n\nChallenge\nI can connect ${topic} to previous learning and explain the relationship.${extra}`,
    worksheet: `${header}\n\n1. Retrieval\nWrite three facts you already know that will help with ${topic}.\n\n2. Key knowledge\nSummarise the three most important ideas from today’s explanation.\n\n3. Guided practice\nComplete one example with prompts from your teacher.\n\n4. Independent practice\nAnswer three questions that increase in difficulty.\n\n5. Apply\nUse your knowledge of ${topic} in a new context.\n\n6. Reflect\nWhich step was hardest and what would you do differently next time?${extra}`,
    vocabulary: `${header}\n\nVocabulary builder\nChoose 6–8 essential terms for ${topic}. For each term complete:\n- Term\n- Student-friendly definition\n- Subject-specific example\n- Non-example or common confusion\n- Word family / related term\n\nUse it\nWrite a precise explanation of ${topic} using at least four of the terms correctly.${extra}`,
    "hinge-question": `${header}\n\nHinge question\nWhich response best shows secure understanding of ${topic}?\nA. A tempting answer based on a common misconception\nB. A partially correct answer missing an important condition\nC. The fully correct answer using the key idea\nD. An unrelated but plausible statement\n\nTeacher use\n- Mostly C: move to independent practice.\n- Mixed B/C: clarify the missing condition.\n- Mostly A/D: reteach using a different representation before moving on.${extra}`,
    "lesson-starter": `${header}\n\nDo now — 8 minutes\n1. Recall: one question from last lesson.\n2. Revisit: one question from last week.\n3. Prerequisite: one question needed for ${topic}.\n4. Spot the error: correct a plausible misconception.\n5. Preview: make a prediction about today’s learning.\n\nReview quickly, sample responses from the whole class and adapt the opening explanation if needed.${extra}`,
  };

  const labels: Record<string, string> = {
    "retrieval-question": "Retrieval Questions",
    quiz: "Quick Quiz",
    "exit-ticket": "Exit Ticket",
    differentiation: "Adaptive Teaching Plan",
    "learning-objective": "Learning Objective & Success Criteria",
    worksheet: "Worksheet",
    vocabulary: "Vocabulary Builder",
    "hinge-question": "Hinge Question",
    "lesson-starter": "Lesson Starter",
  };

  return { title: `${topic}: ${labels[input.resourceType] || "Teaching Resource"}`, content: contentByType[input.resourceType] || contentByType.worksheet };
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return Response.json({ error: "Sign in is required." }, { status: 401 });

  const { url, key } = getSupabasePublicConfig();
  const authClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data: auth, error: authError } = await authClient.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: "Your session could not be verified." }, { status: 401 });

  const raw = await request.json().catch(() => ({})) as ResourceRequest;
  const input: Required<ResourceRequest> = {
    resourceType: String(raw.resourceType || "").trim(),
    subject: String(raw.subject || "General").trim().slice(0, 80),
    yearGroup: String(raw.yearGroup || "Mixed age").trim().slice(0, 80),
    topic: String(raw.topic || "").trim().slice(0, 160),
    details: String(raw.details || "").trim().slice(0, 1200),
  };

  if (!allowedTypes.has(input.resourceType)) return Response.json({ error: "Choose a valid resource type." }, { status: 400 });
  if (!input.topic) return Response.json({ error: "Add a topic before generating." }, { status: 400 });

  const typeInstructions: Record<string, string> = {
    "retrieval-question": "Create 8 retrieval questions mixing prerequisite, recent and older knowledge. Include a concise answer key.",
    quiz: "Create a 10-question low-stakes quiz with varied question formats and a separate answer key.",
    "exit-ticket": "Create a short 4-question exit ticket that reveals understanding and misconceptions, plus teacher interpretation guidance.",
    differentiation: "Create an adaptive teaching plan that keeps the same ambitious learning goal but varies scaffolds, representations, checks and stretch.",
    "learning-objective": "Create one precise learning objective, 3-5 observable success criteria, key prior knowledge and one challenge criterion.",
    worksheet: "Create a classroom-ready worksheet with retrieval, key knowledge, guided practice, independent practice, application and reflection. Include answers after a clear divider.",
    vocabulary: "Create a vocabulary builder for 8 essential terms with student-friendly definitions, examples, common confusions and a final application task.",
    "hinge-question": "Create 4 diagnostic hinge questions. Each must have four plausible answer choices, identify the correct answer, explain the misconception behind distractors and give a teacher action based on response patterns.",
    "lesson-starter": "Create a focused 8-10 minute lesson starter using retrieval, prerequisite checking, spot-the-error and one bridge into the new topic. Include answers.",
  };

  const prompt = `Create a classroom-ready resource for a teacher.\nResource type: ${input.resourceType}\nSubject: ${input.subject}\nYear group / phase: ${input.yearGroup}\nTopic: ${input.topic}\nAdditional teacher requirements: ${input.details || "None"}\n\nSpecific requirement: ${typeInstructions[input.resourceType]}\n\nUse accurate, age-appropriate language. Do not invent citations. Keep formatting easy to copy into a worksheet or presentation. Return JSON only with exactly two string fields: title and content.`;

  const result = await generateGemini(prompt, {
    system: "You are a careful UK school teaching-resource assistant. Produce practical resources, not generic advice. Keep the teacher in control and avoid claiming that generated content replaces professional judgement.",
    temperature: 0.35,
    maxOutputTokens: 2600,
    json: true,
  });

  if (result.ok) {
    const parsed = parseGeminiJson<GeneratedResource>(result.text);
    if (parsed?.title && parsed?.content) return Response.json({ ...parsed, source: "ai" });
  }

  return Response.json({ ...fallbackResource(input), source: "template" });
}
