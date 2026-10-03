# School timetable installation receipt

Applied `school_timetable_builder_sync` to the CPD project's database (`tkjbaqkpkvomwwvwhowp`) on 3 October 2026. Source: `school-timetable-setup.sql`. No existing school or planner records were changed.

Verified the new private table has RLS enabled and the authenticated browser role cannot select it directly. The three public RPC wrappers use SECURITY INVOKER, an empty search path and deny anonymous execution. The private implementations check current authenticated membership and management access before reading or writing.

The [Supabase advisor's RLS/no-policy information](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) for this private table is intentional: direct access is denied, and only the guarded RPC implementations access it. No permissive policy was added to silence it. The pre-existing project auth warning about [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) is outside this schema change.

Local PostgreSQL tests use fictional schools and accounts; no live staff identities or school timetables were used for testing.
