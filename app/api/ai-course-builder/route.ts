import { generateGemini, parseGeminiJson } from "@/lib/geminiServer";

export const runtime = "nodejs";

type Source = { title: string; category?: string; summary?: string; content?: string };
type Body = { topic?: string; audience?: string; category?: string; duration?: number; level?: string; notes?: string; sources?: Source[] };
type Block = { block_type: "text"|"quiz"|"scenario"|"poll"|"reflection"|"action_plan"; title: string; content: Record<string, unknown>; required: boolean };
type GeneratedCourse = { title: string; summary: string; objectives: string[]; recommended_for: string[]; blocks: Block[] };

export async function POST(request: Request) {
  let body: Body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const topic = String(body.topic || "").trim();
  if (topic.length < 4) return Response.json({ error: "Add a clear course topic or purpose." }, { status: 400 });
  const sources = Array.isArray(body.sources) ? body.sources.slice(0, 6) : [];
  const sourceText = sources.map((source, index) => `[${index + 1}] ${source.title}\n${String(source.content || source.summary || "").slice(0, 6500)}`).join("\n\n");
  const duration = Math.max(15, Math.min(180, Number(body.duration || 60)));

  const result = await generateGemini(
    `Create a complete school CPD course draft about: ${topic}\nAudience: ${body.audience || "school staff"}\nCategory: ${body.category || "Teaching & Learning"}\nLevel: ${body.level || "Developing"}\nTarget duration: ${duration} minutes\nAdditional notes: ${body.notes || "none"}\n\n${sourceText ? `SCHOOL KNOWLEDGE SOURCES:\n${sourceText}\nUse these sources for school-specific content and do not invent policy requirements.\n\n` : ""}Return JSON only using this exact top-level shape: {"title":"...","summary":"...","objectives":["..."],"recommended_for":["..."],"blocks":[...]}.\n\nBuild a rigorous Phase 1-8 style journey with 16-24 blocks. Allowed block_type values are text, quiz, scenario, poll, reflection, action_plan. Every block must have title, content, required. Use these content shapes:\n- text: {"body":"substantive explanation"}\n- quiz: {"question":"...","options":[4 options],"answer":0,"feedback":"why the answer is correct"}\n- scenario: {"prompt":"...","options":[{"label":"...","feedback":"..."}, ...]}\n- poll: {"prompt":"...","options":["...","..."]}\n- reflection: {"prompt":"..."}\n- action_plan: {"prompt":"What will you try?","outcomePrompt":"What outcome/evidence will you review?"}\n\nThe sequence must include: orientation and outcomes; diagnostic baseline; deep knowledge; misconceptions/non-examples; worked application; inclusive/SEND/EAL access; evidence/implementation; advanced practice/scenario; retrieval/mastery checks; implementation action; follow-through prompts for 7/30/90 days; and a facilitator-ready closing recap. Make quizzes challenging rather than guessable by answer length. Keep safeguarding claims tied to current school policy/DSL guidance when relevant.`,
    {
      json: true,
      temperature: 0.25,
      maxOutputTokens: 7000,
      system: "You design high-quality professional development for schools. Produce practical, evidence-aware, inclusive CPD. Do not fabricate legal requirements, research citations or school policies.",
    },
  );
  if (!result.ok) return Response.json({ error: result.error }, { status: 503 });
  const parsed = parseGeminiJson<GeneratedCourse>(result.text);
  if (!parsed?.title || !Array.isArray(parsed.blocks) || parsed.blocks.length < 12) return Response.json({ error: "Gemini returned an incomplete course draft. Try again with a more specific topic." }, { status: 422 });
  const allowed = new Set(["text","quiz","scenario","poll","reflection","action_plan"]);
  const blocks = parsed.blocks
    .filter(block => block && allowed.has(block.block_type) && block.title && block.content)
    .slice(0, 28)
    .map(block => ({ ...block, required: block.required !== false }));
  if (blocks.length < 12) return Response.json({ error: "The generated course did not contain enough usable learning blocks." }, { status: 422 });
  return Response.json({
    course: {
      title: String(parsed.title).slice(0, 160),
      summary: String(parsed.summary || "").slice(0, 2500),
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives.map(String).filter(Boolean).slice(0, 6) : [],
      recommended_for: Array.isArray(parsed.recommended_for) ? parsed.recommended_for.map(String).filter(Boolean).slice(0, 8) : [],
      blocks,
    },
    model: result.model,
  });
}
