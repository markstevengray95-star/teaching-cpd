const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {courses}=require('../lib/catalogue.ts');
const {buildSchoolReport,reportCsv,localDay,plusMonths,validDay,csvCell}=require('../lib/schoolReporting.ts');
assert.equal(localDay('2026-09-30T23:30:00Z'),'2026-10-01');
assert.equal(localDay('2026-09-30T23:30:00Z','invalid-zone'),'2026-10-01');
assert.equal(localDay('invalid'),'');
assert.equal(plusMonths('2024-01-31',1),'2024-02-29');
assert.equal(plusMonths('2025-01-31',1),'2025-02-28');
assert.equal(validDay('2026-02-30'),false);
assert.equal(csvCell('  =HYPERLINK("bad")'),'"\'  =HYPERLINK(""bad"")"');
const person={id:'staff',full_name:'=Test',department:'Science',role:'Staff'};
const course=courses.find(c=>c.id==='effective-questioning');
const snapshot={generated_at:'2026-10-01T12:00:00Z',organisation:{id:'school',name:'Fixture school',academic_year:'2026/27',timezone:'Europe/London'},
staff:[person],progress:[{user_id:'staff',course_id:course.id,completed_modules:[],completed_at:'2026-09-15T12:00:00Z'},{user_id:'other-school',course_id:course.id,completed_modules:[],completed_at:'2026-09-15T12:00:00Z'}],
requirements:[{id:'r',title:'Required',target_type:'catalogue',target_id:course.id,frequency_months:1,mandatory:true,audience_type:'all',audience_value:null,active:true},{id:'missing',title:'Missing',target_type:'custom',target_id:'c',frequency_months:12,mandatory:true,audience_type:'department',audience_value:'Science',active:true},{id:'not-for-staff',title:'Admin only',target_type:'custom',target_id:'c',mandatory:true,audience_type:'role',audience_value:'Admin',active:true}],
records:[],assignments:[{id:'a',assigned_to:'staff',target_type:'custom',target_id:'c',title_snapshot:'Overdue',due_date:'2026-09-30',mandatory:true,status:'assigned'},{id:'waived',assigned_to:'staff',target_type:'custom',target_id:'c',title_snapshot:'Waived',due_date:'2026-09-30',mandatory:true,status:'waived'}]};
const filters={department:'All',search:'',from:'',to:''},report=buildSchoolReport(snapshot,courses,filters);
assert.equal(report.completionRows.length,1);assert.equal(report.hours,course.duration/60);
assert.deepEqual(report.requirementRows.map(r=>r.status),['due-soon','missing']);
assert.equal(report.assignmentRows.length,1);assert.equal(report.assignmentRows[0].status,'overdue');
assert.equal(buildSchoolReport(snapshot,courses,{...filters,from:'2026-09-15',to:'2026-09-15'}).completionRows.length,1);
assert.equal(buildSchoolReport(snapshot,courses,{...filters,from:'2026-09-16'}).completionRows.length,0);
assert.equal(buildSchoolReport(snapshot,courses,{...filters,department:'English'}).staffRows.length,0);
for(const tab of ['staff','completions','requirements','pathways','assignments'])assert.ok(reportCsv(report,tab,snapshot).startsWith('\uFEFF'));
snapshot.records=[{user_id:'staff',requirement_id:'r',completed_at:'2026-09-20T12:00:00Z',expires_at:'2026-09-30T12:00:00Z'}];
assert.equal(buildSchoolReport(snapshot,courses,filters).requirementRows[0].status,'expired');
snapshot.progress[0].completed_at='invalid';
assert.equal(buildSchoolReport(snapshot,courses,filters).completionRows.length,0);
console.log('PASS: school reporting calculations, inclusive dates, renewal dates, audience, isolation, waived assignments and safe CSV');
