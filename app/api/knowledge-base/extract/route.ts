import { generateGemini, parseGeminiJson } from "@/lib/geminiServer";

export const runtime = "nodejs";

const MAX_BYTES = 3 * 1024 * 1024;
const SUPPORTED = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type Extracted = { content: string; summary: string; tags: string[] };

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a document to upload." }, { status: 400 });
  if (!SUPPORTED.has(file.type)) return Response.json({ error: "Use PDF, DOCX, TXT or Markdown files." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Automatic extraction supports files up to 3 MB. For larger files, paste the important text instead." }, { status: 413 });

  if (file.type === "text/plain" || file.type === "text/markdown") {
    const content = (await file.text()).trim();
    if (!content) return Response.json({ error: "The file did not contain readable text." }, { status: 400 });
    const result = await generateGemini(`Summarise this school document in 2-4 sentences and provide 3-8 short topic tags. Return JSON only as {"summary":"...","tags":["..."]}.\n\nDOCUMENT:\n${content.slice(0, 50000)}`, { json: true, maxOutputTokens: 500 });
    const meta = result.ok ? parseGeminiJson<{ summary?: string; tags?: string[] }>(result.text) : null;
    return Response.json({ content: content.slice(0, 120000), summary: meta?.summary || content.slice(0, 350), tags: Array.isArray(meta?.tags) ? meta!.tags.slice(0, 8) : [] });
  }

  const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
  const result = await generateGemini(
    "Extract the useful readable text from this school document. Preserve headings and important bullet points where possible. Do not invent missing material. Then return JSON only with fields content, summary and tags. summary should be 2-4 sentences and tags should contain 3-8 short topic labels.",
    {
      json: true,
      maxOutputTokens: 7000,
      parts: [{ inlineData: { mimeType: file.type, data: bytes } }],
      system: "You extract and summarise professional school documents accurately. Do not add policy requirements that are not in the source.",
    },
  );
  if (!result.ok) return Response.json({ error: result.error }, { status: 503 });
  const parsed = parseGeminiJson<Extracted>(result.text);
  if (!parsed?.content?.trim()) return Response.json({ error: "The document could not be converted into usable text. Paste the important text instead." }, { status: 422 });
  return Response.json({
    content: parsed.content.slice(0, 120000),
    summary: String(parsed.summary || "").slice(0, 2500),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 8) : [],
  });
}
