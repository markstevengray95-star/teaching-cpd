"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { courses } from "@/lib/catalogue";

export default function CourseDeepLinkController(){
  const pathname=usePathname();
  useEffect(()=>{
    if(pathname!=="/")return;
    const params=new URLSearchParams(window.location.search);const courseId=params.get("course");if(!courseId)return;
    const course=courses.find(item=>item.id===courseId);if(!course)return;
    let attempts=0;let opened=false;
    const tryOpen=()=>{
      if(opened)return true;
      const cards=[...document.querySelectorAll<HTMLButtonElement>("button.courseCard,button.courseRow")];
      const target=cards.find(button=>button.textContent?.includes(course.title));
      if(target){opened=true;target.click();const url=new URL(window.location.href);url.searchParams.delete("course");window.history.replaceState({},"",`${url.pathname}${url.search}${url.hash}`);return true;}
      const courseNav=[...document.querySelectorAll<HTMLButtonElement>("button.navButton")].find(button=>button.textContent?.includes("Courses"));
      if(courseNav)courseNav.click();
      return false;
    };
    if(tryOpen())return;
    const timer=window.setInterval(()=>{attempts+=1;if(tryOpen()||attempts>30)window.clearInterval(timer);},150);
    return()=>window.clearInterval(timer);
  },[pathname]);
  return null;
}
