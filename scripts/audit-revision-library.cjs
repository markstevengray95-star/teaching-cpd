const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const checks = [
  { file: "macbeth.txt", minimum: 100000, pattern: /^SCENE\s+[IVX]+\./gm, count: 28 },
  { file: "romeo-and-juliet.txt", minimum: 130000, pattern: /^SCENE\s+[IVX]+\./gm, count: 24 },
  { file: "a-christmas-carol.txt", minimum: 150000, pattern: /^STAVE\s+[IVX]+:/gm, count: 5 },
];

for (const check of checks) {
  const location = path.join(root, "public", "revision", "books", check.file);
  const text = fs.readFileSync(location, "utf8");
  if (Buffer.byteLength(text) < check.minimum) throw new Error(`${check.file} is unexpectedly short.`);
  if (!text.includes("*** START OF THE PROJECT GUTENBERG EBOOK") || !text.includes("*** END OF THE PROJECT GUTENBERG EBOOK")) {
    throw new Error(`${check.file} is missing retained Project Gutenberg provenance or licence text.`);
  }
  const headings = text.match(check.pattern) || [];
  if (headings.length !== check.count) throw new Error(`${check.file} has ${headings.length} structured headings; expected ${check.count}.`);
}

const navigation = fs.readFileSync(path.join(root, "lib", "appNavigation.ts"), "utf8");
if (!navigation.includes('["/revision", "Student revision library"')) throw new Error("Revision library is not linked in app navigation.");
const shell = fs.readFileSync(path.join(root, "app", "components", "AppShellEnhancements.tsx"), "utf8");
if (!shell.match(/PUBLIC_PREFIXES[^\n]+"\/revision"/)) throw new Error("Revision library must remain available without a staff account.");
if (fs.existsSync(path.join(root, "public", "revision", "books", "an-inspector-calls.txt"))) {
  throw new Error("Copyrighted An Inspector Calls full text must not be bundled.");
}

console.log(JSON.stringify({ books: checks.length, structuredSections: 57, copyrightedFullTexts: 0, result: "PASS" }));
