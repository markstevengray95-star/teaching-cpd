import type { Course, Module } from "./data";

const categoryEvidence: Record<Course["category"], string> = {
  "Teaching & Learning": "Look at pupil thinking, responses, work and independence rather than judging the strategy by how busy the lesson felt.",
  Safeguarding: "Check that staff can identify the live policy, people and reporting route and can act promptly without investigating themselves.",
  SEND: "Look for improved access, participation, learning and independence for the individual pupil rather than assuming a support works from its label.",
  Leadership: "Look for clarity, implementation, staff support and sustainable routines rather than simply counting activity or compliance.",
  Wellbeing: "Look for changes in workload, clarity, access to support and sustainable routines rather than treating wellbeing as an individual trait.",
  "Digital Teaching": "Check educational value, accuracy, privacy, safeguarding and whether the tool genuinely improves learning or workload.",
};

function practiceStoryboard(course: Course): Module {
  const objectives = course.objectives.filter(Boolean);
  return {
    id: `visual-storyboard-${course.id}`,
    type: "visual",
    title: `${course.title}: from idea to visible practice`,
    layout: "flow",
    caption: "Use the storyboard to keep the course connected to an observable professional change rather than treating completion as the end point.",
    items: [
      {
        heading: "Understand",
        text: objectives[0] || course.summary,
        icon: "1",
      },
      {
        heading: "Notice",
        text: objectives[1] || "Identify the precise classroom, pupil, team or system need that makes this learning relevant.",
        icon: "2",
      },
      {
        heading: "Try",
        text: objectives[2] || `Turn one principle from ${course.title} into a small action you can use consistently in context.`,
        icon: "3",
      },
      {
        heading: "See evidence",
        text: categoryEvidence[course.category],
        icon: "4",
      },
      {
        heading: "Review",
        text: "Keep, refine, fade, scale or stop the approach according to the evidence, professional judgement and local policy.",
        icon: "5",
      },
    ],
  };
}

function transferComparison(course: Course): Module {
  return {
    id: `visual-transfer-compare-${course.id}`,
    type: "visual",
    title: "Weak transfer vs strong transfer",
    layout: "compare",
    caption: "The same CPD idea can produce very different practice depending on how deliberately it is implemented and reviewed.",
    items: [
      { heading: "Weak: copy a technique", text: `Use ${course.title} as a fixed recipe because it appeared in the course.`, icon: "×" },
      { heading: "Strong: name the problem", text: "Start with a precise need and choose the part of the course that fits it.", icon: "1" },
      { heading: "Weak: assume impact", text: "Decide it worked because the session was completed or the lesson felt smoother.", icon: "×" },
      { heading: "Strong: check evidence", text: categoryEvidence[course.category], icon: "2" },
    ],
  };
}

export function addCourseVisualStoryboards(course: Course): Course {
  const existing = new Set(course.modules.map(module => module.id));
  const additions: Module[] = [];
  const storyboard = practiceStoryboard(course);
  if (!existing.has(storyboard.id)) additions.push(storyboard);
  if (course.duration >= 60) {
    const comparison = transferComparison(course);
    if (!existing.has(comparison.id)) additions.push(comparison);
  }
  if (!additions.length) return course;

  const firstInsert = Math.min(Math.max(2, Math.floor(course.modules.length * 0.28)), course.modules.length);
  const withStoryboard = [
    ...course.modules.slice(0, firstInsert),
    additions[0],
    ...course.modules.slice(firstInsert),
  ];
  if (additions.length === 1) return { ...course, modules: withStoryboard };

  const secondInsert = Math.min(Math.max(firstInsert + 2, Math.floor(withStoryboard.length * 0.68)), withStoryboard.length);
  return {
    ...course,
    modules: [
      ...withStoryboard.slice(0, secondInsert),
      additions[1],
      ...withStoryboard.slice(secondInsert),
    ],
  };
}
