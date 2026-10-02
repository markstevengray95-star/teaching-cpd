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

## Live records: disabled until school approval and database setup

The confirmed CPD production project is `tkjbaqkpkvomwwvwhowp`. The currently
connected Supabase account exposes a DIFFERENT project. Do not apply this SQL to
that other project. No production schema or pupil records were changed.

The app calls `sen_workspace_access(org_id)` and fails closed if the function is
missing, access is denied or the school is not enabled. General staff tools still
work. The separately labelled fictional demo is in memory only; reload clears it.
Do not enter real pupil information in demo or temporary toolkit notes.

`supabase/sen-department-setup.sql` is reviewed rollout SQL, not an automatically
registered migration. The official CLI failed while opening its local settings
directory on this Windows host. Once tooling and the correct project connection
are available:

1. Confirm the production project, existing school membership and canonical role
   assignment tables. Review the SQL in a staging copy first.
2. Run `supabase migration new sen_department_workspace`, copy the rollout SQL into
   that CLI-generated file, and commit it before applying through the approved
   database deployment process. Do not generate a second migration if already applied.
3. Apply and run database security/performance advisors on the correct project.
4. The school must approve lawful processing, access, retention, backups,
   safeguarding boundaries and approved printing/sharing procedures before activation.
5. A database administrator explicitly enables each approved organisation in
   `private.sen_workspace_schools` with an approval timestamp. No school is enabled
   by installation. Only existing school members/owners WITH a canonical
   `send-eal` or `slt` assignment can access cases. An administrator/platform role,
   editable preferred school, creator identity or legacy role cannot bypass this.

RLS protects SELECT/INSERT/UPDATE; no client DELETE. Organisation and record ID
cannot be reassigned. The server validates record structure/ranges, sets actor
and timestamps, increments version, and records append-only mutation metadata
without names or record bodies. Updates filter the previously loaded version, so
stale drafts cannot overwrite another staff member's change. Archive is reversible.
An archived record must be restored before editing. Database policy is the access
authority, not client UI visibility.

## Verification

`npm run audit:sen` tests model behaviour and the complete SQL in an isolated,
in-memory PostgreSQL engine (PGlite, test-only dependency). It checks activation,
roles/membership, cross-school isolation, anonymous denial, invalid records,
immutable organisation, no deletes, concurrency, archive/restore, audit and role
revocation. This is NOT evidence that the production database was migrated.
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
