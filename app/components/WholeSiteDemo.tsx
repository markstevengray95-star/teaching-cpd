"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./WholeSiteDemo.css";

type Role = "teacher" | "hod" | "send" | "slt" | "admin";
type Area = "home" | "teaching" | "students" | "cpd" | "school" | "timetable" | "reports" | "admin";

const roles: Record<Role,{label:string,subtitle:string}> = {
  teacher:{label:"Teacher",subtitle:"Day-to-day teaching, CPD and student support"},
  hod:{label:"Head of Department",subtitle:"Department planning, staff development and oversight"},
  send:{label:"SEND / EAL",subtitle:"Inclusion, interventions and pupil support"},
  slt:{label:"SLT",subtitle:"Whole-school priorities, reporting and operations"},
  admin:{label:"School Admin",subtitle:"Accounts, setup, access and school systems"},
};

const areas: {id:Area;label:string;hint:string}[] = [
  {id:"home",label:"Home",hint:"Role-aware dashboard"},
  {id:"teaching",label:"Teaching",hint:"Planning and classroom tools"},
  {id:"students",label:"Students",hint:"Pastoral, SEND and interventions"},
  {id:"cpd",label:"CPD",hint:"Courses, coaching and appraisal"},
  {id:"school",label:"School",hint:"Calendar, notices and workflows"},
  {id:"timetable",label:"Timetable",hint:"Whole-school scheduling"},
  {id:"reports",label:"Reports",hint:"Leadership intelligence"},
  {id:"admin",label:"Admin",hint:"Setup and access"},
];

const pupils = [
  {name:"Amelia R.",year:"Year 8",summary:"Strong verbal contributions; benefits from chunked written instructions.",support:"Visual checklist, vocabulary preview and 5-minute retrieval start.",intervention:"Reading fluency · Week 5 of 8",status:"On track"},
  {name:"Hana K.",year:"Year 10",summary:"EAL learner making secure progress in subject vocabulary.",support:"Sentence stems, model answers and pre-teaching of tier 3 vocabulary.",intervention:"Academic language · Review due Friday",status:"Review due"},
  {name:"Daniel M.",year:"Year 7",summary:"Settling well; regulation check-ins are reducing lesson exits.",support:"Predictable routines, movement break card and calm re-entry script.",intervention:"Regulation support · Week 3 of 6",status:"Improving"},
];

const timetableSizes = [
  {label:"Small",staff:18,pupils:"300–500"},{label:"Medium",staff:40,pupils:"600–900"},{label:"Large",staff:75,pupils:"1,000–1,500"},{label:"Very large",staff:120,pupils:"1,500+"},
];

function Stat({label,value,note}:{label:string;value:string;note:string}){
  return <div className="wsdStat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function Progress({value}:{value:number}){
  return <div className="wsdProgress"><span style={{width:`${Math.max(0,Math.min(100,value))}%`}} /></div>;
}

export default function WholeSiteDemo(){
  const [role,setRole]=useState<Role>("teacher");
  const [area,setArea]=useState<Area>("home");
  const [pupil,setPupil]=useState(0);
  const [noticeRead,setNoticeRead]=useState(false);
  const [taskDone,setTaskDone]=useState(false);
  const [timetableSize,setTimetableSize]=useState(1);
  const currentRole=roles[role];
  const currentPupil=pupils[pupil];

  const homeStats=useMemo(()=>{
    if(role==="teacher") return [["Today","5 lessons","2 free periods"],["My CPD","68%","2 active courses"],["Student actions","3","1 review due"],["Notices",noticeRead?"1 read":"1 new","Whole-school update"]];
    if(role==="hod") return [["Department","11 staff","Science"],["CPD completion","82%","Across department"],["Actions","4","2 due this week"],["Curriculum","94%","Mapped for autumn"]];
    if(role==="send") return [["Open plans","18","6 reviews this month"],["Interventions","12","8 improving"],["EAL reviews","5","2 due this week"],["Check-ins","7","Today"]];
    if(role==="slt") return [["Staff active","64","This week"],["Mandatory CPD","91%","Whole school"],["SIP actions","14","3 need attention"],["Approvals","5","Awaiting decision"]];
    return [["Accounts","78","74 active"],["Onboarding","86%","Launch readiness"],["Integrations","3","Google connected"],["Access reviews","4","Due this month"]];
  },[role,noticeRead]);

  return <main className="wsdShell">
    <header className="wsdTopbar">
      <div className="wsdBrand"><span>TCPD</span><div><strong>Teaching CPD</strong><small>Interactive whole-school demo</small></div></div>
      <div className="wsdDemoFlag">FICTIONAL DATA · NOTHING SAVED TO A REAL SCHOOL</div>
      <div className="wsdTopActions"><Link href="/auth">Sign in</Link><Link className="primary" href="/procurement">Purchase information</Link></div>
    </header>

    <section className="wsdHero">
      <div>
        <span className="eyebrow">TRY THE PLATFORM BEFORE YOU BUY</span>
        <h1>Explore a complete fictional school</h1>
        <p>Switch staff roles and move around the platform to see how Teaching CPD connects professional development, teaching, student support, school operations, timetable planning and leadership reporting.</p>
      </div>
      <div className="wsdRolePicker">
        <span>View the demo as</span>
        <select value={role} onChange={e=>setRole(e.target.value as Role)}>{Object.entries(roles).map(([id,item])=><option key={id} value={id}>{item.label}</option>)}</select>
        <strong>{currentRole.label}</strong><small>{currentRole.subtitle}</small>
      </div>
    </section>

    <div className="wsdLayout">
      <aside className="wsdNav">
        <div className="wsdSchool"><span>OA</span><div><strong>Oakfield Academy</strong><small>Demo School · 2026/27</small></div></div>
        <nav>{areas.map(item=><button key={item.id} onClick={()=>setArea(item.id)} className={area===item.id?"active":""}><strong>{item.label}</strong><small>{item.hint}</small></button>)}</nav>
        <div className="wsdNavFoot"><span>Demo role</span><strong>{currentRole.label}</strong><small>Change role at the top at any time.</small></div>
      </aside>

      <section className="wsdWorkspace">
        {area==="home"&&<>
          <div className="wsdPageHead"><div><span className="eyebrow">ROLE-AWARE HOME</span><h2>Good evening, Alex</h2><p>This dashboard changes to show the most useful information for each staff role.</p></div><button onClick={()=>setArea(role==="send"?"students":role==="slt"?"reports":"teaching")}>Open my priority area →</button></div>
          <div className="wsdStats">{homeStats.map(([label,value,note])=><Stat key={label} label={label} value={value} note={note}/>)}</div>
          <div className="wsdTwoCol">
            <article className="wsdCard"><span className="eyebrow">TODAY</span><h3>Your day</h3><div className="wsdTimeline"><div><b>08:55</b><span>Year 10 Physics · Energy transfers</span></div><div><b>09:55</b><span>Year 8 Science · Cells</span></div><div><b>11:10</b><span>Free period · planning</span></div><div><b>12:10</b><span>Year 12 Physics · Electric fields</span></div><div><b>14:05</b><span>Year 9 Science · Forces</span></div></div></article>
            <article className="wsdCard"><span className="eyebrow">NEEDS ATTENTION</span><h3>Actions</h3><button className={`wsdAction ${taskDone?"done":""}`} onClick={()=>setTaskDone(v=>!v)}><span>{taskDone?"✓":"○"}</span><div><strong>Complete safeguarding refresher</strong><small>{taskDone?"Marked complete in this demo":"Due Monday · 12 min remaining"}</small></div></button><button className={`wsdAction ${noticeRead?"done":""}`} onClick={()=>setNoticeRead(true)}><span>{noticeRead?"✓":"!"}</span><div><strong>Read staff briefing notice</strong><small>{noticeRead?"Read in this demo":"Updated fire drill arrangements"}</small></div></button></article>
          </div>
        </>}

        {area==="teaching"&&<>
          <div className="wsdPageHead"><div><span className="eyebrow">TEACHING & LEARNING</span><h2>Plan, teach and share</h2><p>Classroom strategies, curriculum, department work and resource creation in one place.</p></div></div>
          <div className="wsdFeatureGrid">
            {[['Teaching strategies','Retrieval, questioning, feedback, literacy and adaptive teaching.'],['Resource generator','Create retrieval tasks, quizzes, worksheets and exit tickets.'],['Curriculum hub','Build subjects, topics and lessons and connect them to specifications.'],['Department hub','Share notices, assessments, meeting notes, resources and improvement work.'],['Learning walks','Capture classroom evidence without turning it into staff ranking.'],['AI CPD tutor','Turn a classroom problem into planning, reflection and next steps.']].map(([title,text])=><article className="wsdCard" key={title}><h3>{title}</h3><p>{text}</p><button>Try example</button></article>)}
          </div>
          <article className="wsdCard wsdWide"><span className="eyebrow">EXAMPLE RESOURCE</span><h3>Year 10 Physics · Energy retrieval starter</h3><div className="wsdQuestionGrid"><div><b>1</b><span>Name the eight energy stores.</span></div><div><b>2</b><span>State the equation for kinetic energy.</span></div><div><b>3</b><span>Explain one way energy can be transferred.</span></div><div><b>4</b><span>Identify the useful and wasted outputs of a kettle.</span></div></div></article>
        </>}

        {area==="students"&&<>
          <div className="wsdPageHead"><div><span className="eyebrow">STUDENT SUPPORT</span><h2>One support picture, not separate spreadsheets</h2><p>Use fictional pupil records to see how plans, interventions, EAL information and regulation support can sit together.</p></div></div>
          <div className="wsdStudentLayout">
            <aside className="wsdStudentList">{pupils.map((item,index)=><button key={item.name} className={pupil===index?"active":""} onClick={()=>setPupil(index)}><strong>{item.name}</strong><small>{item.year}</small><span>{item.status}</span></button>)}</aside>
            <article className="wsdCard wsdStudentProfile"><div className="wsdProfileHead"><div className="wsdAvatar">{currentPupil.name[0]}</div><div><h3>{currentPupil.name}</h3><p>{currentPupil.year} · Fictional pupil</p></div><span>{currentPupil.status}</span></div><div className="wsdProfileGrid"><div><small>What staff should know</small><strong>{currentPupil.summary}</strong></div><div><small>What works in class</small><strong>{currentPupil.support}</strong></div><div><small>Current intervention</small><strong>{currentPupil.intervention}</strong></div><div><small>Next review</small><strong>{pupil===1?"Friday 9 October":"Within 14 days"}</strong></div></div><div className="wsdMiniTabs"><button>Overview</button><button>Support plan</button><button>Interventions</button><button>EAL & reading</button><button>Timeline</button></div></article>
          </div>
          <div className="wsdThreeCol"><article className="wsdCard"><span className="eyebrow">INTERVENTION</span><h3>Baseline → review → impact</h3><p>Review evidence suggests secure progress. Continue the current strategy and review again in two weeks.</p></article><article className="wsdCard"><span className="eyebrow">REGULATION</span><h3>Check-ins</h3><p>4 successful returns to learning this week. No safeguarding narrative is stored in this general support view.</p></article><article className="wsdCard"><span className="eyebrow">EAL</span><h3>Language profile</h3><p>Reading B · Writing B · Speaking C · Listening C. Teacher-confirmed best-fit remains the professional judgement.</p></article></div>
        </>}

        {area==="cpd"&&<>
          <div className="wsdPageHead"><div><span className="eyebrow">PROFESSIONAL DEVELOPMENT</span><h2>From course completion to classroom impact</h2><p>Staff can complete CPD, set goals, collect evidence, use coaching and connect learning to appraisal.</p></div></div>
          <div className="wsdStats"><Stat label="Assigned CPD" value="4" note="2 in progress"/><Stat label="This year" value="9.5 hrs" note="Recorded learning"/><Stat label="Goals" value="2" note="1 on track"/><Stat label="Certificates" value="6" note="Verified completions"/></div>
          <div className="wsdCourseList"><article className="wsdCard"><div className="wsdCourseHead"><div><span className="eyebrow">IN PROGRESS</span><h3>Adaptive Teaching</h3></div><strong>72%</strong></div><Progress value={72}/><p>Next: worked example and classroom implementation challenge.</p><button>Continue course</button></article><article className="wsdCard"><div className="wsdCourseHead"><div><span className="eyebrow">ASSIGNED</span><h3>Safeguarding Refresher</h3></div><strong>40%</strong></div><Progress value={40}/><p>Mandatory refresher · estimated 12 minutes remaining.</p><button>Resume</button></article><article className="wsdCard"><div className="wsdCourseHead"><div><span className="eyebrow">COACHING</span><h3>Questioning for deeper thinking</h3></div><strong>On track</strong></div><Progress value={65}/><p>Goal, evidence and coaching notes are connected to one development cycle.</p><button>Open coaching cycle</button></article></div>
        </>}

        {area==="school"&&<>
          <div className="wsdPageHead"><div><span className="eyebrow">WHOLE-SCHOOL OPERATIONS</span><h2>Everyday school workflows</h2><p>Staff can find information without jumping between unrelated systems.</p></div></div>
          <div className="wsdFeatureGrid">
            {[['School calendar','Meetings, deadlines, trips, CPD and personal reminders.'],['Notices centre','Targeted notices with acknowledgement where needed.'],['Forms & approvals','Submit requests and see exactly where they are in the process.'],['Trips & visits','Plan visits, approvals and supporting documentation.'],['Policy centre','Current policy version, review date and staff-facing summary.'],['Staff directory','Find colleagues by department, role and expertise.'],['School improvement','Track priorities, owners, milestones and evidence.'],['Staff voice','Capture ideas, barriers and anonymous suggestions.']].map(([title,text])=><article className="wsdCard" key={title}><h3>{title}</h3><p>{text}</p><button>Open demo</button></article>)}
          </div>
        </>}

        {area==="timetable"&&<>
          <div className="wsdPageHead"><div><span className="eyebrow">WHOLE-SCHOOL TIMETABLE</span><h2>Try different school sizes</h2><p>The real Timetable Maker now includes fictional staffing demos from 18 to 120 staff, including realistic part-time working patterns.</p></div></div>
          <div className="wsdSizeGrid">{timetableSizes.map((item,index)=><button key={item.label} className={timetableSize===index?"active":""} onClick={()=>setTimetableSize(index)}><strong>{item.label}</strong><span>{item.staff} staff</span><small>{item.pupils} pupils</small></button>)}</div>
          <div className="wsdTwoCol">
            <article className="wsdCard"><span className="eyebrow">SELECTED DEMO</span><h3>Oakfield Academy · {timetableSizes[timetableSize].label}</h3><div className="wsdProfileGrid"><div><small>Teaching staff</small><strong>{timetableSizes[timetableSize].staff}</strong></div><div><small>School size</small><strong>{timetableSizes[timetableSize].pupils}</strong></div><div><small>Working patterns</small><strong>Full time + 2/3/4-day staff</strong></div><div><small>Checks</small><strong>Availability, workload and clashes</strong></div></div><p>Use the logged-in timetable builder to generate, review, optimise, visually edit and publish staff allocations into personal planners.</p></article>
            <article className="wsdCard"><span className="eyebrow">SAMPLE DAY</span><h3>Monday timetable</h3><div className="wsdTimeline"><div><b>P1</b><span>7A English · E1</span></div><div><b>P2</b><span>10S1 Physics · Lab 1</span></div><div><b>P3</b><span>8A Maths · M1</span></div><div><b>P4</b><span>12P Physics · Lab 2</span></div><div><b>P5</b><span>7A Science · Lab 1</span></div><div><b>P6</b><span>Cover & daily changes</span></div></div></article>
          </div>
        </>}

        {area==="reports"&&<>
          <div className="wsdPageHead"><div><span className="eyebrow">LEADERSHIP INTELLIGENCE</span><h2>See patterns without ranking individual staff</h2><p>Whole-school reporting focuses on completion, capacity, actions, support and impact rather than simplistic staff league tables.</p></div></div>
          <div className="wsdStats"><Stat label="CPD completion" value="91%" note="Mandatory learning"/><Stat label="Interventions reviewed" value="84%" note="Within agreed window"/><Stat label="SIP milestones" value="76%" note="On track"/><Stat label="Approvals" value="5" note="Awaiting decision"/></div>
          <div className="wsdTwoCol"><article className="wsdCard"><h3>CPD completion by department</h3>{[['Science',94],['English',88],['Mathematics',96],['Humanities',84],['Support',91]].map(([name,value])=><div className="wsdBarRow" key={String(name)}><span>{name}</span><Progress value={Number(value)}/><b>{value}%</b></div>)}</article><article className="wsdCard"><h3>Priority actions</h3><div className="wsdActionList"><div><span>High</span><strong>3 safeguarding refreshers overdue</strong></div><div><span>Due</span><strong>2 intervention reviews this week</strong></div><div><span>Watch</span><strong>Science improvement milestone due 16 Oct</strong></div><div><span>Ready</span><strong>Autumn CPD impact review available</strong></div></div></article></div>
        </>}

        {area==="admin"&&<>
          <div className="wsdPageHead"><div><span className="eyebrow">SCHOOL ADMINISTRATION</span><h2>Set up once, manage centrally</h2><p>Accounts, roles, onboarding, integrations and launch checks stay separate from day-to-day teaching tools.</p></div></div>
          <div className="wsdStats"><Stat label="Staff accounts" value="78" note="74 active"/><Stat label="Google sign-in" value="Ready" note="Connected"/><Stat label="Launch readiness" value="86%" note="3 checks remaining"/><Stat label="Role reviews" value="4" note="Due this month"/></div>
          <div className="wsdFeatureGrid">{[['Staff access','Invite staff and apply role-based access.'],['School onboarding','Configure the organisation and launch checklist.'],['Google integrations','Connect sign-in and supported Workspace workflows.'],['Compliance','Track required learning without exposing unrelated staff data.'],['Notification centre','Target operational alerts to the right staff groups.'],['Platform health','See setup, access and integration readiness.']].map(([title,text])=><article className="wsdCard" key={title}><h3>{title}</h3><p>{text}</p><button>View example</button></article>)}</div>
        </>}
      </section>
    </div>

    <section className="wsdClosing">
      <div><span className="eyebrow">READY FOR A REAL SCHOOL SETUP?</span><h2>The demo stays fictional. Your live school gets its own secure workspace.</h2><p>Use the procurement information to review the platform, then create a school account when you are ready to start setup.</p></div>
      <div><Link className="secondary" href="/auth">Staff sign in</Link><Link className="primary" href="/procurement">View purchase information</Link></div>
    </section>
  </main>;
}
