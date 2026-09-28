import type { Course, Module } from "./data";

const specialStoryboards: Record<string, Module[]> = {
  "safeguarding-essentials": [
    {
      id: "visual-special-sg26-five-lenses",
      type: "visual",
      title: "Five lenses for a safeguarding concern",
      layout: "cycle",
      caption: "A single sign rarely explains the whole picture. Staff combine relevant information, avoid unsupported conclusions and use the safeguarding route promptly.",
      items: [
        { heading: "What changed?", text: "Notice relevant changes, patterns, words or observations without diagnosing the cause.", icon: "1" },
        { heading: "What was said?", text: "Listen carefully and preserve relevant words accurately without leading the child.", icon: "2" },
        { heading: "What else is known?", text: "Attendance, online, pastoral or previous information may contribute to the wider authorised picture.", icon: "3" },
        { heading: "What do I record?", text: "Separate observation, the child's words and professional interpretation in the approved system.", icon: "4" },
        { heading: "Who needs it?", text: "Use the school's DSL/deputy, adult-concern or escalation route rather than investigating yourself.", icon: "5" },
      ],
    },
    {
      id: "visual-special-sg26-policy-bridge",
      type: "visual",
      title: "From national guidance to a real school action",
      layout: "flow",
      caption: "The value of safeguarding CPD is being able to move from national expectations to the exact local action without delay.",
      items: [
        { heading: "National expectation", text: "Read the relevant current statutory guidance and understand the all-staff duty.", icon: "1" },
        { heading: "School policy", text: "Know how the setting translates the duty into its current safeguarding procedure.", icon: "2" },
        { heading: "Named people", text: "Know the DSL, deputies and alternative route where the usual contact is unavailable or involved.", icon: "3" },
        { heading: "Approved system", text: "Know where and how to record and report a concern promptly.", icon: "4" },
        { heading: "Escalation", text: "Know what to do if a genuine concern is not being addressed through the normal route.", icon: "5" },
      ],
    },
  ],
  "health-safety-essentials-schools": [
    {
      id: "visual-special-health-safety-loop",
      type: "visual",
      title: "The school safety improvement loop",
      layout: "cycle",
      caption: "Good safety practice is an active system: controls are understood, used, checked and improved when conditions or evidence change.",
      items: [
        { heading: "Understand", text: "Know the policy, role responsibilities and significant controls relevant to the activity.", icon: "1" },
        { heading: "Prepare", text: "Check that people, equipment, environment and supervision match the planned controls.", icon: "2" },
        { heading: "Use", text: "Follow the agreed procedure and role-specific training in practice.", icon: "3" },
        { heading: "Report", text: "Raise hazards, defects, incidents and near misses through the school's route.", icon: "4" },
        { heading: "Review", text: "Update controls or training when evidence or circumstances show the current arrangement is no longer suitable.", icon: "5" },
      ],
    },
  ],
  "allergy-safety-schools-2026": [
    {
      id: "visual-special-allergy-system",
      type: "visual",
      title: "Whole-school allergy safety system",
      layout: "flow",
      caption: "The 2026 statutory approach combines school policy, pupil-specific planning, staff awareness, communication and learning from incidents or near misses.",
      items: [
        { heading: "Policy", text: "Maintain and publish the school's current allergy-safety policy where the statutory duty applies.", icon: "1" },
        { heading: "Know the pupil", text: "Use pupil-specific information and an Individual Healthcare Plan where one is required.", icon: "2" },
        { heading: "Train staff", text: "Give staff the awareness and role-specific training their responsibilities require.", icon: "3" },
        { heading: "Communicate", text: "Share relevant information securely with the people who need it across normal school activities.", icon: "4" },
        { heading: "Learn", text: "Use incidents and near misses to strengthen arrangements rather than treating them as isolated events.", icon: "5" },
      ],
    },
  ],
  "medical-conditions-schools": [
    {
      id: "visual-special-medical-ihp-loop",
      type: "visual",
      title: "Medical support: policy to pupil participation",
      layout: "flow",
      caption: "General CPD supports awareness; individual care and any clinical tasks remain governed by the school's policy, pupil-specific plan and appropriate training.",
      items: [
        { heading: "Policy", text: "Know the school's current medical-conditions arrangements and your role within them.", icon: "1" },
        { heading: "Individual plan", text: "Use the relevant pupil-specific healthcare information where an Individual Healthcare Plan is required.", icon: "2" },
        { heading: "Trained role", text: "Only undertake tasks that fit your training, authorisation and the agreed plan.", icon: "3" },
        { heading: "Participation", text: "Plan support so the pupil can participate safely in learning, trips and wider school life.", icon: "4" },
        { heading: "Review", text: "Report changes, incidents or concerns to the responsible school lead so arrangements remain current.", icon: "5" },
      ],
    },
  ],
  "school-security-emergency-awareness": [
    {
      id: "visual-special-security-plan",
      type: "visual",
      title: "Proportionate school security planning",
      layout: "cycle",
      caption: "Security awareness should help staff understand their local responsibilities without placing sensitive site-specific operational detail into generic training.",
      items: [
        { heading: "Assess", text: "Leaders identify risks relevant to the individual setting using proportionate professional advice.", icon: "1" },
        { heading: "Plan", text: "The school sets clear local policy, responsibilities and communication arrangements.", icon: "2" },
        { heading: "Brief", text: "Staff understand the parts of the plan they need for their role and setting.", icon: "3" },
        { heading: "Practise", text: "Appropriate school exercises and routine checks help confirm that local arrangements are understood.", icon: "4" },
        { heading: "Review", text: "Leaders update arrangements after changes, identified gaps or lessons learned.", icon: "5" },
      ],
    },
  ],
  "ai-in-education": [
    {
      id: "visual-special-ai-safe-use",
      type: "visual",
      title: "AI use: the professional safety gate",
      layout: "flow",
      caption: "AI can assist professional work, but responsibility for educational suitability, safeguarding, privacy and accuracy stays with the user and setting.",
      items: [
        { heading: "Purpose", text: "Start with a clear educational or workload problem rather than the tool itself.", icon: "1" },
        { heading: "Policy", text: "Check the school's approved AI, safeguarding and data-protection arrangements.", icon: "2" },
        { heading: "Minimise", text: "Use only the data needed and keep sensitive pupil information out of unapproved tools.", icon: "3" },
        { heading: "Verify", text: "Check important output for accuracy, suitability, bias and accessibility.", icon: "4" },
        { heading: "Decide", text: "Keep professional judgement and safeguarding decisions with staff rather than delegating them to software.", icon: "5" },
      ],
    },
  ],
};

export function addCourseSpecificVisualStoryboards(course: Course): Course {
  const candidates = specialStoryboards[course.id] || [];
  if (!candidates.length) return course;
  const existing = new Set(course.modules.map(module => module.id));
  const additions = candidates.filter(module => !existing.has(module.id));
  if (!additions.length) return course;

  const modules = [...course.modules];
  additions.forEach((module, index) => {
    const ratio = additions.length === 1 ? 0.5 : index === 0 ? 0.38 : 0.72;
    const position = Math.min(modules.length, Math.max(2, Math.floor(modules.length * ratio)));
    modules.splice(position, 0, module);
  });
  return { ...course, modules };
}
