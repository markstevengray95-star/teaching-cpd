export type TimetableDay = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday';
export type TimetableBlock = {id:string;name:string;type:string;start:string;end:string};
export type TimetableAssignment = {id:string;requirementId?:string;groupId?:string;groupName?:string;subject:string;week:string;dayKey:string;periodIndex:number;periodIndices?:number[];slotIds?:string[];duration?:number;teacherId:string;teacherName?:string;roomCode?:string;roomName?:string;cancelled?:boolean;cover?:boolean;roomChanged?:boolean;originalTeacherId?:string};
export type SchoolTimetableFeed = {linked:boolean;organizationId:string;publicationId?:string;publishedAt?:string;syncRevision?:number;teacherId?:string;school?:{name:string;cycle:string;cycleAnchor:string;timezone:string};days?:{key:string;label:string;enabled:boolean}[];blocks?:TimetableBlock[];dayOverrides?:Record<string,TimetableBlock[]>;date?:string;week?:string;assignments?:TimetableAssignment[];today?:TimetableAssignment[]};
export type SchoolLesson = {id:string;week:'W1'|'W2';day:TimetableDay;period:number;start:string;end:string;subject:string;className:string;room:string;notes:string;schoolManaged?:{organizationId:string;userId:string;key:string};plan:unknown};
const dayNames:Record<string,TimetableDay>={mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'};
const dayOrder=['mon','tue','wed','thu','fri','sat','sun'];
export function publicationLessons(feed:SchoolTimetableFeed,userId:string,assignments=feed.assignments || []):SchoolLesson[]{
 const count=new Map<string,number>();
 // The existing planner plans across two weeks. A one-week school pattern repeats in both.
 const pattern=assignments===feed.assignments&&feed.school?.cycle==='one-week'?assignments.flatMap(a=>[a,{...a,week:'B'}]):assignments;
 return pattern.slice().sort((a,b)=>a.week.localeCompare(b.week)||dayOrder.indexOf(a.dayKey)-dayOrder.indexOf(b.dayKey)||a.periodIndex-b.periodIndex).flatMap(a=>{
  const day=dayNames[a.dayKey];if(!day)throw new Error('Published timetable contains an unsupported teaching day.');
  const blocks=(feed.dayOverrides?.[a.dayKey] || feed.blocks || []).filter(b=>b.type==='lesson');
  const base=JSON.stringify([a.requirementId || '',a.groupId || a.groupName,a.subject,a.week]);const ordinal=count.get(base)||0;count.set(base,ordinal+1);
  const indices=a.periodIndices?.length?a.periodIndices:Array.from({length:a.duration || 1},(_,i)=>a.periodIndex+i);
  return indices.map((index,segment)=>{const block=blocks[index];if(!block)throw new Error('Published lesson has no matching school period.');
   const key=JSON.stringify([base,ordinal,segment]);return {id:'school:'+feed.organizationId+':'+userId+':'+key,week:a.week==='B'?'W2':'W1',day,period:index+1,start:block.start,end:block.end,subject:a.subject,className:a.groupName || '',room:a.roomCode || a.roomName || '',notes:'',plan:{},schoolManaged:{organizationId:feed.organizationId,userId,key}};
  });
 });
}
export function mergePublishedLessons<T extends SchoolLesson>(current:T[],archived:T[],incoming:SchoolLesson[],organizationId:string,userId:string){
 const used=new Set<string>(),candidates=[...current,...archived];
 const own=(l:SchoolLesson)=>l.schoolManaged?.organizationId===organizationId&&l.schoolManaged.userId===userId;
 const sameSlot=(a:SchoolLesson,b:SchoolLesson)=>a.week===b.week&&a.day===b.day&&a.period===b.period;
 const lessons=incoming.map(next=>{
  const previous=candidates.find(l=>!used.has(l.id)&&own(l)&&l.schoolManaged?.key===next.schoolManaged?.key)
   ||current.find(l=>!used.has(l.id)&&!l.schoolManaged&&sameSlot(l,next)&&l.subject===next.subject&&l.className===next.className);
  if(previous)used.add(previous.id);
  return {...next,id:previous?.id || next.id,plan:previous?.plan || next.plan,notes:previous?.notes || ''} as T;
 });
 const retained=current.filter(l=>!used.has(l.id)&&!own(l)&&!incoming.some(n=>sameSlot(l,n)));
 const moved=current.filter(l=>!used.has(l.id)&&!retained.includes(l));
 return {lessons:[...retained,...lessons],archived:[...new Map([...archived.filter(l=>!used.has(l.id)),...moved].map(l=>[l.id,l])).values()]};
}
export function timetableWeek(feed:SchoolTimetableFeed,date:string):'W1'|'W2'{
 if(feed.school?.cycle!=='two-week')return 'W1';
 const anchor=new Date((feed.school.cycleAnchor || '2026-09-07')+'T12:00:00Z');anchor.setUTCDate(anchor.getUTCDate()-(anchor.getUTCDay()+6)%7);
 const diff=Math.floor((new Date(date+'T12:00:00Z').getTime()-anchor.getTime())/604800000);return ((diff%2)+2)%2===1?'W2':'W1';
}
