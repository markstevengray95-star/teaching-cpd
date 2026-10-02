const fs = require('fs');
const path = require('path');

const root = process.cwd();
const layoutPath = path.join(root, 'app', 'layout.tsx');
const layout = fs.readFileSync(layoutPath, 'utf8');

const phases = [
  [21, 'Professional learning milestones', 'CourseProfessionalMilestonesPhase21Controller', 'course-professional-milestones-phase21.css'],
  [22, 'Department and team challenges', 'CourseTeamChallengesPhase22Controller', 'course-team-challenges-phase22.css'],
  [23, 'Live team quiz mode', 'CourseLiveTeamQuizPhase23Controller', 'course-live-team-quiz-phase23.css'],
  [24, 'Unlockable expert challenges', 'CourseExpertChallengesPhase24Controller', 'course-expert-challenges-phase24.css'],
  [25, 'Interactive diagrams and models', 'CourseInteractiveModelsPhase25Controller', 'course-interactive-models-phase25.css'],
  [26, 'Video decision points', 'CourseVideoDecisionPointsPhase26Controller', 'course-video-decision-phase26.css'],
  [27, 'Audio professional scenarios', 'CourseAudioProfessionalScenariosPhase27Controller', 'course-audio-scenarios-phase27.css'],
  [28, 'Personalised course entry route', 'CoursePersonalisedEntryPhase28Controller', 'course-personalised-entry-phase28.css'],
  [29, 'Personal professional toolkit', 'CourseProfessionalToolkitPhase29Controller', 'course-professional-toolkit-phase29.css'],
  [30, 'Final implementation challenge', 'CourseImplementationChallengePhase30Controller', 'course-implementation-challenge-phase30.css'],
  [31, 'Certification exam', 'CourseCertificationExamPhase31Controller', 'course-certification-exam-phase31.css'],
];

const failures = [];
for (const [phase, label, controller, css] of phases) {
  const controllerPath = path.join(root, 'app', 'components', `${controller}.tsx`);
  const cssPath = path.join(root, 'app', css);
  const checks = [
    [fs.existsSync(controllerPath), `controller file ${path.relative(root, controllerPath)}`],
    [fs.existsSync(cssPath), `stylesheet ${path.relative(root, cssPath)}`],
    [layout.includes(`import ${controller} from \"./components/${controller}\";`), `layout import for ${controller}`],
    [layout.includes(`import \"./${css}\";`), `layout stylesheet import for ${css}`],
    [layout.includes(`<${controller} />`), `layout render for ${controller}`],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, description]) => description);
  if (missing.length) failures.push(`Phase ${phase} — ${label}: missing ${missing.join(', ')}`);
  else console.log(`✓ Phase ${phase}: ${label}`);
}

const enginePath = path.join(root, 'lib', 'courseCertificationExamPhase31.ts');
if (!fs.existsSync(enginePath)) {
  failures.push('Phase 31: certification engine is missing');
} else {
  const engine = fs.readFileSync(enginePath, 'utf8');
  const certificationChecks = [
    ['PHASE31_PASS_PERCENT = 80', '80% pass threshold'],
    ['PHASE31_MIN_BANK = 25', 'minimum 25-question bank'],
    ['PHASE31_MAX_BANK = 40', 'maximum 40-question bank'],
    ['PHASE31_MIN_ATTEMPT = 10', 'minimum 10-question attempt'],
    ['PHASE31_MAX_ATTEMPT = 15', 'maximum 15-question attempt'],
    ['unlimitedResits:true', 'unlimited resits'],
    ['certificateGated:true', 'certificate gating'],
  ];
  for (const [marker, description] of certificationChecks) {
    if (!engine.includes(marker)) failures.push(`Phase 31: missing ${description}`);
  }
}

if (failures.length) {
  console.error('\nRoadmap integrity audit failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log('\nRoadmap integrity audit passed: Phases 21–31 are present, wired into the course shell, styled, and Phase 31 certification rules are intact.');
