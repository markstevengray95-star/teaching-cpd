const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, f);
const { courses, keyCourses, quickCourses, extendedCourses } = require('../lib/catalogue.ts');
const { shortCourseParents, shortCourseBriefs } = require('../lib/shortCourses.ts');
const { buildCourseExperience } = require('../lib/courseExperience.ts');
const { courseSections } = require('../lib/presentationLearning.ts');
const { classroomCase, classroomScore } = require('../lib/classroomPractice.ts');
const { isAssessmentBank, questionsForModule, selectAssessmentQuestions, scoreAssessment, decodeQuestion } = require('../lib/assessmentQuestions.ts');
const text = (s, context) => assert.ok(typeof s === 'string' && s.trim().length > 0, context);
const path = require('node:path');
const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const home = read('app/page.tsx'), workspace = read('app/components/CourseWorkspace.tsx');
assert.ok(home.includes('<CourseWorkspace'), 'Teaching CPD must use the native workspace');
assert.ok(workspace.includes('<ActivityPractice'), 'Activity drafting must be reachable');
assert.ok(workspace.includes('shortCoursePresentation'), 'Short route must identify its controller scope');
assert.ok(read('app/layout.tsx').includes('./course-learning-layout.css'), 'Native course layout must load');
for (const name of fs.readdirSync(path.join(__dirname, '../app/components'))) {
  if ((name.startsWith('Course') && name.endsWith('Controller.tsx')) || name === 'AdminSlideUnlockController.tsx') {
    const source = read('app/components/' + name);
    if (source.includes('.courseModal')) assert.ok(source.includes('not(.shortCoursePresentation)'), name + ': short-course scope');
  }
}
assert.ok(quickCourses.length >= 15);
assert.equal(new Set(courses.map(c => c.id)).size, courses.length);
assert.deepEqual([...new Set(keyCourses.map(c => c.duration))].sort((a,b)=>a-b), [45,60,75,90]);
let tasks = 0, cards = 0, bankQuestions = 0;
for (const c of extendedCourses) {
  const core = keyCourses.find(k => k.id === c.id);
  assert.ok(c.duration >= core.duration, `${c.id}: extended route cannot be shorter`);
  assert.ok(Math.abs(c.modules.reduce((s,m)=>s+m.minutes,0)-c.duration) < .001);
}
for (const c of courses) {
  text(c.title, c.id); text(c.summary, c.id);
  assert.ok(c.objectives.length && c.modules.length);
  assert.equal(new Set(c.modules.map(m=>m.id)).size, c.modules.length);
  assert.ok(Math.abs(c.modules.reduce((s,m)=>s+m.minutes,0)-c.duration) < .001, `${c.id}: timing budget`);
  const sections=courseSections(c); assert.equal(sections[0].start,0); assert.equal(sections.at(-1).end,c.modules.length);
  sections.forEach((s,i)=>{assert.ok(s.start<s.end);if(i)assert.equal(s.start,sections[i-1].end)});
  if(shortCourseParents[c.id]) {
    assert.ok(c.duration>0 && c.duration<=20);
    assert.ok(keyCourses.some(parent=>parent.id===shortCourseParents[c.id]), `${c.id}: parent exists`);
    assert.equal(c.modules.length,7); assert.equal(sections.length,3);
  } else assert.ok(c.duration>=45 && c.duration<=90);
  for(const m of c.modules) {
    tasks++;text(m.id,c.id);text(m.title,m.id);assert.ok(m.minutes>0);
    switch(m.type) {
      case 'content': text(m.body,m.id);break;
      case 'quiz': {
        text(m.question,m.id);text(m.feedback,m.id);assert.ok(m.options.length>=2);m.options.forEach(o=>text(o,m.id));assert.ok(Number.isInteger(m.answer)&&m.answer>=0&&m.answer<m.options.length);
        if(isAssessmentBank(m)) {
          m.options.forEach(o=>assert.ok(decodeQuestion(o),`${m.id}: invalid encoded question`));
          const decoded=questionsForModule(m);bankQuestions+=decoded.length;assert.equal(decoded.length,m.options.length);
          for(const q of decoded){text(q.question,m.id);q.options.forEach(o=>text(o,m.id));text(q.feedback,m.id);assert.ok(!/\[q\||§/.test(q.question+q.options.join('')))}
          const selected=selectAssessmentQuestions(decoded,m.id,0), picked=Object.fromEntries(selected.map((q,i)=>[i,q.answer]));
          assert.deepEqual(scoreAssessment(selected,picked),{complete:true,correct:selected.length,percent:100});
          assert.equal(scoreAssessment(selected,{}).complete,false);
          assert.equal(scoreAssessment(selected,Object.fromEntries(selected.map((q,i)=>[i,(q.answer+1)%4]))).percent,0);
        }
        break;
      }
      case 'scenario': text(m.prompt,m.id);assert.ok(m.options.length>=2);m.options.forEach(o=>{text(o.label,m.id);text(o.feedback,m.id)});break;
      case 'activity': text(m.prompt,m.id);assert.ok(m.instructions.length);m.instructions.forEach(o=>text(o,m.id));assert.ok((m.minimumCharacters??30)>0);break;
      case 'reflection': text(m.prompt,m.id);break;
      case 'checklist': text(m.prompt,m.id);assert.ok(m.items.length);m.items.forEach(o=>text(o,m.id));break;
      case 'visual': assert.ok(m.items.length);m.items.forEach(o=>{text(o.heading,m.id);text(o.text,m.id)});break;
      default: assert.fail(`Unknown module type: ${m.type}`);
    }
  }
  const e=buildCourseExperience(c,courses);
  assert.ok(e.flashcards.length>=3, `${c.id}: substantive flashcards`);
  for(const card of e.flashcards) { cards++;text(card.front,c.id);text(card.back,c.id);assert.ok(/[?]/.test(card.front),`${c.id}: flashcard must ask a question`);assert.ok(!/^(Objective|Key idea) \d+$/.test(card.front));assert.ok(!/\[q\||§/.test(card.front+card.back),`${c.id}: no raw assessment encoding`); }
  for(const q of e.diagnostic) {text(q.question,c.id);assert.ok(q.options[q.answer]?.trim());text(q.feedback,c.id)}
  const p=classroomCase(c);text(p.setting,c.id);text(p.question,c.id);text(p.followUp,c.id);text(p.review,c.id);assert.equal(p.observations.length,3);assert.equal(p.options.length,3);
  assert.deepEqual(classroomScore(p,['observation','observation','observation','inference'],p.answer),{evidence:4,decision:true});
  assert.equal(classroomScore(p,['inference','inference','inference','observation'],(p.answer+1)%3).evidence,0);
  assert.equal(classroomScore(p,[],(p.answer+1)%3).decision,false);
}
for(const b of shortCourseBriefs) { assert.ok(b.answer>=0&&b.answer<b.choices.length);assert.ok(b.correct>=0&&b.correct<b.options.length); }
console.log(JSON.stringify({courses:courses.length,keyCourses:keyCourses.length,shortCourses:quickCourses.length,tasks,decodedAssessmentQuestions:bankQuestions,questionFlashcards:cards,durations:Object.fromEntries([15,20,45,60,75,90].map(n=>[n,courses.filter(c=>c.duration===n).length])),result:'PASS'},null,2));
