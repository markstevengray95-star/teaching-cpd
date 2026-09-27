import type { Course, Module } from "./data";

function journeyItems(course: Course) {
  const objectives = course.objectives.slice(0, 5);
  const labels = ["Understand", "Notice", "Practise", "Apply", "Review"];
  return objectives.map((objective, index) => ({
    heading: labels[index] || `Focus ${index + 1}`,
    text: objective,
    icon: String(index + 1),
  }));
}

const transferCycle: Module = {
  id: "__template__",
  type: "visual",
  title: "From CPD to classroom impact",
  layout: "cycle",
  caption: "Professional learning becomes more useful when staff deliberately test a small change, gather evidence and revisit the decision.",
  items: [
    { heading: "Choose", text: "Select one high-value idea connected to a real need in your context.", icon: "1" },
    { heading: "Plan", text: "Define what the change will look like and the evidence you will notice.", icon: "2" },
    { heading: "Try", text: "Use the approach consistently enough to learn from it.", icon: "3" },
    { heading: "Notice", text: "Gather manageable evidence from pupil responses, work or professional observation.", icon: "4" },
    { heading: "Adapt", text: "Keep, refine, fade or stop the approach according to the evidence.", icon: "5" },
    { heading: "Revisit", text: "Return later to check whether the improvement has become secure and sustainable.", icon: "6" },
  ],
};

export function addCourseVisualDepth(course: Course): Course {
  const visualCount = course.modules.filter(module => module.type === "visual").length;
  const additions: Module[] = [];

  if (visualCount < 2) {
    additions.push({
      id: `visual-journey-${course.id}`,
      type: "visual",
      title: `${course.title}: learning journey`,
      layout: "timeline",
      caption: "Use this animated map to connect the course objectives before working through the detailed content.",
      items: journeyItems(course),
    });
  }

  if (course.duration >= 55 && visualCount + additions.length < 3) {
    additions.push({ ...transferCycle, id: `visual-transfer-${course.id}` });
  }

  if (!additions.length) return course;
  const insertionPoint = Math.min(3, course.modules.length);
  return {
    ...course,
    modules: [
      ...course.modules.slice(0, insertionPoint),
      ...additions,
      ...course.modules.slice(insertionPoint),
    ],
  };
}
