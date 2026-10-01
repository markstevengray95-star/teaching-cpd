"use client";

import { useId, useState } from "react";
import { categoryOrder, courses, type Course } from "@/lib/catalogue";
import { defaultDiscoveryFilters, discoverCourses, learningNeeds, learningStatus } from "@/lib/courseDiscovery";
import { pathwayRoles, type LearningProgress } from "@/lib/coursePathways";
import { shortCourseParents } from "@/lib/shortCourses";
import CoursePathways from "./CoursePathways";

export default function CourseDiscovery({ progress, search, setSearch, category, setCategory, openCourse }: {progress:LearningProgress;search:string;setSearch:(s:string)=>void;category:string;setCategory:(s:string)=>void;openCourse:(c:Course)=>void}) {
  const id=useId(), [settings,setSettings]=useState(defaultDiscoveryFilters), [showPathways,setShowPathways]=useState(false);
  const filters={...settings,search,category}, found=discoverCourses(courses,filters,progress);
  const active=Object.entries(filters).filter(([key,value])=>key!=="sort" && value!==defaultDiscoveryFilters[key as keyof typeof filters]);
  function clear() {setSearch("");setCategory("All");setSettings(defaultDiscoveryFilters);}
  const pick=(key:keyof typeof settings,value:string)=>setSettings(current=>({...current,[key]:value}));
  return <div className="courseDiscovery">
    <section className="pageTitle"><div><span className="eyebrow">COURSE LIBRARY</span><h1>Find the learning you need.</h1><p>Start with a practical need, choose a course that fits your time, or follow a connected pathway.</p></div><button type="button" className="secondary" aria-expanded={showPathways} aria-controls={id+"-pathways"} onClick={()=>setShowPathways(v=>!v)}>{showPathways?"Hide learning pathways":"Explore 8 learning pathways"}</button></section>
    <div className="discoverySearch"><label htmlFor={id+"-search"}>Search titles, topics and learning goals</label><input id={id+"-search"} className="search" type="search" placeholder="Try questioning, anxiety, health and safety, TA…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="discoveryFilters">
      <label>Learning need<select value={settings.need} onChange={e=>pick("need",e.target.value)}><option value="All">Any learning need</option>{learningNeeds.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
      <label>Suitable for<select value={settings.role} onChange={e=>pick("role",e.target.value)}><option value="All">All roles</option>{pathwayRoles.map(r=><option key={r}>{r}</option>)}</select></label>
      <label>Time available<select value={settings.maxMinutes} onChange={e=>pick("maxMinutes",e.target.value)}><option value="All">Any duration</option>{[20,45,60,75,90].map(n=><option key={n} value={n}>Up to {n} minutes</option>)}</select></label>
      <label>Course type<select value={settings.kind} onChange={e=>pick("kind",e.target.value)}><option value="All">All courses</option><option value="short">Short refreshers · 15–20 min</option><option value="core">Core courses · 45–90 min</option></select></label>
    </div>
    <details className="discoveryExtraFilters"><summary>More filters and sorting{[category,settings.level,settings.status].filter(value=>value!=="All").length>0?" · active":""}</summary><div className="discoveryFilters">
      <label>Topic area<select value={category} onChange={e=>setCategory(e.target.value)}><option value="All">All topic areas</option>{categoryOrder.map(cat=><option key={cat}>{cat}</option>)}</select></label>
      <label>Course level<select value={settings.level} onChange={e=>pick("level",e.target.value)}><option value="All">Any level</option>{["Foundation","Developing","Advanced"].map(level=><option key={level}>{level}</option>)}</select></label>
      <label>My progress<select value={settings.status} onChange={e=>pick("status",e.target.value)}><option value="All">Any progress</option><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>
      <label>Sort courses<select value={settings.sort} onChange={e=>pick("sort",e.target.value)}><option value="suggested">Continue first, then short primers</option><option value="shortest">Shortest first</option><option value="title">Title A–Z</option></select></label>
    </div></details>
    <div className="discoveryMeta"><p role="status" aria-live="polite"><strong>{found.length} of {courses.length} courses</strong>{active.length? " · "+active.length+" active filters":""}</p><button type="button" className="textButton" onClick={clear}>Clear all filters</button></div>
    <p className="discoveryHint">Times are guided pacing estimates. Optional extended practice adds time. Role labels describe the intended audience, not authorisation to perform specialist duties.</p>
    <div id={id+"-pathways"} hidden={!showPathways}>{showPathways && <CoursePathways progress={progress} openCourse={openCourse}/>}</div>
    {found.length ? <div className="cardGrid">{found.map(course=>{
      const status=learningStatus(course,progress), parent=courses.find(c=>c.id===shortCourseParents[course.id]);
      const count=course.modules.filter(m=>progress[course.id]?.completedModules.includes(m.id)).length;
      const percent=status==="completed"?100:Math.round(count/course.modules.length*100);
      return <button type="button" className="courseCard discoveryCard" key={course.id} onClick={()=>openCourse(course)}><div className="courseCardTop"><span>{course.category}</span><span className="courseLevel">{course.level}</span></div><h2>{course.title}</h2><p>{course.summary}</p><div className="discoveryOutcome"><span>What you will work on</span><p>{course.objectives[0]}</p></div>{parent && <p className="discoveryParent">Short refresher linked to {parent.title}</p>}<div className="courseCardFoot"><span>{course.duration} min · {parent?"Short refresher":"Core course"}</span><span>{status==="completed"?"Completed":status==="in-progress"?percent+"% complete":"Not started"}</span></div><span className="textButton">{status==="in-progress"?"Continue course":status==="completed"?"Revisit course":"Explore course"} →</span></button>;
    })}</div> : <div className="discoveryEmpty" role="status"><h2>No courses match this combination.</h2><p>Try a broader search, allow more time, or clear the role, level or progress filters. Your current filters have not been changed.</p><button type="button" className="primary" onClick={clear}>Show all courses</button></div>}
  </div>;
}
