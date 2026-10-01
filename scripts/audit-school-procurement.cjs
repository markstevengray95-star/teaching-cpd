const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {courses}=require('../lib/catalogue.ts');
const {catalogueFacts,procurementFields,procurementSections,missingProcurementFields,procurementMarkdown,markdownText}=require('../lib/schoolProcurement.ts');
const facts=catalogueFacts(courses);assert.deepEqual(facts,{total:103,short:15,core:88,coreMin:45,coreMax:90,shortMax:20});
assert.equal(procurementSections(facts).length,8);assert.equal(procurementFields.length,12);
assert.equal(missingProcurementFields({}).length,12);
const populated=Object.fromEntries(procurementFields.map(f=>[f.id,'Draft fixture']));
assert.equal(missingProcurementFields(populated).length,0);
for(const details of [{},populated]){const text=procurementMarkdown(facts,details);assert.ok(text.includes('DRAFT FOR REVIEW'));assert.ok(text.includes('not a contract'));assert.ok(text.includes('remain unverified'));assert.ok(text.includes('TO CONFIRM'));procurementSections(facts).forEach(s=>assert.ok(text.includes(s.title)));assert.ok(!text.includes('tkjbaqkpkvomwwvwhowp'));assert.ok(!text.includes('NEXT_PUBLIC'));assert.ok(!text.includes('sb_publishable'));}
assert.equal(markdownText('[bad](https://example.invalid)\n# header'),'\\[bad\\]\\(https://example.invalid\\) \\# header');
const packClient=fs.readFileSync('app/components/SchoolProcurementPack.tsx','utf8');assert.ok(!/localStorage|supabase|fetch\(/.test(packClient));
const page=fs.readFileSync('app/procurement/page.tsx','utf8');assert.ok(!page.includes('"use client"'),'Catalogue facts calculated on server without sending full course data');
const shell=fs.readFileSync('app/components/AppShellEnhancements.tsx','utf8');assert.ok(shell.includes('"/procurement"'));
// Verify the download helper wires the content, name, browser click and cleanup.
let anchor,appended=false,clicked=false,removed=false,revoked=false,blob;
global.URL={createObjectURL:value=>{blob=value;return 'blob:fixture';},revokeObjectURL:value=>{assert.equal(value,'blob:fixture');revoked=true;}};
global.document={createElement:()=>anchor={click(){assert.ok(appended);clicked=true;},remove(){removed=true;}},body:{appendChild(){appended=true;}}};
const nativeTimeout=global.setTimeout;global.setTimeout=fn=>{fn();return 1;};
const {downloadText}=require('../lib/schoolReporting.ts');downloadText(procurementMarkdown(facts,{}),'pack-DRAFT.md','text/markdown;charset=utf-8');
assert.equal(anchor.download,'pack-DRAFT.md');assert.equal(blob.type,'text/markdown;charset=utf-8');assert.ok(clicked&&removed&&revoked);global.setTimeout=nativeTimeout;
console.log('PASS: eight procurement sections, 12 unresolved fields, catalogue facts, draft-only exports, safe Markdown and browser download wiring');
