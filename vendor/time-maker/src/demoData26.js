import { buildDemoData as buildBaseDemoData } from './demoData.js';

const availability = (mon, tue, wed, thu, fri) => ({ mon, tue, wed, thu, fri });

const STAFF = [
  ['demo-staff-gray','Mark Gray','MG','Science',['Science','Physics'],1,24,availability(true,true,true,true,true),'Demo Head of Physics · Full time'],
  ['demo-staff-patel','Asha Patel','AP','Mathematics',['Mathematics','Maths'],1,25,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-taylor','Sophie Taylor','ST','English',['English'],1,24,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-khan','Nadia Khan','NK','Science',['Science','Chemistry'],1,24,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-evans','Rachel Evans','RE','Science',['Science','Biology'],1,24,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-morgan','James Morgan','JM','Humanities',['History'],1,24,availability(true,true,true,true,true),'Head of Humanities · Full time'],
  ['demo-staff-garcia','Elena Garcia','EG','Languages',['Spanish','French'],1,24,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-brown','Oliver Brown','OB','PE',['PE'],1,25,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-white','Amelia White','AW','Arts',['Art'],1,24,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-green','Samuel Green','SG','Technology',['Design Technology','Computing'],1,24,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-wood','Maya Wood','MW','SEND',['SEND','Learning Support'],1,22,availability(true,true,true,true,true),'SENDCo · Full time'],
  ['demo-staff-scott','George Scott','GS','Humanities',['Geography'],1,24,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-young','Isla Young','IY','English',['English','Drama'],1,24,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-king','Leo King','LK','Mathematics',['Mathematics','Maths'],1,25,availability(true,true,true,true,true),'Full time'],
  ['demo-staff-hall','Zara Hall','ZH','Sixth Form',['Psychology','PSHE'],1,23,availability(true,true,true,true,true),'Sixth Form tutor · Full time'],
  ['demo-staff-lewis','Daniel Lewis','DL','English',['English'],0.8,19,availability(true,true,true,true,false),'Part time · 4 days · Monday–Thursday'],
  ['demo-staff-clarke','Hannah Clarke','HC','Science',['Science','Biology'],0.8,19,availability(false,true,true,true,true),'Part time · 4 days · Tuesday–Friday'],
  ['demo-staff-hussain','Omar Hussain','OH','Mathematics',['Mathematics','Maths'],0.8,20,availability(true,true,false,true,true),'Part time · 4 days · Monday, Tuesday, Thursday, Friday'],
  ['demo-staff-martin','Chloe Martin','CM','Languages',['French'],0.8,19,availability(true,false,true,true,true),'Part time · 4 days · Monday, Wednesday–Friday'],
  ['demo-staff-shah','Priya Shah','PS','Humanities',['Geography'],0.6,15,availability(true,true,true,false,false),'Part time · 3 days · Monday–Wednesday'],
  ['demo-staff-walker','Ben Walker','BW','PE',['PE'],0.6,15,availability(false,false,true,true,true),'Part time · 3 days · Wednesday–Friday'],
  ['demo-staff-grant','Lucy Grant','LG','Arts',['Music'],0.6,14,availability(true,false,true,false,true),'Part time · 3 days · Monday, Wednesday, Friday'],
  ['demo-staff-rahman','Ahmed Rahman','AR','Technology',['Computing'],0.6,15,availability(false,true,true,true,false),'Part time · 3 days · Tuesday–Thursday'],
  ['demo-staff-foster','Emily Foster','EF','SEND',['SEND','Learning Support'],0.4,10,availability(true,true,false,false,false),'Part time · 2 days · Monday–Tuesday'],
  ['demo-staff-wilson','Grace Wilson','GW','Arts',['Drama'],0.4,10,availability(false,false,false,true,true),'Part time · 2 days · Thursday–Friday'],
  ['demo-staff-bennett','Tom Bennett','TB','Science',['Science','Physics'],0.4,10,availability(false,true,false,true,false),'Part time · 2 days · Tuesday and Thursday'],
].map(([id,name,initials,department,subjects,fte,maxPeriods,workingDays,notes]) => ({
  id,name,initials,department,subjects,fte,maxPeriods,
  ppaPeriods: Number(fte) >= 1 ? 4 : Number(fte) >= .8 ? 3 : Number(fte) >= .6 ? 2 : 1,
  leadershipPeriods: ['MG','JM','MW','ZH'].includes(initials) ? 2 : 0,
  maxDaily: 5,maxConsecutive: 4,availability: workingDays,notes,
}));

export function buildDemoData26() {
  const base = buildBaseDemoData();
  return {
    ...base,
    school: { ...base.school, name: 'Oakfield Academy (Demo School)' },
    staff: STAFF,
  };
}

export const demoStaff26 = STAFF;
