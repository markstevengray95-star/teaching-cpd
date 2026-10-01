const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {courses}=require('../lib/catalogue.ts');
const {learningPathways,pathwayState,courseFinished}=require('../lib/coursePathways.ts');
assert.equal(new Set(learningPathways.map(p=>p.id)).size,learningPathways.length);
for(const p of learningPathways) {
  assert.ok(p.roles.length && p.steps.length>=3 && p.outcome);
  assert.equal(new Set(p.steps.map(s=>s.courseId)).size,p.steps.length);
  const empty=pathwayState(p,courses,{});
  assert.equal(empty.next.courseId,p.steps[0].courseId);
  assert.equal(empty.completed,0);
  const progress=Object.fromEntries(empty.steps.map(s=>[s.course.id,{completedModules:s.course.modules.map(m=>m.id)}]));
  const done=pathwayState(p,courses,progress);assert.equal(done.completed,p.steps.length);assert.equal(done.next,undefined);
  delete progress[empty.steps[1].course.id];
  assert.equal(pathwayState(p,courses,progress).next.courseId,empty.steps[1].course.id);
  assert.equal(courseFinished(empty.steps[0].course,{[empty.steps[0].course.id]:{completedModules:['old-removed-id'],completedAt:'2026-10-01'}}),true);
  assert.equal(courseFinished(empty.steps[0].course,{[empty.steps[0].course.id]:{completedModules:['old-removed-id']}}),false);
  assert.equal(empty.minutes,empty.steps.reduce((n,s)=>n+s.course.duration,0));
}
console.log(JSON.stringify({pathways:learningPathways.length,connectedSteps:learningPathways.reduce((n,p)=>n+p.steps.length,0),result:'PASS'}));
