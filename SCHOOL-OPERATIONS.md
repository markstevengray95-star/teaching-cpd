# School operations

## Reporting

School Admins and CPD Leads can open /school-reporting for staff summaries, dated catalogue completions and planned CPD hours, mandatory training renewals, suggested pathway progress and assignments.

School scope is derived from the authenticated active membership, never a browser-supplied organisation ID. The reporting RPC projects completion metadata without private reflections, assessment responses, evidence notes or assignment notes. Raw course-progress policies remain unchanged.

Department and staff filters apply throughout. Date filters apply only to completed catalogue courses and planned hours; requirements and deadlines remain current. Hours are catalogue estimates, not tracked time or proof of competence. Suggested pathways are not assigned obligations. CSV exports contain staff personal data and must use school-approved handling.

Verification: audit-school-reporting.cjs, TypeScript and the transaction-only supabase/tests/school_reporting.sql (two-school isolation, anonymous/ordinary/inactive access denial and private-data exclusion). All database fixtures roll back.

## Guided school setup

/school-onboarding is self-guarded for School Admin and CPD Lead accounts, including before a school is connected or licensed. Seven tutorial pages link to existing configuration screens rather than creating schools, buying licences or granting roles implicitly. School creation still uses the existing Organisation setup workflow.

The protected setup snapshot returns live counts and the server-side subscription decision. Manual pilot confirmations are stored per school/checkpoint with database-stamped user/time and admin-only RLS. Checkboxes remain unchanged when a save fails. Reading the tutorial never marks configuration as complete; directory rows do not imply active staff membership.

The invalid trial_ends_at field has been removed from launch-readiness queries to match the Teaching CPD schema. Verification: audit-school-onboarding.cjs, TypeScript, browser preview and the rolled-back supabase/tests/school_onboarding.sql including cross-school write denial.

Existing deployment advisories remain outside this feature: leaked-password protection is disabled, and older tables have indexing/policy notices. Before selling, review https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection and the existing launch-readiness platform-owner checklist. This change is not a whole-platform security certification.

## School procurement pack

/procurement is public and contains no school records. Its server-rendered catalogue summary supplies only aggregate course counts/durations to the interactive pack. Eight sections cover the product, buyer evaluation, data boundaries, processing-agreement review, security/service evidence, accessibility, commercial terms and rollout.

Twelve draft-detail fields are held only in page memory. They are not uploaded, persisted or published. Download before leaving if you need a copy. Markdown export and print/Save PDF include unresolved placeholders and an explicit draft warning even when every field is filled. This tool never signs a contract, approves a quote, certifies compliance or guarantees service levels.

Current official ICO and W3C guidance is linked; ICO flags its contracts guidance as under review. Provider identity, quote, retention/deletion, subprocessors, service levels, recovery evidence and accessibility assessment require confirmation and appropriate review before sale.

Verification: audit-school-procurement.cjs checks derived catalogue counts, complete draft sections/placeholders, input escaping, public-data boundaries and Blob download wiring. Browser fixtures test the actual interactive components, not a real school-account identity-provider login. The in-app browser did not return a download event during CSV testing, so filesystem delivery needs a normal-browser check; export content and download wiring are independently tested.
