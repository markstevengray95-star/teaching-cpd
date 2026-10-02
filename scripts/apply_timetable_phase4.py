from pathlib import Path

p = Path('app/components/StaffTimetableHub.tsx')
s = p.read_text()

# Browser auth client for secure API requests.
anchor = 'import Link from "next/link";\n'
addition = 'import { getSupabaseBrowserClient } from "@/lib/supabase";\n'
if addition not in s:
    s = s.replace(anchor, anchor + addition, 1)

# Add the generated exam-practice field to saved lesson plans.
if '  examPractice: string;\n' not in s:
    s = s.replace('  assessment: string;\n  teacherNotes: string;\n', '  assessment: string;\n  examPractice: string;\n  teacherNotes: string;\n', 1)

# Add a typed subset returned by the generator API.
type_anchor = 'type Lesson = {\n'
if 'type GeneratedLessonPlan = Pick<LessonPlan' not in s:
    generated_type = '''type GeneratedLessonPlan = Pick<LessonPlan,\n  "objectives" | "vocabulary" | "priorKnowledge" | "retrieval" | "misconceptions" | "teacherExplanation" | "modelling" |\n  "guidedPractice" | "independentPractice" | "assessment" | "examPractice" | "sendEalAdaptations" | "stretchChallenge" |\n  "homeworkTask" | "exitTicket" | "sequence"\n>;\n\n'''
    s = s.replace(type_anchor, generated_type + type_anchor, 1)

# Backward compatible default for existing saved lesson plans.
old_blank = 'lessonDate: "", topic: "", vocabulary: "", objectives: "", sequence: "", resources: "", assessment: "", teacherNotes: "",'
new_blank = 'lessonDate: "", topic: "", vocabulary: "", objectives: "", sequence: "", resources: "", assessment: "", examPractice: "", teacherNotes: "",'
if old_blank in s:
    s = s.replace(old_blank, new_blank, 1)

# Add generator state after lessonIndex state.
state_anchor = '  const [lessonIndex, setLessonIndex] = useState(Math.max(0, plan.sequencePosition || 0));\n'
if 'const [generatingLesson, setGeneratingLesson]' not in s:
    s = s.replace(state_anchor, state_anchor + '''  const [generatingLesson, setGeneratingLesson] = useState(false);\n  const [generationMessage, setGenerationMessage] = useState("");\n  const [generationSource, setGenerationSource] = useState<"ai" | "template" | "">("");\n  const [teacherRequirements, setTeacherRequirements] = useState("");\n''', 1)

# Count exam practice in detailed plan completion.
old_keys = 'const detailedKeys: (keyof LessonPlan)[] = ["priorKnowledge","retrieval","misconceptions","teacherExplanation","modelling","guidedPractice","independentPractice","sendEalAdaptations","stretchChallenge","homeworkTask","exitTicket","reflection"];'
new_keys = 'const detailedKeys: (keyof LessonPlan)[] = ["priorKnowledge","retrieval","misconceptions","teacherExplanation","modelling","guidedPractice","independentPractice","assessment","examPractice","sendEalAdaptations","stretchChallenge","homeworkTask","exitTicket","reflection"];'
if old_keys in s:
    s = s.replace(old_keys, new_keys, 1)

# Add one-click generation before applySuggestedLesson.
function_anchor = '  function applySuggestedLesson() {\n'
if 'async function generateFullLesson' not in s:
    generator_fn = r'''  async function generateFullLesson(overwrite = false) {
    if (readOnly || generatingLesson) return;
    const topic = (plan.topic || selectedTemplate?.title || "").trim();
    if (!topic) { setGenerationMessage("Choose a curriculum lesson or enter a lesson topic first."); return; }
    if (overwrite && !window.confirm("Regenerate the structured lesson sections? This will replace existing objectives, vocabulary, sequence and detailed planning fields. Your curriculum selection, resources, notes and reflection will be kept.")) return;

    setGeneratingLesson(true);
    setGenerationMessage("Building a complete 55-minute lesson…");
    setGenerationSource("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sign in again before generating a lesson.");

      const response = await fetch("/api/lesson-generator", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: lesson.subject || subject,
          className: lesson.className,
          stage,
          examBoard,
          course: selectedCourse?.title || courseId,
          unit: selectedUnit?.title || plan.curriculumUnit,
          subtopic: selectedSubtopic?.title || plan.curriculumSubtopic,
          topic,
          objectives: plan.objectives || selectedTemplate?.objectives || "",
          vocabulary: plan.vocabulary || selectedTemplate?.vocabulary || "",
          teacherRequirements,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { lesson?: GeneratedLessonPlan; source?: "ai" | "template"; error?: string };
      if (!response.ok || !payload.lesson) throw new Error(payload.error || "The lesson could not be generated.");
      const generated = payload.lesson;
      const generatedKeys: (keyof GeneratedLessonPlan)[] = ["objectives","vocabulary","priorKnowledge","retrieval","misconceptions","teacherExplanation","modelling","guidedPractice","independentPractice","assessment","examPractice","sendEalAdaptations","stretchChallenge","homeworkTask","exitTicket","sequence"];

      setPlan((current) => {
        const next = { ...current, planningMode: "detailed" as const, topic: current.topic || topic };
        generatedKeys.forEach((key) => {
          if (overwrite || !String(current[key] || "").trim()) next[key] = generated[key];
        });
        return next;
      });
      const source = payload.source === "ai" ? "ai" : "template";
      setGenerationSource(source);
      setGenerationMessage(source === "ai" ? "Lesson generated. Review and edit each section before saving." : "AI was unavailable, so a classroom-ready built-in lesson structure was used. Review and edit before saving.");
    } catch (error) {
      setGenerationMessage(error instanceof Error ? error.message : "The lesson could not be generated.");
    } finally {
      setGeneratingLesson(false);
    }
  }

'''
    s = s.replace(function_anchor, generator_fn + function_anchor, 1)

# Phase label and generator UI.
s = s.replace('LESSON PLANNING · PHASE 3', 'LESSON PLANNING · PHASE 4', 1)
mode_bar = '    <div className="ttPlanModeBar"><div className="ttPlanModeSwitch"><button type="button" className={plan.planningMode === "simple" ? "active" : ""} onClick={() => setPlan((current) => ({ ...current, planningMode: "simple" }))}>Simple</button><button type="button" className={plan.planningMode === "detailed" ? "active" : ""} onClick={() => setPlan((current) => ({ ...current, planningMode: "detailed" }))}>Detailed</button></div><div className="ttPlanCompletion"><span>Detailed plan</span><b>{detailedComplete}/{detailedKeys.length}</b><i><em style={{ width: `${Math.round(detailedComplete / detailedKeys.length * 100)}%` }} /></i></div>{!readOnly && <button type="button" className="ttButton" onClick={buildDetailedStructure}>Build detailed structure</button>}</div>\n'
if mode_bar in s and 'ttLessonGenerator' not in s:
    generator_ui = mode_bar + '''    <section className="ttLessonGenerator"><div className="ttLessonGeneratorHead"><div><span className="staffTimetableEyebrow">ONE-CLICK LESSON GENERATION</span><h3>Generate the full lesson</h3><p>Build an editable 55-minute lesson from the selected curriculum topic, including retrieval, explanation, modelling, practice, checks, exam-style application, homework, adaptations and exit ticket.</p></div><span className={`ttGeneratorBadge ${generationSource || "ready"}`}>{generatingLesson ? "Generating…" : generationSource === "ai" ? "AI generated" : generationSource === "template" ? "Built-in fallback" : "Ready"}</span></div><label className="ttGeneratorRequirements"><span>Optional teacher requirements</span><textarea disabled={readOnly || generatingLesson} value={teacherRequirements} onChange={(event) => setTeacherRequirements(event.target.value)} placeholder="e.g. practical lesson, stronger exam technique focus, include paired discussion, keep independent task to 15 minutes…" /></label><div className="ttGeneratorActions">{!readOnly && <><button type="button" className="ttButton primary" disabled={generatingLesson || !(plan.topic || selectedTemplate?.title)} onClick={() => generateFullLesson(false)}>{generatingLesson ? "Generating lesson…" : "Generate full lesson"}</button><button type="button" className="ttButton" disabled={generatingLesson || !(plan.topic || selectedTemplate?.title)} onClick={() => generateFullLesson(true)}>Regenerate planning sections</button></>}<span>{generationMessage || "Generation fills blank sections by default, so existing teacher edits are preserved."}</span></div><div className="ttGeneratorNote"><b>Teacher review required.</b><span>Generated content is a planning draft, not an official exam-board resource or mark scheme. Check subject accuracy, suitability and timings before teaching.</span></div></section>\n'''
    s = s.replace(mode_bar, generator_ui, 1)

# Add exam practice to the detailed practice section.
old_practice = '{field("guidedPractice","Guided practice",true,"Scaffolded examples, questioning and supported rehearsal")}{field("independentPractice","Independent practice",true,"What will pupils do independently to secure the learning?")}{field("exitTicket","Exit ticket",true,"2–3 final questions directly aligned to the objectives")}'
new_practice = '{field("guidedPractice","Guided practice",true,"Scaffolded examples, questioning and supported rehearsal")}{field("independentPractice","Independent practice",true,"What will pupils do independently to secure the learning?")}{field("assessment","Checks / hinge questions",true,"Diagnostic questions that determine whether to move on or reteach")}{field("examPractice","Exam-style application",true,"An age-appropriate application or exam-style question with teacher success criteria")}{field("exitTicket","Exit ticket",true,"2–3 final questions directly aligned to the objectives")}'
if old_practice in s:
    s = s.replace(old_practice, new_practice, 1)

p.write_text(s)

css = Path('app/components/StaffTimetableHub.css')
c = css.read_text()
if '.ttLessonGenerator{' not in c:
    c += '''\n/* Phase 4 — one-click lesson generation */\n.ttLessonGenerator{margin:0 0 16px;padding:18px;border:1px solid #cfdaf5;border-radius:18px;background:linear-gradient(145deg,#f7f9ff,#eef5ff);box-shadow:0 10px 28px rgba(45,75,150,.06)}.ttLessonGeneratorHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.ttLessonGeneratorHead h3{margin:4px 0 6px;font-size:20px;letter-spacing:-.025em}.ttLessonGeneratorHead p{margin:0;max-width:760px;color:#68768b;font-size:12px;line-height:1.55}.ttGeneratorBadge{flex:0 0 auto;padding:7px 10px;border-radius:999px;font-size:10px;font-weight:900;background:#e8edf7;color:#53627a}.ttGeneratorBadge.ai{background:#e9f7ef;color:#267654}.ttGeneratorBadge.template{background:#fff6df;color:#8a651e}.ttGeneratorBadge.ready{background:#edf2ff;color:#405abc}.ttGeneratorRequirements{display:grid;gap:6px;margin-top:14px}.ttGeneratorRequirements>span{font-size:10px;color:#66748a;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.ttGeneratorRequirements textarea{min-height:72px;resize:vertical;border:1px solid #cfd9e9;border-radius:11px;background:#fff;color:#26344d;padding:10px 11px;font:inherit}.ttGeneratorActions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:11px}.ttGeneratorActions>span{flex:1 1 280px;color:#6c788d;font-size:11px;line-height:1.45}.ttGeneratorNote{display:flex;gap:7px;align-items:flex-start;margin-top:12px;padding:9px 10px;border-radius:10px;background:#fff;color:#6a7689;font-size:10px;line-height:1.45}.ttGeneratorNote b{color:#35445d;white-space:nowrap}@media(max-width:700px){.ttLessonGeneratorHead{flex-direction:column}.ttGeneratorActions .ttButton{width:100%}.ttGeneratorNote{display:grid}}\n'''
    css.write_text(c)
