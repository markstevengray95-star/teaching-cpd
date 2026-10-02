# SEN department workspace

Open `/sen` from Tools → Teaching & pupil support, or the student-support hub.
Six task-focused sections replace a sprawling collection of tabs. The existing
SEND/EAL guidance and intervention tracker remain available; their old records
are not silently imported or given broader access.

## Included workflows

- Department action queue: support-plan, intervention and entered EHCP review dates.
- Searchable pupil/referral register, identified areas of need, strengths, language
  background, graduated support plans, pupil/family voice, professional summaries.
- Printable classroom passport (only agreed support fields; not full case notes).
- Provision map: lead, dosage, weekly staff minutes and estimated costs.
- Intervention delivery: observable baseline/goal, local success measure, session
  evidence, actual minutes, fidelity, pupil usefulness, review and continue/adjust/
  fade/close status. No automatic clinical or statutory decision.
- Review meetings, actions, next dates, transition and handover planning.
- EAL assessment: 20 original criteria across four strands, three original task
  packs, evidence/support/confidence, teacher-confirmed band and language targets.
  Unobserved criteria are NULL, never default scores; means are descriptive only.
- Reading-age history: chronological comparison where birth date is recorded;
  changes only across distinct dates with the same named assessment tool/edition.
- Private regulation check-in → support → check-out, body/context notes, return to
  learning and descriptive strategy feedback. No zone-based pupil rankings.
- Staff toolkit: 12 strategies, 12 activities, five-language phrase cards, teacher
  language coaching, seven transition contexts, trips/exam preparation,
  environment checklist, pupil voice and implementation prompts, CPD links.

## Source provenance

Adapted from the user's repositories, not a generic replacement:

- `markstevengray95-star/zones` at
  `c1c50e9a0a7de5ae615ab2d37536769205aea074`: `platform-data.js`,
  `operations-data.js`, intervention baseline/goal/delivery/evidence/review workflow
  in `cpd-interventions.js` and `intervention-review-plus.js`.
- `markstevengray95-star/EAL` at
  `a6232d8c60c127974a92fd1d47f658adfe10d0b3`: original `ealDetailedStrands` and
  `ealTaskSets` in `index.html`; reading history, new-arrival, pupil voice and
  passport workflows.

Only original resource definitions were imported. No pupil records, secrets,
local role selectors, localStorage stores, external media uploads or old login
systems were copied. This is neither an official Zones of Regulation product nor
an official/licensed/standardised Bell Foundation test. EAL alone is not SEN.

## Live records: self-service school onboarding

The confirmed CPD production project is `tkjbaqkpkvomwwvwhowp`. Secure pupil
storage was installed there on 2 October 2026 through the Supabase migration API,
registered as `20261002150055_sen_department_workspace`. Do not apply it to a
different project or create a duplicate migration. No pupil records were seeded.
At installation there were no school organisations, so no school was activated.

The app calls `sen_workspace_access(org_id)` and fails closed if the function is
missing, access is denied or the school is not enabled. General staff tools still
work. The separately labelled fictional demo is in memory only; reload clears it.
Do not enter real pupil information in demo or temporary toolkit notes.

`supabase/sen-department-setup.sql` is the reviewed SQL used for that registered
migration, not a script to rerun on application deployment. The official CLI could
not open its local settings directory on this Windows host; the migration API
provided the server-generated migration version instead.

1. Confirm the production project and the existing migration history before any
   further database changes. Make future changes as separate reviewed migrations.
2. Configure the actual school organisation and its named staff memberships.
3. Assign canonical `send-eal` or `slt` roles only to authorised staff.
4. The school must approve lawful processing, access, retention, backups,
   safeguarding boundaries and approved printing/sharing procedures before activation.
5. The school owner or an actual school `owner`/`admin` member activates storage
   in School onboarding or `/sen-setup`. They attest to all three privacy checks
   and select named current staff with canonical `send-eal` or `slt` roles.
   The checked database RPC enables storage immediately without provider action.
   Each approval/change/pause records actor, time, privacy version and selected
   staff IDs in a private append-only activation log. No school is enabled merely
   by signing up or installing SQL. New schools use the same flow without a code update.
   Only selected existing school members/owners WITH a current canonical
   `send-eal` or `slt` assignment can access cases. An administrator/platform role,
   editable preferred school, creator identity or legacy role cannot bypass this.

RLS protects SELECT/INSERT/UPDATE; no client DELETE. Organisation and record ID
cannot be reassigned. The server validates record structure/ranges, sets actor
and timestamps, increments version, and records append-only mutation metadata
without names or record bodies. Updates filter the previously loaded version, so
stale drafts cannot overwrite another staff member's change. Archive is reversible.
An archived record must be restored before editing. Database policy is the access
authority, not client UI visibility.

Changing the approved staff list requires fresh privacy attestations. Removing a
role or membership removes access even when an old approval still lists the user.
Pause storage to block access while retaining records; reactivation requires fresh
approval. It does not delete records or revoke copies already printed/downloaded.
`supabase/sen-onboarding-setup.sql` was installed as migration
`20261002165601_sen_self_service_onboarding`; do not reapply it.
The base storage setup must be installed first. School onboarding uses its own
canonical organisation lookup, not a legacy CPD pilot organisation ID. If the older
pilot checklist cannot load, pupil-storage setup remains available independently.

## Verification

`npm run audit:sen` tests model behaviour and the complete SQL in an isolated,
in-memory PostgreSQL engine (PGlite, test-only dependency). It checks activation,
roles/membership, cross-school isolation, anonymous denial, invalid records,
immutable organisation, no deletes, concurrency, archive/restore, audit and role
revocation. Production migration history and table metadata separately confirm
installation and RLS on both record tables and the private activation table.
Security/performance advisors were run after installation. The private activation
table intentionally has no client policies or grants; only the checked server
helper reads it. Leaked-password protection remains a pre-existing Auth warning.
End-to-end production save/reload testing still requires an approved school and
authorised staff; no real pupil data was used to test installation.
Run normal course/navigation audits and a production build as well.

## Deliberate boundaries / remaining integration work

This is a SEN working space, not every function of an MIS, statutory EHCP system,
medical record or safeguarding product. No automatic diagnosis, EHCP eligibility,
exam-arrangement approval, statutory deadline calculation or external AI processing.
Contact logs do not send emails. The provision map plans staff time; it is not a
conflict-checked TA timetable. External documents, consent workflows, referral
submissions, MIS sync, full historical version recovery and retention automation
need separate school-approved integrations. Database audit is mutation metadata,
not a saved copy of each previous case version.

Reports describe the loaded records only (up to 1,000); they are not a full-school
or statutory census export. Pupil printing is an explicit action and may save a
local PDF; follow the school's access and retention procedures.
