const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, f);
const { courses } = require('../lib/catalogue.ts');
const { activityChallenge, courseQuestions, choiceFeedback, readTakeaway, takeawayText } = require('../lib/courseLearningTools.ts');
const { startingQuestions, readStartingPoint, recommendedFocus, roleExample, practiceRoles, practicePhases } = require('../lib/courseLearningTools.ts');
let activities = 0;
for (const course of courses) {
  const questions = courseQuestions(course); assert.ok(questions.length, course.id);
  assert.ok(startingQuestions(course).length <= 3);
  for (const percent of [0, 50, 100]) {
    const focus = recommendedFocus(course, percent, [questions[0].topic]);
    assert.ok(focus.moduleIds.length);
    focus.moduleIds.forEach(id => assert.ok(course.modules.some(m => m.id === id)));
  }
  const examples = [];
  for (const role of practiceRoles) for (const phase of practicePhases) {
    const example = roleExample(course, role, phase);
    assert.ok(example.case && example.roleTask && example.phaseTask);
    assert.ok(course.objectives.includes(example.objective));
    examples.push(example.roleTask + example.phaseTask);
  }
  assert.equal(new Set(examples).size, 12, course.id + ': distinct role / phase tasks');
  const start = startingQuestions(course), answers = Object.fromEntries(start.map((q,i)=>[i,q.answer]));
  const saved = JSON.stringify({version:1,role:'Leader',phase:'Primary',answers,questionIds:start.map(q=>q.question)});
  assert.equal(readStartingPoint(course, saved).checked, true);
  assert.equal(readStartingPoint(course, saved.replace(start[0].question, 'Changed bank')).checked, false);
  for (const module of course.modules) {
    if (module.type === 'activity') {
      const pack = activityChallenge(course, module); activities++;
      assert.ok(course.objectives.includes(pack.objective));
      assert.ok(questions.some(q => q.question === pack.question.question));
      assert.notEqual(pack.weakResponse, pack.question.options[pack.question.answer]);
      if (pack.scenario) assert.ok(course.modules.includes(pack.scenario));
    }
    if (module.type === 'quiz' && !module.options[0].startsWith('[q|')) {
      assert.equal(choiceFeedback(module, module.answer).correct, true);
      assert.equal(choiceFeedback(module, (module.answer + 1) % module.options.length).correct, false);
      assert.equal(choiceFeedback(module, 0).explanation, module.feedback);
    }
  }
  const plan = readTakeaway(JSON.stringify({version:1,action:'Test one action',evidence:'Review evidence',reviewDate:'2026-10-15'}));
  assert.equal(plan.action, 'Test one action'); assert.ok(takeawayText(course, plan).includes(course.title));
}
assert.equal(readTakeaway('{broken').action, '');
assert.equal(readTakeaway(JSON.stringify({version:2,action:'future'})).action, '');
console.log(JSON.stringify({courses:courses.length,courseSpecificActivities:activities,result:'PASS'}));
