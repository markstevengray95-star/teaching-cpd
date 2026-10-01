/** Presentation labels must not expose the answer tags used by legacy practice widgets. */
export function parsePracticeOption(value: string) {
  const raw = value.replace(/\s+/g, " ").trim();
  const match = raw.match(/^(?:\d+\s*)?\[([^\]]+)\]\s*(.*)$/);
  return {tag:match?.[1] || "",label:match?.[2] || raw};
}
