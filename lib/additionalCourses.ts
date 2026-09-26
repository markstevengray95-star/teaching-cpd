import type { Course, Module } from "./data";

const reflection = (id: string, prompt: string): Module => ({ id, type: "reflection", title: "Apply it to your practice", prompt });

export const additionalCourses: Course[] = [
  {
    id: "worked-examples-and-modelling",
    title: "Worked Examples, Modelling & Think-Alouds",
    category: "Teaching & Learning",
    duration: 70,
    level: "Developing",
    summary: "Make expert thinking visible, reduce unnecessary search for novices and fade worked support as pupils become more independent.",
    objectives: [
      "Distinguish modelling from simply showing an answer",
      "Design worked examples around the decisions pupils need to learn",
      "Use think-alouds without overloading pupils",
      "Fade support in response to evidence of growing independence"
    ],
    recommendedFor: ["Teacher", "ECT", "Teaching Assistant"],
    modules: [
      { id: "wem1", type: "content", title: "What effective modelling actually does", body: "Modelling makes the process of successful performance visible. A useful model does more than display a finished product: it draws attention to choices, sequencing, checks and the knowledge being used. For novices, this can reduce unproductive trial-and-error while preserving the thinking pupils will later need to perform independently.", keyPoints: ["Model the process, not only the product", "Name important decisions", "Connect each step to prior knowledge", "Keep attention on the learning goal"] },
      { id: "wem2", type: "quiz", title: "Knowledge check", question: "Which teacher move best illustrates a think-aloud?", options: ["Silently completing the solution", "Explaining the decision being made, why it is appropriate and how it will be checked", "Giving pupils the final answer", "Reading the question twice"], answer: 1, feedback: "A think-aloud exposes the normally hidden decisions and checks an expert makes." },
      { id: "wem3", type: "content", title: "Worked examples and novice learners", body: "When pupils have little prior knowledge, solving a complex problem from scratch can consume working memory in search rather than learning the structure. A worked example can show the route through the problem. It should then be followed by practice that requires pupils to retrieve and use the same reasoning.", keyPoints: ["Use examples before unsupported complex problem solving", "Keep annotations close to the step they explain", "Compare examples when the contrast matters", "Follow examples with active pupil practice"] },
      { id: "wem4", type: "scenario", title: "The disappearing scaffold", prompt: "Pupils can follow a complete worked example but struggle when every step is removed at once. What is the strongest next move?", options: [{ label: "Return permanently to complete examples", feedback: "Permanent full support can prevent independence." }, { label: "Use completion problems with some steps removed, then gradually remove more support", feedback: "Faded examples create a bridge between modelling and independent performance." }, { label: "Give harder independent problems immediately", feedback: "Increasing difficulty does not solve the abrupt loss of support." }] },
      { id: "wem5", type: "content", title: "Model quality matters", body: "A model can fail if it contains too much commentary, irrelevant detail or unexplained expert shortcuts. Decide in advance what pupils should notice. Use concise narration, pause at decision points and make checking routines explicit.", keyPoints: ["Avoid narrating every obvious action", "Pause where choices matter", "Use consistent representations", "Show how errors are noticed and corrected"] },
      { id: "wem6", type: "scenario", title: "Live modelling scenario", prompt: "During a live model, pupils are copying every word but cannot explain why each step is happening. What adjustment is most useful?", options: [{ label: "Speak faster so the model finishes sooner", feedback: "Speed can increase copying without understanding." }, { label: "Pause at decision points, ask pupils to predict the next step and explain the reason before continuing", feedback: "Prediction and explanation turn the model into active processing." }, { label: "Remove all explanation", feedback: "Pupils still need access to the reasoning behind the process." }] },
      { id: "wem7", type: "quiz", title: "Fading support check", question: "What should determine when a scaffold is reduced?", options: ["A fixed number of minutes", "Evidence that pupils can succeed with less support", "The end of the worksheet", "Whether the teacher is tired of modelling"], answer: 1, feedback: "Support should fade responsively as checks show that pupils can carry more of the process themselves." },
      reflection("wem8", "Choose one difficult process you teach. Outline the model you will use, the decisions you will make visible, and one intermediate step between the full model and independent practice.")
    ]
  },
  {
    id: "checking-for-understanding",
    title: "Checking for Understanding: From Guessing to Evidence",
    category: "Teaching & Learning",
    duration: 65,
    level: "Developing",
    summary: "Build reliable checks that reveal what the class understands before you decide to move on, re-model or adapt support.",
    objectives: [
      "Recognise weak proxies for understanding",
      "Design hinge questions around likely misconceptions",
      "Use whole-class response techniques productively",
      "Respond instructionally to the evidence collected"
    ],
    recommendedFor: ["Teacher", "ECT", "Department Lead"],
    modules: [
      { id: "cfu1", type: "content", title: "Understanding is not the same as compliance", body: "Quiet work, nodding and completed notes can all occur without secure understanding. Checking for understanding means deliberately collecting evidence that helps you decide whether pupils are ready for the next step.", keyPoints: ["Do not rely on 'Does everyone understand?'", "Sample the whole class where possible", "Ask questions that expose likely misconceptions", "Use the evidence to change what happens next"] },
      { id: "cfu2", type: "scenario", title: "Hands-up trap", prompt: "Three confident pupils answer every question correctly while the rest of the class stays quiet. What is the strongest interpretation?", options: [{ label: "The class has mastered the material", feedback: "A small volunteer sample cannot establish whole-class understanding." }, { label: "You need a broader sample before deciding whether to move on", feedback: "Whole-class or deliberately distributed responses provide better evidence." }, { label: "The quiet pupils definitely do not understand", feedback: "Silence alone does not reveal what they know either." }] },
      { id: "cfu3", type: "content", title: "Hinge questions", body: "A hinge question sits at an important decision point in a lesson. It should be quick for pupils to answer and quick for the teacher to interpret. Strong distractors correspond to meaningful misconceptions, so the pattern of responses tells you what to do next.", keyPoints: ["Target one important concept", "Build plausible wrong answers from real misconceptions", "Make every pupil commit to a response", "Decide in advance what each response pattern means for teaching"] },
      { id: "cfu4", type: "quiz", title: "Hinge-question check", question: "Which is the most useful feature of a hinge question?", options: ["It takes twenty minutes to complete", "Only one pupil can answer it", "Different wrong answers reveal different misunderstandings", "It is always an essay"], answer: 2, feedback: "Diagnostic distractors make a hinge question useful for immediate instructional decisions." },
      { id: "cfu5", type: "content", title: "Response systems", body: "Mini-whiteboards, response cards, fingers for bounded choices, short digital polls and carefully structured cold call can all broaden the evidence available. The method should fit the question and should not turn checking into public humiliation.", keyPoints: ["Choose a response method that lets you see enough pupils", "Give adequate thinking time", "Normalise mistakes as useful evidence", "Protect psychological safety while maintaining accountability"] },
      { id: "cfu6", type: "scenario", title: "What do you do with the data?", prompt: "A hinge question shows roughly 40% of the class chose the same misconception. What is the best next step?", options: [{ label: "Ignore it and continue because most were correct", feedback: "A large, coherent misconception is useful evidence that should shape instruction." }, { label: "Address the misconception explicitly, re-model or contrast examples, then check again", feedback: "The check becomes valuable when it changes the next teaching move." }, { label: "Give those pupils a lower learning objective", feedback: "A misconception does not automatically justify reducing the intended learning." }] },
      { id: "cfu7", type: "quiz", title: "Evidence quality check", question: "Which gives the weakest evidence of understanding?", options: ["Every pupil answers a diagnostic multiple-choice question", "Pupils explain why an example is incorrect", "The teacher asks 'all okay?' and several pupils nod", "Pupils complete one similar problem independently"], answer: 2, feedback: "General self-report and nodding are weak evidence compared with an observable response to the content." },
      reflection("cfu8", "Design one hinge question for an upcoming lesson. Write the correct answer, two or three plausible misconceptions, the response method you will use, and what you will do if a misconception dominates.")
    ]
  },
  {
    id: "effective-explanations",
    title: "Clear Explanations & Classroom Communication",
    category: "Teaching & Learning",
    duration: 60,
    level: "Foundation",
    summary: "Plan concise explanations that connect to prior knowledge, foreground essential ideas and use examples and representations deliberately.",
    objectives: [
      "Identify the essential idea an explanation must communicate",
      "Connect new information to relevant prior knowledge",
      "Use examples and representations without creating split attention",
      "Check whether the explanation produced the intended understanding"
    ],
    recommendedFor: ["Teacher", "ECT", "Teaching Assistant"],
    modules: [
      { id: "ex1", type: "content", title: "Explanation is designed, not improvised", body: "A strong explanation has a clear destination. Decide what pupils should understand, what prior knowledge it depends on, which example will make the idea visible and which details can be postponed. More words do not automatically produce more clarity.", keyPoints: ["Start from the learning idea", "Activate only relevant prior knowledge", "Remove interesting but distracting detail", "Plan a check immediately after the explanation"] },
      { id: "ex2", type: "quiz", title: "Knowledge check", question: "Which change is most likely to improve a complex explanation for novices?", options: ["Add more unrelated examples", "Break it into meaningful chunks and check understanding between them", "Use more technical language without defining it", "Explain continuously for longer"], answer: 1, feedback: "Chunking and checking allow pupils to process the structure before additional unfamiliar material is introduced." },
      { id: "ex3", type: "content", title: "Examples and non-examples", body: "Examples show what a concept looks like; carefully chosen non-examples help define its boundaries. Comparing cases can make the critical features easier to notice than a definition alone.", keyPoints: ["Choose examples for a reason", "Vary irrelevant surface features", "Use non-examples to expose boundaries", "Ask pupils what changed and what stayed essential"] },
      { id: "ex4", type: "scenario", title: "Representation overload", prompt: "A slide contains a diagram, dense paragraph, animation and several labels while the teacher explains a new process. Pupils are missing the key idea. What is a sensible change?", options: [{ label: "Add another animation", feedback: "More competing information can increase avoidable processing." }, { label: "Simplify the display, align labels with the relevant parts and reveal information as it becomes necessary", feedback: "Coordinating visual and spoken information can make the essential structure easier to follow." }, { label: "Ask pupils to copy everything first", feedback: "Copying does not guarantee that the relevant relationships are understood." }] },
      { id: "ex5", type: "content", title: "Vocabulary inside explanations", body: "Subject vocabulary matters because precise terms allow precise thinking. Introduce necessary terms explicitly, connect them to meaning and use them repeatedly in context. Avoid replacing every technical word with vague everyday language when the technical term is the learning goal.", keyPoints: ["Define essential terms clearly", "Connect word, meaning and example", "Model the term in a complete disciplinary sentence", "Return to the vocabulary during practice"] },
      { id: "ex6", type: "scenario", title: "Explanation repair", prompt: "After your explanation, pupils repeat the definition but apply the concept incorrectly. What should you do?", options: [{ label: "Assume the explanation worked because they memorised the definition", feedback: "Accurate repetition does not necessarily show conceptual understanding." }, { label: "Use contrasting examples, ask pupils to explain the distinction and then check application again", feedback: "Changing representation and probing the boundary of the concept can repair incomplete understanding." }, { label: "Move on and fix it during the exam revision period", feedback: "Delayed repair allows the misconception to become embedded." }] },
      reflection("ex7", "Take one explanation you give often. Rewrite its sequence in five parts: prior knowledge, essential idea, example/representation, likely misconception and immediate check for understanding.")
    ]
  },
  {
    id: "memory-study-strategies",
    title: "Memory, Practice & Study Strategies",
    category: "Teaching & Learning",
    duration: 70,
    level: "Developing",
    summary: "Help pupils study more effectively through retrieval, spacing, interleaving, elaboration and realistic monitoring of what they know.",
    objectives: [
      "Explain why familiarity can be mistaken for learning",
      "Use retrieval and spacing to strengthen long-term access",
      "Introduce interleaving and elaboration appropriately",
      "Teach pupils to monitor learning using evidence rather than confidence alone"
    ],
    recommendedFor: ["Teacher", "Tutor", "ECT", "Pastoral"],
    modules: [
      { id: "ms1", type: "content", title: "Familiarity is not the same as recall", body: "Rereading notes can make material feel familiar because the answer is visible. Learning is better tested by trying to retrieve or use the information without the answer in front of you, then checking and correcting the attempt.", keyPoints: ["Teach pupils to test themselves", "Keep retrieval low stakes", "Correct errors after attempts", "Distinguish difficulty from failure"] },
      { id: "ms2", type: "quiz", title: "Study-strategy check", question: "Which activity gives the strongest direct practice of retrieval?", options: ["Highlighting the same page again", "Answering questions from memory before checking the answers", "Copying a model answer word for word", "Watching the same video without pausing"], answer: 1, feedback: "Retrieval requires bringing information to mind rather than simply seeing it again." },
      { id: "ms3", type: "content", title: "Spacing", body: "Spacing distributes encounters with important knowledge over time. Some forgetting between practices is expected; successfully retrieving after a delay can strengthen later access. Spacing works best when the material is revisited before it disappears from the curriculum completely.", keyPoints: ["Plan revisiting across weeks and months", "Mix recent and older material", "Expect retrieval to feel harder after a delay", "Use feedback to repair forgotten or distorted knowledge"] },
      { id: "ms4", type: "scenario", title: "Revision timetable scenario", prompt: "A pupil plans to spend six hours on one subject the night before the exam because it feels efficient. Which advice is strongest?", options: [{ label: "Keep all study in one long block", feedback: "Massed practice can create short-term familiarity without durable access." }, { label: "Distribute shorter sessions across several days and include retrieval from memory", feedback: "Spacing plus retrieval provides repeated opportunities to reconstruct the knowledge." }, { label: "Only reread the easiest topic", feedback: "Ease and familiarity are poor guides to what needs practice." }] },
      { id: "ms5", type: "content", title: "Interleaving and discrimination", body: "Interleaving mixes related problem types or concepts so pupils must decide which approach applies. It can be useful once the basics are established because it practises discrimination rather than simply repeating the same method many times in a row.", keyPoints: ["Do not randomise everything", "Mix related material where choosing the method matters", "Establish initial understanding before heavy interleaving", "Discuss why a particular strategy fits each problem"] },
      { id: "ms6", type: "content", title: "Elaboration and explanation", body: "Explaining why an idea is true, connecting it to prior knowledge and generating examples can deepen the network around it. Elaboration is most useful when the explanation itself is accurate; confident invented explanations need correction.", keyPoints: ["Ask why and how questions", "Connect ideas across the subject", "Generate examples and counterexamples", "Check elaborations for accuracy"] },
      { id: "ms7", type: "quiz", title: "Monitoring check", question: "What is the strongest way for a pupil to judge whether a topic is secure?", options: ["It looks familiar in the textbook", "They can retrieve and apply it without the answer visible, then check accuracy", "They spent a long time highlighting it", "They feel confident immediately after rereading"], answer: 1, feedback: "Performance on retrieval and application is stronger evidence than familiarity or time spent." },
      { id: "ms8", type: "scenario", title: "Study-support scenario", prompt: "A pupil says, 'Flashcards don't work for me' but they are reading the front and immediately flipping to the answer. What is a useful adjustment?", options: [{ label: "Tell them to make more decorative cards", feedback: "Decoration does not address the lack of retrieval attempt." }, { label: "Require an answer from memory first, say or write it, then check and separate secure from insecure cards", feedback: "This changes the activity from recognition into retrieval with feedback." }, { label: "Tell them memory is fixed", feedback: "Study strategies can be taught and improved." }] },
      reflection("ms9", "Design a two-week study routine for one important topic in your subject using retrieval, spacing and at least one opportunity to apply or explain the knowledge. What evidence would show that it is becoming more secure?")
    ]
  }
];
