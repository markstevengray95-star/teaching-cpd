import type { Course } from "@/lib/catalogue";
import { courseSources, learningToolsUpdated, sourceDirectoryChecked } from "@/lib/courseSources";
import { isSafetyCourse } from "@/lib/classroomPractice";
export default function CourseSources({ course }: { course: Course }) {
  const critical = isSafetyCourse(course) || course.category === "Safeguarding";
  return <section className="learningToolPanel" aria-label="Course sources and review status">
    <span className="practiceEyebrow">REFERENCES · TRANSPARENT REVIEW STATUS</span><h3>Sources and review</h3>
    <dl className="sourceReviewDates"><dt>Learning tools updated</dt><dd>{learningToolsUpdated}</dd><dt>Source directory checked</dt><dd>{sourceDirectoryChecked}</dd><dt>Specialist content approval</dt><dd>Not recorded in this release. Do not interpret a source-link check as approval of every course statement.</dd></dl>
    {critical && <p className="practiceSetting">This is awareness and fictional practice, not specialist certification. Current applicable guidance, school policies, risk assessments, individual plans and designated professional support take precedence. A designated specialist should review policy-critical course content.</p>}
    <p>These are relevant official or evidence-review references and learning-design background. They are not a claim that each generated passage has been checked against every source.</p>
    <ul>{courseSources(course).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} (opens in a new tab)</a><p>{source.purpose}</p></li>)}</ul>
    <details className="readingReference"><summary>Accessible ways to use this course</summary><ul><li>Use the keyboard to reach controls; focus is visible. Escape closes the course and restores focus.</li><li>Reading can be shown in full or in short sections. Deeper reading and extra practice are optional.</li><li>Present mode changes the layout, not the completion requirements. Motion is reduced when your system requests it.</li><li>The new learning tools use text instructions and feedback; no audio-only or colour-only answer is required.</li></ul><p>Existing video/media activities still need a separate asset-level caption and transcript review. This release does not claim a complete accessibility certification.</p></details>
  </section>;
}
