const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const { sourceCourses, keyCourses, extendedCourses } = require('../lib/catalogue.ts');
const { conciseCourse } = require('../lib/conciseCourses.ts');
const { editCourseContent, isTemplateReading } = require('../lib/courseEditorial.ts');
let removed = 0, wordsRemoved = 0, retainedReadings = 0;
for (const source of sourceCourses) {
  const before = conciseCourse(source), after = keyCourses.find(c=>c.id===source.id);
  assert.ok(JSON.stringify(editCourseContent(after))===JSON.stringify(after),'Editorial pass is idempotent');
  assert.equal(after.duration,[45,60,75,90].find(n=>n===after.duration));
  for (const m of before.modules) {
    const edited = after.modules.find(n=>n.id===m.id);
    if (m.type !== 'content') {
      assert.ok(edited, m.id + ': interactive task retained');
      const { minutes: a, ...original } = m, { minutes: b, ...current } = edited;
      assert.deepEqual(current, original, m.id + ': task / answers unchanged');
    }
    if (!edited) { removed++; if(m.type==='content') wordsRemoved+=m.body.split(/\s+/).length; }
    if (edited && m.type==='content' && edited.type==='content') {
      wordsRemoved += Math.max(0,m.body.split(/\s+/).length-edited.body.split(/\s+/).length);
      if (m.body===edited.body) retainedReadings++;
    }
  }
  assert.ok(after.modules.some(m=>m.type==='content'), source.id + ': retain teaching');
  assert.ok(!after.modules.some(isTemplateReading));
  assert.ok(!extendedCourses.find(c=>c.id===source.id).modules.some(isTemplateReading));
}
console.log(JSON.stringify({courses:keyCourses.length,removedTemplateSlides:removed,wordsRemoved,unchangedSubjectReadings:retainedReadings,result:'PASS'},null,2));
