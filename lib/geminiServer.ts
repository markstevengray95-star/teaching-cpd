type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string } };

type GeminiOptions = {
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  json?: boolean;
  parts?: GeminiPart[];
};

export function getGeminiConfig() {
  return {
    key: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
    model: process.env.GEMINI_COACH_MODEL || process.env.GEMINI_MODEL || "gemini-3.8-flash",
  };
}

export async function generateGemini(prompt: string, options: GeminiOptions = {}) {
  const { key, model } = getGeminiConfig();
  if (!key) return { ok: false as const, error: "Gemini is not configured." };
  const contents = options.parts?.length
    ? [{ role: "user", parts: [...options.parts, { text: prompt }] }]
    : [{ role: "user", parts: [{ text: prompt }] }];
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.25,
      maxOutputTokens: options.maxOutputTokens ?? 2200,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (options.system) body.systemInstruction = { parts: [{ text: options.system }] };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false as const, error: `Gemini request failed (${response.status}).`, detail: detail.slice(0, 500) };
  }
  const payload = await response.json();
  const text = (payload?.candidates?.[0]?.content?.parts || [])
    .map((part: { text?: string }) => typeof part?.text === "string" ? part.text : "")
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!text) return { ok: false as const, error: "Gemini returned an empty response." };
  return { ok: true as const, text, model };
}

export function parseGeminiJson<T>(text: string): T | null {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(clean) as T; } catch { return null; }
}
