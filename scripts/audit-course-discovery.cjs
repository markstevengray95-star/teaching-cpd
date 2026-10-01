const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {courses}=require('../lib/catalogue.ts');
const {discoverCourses,defaultDiscoveryFilters,learningNeeds,courseNeeds,suitsRole,learningStatus}=require('../lib/courseDiscovery.ts');
const {pathwayRoles}=require('../lib/coursePathways.ts');
const find=(changes,progress={})=>discoverCourses(courses,{...defaultDiscoveryFilters,...changes},progress);
assert.equal(find({}).length,103);
assert.equal(find({kind:'short',maxMinutes:'20'}).length,15);
assert.equal(find({kind:'core',maxMinutes:'20'}).length,0);
for(const max of [20,45,60,75,90]) find({maxMinutes:String(max)}).forEach(c=>assert.ok(c.duration<=max));
for(const role of pathwayRoles) { const results=find({role});assert.ok(results.length);results.forEach(c=>assert.ok(suitsRole(c,role))); }
for(const need of learningNeeds) {const results=find({need:need.id});assert.ok(results.length);results.forEach(c=>assert.ok(courseNeeds(c).includes(need.id)));}
courses.forEach(c=>assert.ok(courseNeeds(c).length,c.id+': discoverable by learning need'));
assert.ok(find({search:'health and safety'}).some(c=>c.id==='health-safety-essentials-schools'));
assert.ok(find({search:'health and safety'}).slice(0,2).some(c=>c.id==='health-safety-essentials-schools'),'Title relevance beats incidental body matches');
assert.ok(find({search:'TA'}).some(c=>c.id==='adaptive-teaching'));
assert.ok(find({search:'AFL'}).some(c=>c.id==='assessment-for-learning'));
assert.ok(find({search:'retrieval memory'}).some(c=>c.id==='retrieval-practice'));
assert.equal(find({search:'no-such-topic-zqxv'}).length,0);
const course=courses.find(c=>c.id==='effective-questioning'), partial={[course.id]:{completedModules:[course.modules[0].id,'removed-old-id']}};
assert.equal(learningStatus(course,partial),'in-progress');
assert.equal(find({status:'in-progress'},partial).length,1);
assert.equal(find({},partial)[0].id,course.id);
const completed={[course.id]:{completedModules:[],completedAt:'2026-10-01'}};
assert.equal(find({status:'completed'},completed)[0].id,course.id);
assert.equal(find({status:'not-started'},completed).length,102);
const short=find({sort:'shortest'});short.forEach((c,i)=>assert.ok(!i||c.duration>=short[i-1].duration));
console.log(JSON.stringify({courses:courses.length,learningNeeds:learningNeeds.length,roles:pathwayRoles.length,result:'PASS'}));
