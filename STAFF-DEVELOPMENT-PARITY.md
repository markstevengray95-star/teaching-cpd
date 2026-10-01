# Staff Development → Teaching CPD parity audit

Audit date: 2026-10-01

This audit records which Staff Development changes belong in the Teaching CPD source application and which changes are Staff Development shell/integration concerns that should not be copied back into the core CPD app.

## Course content and presentation changes

Teaching CPD is the source package used by Staff Development for the CPD catalogue. The earlier migration already contained:

- Presentation overhaul Phases 1–31.
- The shortened staff-facing course journeys created after full QA.
- The 30-minute CPD refresher collection.
- The 5–10 minute Micro-CPD collection.
- Phase 28 personalised entry routes.
- Phase 29 professional toolkit.
- Phase 30 implementation challenge.
- Phase 31 certification exam and certificate gating.
- Live presenter, facilitator, assessment, follow-through, adaptive, simulation, challenge and interactive presentation controllers.

The 30-minute refreshers are rendered on `/micro-cpd` alongside the original 5–10 minute units. `app/cpd-refreshers.css` is loaded globally so the refresher cards, sections, checks and responsive layout use their intended presentation.

## Latest course parity corrections

The 1 October comparison found that the latest Staff Development-native workspace, 15 linked short courses, question flashcards, decoded assessments and evidence-based classroom rehearsal had not yet reached Teaching CPD. This update ports that work into Teaching CPD itself, without importing the Staff Development wrapper.

- The main catalogue now has 88 key courses and 15 linked short courses. The existing Micro-CPD and 30-minute refresher collections remain separate and unchanged.
- Key course estimates now vary: 8 at 45 minutes, 38 at 60, 37 at 75 and 5 at 90. Focused practical courses use the shorter estimates; broader or specialist courses retain more time. These are planning estimates, not timers or claims that every learner needs the same time.
- Seven linked short courses are 15 minutes and eight are 20. Their seven-module route is not expanded by the legacy long-course presentation controllers.
- The concise key-course route removes 968 repeated support slides while retaining original reading passages, assessment IDs and the first case example. The extended route remains available. Per-module budgets sum to the selected route estimate.
- The native workspace groups each key course into five stages and each short course into three. Existing reading is preserved; 264 optional Read & Try panels support application.
- Encoded assessment banks are presented as real questions with options and explanations. Unanswered checks cannot be scored. Pass-mark checks require a passing result before completion; starting-point diagnostics have no pass mark.
- Every course has substantive question flashcards: attempt recall, reveal the model answer, then mark for more practice or secure for now. Ratings are session self-checks, not a competence score.
- Classroom rehearsal uses observed evidence versus inference, a decision with rationale, and a follow-up review. Safety courses use an appropriate professional-risk lens rather than a generic teaching intervention.
- Activity tasks retain their original prompts and instructions, with optional problem/action/evidence drafting and self-review criteria. Appending a draft preserves existing responses. Character counts are not presented as quality scores.
- Progress writes are serialized and only reflected as saved after Teaching CPD's existing Supabase write succeeds. Failed saves retain drafts and show an error. No database migration or alternate progress table is introduced.

Verification: `npm run audit:courses` checks all 103 catalogue courses, 6,269 modules, 6,195 decoded bank-question instances, 1,101 question flashcards, route integrity, timing totals and short-course parent links. Representative browser checks cover native assessment gating, activity drafts, failed-save retention, parent-course navigation, flashcards, classroom evidence and mobile Course Lab access. Browser persistence checks use a mock adapter; signed-in production writes are not claimed as tested.

## Staff Development workflows moved into Teaching CPD

The following Staff Development-native school workflows have been ported to Teaching CPD and adapted to its existing Supabase model:

- `/appraisal`
- `/compliance`
- `/induction`
- `/departments`

They reuse Teaching CPD's existing course progress, appraisal evidence, training, department planning and leadership data instead of creating a second CPD progress model.

## Admin course access moved into Teaching CPD

Staff Development added an administrator mode that removes sequential presentation locks so an administrator can inspect every course section immediately. Teaching CPD now has the equivalent behaviour through `AdminSlideUnlockController`, using Teaching CPD's own `staff_profiles` and `platform_admins` authorization sources.

This is an administrator inspection convenience only; normal staff course progression remains unchanged.

## Features intentionally not copied back

These are Staff Development integration/shell features rather than newer Teaching CPD source features and are intentionally kept out of the core Teaching CPD app to avoid duplicate or conflicting systems:

- Zones-specific navigation and Zones application pages.
- Staff Development's wrapper `/cpd` route.
- `staff_development_course_progress` and Staff Development-specific entitlement tables.
- Staff Development-specific billing/subscription wrapper state.
- Staff Development home-sidebar DOM simplifier, because Teaching CPD already uses its own grouped `DevelopmentDock` navigation.
- Bridge routes whose only purpose is to re-export an existing Teaching CPD page or controller.

## Rule for future work

New CPD course content, presentation phases, short courses and course-quality logic should continue to live in Teaching CPD first. Staff Development can consume that source. Staff Development-only whole-school or Zones features should only be ported back when they provide a genuine CPD capability rather than a duplicate wrapper.
