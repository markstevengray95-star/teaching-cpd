const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};

const { sourceCourses: courses } = require('../lib/catalogue.ts');
const { conciseCourse, completedModuleCount } = require('../lib/conciseCourses.ts');
const { plannedCourseMinutes } = require('../lib/courseTiming.ts');
const { courseSections, slideReadingExtension, readingParagraphs } = require('../lib/presentationLearning.ts');
const rows = courses.map(original => {
  const concise = conciseCourse(original);
  const retained = new Set(concise.modules.map(module => module.id));
  assert.equal(concise.id, original.id);
  assert.deepEqual(concise.objectives, original.objectives);
  assert.equal(concise.modules[0], original.modules[0]);
  assert.equal(concise.modules.at(-1), original.modules.at(-1));
  assert.equal(retained.size, concise.modules.length);
  assert.deepEqual(conciseCourse(concise), concise, 'Compaction must be idempotent');
  for (const module of original.modules) {
    // Every explanation, assessment, subject-specific module and first full case
    // stays byte-for-byte identical. Only the explicit optional groups may go.
    if (module.type === 'content' || module.type === 'quiz' || module.type === 'scenario'
      || module.id.startsWith(`overhaul4-case-${original.id}-1-`)) {
      assert.ok(retained.has(module.id), `${original.id}: missing ${module.id}`);
    }
  }
  for (const type of ['content', 'visual', 'quiz', 'scenario', 'activity', 'checklist', 'reflection']) {
    if (original.modules.some(module => module.type === type)) {
      assert.ok(concise.modules.some(module => module.type === type), `${original.id}: missing ${type}`);
    }
  }
  assert.ok(concise.modules.length < original.modules.length);
  assert.ok(concise.duration < original.duration);
  const oldIds = original.modules.map(module => module.id);
  assert.equal(completedModuleCount(concise, [...oldIds, ...oldIds, 'deleted-old-id']), concise.modules.length);
  assert.equal(completedModuleCount(concise, oldIds.filter(id => !retained.has(id))), 0);
  for (const module of concise.modules) assert.equal(module, original.modules.find(item => item.id === module.id));
  const sections = courseSections(concise);
  assert.equal(sections.length, 5, `${original.id}: five presentation sections`);
  assert.equal(sections[0].start, 0);
  assert.equal(sections.at(-1).end, concise.modules.length);
  sections.forEach((section, index) => {
    assert.ok(section.start < section.end);
    if (index > 0) assert.equal(section.start, sections[index - 1].end);
  });
  const extensions = concise.modules.map(module => slideReadingExtension(concise, module)).filter(Boolean);
  assert.equal(extensions.length, 3, `${original.id}: three added readings`);
  assert.deepEqual(extensions.map(extension => extension.kind), ['evidence', 'sequence', 'decision']);
  extensions.forEach(extension => {
    assert.ok(extension.paragraphs.every(paragraph => paragraph.trim()));
    assert.ok(extension.scenario, `${original.id}: course-specific scenario`);
    assert.equal(extension.sequence.length, 4);
    assert.equal(extension.evidence.length, 3);
  });
  for (const module of concise.modules) if (module.type === 'content') {
    const normalise = text => text.replace(/\s+/g, ' ').trim();
    assert.equal(normalise(readingParagraphs(module.body).join(' ')), normalise(module.body), `${original.id}: text preserved for ${module.id}`);
  }
  return { course: concise.title, originalSlides: original.modules.length, conciseSlides: concise.modules.length,
    originalMinutes: original.duration, conciseMinutes: plannedCourseMinutes(concise),
    reductionPercent: Math.round(100 * (1 - concise.modules.length / original.modules.length)) };
});
const removed = rows.reduce((sum, row) => sum + row.originalSlides - row.conciseSlides, 0);
console.log(JSON.stringify({ courses: rows.length, removedRequiredSlides: removed,
  reductionRange: [Math.min(...rows.map(row => row.reductionPercent)), Math.max(...rows.map(row => row.reductionPercent))],
  averageReduction: Math.round(rows.reduce((sum, row) => sum + row.reductionPercent, 0) / rows.length),
  rows }, null, 2));
