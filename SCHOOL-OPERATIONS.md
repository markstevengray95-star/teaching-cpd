# School operations

## Reporting

School Admins and CPD Leads can open /school-reporting for staff summaries, dated catalogue completions and planned CPD hours, mandatory training renewals, suggested pathway progress and assignments.

School scope is derived from the authenticated active membership, never a browser-supplied organisation ID. The reporting RPC projects completion metadata without private reflections, assessment responses, evidence notes or assignment notes. Raw course-progress policies remain unchanged.

Department and staff filters apply throughout. Date filters apply only to completed catalogue courses and planned hours; requirements and deadlines remain current. Hours are catalogue estimates, not tracked time or proof of competence. Suggested pathways are not assigned obligations. CSV exports contain staff personal data and must use school-approved handling.

Verification: audit-school-reporting.cjs, TypeScript and the transaction-only supabase/tests/school_reporting.sql (two-school isolation, anonymous/ordinary/inactive access denial and private-data exclusion). All database fixtures roll back.
