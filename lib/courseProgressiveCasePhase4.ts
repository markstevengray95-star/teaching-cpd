import type { Course, Module } from "./data";

const PREFIX = "overhaul4-case-";
export const PRESENTATION_OVERHAUL_PHASE4_VERSION = "2026.5";
export const PHASE4_CASE_STEPS = ["brief", "decision", "evidence", "rehearse", "model", "retry", "transfer"] as const;
export type Phase4CaseStep = (typeof PHASE4_CASE_STEPS)[number];
export type Phase4CaseNumber = 1 | 2;

type ActivityModule = Extract<Module, { type: "activity" }>;

export type Phase4RoleLens = {
  id: string;
  label: string;
  context: string;
  transfer: string;
};

export type Phase4Choice = {
  id: string;
  label: string;
  strongest: boolean;
  feedback: string;
};

export type Phase4ProgressiveCasePack = {
  caseNumber: Phase4CaseNumber;
  title: string;
  subtitle: string;
  situation: string;
  roles: Phase4RoleLens[];
  firstDecisionPrompt: string;
  firstDecisionOptions: Phase4Choice[];
  newEvidence: string[];
  evidencePrompt: string;
  evidenceOptions: Phase4Choice[];
  rehearsalPrompt: string;
  modelResponse: string;
  modelCriteria: string[];
  retryPrompt: string;
  transferPrompt: string;
  transferOptions: Phase4Choice[];
};

export type Phase4ProgressiveCaseModulePack = Phase4ProgressiveCasePack & {
  moduleId: string;
  step: Phase4CaseStep;
};

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function short(value: string, limit = 150) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1).trim()}…`;
}

function roleLenses(course: Course): Phase4RoleLens[] {
  const recommended = course.recommendedFor.filter(role => role && role !== "All staff");
  const primary = recommended[0] || "Staff member";
  const second = recommended[1] || (course.category === "Leadership" ? "Department Lead" : course.category === "SEND" ? "Teaching Assistant" : course.category === "Safeguarding" ? "Pastoral staff" : "Colleague");
  const third = course.category === "Leadership" ? "Senior Leader" : course.category === "Wellbeing" ? "Team Leader" : course.category === "Digital Teaching" ? "CPD Lead" : "Department Lead";
  return [
    { id: "primary", label: primary, context: `Respond from the perspective of a ${primary.toLowerCase()} who has direct responsibility for the immediate professional decision.`, transfer: `Adapt the response so it is realistic for a ${primary.toLowerCase()} to sustain in normal practice.` },
    { id: "partner", label: second, context: `Respond as a ${second.toLowerCase()} supporting the same situation without taking over somebody else's professional responsibility.`, transfer: `Decide what support, clarification or follow-up a ${second.toLowerCase()} should provide.` },
    { id: "leader", label: third, context: `Respond as a ${third.toLowerCase()} who needs to improve the conditions around the practice, not simply judge the person involved.`, transfer: `Translate the learning into a team routine a ${third.toLowerCase()} could support and review.` },
  ];
}

function categoryCase(course: Course, caseNumber: Phase4CaseNumber): Omit<Phase4ProgressiveCasePack, "caseNumber" | "roles"> {
  const objective = short(course.objectives[Math.min(caseNumber - 1, course.objectives.length - 1)] || course.objectives[0] || course.summary, 125);

  if (course.category === "Safeguarding") {
    if (caseNumber === 1) return {
      title: "Progressive case 1 · concern, uncertainty and the correct boundary",
      subtitle: "The information is incomplete. Your job is to respond safely without turning professional curiosity into investigation.",
      situation: "A pupil's presentation and behaviour have changed over several days. During a routine conversation they share a small piece of information that could be relevant to safeguarding, but it is incomplete and ambiguous.",
      firstDecisionPrompt: "What is the strongest immediate professional response?",
      firstDecisionOptions: [
        { id: "a", label: "Listen calmly, avoid leading questions, record factual information and follow the school's current safeguarding route.", strongest: true, feedback: "This keeps the response within the member of staff's role and preserves a clear reporting route." },
        { id: "b", label: "Ask increasingly detailed questions until you are confident that the concern is genuine.", strongest: false, feedback: "Staff should not investigate. Leading or repeated questioning can blur evidence and move beyond the appropriate role." },
        { id: "c", label: "Wait until there is clearer evidence because the pupil did not make a direct allegation.", strongest: false, feedback: "A concern does not need to be proven before it is shared through the school's safeguarding process." },
      ],
      newEvidence: ["The pupil later gives a slightly different detail.", "A colleague has separately noticed a change but cannot explain it.", "There is still no complete account of what may have happened."],
      evidencePrompt: "How should the new information change your response?",
      evidenceOptions: [
        { id: "a", label: "Add the new factual information to the safeguarding record and update the DSL through the agreed route.", strongest: true, feedback: "New information should refine the record and be passed through the correct safeguarding process." },
        { id: "b", label: "Resolve the differences yourself before passing anything on.", strongest: false, feedback: "Resolving inconsistencies is not the classroom member of staff's investigative responsibility." },
        { id: "c", label: "Treat the differing detail as evidence that the concern is unreliable.", strongest: false, feedback: "Variation in an account does not allow a staff member to dismiss a concern independently." },
      ],
      rehearsalPrompt: "Write the exact short response you would give the pupil and the factual note you would make immediately afterwards. Do not include real pupil information.",
      modelResponse: "Thank you for telling me. I am listening. I cannot promise to keep this just between us because I may need to share it with the safeguarding staff who can help. I would record what was actually said or observed, distinguish fact from interpretation, note the time/context, and use the school's current reporting route promptly.",
      modelCriteria: ["Does not promise secrecy", "Avoids investigation or leading questions", "Separates fact from interpretation", "Uses the school's current DSL/reporting route"],
      retryPrompt: "Rewrite your response after studying the model. Make it shorter, clearer and more professionally bounded than your first attempt.",
      transferPrompt: "The same concern now appears during a busy transition rather than a planned conversation. What transfers?",
      transferOptions: [
        { id: "a", label: "Protect the same listen-record-report principles while adapting the timing and immediate practical arrangements safely.", strongest: true, feedback: "The context can change while the safeguarding boundary remains stable." },
        { id: "b", label: "Delay any response until there is a quiet formal meeting because the context is inconvenient.", strongest: false, feedback: "Practical arrangements can adapt, but the duty to respond and report should not be ignored." },
        { id: "c", label: "Use a generic AI tool to decide whether the information meets a safeguarding threshold.", strongest: false, feedback: "Safeguarding decisions must remain with the school's current procedure and designated safeguarding staff." },
      ],
    };
    return {
      title: "Progressive case 2 · implementation after a safeguarding refresher",
      subtitle: "The training was completed, but staff responses remain inconsistent. Decide how to improve the system without reducing safeguarding to compliance theatre.",
      situation: "A safeguarding refresher has been completed across the school. Later checks show that staff can recall key messages, but some are still unsure which reporting route to use in less obvious situations.",
      firstDecisionPrompt: "What should a leader do first?",
      firstDecisionOptions: [
        { id: "a", label: "Clarify the reporting route with realistic examples, check access to the current policy and rehearse ambiguous cases.", strongest: true, feedback: "This addresses the implementation barrier directly rather than assuming the training message simply needs repeating." },
        { id: "b", label: "Publish names of staff who hesitated so others take the training more seriously.", strongest: false, feedback: "Ranking staff does not resolve ambiguity and can distort honest professional learning." },
        { id: "c", label: "Add another generic quiz without checking what is causing the uncertainty.", strongest: false, feedback: "More assessment is not automatically the right response to an implementation problem." },
      ],
      newEvidence: ["Most uncertainty concerns low-level or ambiguous information rather than obvious disclosures.", "Staff know who the DSL is.", "Several staff say they worry about 'overreacting'."],
      evidencePrompt: "Which response now best fits the evidence?",
      evidenceOptions: [
        { id: "a", label: "Use short ambiguous scenarios to rehearse when and how to pass concerns on, reinforcing that staff report rather than prove.", strongest: true, feedback: "The evidence points to professional threshold uncertainty, so rehearsal is a closer intervention." },
        { id: "b", label: "Re-teach only the DSL's name and contact details.", strongest: false, feedback: "Those facts are already secure; they do not address the identified barrier." },
        { id: "c", label: "Tell staff to trust their instinct and avoid written guidance.", strongest: false, feedback: "Professional judgement should remain anchored to current policy and the agreed reporting route." },
      ],
      rehearsalPrompt: "Draft a two-minute facilitator explanation for staff who worry that reporting an ambiguous concern means making an accusation.",
      modelResponse: "Reporting a concern is not the same as deciding what happened. Your role is to notice, record and share relevant information through the school's agreed route. The DSL can consider the wider picture and decide the appropriate next step. Factual reporting supports professional curiosity without asking staff to investigate or prove a case.",
      modelCriteria: ["Separates reporting from accusation", "Reinforces the staff/DSL role boundary", "Uses calm non-alarmist language", "Anchors the message to current school procedure"],
      retryPrompt: "Rewrite the explanation so it could be used confidently in a live staff briefing and is precise enough to prevent the original misconception.",
      transferPrompt: "How should leaders know whether the refresher changed practice?",
      transferOptions: [
        { id: "a", label: "Review anonymised implementation patterns, staff confidence and correct use of the reporting route without ranking individuals.", strongest: true, feedback: "This checks implementation while protecting a developmental culture." },
        { id: "b", label: "Use course completion alone as proof that safeguarding practice is secure.", strongest: false, feedback: "Completion shows exposure to training, not necessarily confident implementation." },
        { id: "c", label: "Wait for a serious incident before checking whether the route works.", strongest: false, feedback: "Implementation should be reviewed before failure creates the evidence." },
      ],
    };
  }

  if (course.category === "SEND") {
    if (caseNumber === 1) return {
      title: "Progressive case 1 · preserve ambition while removing a barrier",
      subtitle: "A pupil is not accessing the task. Decide what to adapt without making the label the plan.",
      situation: `A pupil is struggling to begin an upcoming task linked to this objective: “${objective}”. They can discuss some of the underlying ideas but become stuck when several task demands are combined at once.`,
      firstDecisionPrompt: "What is the strongest first adaptation?",
      firstDecisionOptions: [
        { id: "a", label: "Identify the specific task barrier, keep the learning goal and add the smallest scaffold that improves access.", strongest: true, feedback: "This responds to the task rather than assuming the diagnostic label tells you the solution." },
        { id: "b", label: "Replace the learning goal with an easier one permanently.", strongest: false, feedback: "This may reduce ambition before testing whether access can be improved another way." },
        { id: "c", label: "Add every support available so the pupil cannot get stuck.", strongest: false, feedback: "Over-support can remove the thinking and independence the task is intended to develop." },
      ],
      newEvidence: ["The pupil can explain the first step verbally.", "A visible sequence reduces hesitation.", "When an adult stays beside them throughout, they complete the work but wait for prompts."],
      evidencePrompt: "What should you do with this mixed evidence?",
      evidenceOptions: [
        { id: "a", label: "Keep the visible sequence, reduce continuous prompting and review whether independence increases.", strongest: true, feedback: "This keeps the support that targets the barrier while testing whether dependence can be reduced." },
        { id: "b", label: "Keep the adult beside the pupil for every similar task because completion improved.", strongest: false, feedback: "Completion alone may conceal growing dependence on prompts." },
        { id: "c", label: "Remove all support immediately because the pupil completed the task once.", strongest: false, feedback: "Fading should be responsive rather than abrupt or based on a single success." },
      ],
      rehearsalPrompt: "Write the instructions/scaffold you would give the pupil for the next attempt. Make the learning demand visible without doing the thinking for them.",
      modelResponse: "Goal: complete the same core task. Step 1: identify what the question is asking. Step 2: choose the relevant information. Step 3: make the first response using the worked example only as a structure. Step 4: hide the example and complete the next part independently. Checkpoint: explain why you chose that step before asking for adult help.",
      modelCriteria: ["Keeps the original learning goal", "Targets a specific barrier", "Makes steps visible", "Includes a route to fading support"],
      retryPrompt: "Rewrite your scaffold after comparing it with the model. Remove any unnecessary support and make the route to independence clearer.",
      transferPrompt: "The same pupil succeeds with the scaffold in one subject but not another. What should transfer?",
      transferOptions: [
        { id: "a", label: "Transfer the barrier-solving principle, then adapt the scaffold to the new task demands rather than copying it unchanged.", strongest: true, feedback: "The principle transfers; the surface support may need to change." },
        { id: "b", label: "Use exactly the same scaffold because consistency means identical support.", strongest: false, feedback: "Consistency of purpose does not require identical task support." },
        { id: "c", label: "Conclude that the support was ineffective because it did not generalise automatically.", strongest: false, feedback: "Different tasks can create different barriers even for the same pupil." },
      ],
    };
    return {
      title: "Progressive case 2 · team consistency without blanket strategies",
      subtitle: "A support appears successful, and the team is tempted to turn it into a universal rule.",
      situation: "A department has seen a useful adaptation improve access for several pupils. Staff now want to add it to every lesson plan for every pupil with a similar diagnostic label.",
      firstDecisionPrompt: "What is the strongest leadership response?",
      firstDecisionOptions: [
        { id: "a", label: "Define the barrier the adaptation solves, identify when it is useful and retain room for individual plans and task-specific decisions.", strongest: true, feedback: "This helps the team scale a principle without turning a useful strategy into a stereotype." },
        { id: "b", label: "Require the adaptation for every pupil with that label because consistency matters most.", strongest: false, feedback: "Labels do not determine identical barriers or identical support needs." },
        { id: "c", label: "Avoid any common approach because SEND support must always be completely individual.", strongest: false, feedback: "Shared inclusive routines can be valuable when they are linked to real barriers and reviewed." },
      ],
      newEvidence: ["Some pupils use the support independently.", "Others ignore it because it does not match the task barrier.", "A small group rely on it even when it is no longer necessary."],
      evidencePrompt: "What does the evidence suggest the team should improve?",
      evidenceOptions: [
        { id: "a", label: "Teach staff to decide when the support is needed, how to review it and when to fade or replace it.", strongest: true, feedback: "The implementation problem is now professional decision-making, not availability of the resource." },
        { id: "b", label: "Increase the number of copies of the same resource.", strongest: false, feedback: "Availability does not solve poor matching or over-reliance." },
        { id: "c", label: "Stop the strategy entirely because it was not equally useful for everyone.", strongest: false, feedback: "Mixed impact calls for more precise use, not necessarily abandonment." },
      ],
      rehearsalPrompt: "Draft a short department guidance note explaining when to use, review and fade the adaptation.",
      modelResponse: "Use the adaptation when the task creates the barrier it is designed to reduce. Check whether it improves access to the same ambitious goal. Review whether the pupil is becoming more independent rather than simply more compliant. Fade, alter or replace the support when the barrier changes, the pupil no longer needs it, or the support begins to create dependence.",
      modelCriteria: ["Starts with the barrier", "Maintains ambitious goals", "Includes evidence of independence", "Defines when to fade/adapt/stop"],
      retryPrompt: "Rewrite the guidance so a colleague could use it as a practical decision tool rather than a general statement of intent.",
      transferPrompt: "How should the department evaluate the guidance after a half term?",
      transferOptions: [
        { id: "a", label: "Review examples of task access and independence, staff decision-making and pupil feedback rather than counting resource use alone.", strongest: true, feedback: "This keeps the evaluation close to the purpose of the adaptation." },
        { id: "b", label: "Measure success by the percentage of lessons displaying the resource.", strongest: false, feedback: "Visibility or frequency does not show whether the support solved the right barrier." },
        { id: "c", label: "Ask only whether staff liked the resource.", strongest: false, feedback: "Acceptability matters, but it is not enough to judge pupil access or independence." },
      ],
    };
  }

  if (course.category === "Leadership") {
    if (caseNumber === 1) return {
      title: "Progressive case 1 · implementation is inconsistent",
      subtitle: "The visible problem looks like compliance. The deeper problem may be clarity, capability, capacity or support.",
      situation: `A team has agreed a new routine related to “${objective}”. Several weeks later implementation varies significantly between staff and meetings are beginning to focus on who is or is not following it.`,
      firstDecisionPrompt: "What should the leader do first?",
      firstDecisionOptions: [
        { id: "a", label: "Re-establish the intended routine, gather barriers and check whether staff have the clarity, capability and capacity to enact it.", strongest: true, feedback: "This diagnoses implementation conditions before turning monitoring into judgement." },
        { id: "b", label: "Increase monitoring immediately and publish individual compliance percentages.", strongest: false, feedback: "More monitoring cannot repair unclear expectations or missing implementation support." },
        { id: "c", label: "Add another improvement priority so momentum is not lost.", strongest: false, feedback: "Additional change can increase overload before the original routine is secure." },
      ],
      newEvidence: ["Staff describe the routine differently.", "A key resource is difficult to access during busy periods.", "Two experienced colleagues have developed a simpler version that appears workable."],
      evidencePrompt: "What should change in the implementation plan?",
      evidenceOptions: [
        { id: "a", label: "Clarify the non-negotiable principle, simplify the routine, remove the access barrier and test the workable adaptation.", strongest: true, feedback: "This uses the evidence to improve implementation rather than merely intensify pressure." },
        { id: "b", label: "Prohibit all adaptations so everybody does exactly the original version.", strongest: false, feedback: "The surface routine may be adaptable if the core purpose is protected." },
        { id: "c", label: "Treat the variation as proof that staff lack commitment.", strongest: false, feedback: "The evidence points to system and clarity issues that need addressing first." },
      ],
      rehearsalPrompt: "Draft the next five-minute team conversation: acknowledge the problem, clarify the core routine, invite barrier evidence and set one testable next step.",
      modelResponse: "We are not yet implementing this consistently, so we need to understand why before adding more monitoring. The non-negotiable purpose is [state the principle]. The routine should make that easier, not become the goal itself. Here is the simplest agreed version. What is making this difficult in practice? We will remove the access issue, test the simplified version for two weeks, and review implementation evidence together.",
      modelCriteria: ["States purpose before monitoring", "Names the implementation problem without blaming", "Invites barrier evidence", "Sets one manageable test and review point"],
      retryPrompt: "Rewrite your conversation after studying the model. Make it clearer, shorter and less likely to sound like covert performance management.",
      transferPrompt: "The routine becomes secure. What should the leader do next?",
      transferOptions: [
        { id: "a", label: "Reduce unnecessary monitoring, keep proportionate review points and redirect support to the next identified development need.", strongest: true, feedback: "Secure routines should become sustainable rather than permanently intensifying oversight." },
        { id: "b", label: "Keep increasing monitoring because more data is always better.", strongest: false, feedback: "Monitoring should remain proportionate to the implementation need." },
        { id: "c", label: "Immediately replace the routine with a new initiative.", strongest: false, feedback: "Successful implementation needs time to become normal practice." },
      ],
    };
    return {
      title: "Progressive case 2 · feedback, challenge and professional trust",
      subtitle: "A colleague disagrees with an improvement decision. Practise a conversation that combines clarity, evidence and genuine professional dialogue.",
      situation: "A respected colleague challenges a department approach in a meeting. Their concern is specific and evidence-based, but the disagreement is beginning to be interpreted by others as resistance.",
      firstDecisionPrompt: "What is the strongest response from the leader?",
      firstDecisionOptions: [
        { id: "a", label: "Separate challenge from non-compliance, explore the evidence and clarify which parts of the approach are principle versus adaptable routine.", strongest: true, feedback: "Professional challenge can improve implementation when leaders distinguish the purpose from the current method." },
        { id: "b", label: "Close the discussion because public disagreement undermines leadership authority.", strongest: false, feedback: "Suppressing evidence-based challenge can hide implementation problems and reduce trust." },
        { id: "c", label: "Abandon the approach immediately to show that staff voice is valued.", strongest: false, feedback: "Listening to challenge does not require abandoning a potentially useful principle without review." },
      ],
      newEvidence: ["The colleague's concern applies mainly to one context.", "Most staff can implement the routine as intended.", "The current guidance does not explain where adaptation is acceptable."],
      evidencePrompt: "What is the most proportionate response now?",
      evidenceOptions: [
        { id: "a", label: "Clarify the adaptable boundary, test the colleague's proposed adaptation in the relevant context and compare evidence.", strongest: true, feedback: "This preserves coherence while using challenge to refine the implementation." },
        { id: "b", label: "Create separate rules for every individual member of staff.", strongest: false, feedback: "Unlimited variation can make the core purpose unclear and difficult to sustain." },
        { id: "c", label: "Ignore the concern because most staff are managing.", strongest: false, feedback: "A context-specific barrier can still be important even when overall implementation is strong." },
      ],
      rehearsalPrompt: "Draft how you would respond to the colleague in the meeting while protecting both clarity and professional dignity.",
      modelResponse: "That is a useful challenge. I want to separate the core purpose from the exact routine we are currently using. The purpose remains important, but your evidence suggests this version may create a problem in that context. Let's define what cannot be lost, test the adaptation you are proposing, and agree what evidence would tell us whether it is stronger.",
      modelCriteria: ["Acknowledges challenge without defensiveness", "Protects the core purpose", "Uses evidence rather than status", "Creates a bounded test rather than unlimited variation"],
      retryPrompt: "Rewrite your response so it sounds natural enough to use live and makes the next professional step explicit.",
      transferPrompt: "What team routine would reduce similar conflict in future?",
      transferOptions: [
        { id: "a", label: "Make the core principle, adaptable elements and evidence-review process explicit whenever a new routine is introduced.", strongest: true, feedback: "Clear adaptation boundaries make professional challenge easier to use constructively." },
        { id: "b", label: "Ask staff to raise concerns only after implementation is complete.", strongest: false, feedback: "Useful implementation evidence often appears while practice is still developing." },
        { id: "c", label: "Avoid discussing evidence in meetings because disagreement takes too long.", strongest: false, feedback: "Removing professional reasoning can produce superficial agreement rather than stronger implementation." },
      ],
    };
  }

  if (course.category === "Wellbeing") {
    if (caseNumber === 1) return {
      title: "Progressive case 1 · a workload problem disguised as resilience",
      subtitle: "The obvious response is an individual wellbeing intervention. The evidence points towards a system problem.",
      situation: "Staff describe a recurring task as stressful and time-consuming. An initial suggestion is to provide resilience resources and time-management tips.",
      firstDecisionPrompt: "What should happen before choosing the intervention?",
      firstDecisionOptions: [
        { id: "a", label: "Map the workflow, identify duplication and clarify which part of the task creates avoidable workload.", strongest: true, feedback: "This diagnoses the system condition before asking individuals to cope with it better." },
        { id: "b", label: "Schedule a resilience workshop immediately because stress has been reported.", strongest: false, feedback: "An individual intervention may miss a workload-generating system problem." },
        { id: "c", label: "Assume the task is acceptable because some staff complete it quickly.", strongest: false, feedback: "Variation in coping does not show that the process itself is efficient or equitable." },
      ],
      newEvidence: ["The same information is entered into two systems.", "One deadline creates a predictable monthly spike.", "Removing one duplicated step would not reduce the intended outcome."],
      evidencePrompt: "What is the strongest next move?",
      evidenceOptions: [
        { id: "a", label: "Remove the duplicate step, adjust the deadline pattern and measure whether time demand falls without reducing quality.", strongest: true, feedback: "This acts directly on the identified workload causes and includes an impact check." },
        { id: "b", label: "Keep the system unchanged and add optional wellbeing materials.", strongest: false, feedback: "This does not address the evidence about the process itself." },
        { id: "c", label: "Ask staff to work faster using a standard time-management method.", strongest: false, feedback: "The duplicated task remains duplicated regardless of individual efficiency." },
      ],
      rehearsalPrompt: "Draft the message you would give staff explaining the change without implying that wellbeing is now 'fixed'.",
      modelResponse: "You identified that this process was creating avoidable duplication. We are removing the second entry step and adjusting the deadline so the work is distributed more realistically. We will check whether this reduces time demand without weakening the intended outcome. This is one system change, not a claim that it resolves every wellbeing issue.",
      modelCriteria: ["Names the system cause", "Explains the concrete change", "Includes an impact check", "Avoids overclaiming"],
      retryPrompt: "Rewrite the message so it is concise, credible and clear about what has changed and what remains uncertain.",
      transferPrompt: "How should the school decide whether to keep the change?",
      transferOptions: [
        { id: "a", label: "Compare workload/time evidence and outcome quality after an agreed review period, including whether work shifted elsewhere.", strongest: true, feedback: "This checks both benefit and unintended redistribution of workload." },
        { id: "b", label: "Keep it permanently if the announcement receives positive feedback.", strongest: false, feedback: "Initial approval does not establish sustained workload impact." },
        { id: "c", label: "Judge success only by whether fewer staff complain.", strongest: false, feedback: "Complaint frequency is an incomplete proxy for workload or wellbeing." },
      ],
    };
    return {
      title: "Progressive case 2 · support without forced disclosure",
      subtitle: "A team wants to discuss wellbeing openly. Build a psychologically safer route that does not require personal disclosure.",
      situation: "A department meeting includes a wellbeing discussion. The planned activity asks every member of staff to describe a current personal pressure to the whole group.",
      firstDecisionPrompt: "What is the strongest adjustment?",
      firstDecisionOptions: [
        { id: "a", label: "Allow hypothetical/team-level examples and private reflection so participation does not depend on personal disclosure.", strongest: true, feedback: "This keeps the professional learning goal while respecting boundaries around personal information." },
        { id: "b", label: "Keep compulsory disclosure because openness only works when everybody participates equally.", strongest: false, feedback: "Equal participation does not require equal personal disclosure." },
        { id: "c", label: "Remove the topic entirely because wellbeing can never be discussed at work.", strongest: false, feedback: "Wellbeing can be discussed professionally without requiring private disclosure." },
      ],
      newEvidence: ["Some staff want practical workload discussion.", "Others prefer not to discuss personal circumstances.", "The team shares one recurring process concern."],
      evidencePrompt: "How should the session develop?",
      evidenceOptions: [
        { id: "a", label: "Move the group towards the shared process concern and use optional/private routes for personal reflection.", strongest: true, feedback: "This creates a useful team action without forcing personal material into the room." },
        { id: "b", label: "Ask the reluctant staff to explain why they do not want to share.", strongest: false, feedback: "That simply creates another form of pressured disclosure." },
        { id: "c", label: "Treat silence as evidence that those staff are coping well.", strongest: false, feedback: "Non-disclosure does not reveal someone's wellbeing state." },
      ],
      rehearsalPrompt: "Rewrite the facilitator instructions for the activity so staff can participate safely and still reach a useful team action.",
      modelResponse: "Choose either a hypothetical example, a team-level pattern or a personal example you are comfortable sharing. You do not need to disclose private circumstances. Identify one work factor that could be made clearer, simpler or more sustainable. We will look for patterns we can act on collectively and keep personal support routes separate.",
      modelCriteria: ["Makes disclosure optional", "Keeps a meaningful professional task", "Separates team action from personal support", "Avoids assumptions about silence"],
      retryPrompt: "Rewrite the instructions so they are short enough to use on a slide and still protect the same boundaries.",
      transferPrompt: "What should leaders do with the resulting themes?",
      transferOptions: [
        { id: "a", label: "Aggregate themes, choose a manageable system action and review impact without attributing comments to individuals.", strongest: true, feedback: "This turns discussion into improvement while respecting privacy." },
        { id: "b", label: "Create a list showing which staff reported the most pressures.", strongest: false, feedback: "Ranking individual disclosure is not a useful or safe wellbeing measure." },
        { id: "c", label: "Store all personal examples as evidence for appraisal.", strongest: false, feedback: "Wellbeing discussion should not become involuntary performance evidence." },
      ],
    };
  }

  if (course.category === "Digital Teaching") {
    if (caseNumber === 1) return {
      title: "Progressive case 1 · technology solves the wrong problem",
      subtitle: "A digital tool looks efficient and engaging. Decide whether it is actually improving the intended outcome.",
      situation: `A team wants to adopt a new digital tool to support “${objective}”. A short trial gets positive staff and pupil reactions and produces attractive outputs quickly.`,
      firstDecisionPrompt: "What should happen before wider adoption?",
      firstDecisionOptions: [
        { id: "a", label: "Define the intended outcome, check privacy/accessibility and compare evidence from the tool with a suitable alternative.", strongest: true, feedback: "This evaluates the tool against purpose rather than novelty alone." },
        { id: "b", label: "Adopt it because engagement and speed show that learning has improved.", strongest: false, feedback: "Engagement and speed are observations, not proof of the intended educational outcome." },
        { id: "c", label: "Upload real sensitive pupil data so the trial becomes more realistic.", strongest: false, feedback: "Sensitive information should not be exposed simply to increase realism." },
      ],
      newEvidence: ["Outputs are fast but occasionally inaccurate.", "One accessibility feature does not work well on older devices.", "Staff report significant time savings for a repetitive low-value task."],
      evidencePrompt: "What is the strongest next step?",
      evidenceOptions: [
        { id: "a", label: "Use it only for the low-risk task with human verification, fix the accessibility route and keep sensitive data out of the workflow.", strongest: true, feedback: "This narrows use to the evidence-supported benefit while protecting accuracy and access." },
        { id: "b", label: "Expand use to high-stakes decisions because staff already trust the interface.", strongest: false, feedback: "Interface confidence does not remove accuracy, privacy or accountability risks." },
        { id: "c", label: "Reject all digital tools because one accessibility feature was imperfect.", strongest: false, feedback: "A limitation should be addressed proportionately rather than generalised to every use." },
      ],
      rehearsalPrompt: "Draft the staff guidance for using the tool safely in the approved low-risk workflow.",
      modelResponse: "Use the tool only for the agreed low-risk task. Do not enter sensitive or identifiable pupil information. Treat generated outputs as drafts: verify important claims before use. Provide the non-digital/accessibility alternative where needed. Staff remain responsible for the final professional decision and output.",
      modelCriteria: ["Defines the approved purpose", "Protects sensitive data", "Requires verification", "Retains human accountability and an accessible alternative"],
      retryPrompt: "Rewrite your guidance so it is practical enough to sit beside the tool and specific enough to prevent unsafe expansion of use.",
      transferPrompt: "A colleague proposes using the same tool for a higher-stakes task. What should transfer?",
      transferOptions: [
        { id: "a", label: "Re-run the purpose, privacy, accuracy, accessibility and accountability checks for the new use rather than assuming approval transfers.", strongest: true, feedback: "A safe low-risk use does not automatically validate a higher-stakes one." },
        { id: "b", label: "Allow it because the tool is already approved somewhere in the school.", strongest: false, feedback: "Approval should relate to the use case and risk, not the product name alone." },
        { id: "c", label: "Let the tool make the final professional judgement if it is faster.", strongest: false, feedback: "Human accountability should remain where professional judgement is required." },
      ],
    };
    return {
      title: "Progressive case 2 · AI output looks convincing but is wrong",
      subtitle: "Practise verification, correction and transparent professional use when a plausible output contains an important error.",
      situation: "A generated resource looks polished and saves substantial preparation time. During review, one factual statement is found to be wrong and another example is poorly matched to the intended learners.",
      firstDecisionPrompt: "What is the strongest response?",
      firstDecisionOptions: [
        { id: "a", label: "Correct the errors, verify the remaining important claims, adapt the example and treat the incident as evidence for stronger checking guidance.", strongest: true, feedback: "This keeps useful efficiency while strengthening the human verification process." },
        { id: "b", label: "Use it anyway because most of the content is correct.", strongest: false, feedback: "A polished output does not reduce responsibility for important factual or educational errors." },
        { id: "c", label: "Ban all generative AI use immediately.", strongest: false, feedback: "One failure may justify stronger controls without proving that every low-risk use is inappropriate." },
      ],
      newEvidence: ["The error would have been noticed by a simple source check.", "The mismatch came from a vague prompt.", "Another colleague independently catches a different minor issue."],
      evidencePrompt: "What system improvement is most justified?",
      evidenceOptions: [
        { id: "a", label: "Add a short verification checklist and improve prompt/context guidance for the approved workflow.", strongest: true, feedback: "The evidence identifies a repeatable quality-control weakness that can be improved." },
        { id: "b", label: "Require staff to trust outputs only when they look professional.", strongest: false, feedback: "Surface polish is not a reliability check." },
        { id: "c", label: "Assume experienced staff do not need verification guidance.", strongest: false, feedback: "Plausible errors can affect experienced users too." },
      ],
      rehearsalPrompt: "Write the verification checklist you would place beside the AI workflow.",
      modelResponse: "Before use: remove sensitive data; state the audience and purpose clearly. After generation: verify important factual claims against a reliable source; check examples against the intended learners/context; inspect for bias or missing perspectives where relevant; edit rather than copy blindly; retain professional responsibility for the final version.",
      modelCriteria: ["Checks privacy before generation", "Verifies factual claims", "Checks educational/context fit", "Keeps staff accountable for the final output"],
      retryPrompt: "Rewrite the checklist into a short version staff could realistically use every time without turning it into a burdensome form.",
      transferPrompt: "How should leaders review whether the AI workflow is genuinely useful?",
      transferOptions: [
        { id: "a", label: "Compare time saved, error/verification patterns, accessibility and output quality for the defined workflow.", strongest: true, feedback: "This evaluates the promised benefit alongside the risks and quality requirements." },
        { id: "b", label: "Count how many prompts staff submit each month.", strongest: false, feedback: "Usage volume does not show whether the workflow improves quality or workload." },
        { id: "c", label: "Use positive staff comments as the only impact measure.", strongest: false, feedback: "Acceptability matters but cannot substitute for accuracy, quality and workload evidence." },
      ],
    };
  }

  // Teaching & Learning default.
  if (caseNumber === 1) return {
    title: "Progressive case 1 · the technique is visible but the learning problem is not",
    subtitle: "A familiar strategy appears to be working. Use pupil evidence to decide what should happen next.",
    situation: `A teacher introduces a routine linked to “${objective}”. Pupils are participating and the lesson looks smooth, but the teacher has not yet checked whether the intended learning has improved.`,
    firstDecisionPrompt: "What is the strongest next move?",
    firstDecisionOptions: [
      { id: "a", label: "Use a whole-class check that reveals pupil thinking, then adapt the next teaching move to the response pattern.", strongest: true, feedback: "This reconnects the visible technique to the learning problem and evidence." },
      { id: "b", label: "Keep the routine unchanged because high participation proves it is successful.", strongest: false, feedback: "Participation can be useful, but it does not automatically demonstrate understanding." },
      { id: "c", label: "Replace the routine immediately with a different fashionable strategy.", strongest: false, feedback: "Changing techniques without diagnosing the learning problem simply creates more surface variation." },
    ],
    newEvidence: ["Most pupils choose the correct answer to a check.", "A sizeable minority choose the same distractor.", "When asked to explain, several correct answers are based on weak reasoning."],
    evidencePrompt: "What does the evidence suggest?",
    evidenceOptions: [
      { id: "a", label: "The class needs a targeted response to the shared misconception and an explanation check, not just more of the same routine.", strongest: true, feedback: "The pattern gives a specific teaching problem to act on." },
      { id: "b", label: "The lesson is secure because the majority answered correctly.", strongest: false, feedback: "The repeated distractor and weak explanations show important understanding is still insecure." },
      { id: "c", label: "The routine failed completely and should never be used again.", strongest: false, feedback: "The routine generated useful evidence; the issue is how the teacher responds to it." },
    ],
    rehearsalPrompt: "Write the next 60–90 seconds of teacher talk and questioning you would use to address the misconception without simply giving the answer away.",
    modelResponse: "I can see one response appearing repeatedly, so let's test the reasoning behind it. First, explain to your partner why option B might look convincing. Now compare B with C: what single piece of evidence separates them? I will take three explanations, not just answers. Then we will retry the original question with one feature changed.",
    modelCriteria: ["Uses the actual response pattern", "Makes pupil reasoning visible", "Avoids immediately giving the answer", "Builds in a retry/check"],
    retryPrompt: "Rewrite your teacher response after studying the model. Make the diagnosis, prompt and retry more precise than in your first attempt.",
    transferPrompt: "The same misconception appears in a different class with lower confidence. What should transfer?",
    transferOptions: [
      { id: "a", label: "Keep the diagnosis-and-check principle but adapt response routines, wait time and scaffolding to the new class.", strongest: true, feedback: "The underlying reasoning transfers while the surface delivery adapts." },
      { id: "b", label: "Use exactly the same wording and timings because consistency means identical teaching.", strongest: false, feedback: "Consistency of purpose does not require identical surface delivery." },
      { id: "c", label: "Avoid checking explanations because lower confidence pupils may find it uncomfortable.", strongest: false, feedback: "Participation structures can adapt without removing the need to make thinking visible." },
    ],
  };

  return {
    title: "Progressive case 2 · a promising strategy does not transfer cleanly",
    subtitle: "A technique that worked in one class is copied elsewhere. Decide what needs adapting and what should remain stable.",
    situation: "A teacher copies a successful routine from a colleague. In the new class, participation falls and the task produces less useful evidence even though the routine is being followed accurately.",
    firstDecisionPrompt: "What should the teacher do first?",
    firstDecisionOptions: [
      { id: "a", label: "Return to the learning problem and underlying principle, then identify which contextual feature made the copied routine less accessible or informative.", strongest: true, feedback: "This separates the principle from the surface routine and creates a reasoned adaptation." },
      { id: "b", label: "Keep repeating the routine until pupils become used to it.", strongest: false, feedback: "Familiarity may help, but repetition without diagnosis does not explain why the evidence quality fell." },
      { id: "c", label: "Conclude that the original colleague's strategy was overrated.", strongest: false, feedback: "Failure to transfer unchanged does not invalidate the underlying principle." },
    ],
    newEvidence: ["The new class has less secure prerequisite knowledge.", "Several pupils need more processing time before public response.", "The original class had practised the response routine for several weeks."],
    evidencePrompt: "Which adaptation is most justified?",
    evidenceOptions: [
      { id: "a", label: "Strengthen prerequisite retrieval, add private thinking/rehearsal time and explicitly teach the response routine before judging it again.", strongest: true, feedback: "Each change responds directly to the contextual evidence while preserving the original principle." },
      { id: "b", label: "Lower the learning goal so responses are easier to obtain.", strongest: false, feedback: "The evidence points to access/prerequisite issues rather than a need to reduce ambition." },
      { id: "c", label: "Increase the pace to create more opportunities to practise.", strongest: false, feedback: "Less processing time is unlikely to address the identified barriers." },
    ],
    rehearsalPrompt: "Draft how you would explain and teach the adapted routine to the class before using it for the next learning check.",
    modelResponse: "We are going to use this routine to help everyone make their thinking visible. You will first think silently, then jot one reason, then rehearse it with a partner before I sample responses. The goal is not speed. I am looking for the reasoning that helps us decide what to teach next. We will practise the routine once with a low-stakes example before using it for today's key idea.",
    modelCriteria: ["Explains the purpose to pupils", "Teaches rather than assumes the routine", "Builds processing/rehearsal time", "Keeps the ambitious learning goal"],
    retryPrompt: "Rewrite your explanation so it is concise enough for live classroom use and explicitly addresses the barriers revealed by the new evidence.",
    transferPrompt: "After two weeks, participation improves but misconceptions are still missed. What should change next?",
    transferOptions: [
      { id: "a", label: "Keep the improved participation routine but redesign the questions/checks so the likely misconceptions are more diagnostic.", strongest: true, feedback: "Different parts of the system can improve at different rates; now the evidence points to task design." },
      { id: "b", label: "Abandon the routine because it has not solved every learning problem.", strongest: false, feedback: "The participation barrier improved; the next issue is the quality of the diagnostic check." },
      { id: "c", label: "Measure success only by how many pupils respond.", strongest: false, feedback: "Participation matters, but the intended outcome includes useful evidence of understanding." },
    ],
  };
}

function moduleId(course: Course, caseNumber: Phase4CaseNumber, step: Phase4CaseStep) {
  return `${PREFIX}${safeId(course.id)}-${caseNumber}-${step}`;
}

function caseModule(course: Course, caseNumber: Phase4CaseNumber, step: Phase4CaseStep): ActivityModule {
  const data = categoryCase(course, caseNumber);
  const titleByStep: Record<Phase4CaseStep, string> = {
    brief: `${data.title} · Case brief`,
    decision: `${data.title} · First decision`,
    evidence: `${data.title} · New evidence`,
    rehearse: `${data.title} · First rehearsal`,
    model: `${data.title} · Study the model`,
    retry: `${data.title} · Improve the second attempt`,
    transfer: `${data.title} · Transfer decision`,
  };
  return {
    id: moduleId(course, caseNumber, step),
    type: "activity",
    title: titleByStep[step],
    prompt: step === "brief" ? data.situation : step === "decision" ? data.firstDecisionPrompt : step === "evidence" ? data.evidencePrompt : step === "rehearse" ? data.rehearsalPrompt : step === "model" ? "Compare your first attempt with the model and identify what needs improving." : step === "retry" ? data.retryPrompt : data.transferPrompt,
    instructions: ["Work through the case in sequence.", "Use the feedback to revise your reasoning rather than simply reveal an answer.", "Keep examples anonymous and do not enter identifiable pupil or staff information."],
    placeholder: step === "rehearse" || step === "retry" ? "Write your professional response here…" : "Complete the interactive case step above.",
    minimumCharacters: step === "rehearse" ? 80 : step === "retry" ? 100 : 20,
  };
}

function insertAfter(modules: Module[], id: string, additions: Module[]) {
  const index = modules.findIndex(module => module.id === id);
  const at = index >= 0 ? index + 1 : Math.max(1, Math.floor(modules.length / 2));
  modules.splice(at, 0, ...additions);
}

export function applyProgressiveCasePhase4(course: Course): Course {
  const id = safeId(course.id);
  const modules = course.modules.filter(module => !module.id.startsWith(`${PREFIX}${id}-`));
  const first = PHASE4_CASE_STEPS.map(step => caseModule(course, 1, step));
  const second = PHASE4_CASE_STEPS.map(step => caseModule(course, 2, step));
  insertAfter(modules, `overhaul2-process-${id}-2`, first);
  insertAfter(modules, `overhaul2-process-${id}-3`, second);
  return { ...course, duration: course.duration + 36, modules };
}

export function isProgressiveCasePhase4Module(module: Module | undefined | null) {
  return Boolean(module?.id.startsWith(PREFIX));
}

export function getProgressiveCasePhase4ModulePack(course: Course, module: Module | undefined | null): Phase4ProgressiveCaseModulePack | null {
  if (!module || !isProgressiveCasePhase4Module(module)) return null;
  const match = module.id.match(/-(1|2)-(brief|decision|evidence|rehearse|model|retry|transfer)$/);
  if (!match) return null;
  const caseNumber = Number(match[1]) as Phase4CaseNumber;
  const step = match[2] as Phase4CaseStep;
  return { ...categoryCase(course, caseNumber), roles: roleLenses(course), caseNumber, step, moduleId: module.id };
}

export function auditProgressiveCasePhase4(course: Course) {
  const modules = course.modules.filter(isProgressiveCasePhase4Module);
  const packs = modules.map(module => getProgressiveCasePhase4ModulePack(course, module)).filter(Boolean) as Phase4ProgressiveCaseModulePack[];
  const case1 = packs.filter(pack => pack.caseNumber === 1);
  const case2 = packs.filter(pack => pack.caseNumber === 2);
  const complete = (items: Phase4ProgressiveCaseModulePack[]) => PHASE4_CASE_STEPS.every(step => items.some(item => item.step === step));
  const decisionPoints = [1, 2].reduce((sum, number) => {
    const data = categoryCase(course, number as Phase4CaseNumber);
    return sum + data.firstDecisionOptions.length + data.evidenceOptions.length + data.transferOptions.length;
  }, 0);
  const modelCriteria = [1, 2].reduce((sum, number) => sum + categoryCase(course, number as Phase4CaseNumber).modelCriteria.length, 0);
  return {
    courseId: course.id,
    title: course.title,
    caseArcs: [case1.length ? 1 : 0, case2.length ? 1 : 0].reduce((a, b) => a + b, 0),
    modules: modules.length,
    case1Complete: complete(case1),
    case2Complete: complete(case2),
    decisionPoints,
    modelCriteria,
    roleLenses: roleLenses(course).length,
    requiredSecondAttempts: packs.filter(pack => pack.step === "retry").length,
  };
}

export function validateProgressiveCasePhase4(course: Course) {
  const audit = auditProgressiveCasePhase4(course);
  if (audit.caseArcs !== 2 || !audit.case1Complete || !audit.case2Complete) throw new Error(`CPD course ${course.id} needs two complete Phase 4 progressive case arcs`);
  if (audit.modules !== PHASE4_CASE_STEPS.length * 2) throw new Error(`CPD course ${course.id} needs ${PHASE4_CASE_STEPS.length * 2} Phase 4 case modules`);
  if (audit.decisionPoints < 18) throw new Error(`CPD course ${course.id} needs at least 18 Phase 4 case decision points`);
  if (audit.modelCriteria < 8) throw new Error(`CPD course ${course.id} needs explicit Phase 4 model-response criteria`);
  if (audit.roleLenses < 3) throw new Error(`CPD course ${course.id} needs three Phase 4 role lenses`);
  if (audit.requiredSecondAttempts !== 2) throw new Error(`CPD course ${course.id} needs a required second attempt in both Phase 4 cases`);
}
