import type { Course, Module } from "./data";

export type LearningSection = { id: string; title: string; purpose: string; start: number; end: number };
export function courseSections(course: Course): LearningSection[] {
  if (course.id.startsWith("short-")) return [
    { id: "short-learn", title: "Understand", purpose: "Read and retrieve one focused idea", start: 0, end: 2 },
    { id: "short-rehearse", title: "Rehearse", purpose: "Choose and practise a response", start: 2, end: 4 },
    { id: "short-apply", title: "Apply", purpose: "Check your plan and commit to practice", start: 4, end: course.modules.length },
  ];
  const labels = [
    ["Start here", "Orientate and check your starting point"],
    ["Understand", "Read, connect and challenge the idea"],
    ["Rehearse", "Explore a model and try it yourself"],
    ["Decide", "Use evidence to choose a response"],
    ["Apply", "Build a practical next step and review it"],
  ];
  const starts = [0, ...course.modules.flatMap((module, index) =>
    /^overhaul1-cycle-.+-[1-4]$/.test(module.id) ? [index] : [])];
  return starts.map((start, index) => ({ id: `section-${index}`, title: labels[index]?.[0] || "Continue",
    purpose: labels[index]?.[1] || "Connect the learning to your practice", start,
    end: starts[index + 1] ?? course.modules.length }));
}

export const moduleLabels: Record<Module["type"], string> = {
  content: "Read", visual: "Explore", quiz: "Check", scenario: "Decide",
  activity: "Practise", checklist: "Apply", reflection: "Reflect",
};

// Preserve every word while turning unbroken source text into readable paragraphs.
export function readingParagraphs(text: string): string[] {
  if (/\n\s*\n/.test(text)) return text.split(/\n\s*\n/).filter(value => value.trim());
  const sentences = text.split(/(?<=[.!?])\s+/);
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 3) paragraphs.push(sentences.slice(index, index + 3).join(" ").trim());
  return paragraphs;
}

type Lens = { situation: string; explanation: string; review: string; evidence: [string, string, string]; sequence: [string, string, string, string] };
const lenses: Record<Course["category"], Lens> = {
  "Teaching & Learning": {
    situation: "Imagine a class that completes a task quietly, yet gives very different explanations when asked why the method works. Completion tells you something about participation, but it does not settle what pupils understand. Before adding another teaching strategy, look closely at the response you hoped to see. A well-chosen example, question or explanation makes the pupil's thinking visible and gives you a reason for your next teaching move.",
    explanation: "The important step is the connection between the principle and the task. A technique can look impressive while missing the difficulty that pupils actually face. Rehearse a small change, predict the responses it should produce, and check those responses. If the support helps pupils start but leaves them unable to explain independently, the next move may be to change or fade the support rather than add more of it.",
    review: "Treat an improvement as a reason to investigate, not proof that every part of the approach worked. Compare the evidence with the intended learning and ask what else could explain the change. A finished worksheet, a confident volunteer and a quiet room answer different questions. Choose one check close to the learning goal, then decide what would make you keep, adapt or stop the routine.",
    evidence: ["Six of the ten sampled answers explain the method correctly.", "The class was quiet, so everyone must understand.", "Three pupils used the model independently on the next task."],
    sequence: ["Identify the intended learning and the specific difficulty.", "Elicit responses that reveal pupil thinking.", "Choose a small teaching adjustment linked to that evidence.", "Check the learning again and adapt the next step."],
  },
  SEND: {
    situation: "Imagine a pupil who can explain an idea aloud but cannot begin the written task. That contrast is useful information: the difficulty may sit in the task's demands rather than the learning goal itself. Consider the language, sequence, environment and available support before choosing an adaptation. The question is what this pupil needs in this situation, not which strategy usually accompanies a label.",
    explanation: "A useful adaptation has a clear job. It may make instructions easier to follow, make a routine more predictable or help a pupil organise a first response. That does not mean removing all challenge or doing the thinking for the pupil. Rehearse the support and ask what the pupil will still need to do independently. A colleague should be able to explain both why the support is present and how its usefulness will be reviewed.",
    review: "Review access and independence together. A pupil beginning sooner may be an encouraging sign, but the support may still need changing if the pupil waits for an adult at every later step. Use pupil feedback, the agreed plan and observations of the actual task to decide what to keep or adapt. Describe the barrier and the response carefully so that temporary support does not become a permanent assumption about the pupil.",
    evidence: ["The pupil began after the instructions were shown in three steps.", "The pupil avoided writing because they are lazy.", "The pupil completed the second example without an adult prompt."],
    sequence: ["Identify the barrier in the task and consult the agreed support plan.", "Choose an adaptation that preserves the learning goal.", "Rehearse how the support will be used without taking over.", "Review access and independence, then keep, adapt or fade the support."],
  },
  Leadership: {
    situation: "Imagine a team that agrees with a new routine but uses it inconsistently a fortnight later. It is tempting to read this as a motivation problem. First ask whether the expectation was clear, staff could rehearse it, and time or resources were available. A useful leadership conversation separates the intended outcome from the conditions needed to achieve it, making the next action specific enough to support rather than merely monitor.",
    explanation: "Turn a broad ambition into an observable routine. Staff need to know what to do, why it matters and where professional adaptation is appropriate. A worked example can make that expectation easier to discuss, but copying the example is not the same as understanding the purpose. Ask colleagues to explain their reasoning, identify a likely barrier and rehearse the response before expecting it to become normal practice.",
    review: "Look at implementation and outcomes without treating either as the whole story. Attendance at training shows participation; it does not show what changed afterwards. An improved outcome may have several explanations. Use a small sample of relevant work, observations and staff feedback to understand what happened. Agree the next adjustment and review point together, avoiding a judgement based on a single score or isolated observation.",
    evidence: ["Four of six sampled plans include the agreed review point.", "The team does not care because implementation varies.", "Two colleagues reported that the template duplicated an existing task."],
    sequence: ["Clarify the intended outcome and the current barrier.", "Agree an observable routine and the support needed.", "Model and rehearse the routine with the team.", "Review implementation and outcomes before deciding the next adjustment."],
  },
  Wellbeing: {
    situation: "Imagine staff repeatedly finishing the same administrative task in several different systems. A wellbeing initiative might offer a useful pause, but it would leave the duplication in place. Start by describing the work and where the pressure arises. A practical improvement may involve a clearer priority, fewer repeated steps or a change in how work is allocated. Discussion can use a fictional or team-level example without requiring personal disclosure.",
    explanation: "A manageable change needs an owner, a boundary and a reason. Removing one task may help one role while quietly shifting the burden to another. Before agreeing the change, trace who will do the work and what can realistically stop. Rehearse the conversation that explains the new arrangement, including what staff should do when demands conflict. The aim is a routine people can sustain, rather than another activity to fit into a busy week.",
    review: "Ask whether the underlying pressure changed. A popular session or a completed survey is not enough to answer that question. Look at the repeated work, clarity of priorities and feedback from the roles affected. Agree a modest review point and be ready to change the plan if work has merely moved elsewhere. Useful professional reflection can stay focused on the system and the next action rather than on private experiences.",
    evidence: ["The team entered the same data into three systems this week.", "Staff would cope if they were more resilient.", "The revised process removed one weekly reporting step."],
    sequence: ["Describe the repeated demand and whose work it affects.", "Choose one workload or clarity change with a clear owner.", "Check that the change does not shift the burden elsewhere.", "Review whether the underlying pressure actually reduced."],
  },
  "Digital Teaching": {
    situation: "Imagine a digital tool that produces a polished resource in seconds. The appearance of the output says little about whether it fits the learning goal, is accurate or is accessible to the intended learners. Start with the task you need to improve. Then check the output and decide what still needs a person's judgement. A useful tool earns its place by helping with a specific problem, rather than by being new or impressive.",
    explanation: "Rehearse the whole routine, including what happens when the tool is wrong or unavailable. A good demonstration can hide the checks that make the process reliable. Explain how an output will be reviewed, how learners will access it and what information should be kept out of the example. Use fictional data for practice. The resulting resource still needs to be checked against the teaching purpose and your setting's agreed procedures.",
    review: "Compare the benefit with the extra work and risks introduced by the routine. Faster drafting is useful only if checking and correcting the output do not erase the gain. Look at the quality of the final work, access for learners and the time spent across the whole process. Decide what evidence would justify keeping the tool, changing its role or using a simpler alternative.",
    evidence: ["Two statements in the generated resource contradicted the source notes.", "The output looks professional, so it must be accurate.", "The teacher checked and corrected the resource before using it."],
    sequence: ["Define the teaching problem before selecting a tool.", "Test it with fictional or permitted information.", "Check accuracy, accessibility and fit with the learning goal.", "Review the whole routine and decide whether the benefit justifies it."],
  },
  Safeguarding: {
    situation: "Imagine receiving information that leaves you uncertain about what it means. The uncertainty is part of the professional problem; it is not a reason to invent an explanation or conduct your own investigation. Keep observed facts, what was said and your interpretation distinct. Use the reporting route in your current school policy and seek the appropriate safeguarding guidance. A practice example helps you rehearse that boundary, but it cannot replace the local procedure.",
    explanation: "The quality of a response depends on staying within the staff member's role. Listening, recording and reporting are different from trying to establish a complete account yourself. In a fictional practice case, rehearse how you would describe the information clearly and how you would find the correct next step in the school's policy. Do not place real pupil details in a training response. Where the case leaves uncertainty, identify the guidance you would need rather than filling the gap with assumptions.",
    review: "Review the clarity of the record and whether the response followed the agreed procedure. A training task does not determine what should happen in a live case. Use current school policy and the relevant safeguarding lead's guidance to resolve questions about responsibilities and reporting. The useful learning is recognising the boundary between evidence and inference, then knowing where to take a concern rather than attempting to prove or dismiss it yourself.",
    evidence: ["The fictional pupil said, 'I do not feel safe going home.'", "The pupil is exaggerating to avoid trouble.", "The record notes the pupil's words and when they were said."],
    sequence: ["Identify the information available without inventing missing facts.", "Distinguish observed or reported information from interpretation.", "Locate the reporting route in the current school policy.", "Follow that procedure and seek safeguarding guidance where unsure."],
  },
};

export type ReadingExtension = { title: string; paragraphs: string[]; prompt: string; kind: "evidence" | "sequence" | "decision"; evidence: Lens["evidence"]; sequence: Lens["sequence"]; scenario?: Extract<Module, { type: "scenario" }> };
export function slideReadingExtension(course: Course, module: Module): ReadingExtension | null {
  const anchors = ["connections", "application", "evidence"];
  const slot = anchors.findIndex(anchor => module.id === `depth-2026-${course.id}-${anchor}`);
  if (slot < 0) return null;
  const lens = lenses[course.category];
  const subjectContent = course.modules.filter((item): item is Extract<Module, { type: "content" }> =>
    item.type === "content" && !/^(quality-|depth-2026-|overhaul2-reading-)/.test(item.id));
  const subject = subjectContent[Math.min(slot, subjectContent.length - 1)];
  // Reuse whole paragraphs from the course's own subject explanation; no generated
  // factual claims or external authority are added to the teaching content.
  const excerpt = subject ? readingParagraphs(subject.body)[0] : course.summary;
  const scenario = course.modules.find((item): item is Extract<Module, { type: "scenario" }> => item.type === "scenario" && !item.id.startsWith("phase4-practice-"))
    || course.modules.find((item): item is Extract<Module, { type: "scenario" }> => item.type === "scenario");
  return {
    title: ["Read the situation", "Connect the idea to a response", "Read the evidence, then review"][slot],
    paragraphs: [`In ${course.title}, the professional task is to ${course.objectives[slot % course.objectives.length]?.replace(/[.!?]$/, "").replace(/^./, letter => letter.toLowerCase()) || "connect the learning to practice"}. ${excerpt}`,
      [lens.situation, lens.explanation, lens.review][slot]],
    prompt: ["Which detail would you check before choosing a response?", "What makes a response fit this problem rather than merely sound sensible?", "What would make you change your mind about the response?"][slot],
    kind: (["evidence", "sequence", "decision"] as const)[slot], evidence: lens.evidence, sequence: lens.sequence, scenario,
  };
}

