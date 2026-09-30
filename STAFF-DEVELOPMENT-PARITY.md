# Staff Development → Teaching CPD parity audit

Audit date: 2026-09-30

This audit records which Staff Development changes belong in the Teaching CPD source application and which changes are Staff Development shell/integration concerns that should not be copied back into the core CPD app.

## Course content and presentation changes

Teaching CPD is the source package used by Staff Development for the CPD catalogue. The current Teaching CPD main branch already contains the course work that Staff Development pinned and bridged, including:

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
