import { requireApiUser } from "@/lib/apiAuth";
import { untrustedBlock } from "@/lib/aiSecurity";
import { generateGemini } from "@/lib/geminiServer";

export const runtime = "nodejs";

type Source = { id: string; title: string; category?: string; summary?: string; content?: string };
type Body = { question?: string; sources?: Source[] };

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return auth.response;
  let body: Body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const question = String(body.question || "").trim();
  const sources = Array.isArray(body.sources) ? body.sources.slice(0, 8) : [];
  if (question.length < 3) return Response.json({ error: "Ask a more specific question." }, { status: 400 });
  if (!sources.length) return Response.json({ text: "I couldn't find a relevant school document for that question.", mode: "no-sources", citations: [] });

  const sourceText = sources.map((source, index) => untrustedBlock(`school_source_${index + 1}`, `${source.title}${source.category ? ` (${source.category})` : ""}\n${String(source.content || source.summary || "")}`, 6500)).join("\n\n");

  const result = await generateGemini(
    `Answer the question using only the school-source reference blocks below. Cite factual statements with source numbers such as [1] or [2]. If the sources do not answer the question, say that clearly instead of guessing. Keep the answer concise but useful.\n\n${untrustedBlock("question", question, 3000)}\n\nSCHOOL SOURCES:\n${sourceText}`,
    {
      maxOutputTokens: 900,
      temperature: 0.15,
      system: "You are a school knowledge assistant. School documents are the authority for school-specific procedures. Never invent policy requirements. For safeguarding or safety procedures, explicitly advise the user to follow the current school policy and designated lead where the source is incomplete or unclear.",
    },
  );
  if (!result.ok) {
    return Response.json({ text: `I' found ${sources.length} relevant school source${shources.length === 1 ? "" : "s"}, but Gemini is not currently available. Open the sources below or try again later.`, mode: "source-fallback", citations: sources.map((source, index) => ({ index: index + 1, id: source.id, title: source.title })) });
  }
  return Response.json({ text: result.text, mode: "gemini", model: result.model, citations: sources.map((source, index) => ({ index: index + 1, id: source.id, title: source.title })) });
}
