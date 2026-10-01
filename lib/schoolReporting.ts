import type { Course } from "./data";
import { learningPathways, pathwayState } from "./coursePathways";
import { pathways as legacyPathways } from "./pathways";

export type ReportStaff = {id:string;full_name:string;role:string;department:string};
export type ReportProgress = {user_id:string;course_id:string;completed_modules:string[];completed_at:string|null};
export type ReportRequirement = {id:string;title:string;target_type:string;target_id:string;frequency_months:number|null;mandatory:boolean;audience_type:string;audience_value:string|null;active:boolean};
export type ReportRecord = {user_id:string;requirement_id:string;completed_at:string;expires_at:string|null};
export type ReportAssignment = {id:string;assigned_to:string;target_type:string;target_id:string;title_snapshot:string;due_date:string|null;mandatory:boolean;status:string};
export type ReportingSnapshot = {
  generated_at:string; organisation:{id:string;name:string;academic_year:string;timezone:string};
  staff:ReportStaff[]; progress:ReportProgress[]; requirements:ReportRequirement[]; records:ReportRecord[]; assignments:ReportAssignment[];
};
export type ReportFilters = {department:string;search:string;from:string;to:string};
export function validDay(day:string):boolean {return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0,10)===day;}
export function localDay(timestamp:string,timezone="Europe/London"):string {
  if(!timestamp || Number.isNaN(Date.parse(timestamp))) return "";
  let formatter:Intl.DateTimeFormat;
  try {formatter=new Intl.DateTimeFormat("en-GB",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"});}
  catch {formatter=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"});}
  const parts=formatter.formatToParts(new Date(timestamp));
  const part=(type:string)=>parts.find(p=>p.type===type)?.value;
  return part("year")+"-"+part("month")+"-"+part("day");
}
export function plusMonths(day:string,months:number):string {
  if(!validDay(day) || !Number.isInteger(months) || months<1 || months>120) return "";
  const date=new Date(day), desired=date.getUTCDate();
  date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+months);
  const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  date.setUTCDate(Math.min(desired,last));return date.toISOString().slice(0,10);
}
export function csvCell(value:unknown):string {
  let text=String(value??"");
  if(/^[\s]*[=+\-@]/.test(text) || /^[\t\r]/.test(text)) text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}
export function csv(rows:unknown[][]):string {return "\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n");}
export function downloadText(text:string,name:string,type="text/csv;charset=utf-8") {
  const url=URL.createObjectURL(new Blob([text],{type})), link=document.createElement("a");
  link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function applies(requirement:ReportRequirement,person:ReportStaff) {
  if(requirement.audience_type==="all") return true;
  if(requirement.audience_type==="role") return person.role===requirement.audience_value;
  if(requirement.audience_type==="department") return person.department===requirement.audience_value;
  return false; // Unknown audience must not silently become whole-school.
}
export function buildSchoolReport(snapshot:ReportingSnapshot,catalogue:readonly Course[],filters:ReportFilters) {
  const zone=snapshot.organisation.timezone||"Europe/London", today=localDay(snapshot.generated_at,zone);
  const staff=snapshot.staff.filter(s=>(filters.department==="All"||s.department===filters.department) && (s.full_name+" "+s.role+" "+s.department).toLowerCase().includes(filters.search.toLowerCase().trim()));
  const ids=new Set(staff.map(s=>s.id)), people=new Map(staff.map(s=>[s.id,s])), courseMap=new Map(catalogue.map(c=>[c.id,c]));
  const progress=new Map(snapshot.progress.filter(p=>ids.has(p.user_id)).map(p=>[p.user_id+":"+p.course_id,p]));
  const completionRows=[...progress.values()].flatMap(p=>{
    const c=courseMap.get(p.course_id), day=localDay(p.completed_at||"",zone);
    if(!c || !day || day>today || (filters.from&&day<filters.from)||(filters.to&&day>filters.to)) return [];
    return [{person:people.get(p.user_id)!,course:c,day}];
  });
  const records=new Map(snapshot.records.map(r=>[r.user_id+":"+r.requirement_id,r]));
  const completedByToday=(timestamp:string|null)=>Boolean(timestamp&&localDay(timestamp,zone)&&localDay(timestamp,zone)<=today);
  const requirementRows=staff.flatMap(person=>snapshot.requirements.filter(r=>r.active&&r.mandatory&&applies(r,person)).map(requirement=>{
    const record=records.get(person.id+":"+requirement.id);
    const course=requirement.target_type==="catalogue"?progress.get(person.id+":"+requirement.target_id):undefined;
    const recordDay=localDay(record?.completed_at||"",zone), courseDay=localDay(course?.completed_at||"",zone);
    const useRecord=recordDay && recordDay<=today && (!courseDay || courseDay>today || recordDay>=courseDay);
    const completed=useRecord?recordDay:courseDay&&courseDay<=today?courseDay:"";
    const expires=useRecord&&record?.expires_at?localDay(record.expires_at,zone):completed&&requirement.frequency_months?plusMonths(completed,requirement.frequency_months):"";
    const diff=expires?Math.round((Date.parse(expires)-Date.parse(today))/86400000):Infinity;
    const status=!completed?"missing":diff<0?"expired":diff<=30?"due-soon":"current";
    return {person,requirement,completed,expires,status,source:completed?(useRecord?"Training record":"Catalogue completion"):"No completion"};
  }));
  const perPersonProgress=(id:string)=>Object.fromEntries([...progress.values()].filter(p=>p.user_id===id).map(p=>[p.course_id,{completedModules:p.completed_at&&!completedByToday(p.completed_at)?[]:p.completed_modules,completedAt:completedByToday(p.completed_at)?p.completed_at!:undefined}]));
  const pathwayRows=staff.flatMap(person=>learningPathways.map(pathway=>({person,pathway,...pathwayState(pathway,catalogue,perPersonProgress(person.id))})));
  const assignmentRows=snapshot.assignments.filter(a=>ids.has(a.assigned_to)&&a.status!=="waived").map(assignment=>{
    let complete=assignment.status==="completed";
    if(assignment.target_type==="catalogue") {
      const p=progress.get(assignment.assigned_to+":"+assignment.target_id);
      complete ||= completedByToday(p?.completed_at||null);
    }
    if(assignment.target_type==="pathway") {
      const connected=learningPathways.find(p=>p.id===assignment.target_id);
      const legacy=legacyPathways.find(p=>p.id===assignment.target_id);
      const route=connected?.steps.map(s=>s.courseId)||legacy?.courseIds;
      complete ||= Boolean(route?.length && route.every(id=>{const p=progress.get(assignment.assigned_to+":"+id);return completedByToday(p?.completed_at||null);}));
    }
    return {person:people.get(assignment.assigned_to)!,assignment,status:complete?"completed":assignment.due_date&&validDay(assignment.due_date)&&assignment.due_date<today?"overdue":assignment.status==="in_progress"?"in-progress":"assigned"};
  });
  const staffRows=staff.map(person=>{
    const completed=completionRows.filter(r=>r.person.id===person.id), requirements=requirementRows.filter(r=>r.person.id===person.id);
    return {person,courses:completed.length,hours:completed.reduce((n,r)=>n+r.course.duration,0)/60,current:requirements.filter(r=>r.status==="current"||r.status==="due-soon").length,required:requirements.length,missing:requirements.filter(r=>r.status==="missing"||r.status==="expired").length,overdue:assignmentRows.filter(r=>r.person.id===person.id&&r.status==="overdue").length};
  });
  return {today,periodFrom:filters.from||"All recorded dates",periodTo:filters.to||today,staffRows,completionRows,requirementRows,pathwayRows,assignmentRows,hours:staffRows.reduce((n,r)=>n+r.hours,0)};
}
export type SchoolReport = ReturnType<typeof buildSchoolReport>;
export type ReportTab = "staff"|"completions"|"requirements"|"pathways"|"assignments";
export function reportCsv(report:SchoolReport,tab:ReportTab,snapshot:ReportingSnapshot):string {
  const common=(person:ReportStaff)=>[snapshot.organisation.name,report.today,report.periodFrom,report.periodTo,person.full_name,person.department,person.role];
  const prefix=["School","As of (school timezone)","Completion period from","Completion period to","Staff","Department","Role"];
  const rows:unknown[][]=tab==="staff"?[[...prefix,"Completed courses in period","Planned CPD hours in period","Current requirements","Applicable requirements","Missing or expired","Overdue assignments"],...report.staffRows.map(r=>[...common(r.person),r.courses,r.hours.toFixed(2),r.current,r.required,r.missing,r.overdue])]
    :tab==="completions"?[[...prefix,"Course","Completion date","Planned minutes"],...report.completionRows.map(r=>[...common(r.person),r.course.title,r.day,r.course.duration])]
    :tab==="requirements"?[[...prefix,"Requirement","Status","Completed","Expires","Evidence source"],...report.requirementRows.map(r=>[...common(r.person),r.requirement.title,r.status,r.completed,r.expires,r.source])]
    :tab==="pathways"?[[...prefix,"Suggested pathway (not assignment)","Completed courses","Total courses","Next unfinished course"],...report.pathwayRows.map(r=>[...common(r.person),r.pathway.title,r.completed,r.steps.length,r.next?.course.title||"All complete"])]
    :[[...prefix,"Assignment","Status","Due","Mandatory"],...report.assignmentRows.map(r=>[...common(r.person),r.assignment.title_snapshot,r.status,r.assignment.due_date,r.assignment.mandatory?"Yes":"No"])];
  return csv(rows);
}
