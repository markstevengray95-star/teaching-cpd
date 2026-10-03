export type RevisionTextSection = { id: string; group: string; title: string; content: string };

function normaliseText(raw: string) {
  return raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
}

function trimGutenberg(raw: string) {
  const text = normaliseText(raw);
  const start = text.indexOf("*** START OF THE PROJECT GUTENBERG EBOOK");
  const afterStart = start >= 0 ? text.indexOf("\n", start) + 1 : 0;
  const end = text.indexOf("*** END OF THE PROJECT GUTENBERG EBOOK");
  return text.slice(afterStart, end >= 0 ? end : undefined).trim();
}

function parsePlay(raw: string, bookId: string): RevisionTextSection[] {
  const body = trimGutenberg(raw);
  const peopleIndex = body.search(/Dramatis Person(?:æ|ae)/i);
  const useful = peopleIndex >= 0 ? body.slice(peopleIndex) : body;
  const firstAct = useful.search(/\nACT I\s*\n\s*SCENE I\./);
  const sections: RevisionTextSection[] = [];
  if (firstAct > 0) {
    const front = useful.slice(0, firstAct).trim();
    sections.push({ id: `${bookId}-front`, group: "Opening", title: bookId === "romeo-and-juliet" ? "Cast and Prologue" : "Cast and setting", content: front });
  }
  const play = firstAct >= 0 ? useful.slice(firstAct + 1) : useful;
  const lines = play.split("\n");
  let act = "Act I";
  let current: RevisionTextSection | null = null;
  for (const line of lines) {
    const clean = line.trim();
    const actMatch = clean.match(/^ACT\s+([IVX]+)$/);
    if (actMatch) {
      act = `Act ${actMatch[1]}`;
      continue;
    }
    const sceneMatch = clean.match(/^SCENE\s+([IVX]+)\.\s*(.*)$/);
    if (sceneMatch) {
      if (current) sections.push({ ...current, content: current.content.trim() });
      current = {
        id: `${bookId}-${act.toLowerCase().replace(/\s/g, "-")}-scene-${sceneMatch[1].toLowerCase()}`,
        group: act,
        title: `Scene ${sceneMatch[1]}${sceneMatch[2] ? ` — ${sceneMatch[2]}` : ""}`,
        content: "",
      };
      continue;
    }
    if (current) current.content += `${line}\n`;
  }
  if (current) sections.push({ ...current, content: current.content.trim() });
  return sections;
}

function parseCarol(raw: string): RevisionTextSection[] {
  const body = trimGutenberg(raw);
  const actualStart = body.search(/\nSTAVE I:\s+MARLEY'S GHOST/);
  const prefaceStart = body.indexOf("PREFACE");
  const sections: RevisionTextSection[] = [];
  if (prefaceStart >= 0 && actualStart > prefaceStart) {
    const front = body.slice(prefaceStart, actualStart).replace(/\nCONTENTS[\s\S]*$/i, "").trim();
    sections.push({ id: "a-christmas-carol-preface", group: "Opening", title: "Preface", content: front });
  }
  const text = actualStart >= 0 ? body.slice(actualStart + 1) : body;
  const matches = [...text.matchAll(/^STAVE\s+([IVX]+):\s+(.+)$/gm)];
  matches.forEach((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    sections.push({
      id: `a-christmas-carol-stave-${match[1].toLowerCase()}`,
      group: `Stave ${match[1]}`,
      title: match[2].trim().replace(/\s+/g, " "),
      content: text.slice(start, end).trim(),
    });
  });
  return sections;
}

export function parseRevisionBook(raw: string, bookId: string) {
  return bookId === "a-christmas-carol" ? parseCarol(raw) : parsePlay(raw, bookId);
}
