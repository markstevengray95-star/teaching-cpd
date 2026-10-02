const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), ts = require("typescript");
require.extensions[".ts"] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, f);
const nav = require("../lib/appNavigation.ts");
const { permissionForPath, hasStaffPermission } = require("../lib/rolePermissions.ts");
const access = (role, legacyRole = "", platformAdmin = false) => ({ role, legacyRole, platformAdmin });
const staff = access("teacher", "Staff"), lead = access("hod", "CPD Lead"), admin = access("administrator", "Admin"), owner = access("super-admin", "Admin", true);
assert.equal(nav.homeViewFromSearch(""), "courses");
for (const view of ["dashboard","courses","mycpd","certificates","profile"]) assert.equal(nav.homeViewFromSearch("?view="+view), view);
assert.equal(nav.homeViewFromSearch("?view=not-a-view"), "courses");
assert.equal(nav.homeViewFromSearch("?view=profile&course=retrieval-practice"), "courses");
assert.equal(nav.homeViewUrl("https://example.test/?course=sample&source=school#record","mycpd"), "/?source=school&view=mycpd#record");
assert.ok(nav.isNavigationActive("/", "?view=mycpd", "/?view=mycpd"));
assert.ok(!nav.isNavigationActive("/", "?view=mycpd", "/"));
assert.ok(nav.isNavigationActive("/", "?course=sample", "/"));
assert.ok(!nav.isNavigationActive("/coaching", "", "/coach"));
assert.ok(nav.isNavigationActive("/safeguarding/documents", "", "/safeguarding"));
for (const href of ["/auth","/auth/callback","/join/code","/access-denied","/procurement","/verify","/school-trial/setup"]) assert.ok(nav.hideAppNavigation(href), href);
assert.ok(!nav.hideAppNavigation("/school-onboarding"));
const unique = new Set();
for (const tool of nav.navigationTools) {
  assert.ok(!unique.has(tool.href), "Duplicate destination: "+tool.href); unique.add(tool.href);
  const target = new URL(tool.href,"https://example.test").pathname;
  assert.ok(fs.existsSync(path.join(__dirname,"..","app",target,"page.tsx")), "Missing route: "+tool.href);
  assert.ok(tool.label.length && tool.description.length && tool.group.length);
}
for (const role of [null,"teacher","tutor","hod","pastoral","send-eal","slt","administrator","support","super-admin"]) {
  const context = access(role);
  assert.equal(nav.primaryNavigation(context).length,4);
  for (const tool of nav.visibleNavigationTools(context)) {
    const permission = permissionForPath(tool.href.split("?")[0]);
    if (permission) assert.ok(role && hasStaffPermission(role,permission),role+": "+tool.href);
    assert.ok(tool.gate !== "platform", "Platform links must require the platform flag");
  }
}
const hrefs = context => nav.visibleNavigationTools(context).map(tool=>tool.href);
assert.ok(!hrefs(staff).includes("/admin")); assert.ok(!hrefs(staff).includes("/school-reporting"));
assert.ok(!hrefs(staff).includes("/staff-access")); assert.ok(!hrefs(staff).includes("/school"));
assert.ok(hrefs(lead).includes("/school-reporting")); assert.ok(!hrefs(lead).includes("/staff-access"));
assert.ok(hrefs(admin).includes("/staff-access")); assert.ok(!hrefs(admin).includes("/admin"));
assert.ok(hrefs(owner).includes("/admin")); assert.ok(hrefs(owner).includes("/managed-logins"));
assert.equal(nav.primaryNavigation(staff)[3].href, "/resources");
assert.equal(nav.primaryNavigation(lead)[3].href, "/school");
assert.ok(nav.searchNavigationTools(nav.visibleNavigationTools(staff), "SAFEGUARDING").some(tool=>tool.href==="/safeguarding"));
assert.ok(nav.searchNavigationTools(nav.visibleNavigationTools(lead), "school reporting").some(tool=>tool.href==="/school-reporting"));
assert.equal(nav.searchNavigationTools(nav.visibleNavigationTools(staff), "school reporting").length,0);
assert.equal(nav.searchNavigationTools(nav.navigationTools,"no-such-tool-xyz").length,0);
assert.equal(nav.searchNavigationTools(nav.navigationTools,"  ").length,nav.navigationTools.length);
const layout=fs.readFileSync(path.join(__dirname,"../app/layout.tsx"),"utf8");
assert.ok(layout.includes("<AppNavigation")); assert.ok(layout.includes("<Suspense"));
for (const old of ["<GlobalMainTabs","<MobilePlatformDock","<DevelopmentDock","<CourseDeepLinkController"]) assert.ok(!layout.includes(old),old+" should not duplicate navigation");
const home=fs.readFileSync(path.join(__dirname,"../app/page.tsx"),"utf8");
assert.ok(!home.includes('<aside className="sidebar"')); assert.ok(!home.includes('<nav className="mobileNav"'));
assert.ok(home.includes("courses.find(course => course.id === requestedCourse)"),"Deep links must directly open a course, not simulate clicks");
assert.ok(home.includes('window.addEventListener("popstate", syncNavigation)'));
const school=fs.readFileSync(path.join(__dirname,"../app/school-hub/page.tsx"),"utf8");
assert.ok(!school.includes('<nav className="schoolHubTabs"'));
assert.ok(school.includes('admin&&<optgroup label="Administration"'));
const workspace=fs.readFileSync(path.join(__dirname,"../app/components/CourseWorkspace.tsx"),"utf8");
assert.ok(!workspace.includes('<nav className="learningToolBar"'));
for (const label of ["Find my focus","Practical takeaway","Follow-up learning","Sources & access","Back to course modules"]) assert.ok(workspace.includes(label),"Preserve course tool: "+label);
const hub=fs.readFileSync(path.join(__dirname,"../app/components/WholeSchoolHub.tsx"),"utf8");
assert.ok(!hub.includes('<nav className="wholeSchoolTopNav"'));
assert.ok(hub.includes("matchingTools.map"));
console.log(JSON.stringify({destinations:unique.size,roles:10,primaryDestinations:4,result:"PASS"}));
