create index if not exists safeguarding_requirements_guidance_idx on public.safeguarding_requirements(guidance_source_id);
create index if not exists safeguarding_role_assignments_assigned_by_idx on public.safeguarding_role_assignments(assigned_by);
create index if not exists safeguarding_evidence_requirement_idx on public.safeguarding_evidence(requirement_code);
create index if not exists safeguarding_evidence_verified_by_idx on public.safeguarding_evidence(verified_by);

drop policy if exists "staff view own safeguarding roles" on public.safeguarding_role_assignments;
drop policy if exists "school admins manage safeguarding roles" on public.safeguarding_role_assignments;
create policy "read safeguarding role assignments" on public.safeguarding_role_assignments
for select to authenticated
using (user_id=(select auth.uid()) or private.is_org_admin(organisation_id));
create policy "school admins insert safeguarding roles" on public.safeguarding_role_assignments
for insert to authenticated
with check (private.is_school_admin(organisation_id) and assigned_by=(select auth.uid()));
create policy "school admins update safeguarding roles" on public.safeguarding_role_assignments
for update to authenticated
using (private.is_school_admin(organisation_id))
with check (private.is_school_admin(organisation_id));
create policy "school admins delete safeguarding roles" on public.safeguarding_role_assignments
for delete to authenticated
using (private.is_school_admin(organisation_id));

drop policy if exists "staff view own safeguarding evidence" on public.safeguarding_evidence;
drop policy if exists "staff add own safeguarding evidence" on public.safeguarding_evidence;
drop policy if exists "staff update own unverified safeguarding evidence" on public.safeguarding_evidence;
drop policy if exists "school admins manage safeguarding evidence" on public.safeguarding_evidence;
create policy "read safeguarding evidence" on public.safeguarding_evidence
for select to authenticated
using (user_id=(select auth.uid()) or private.is_org_admin(organisation_id));
create policy "insert safeguarding evidence" on public.safeguarding_evidence
for insert to authenticated
with check (
  (user_id=(select auth.uid()) and organisation_id=private.current_org_id() and verified_by is null and verified_at is null)
  or private.is_org_admin(organisation_id)
);
create policy "update safeguarding evidence" on public.safeguarding_evidence
for update to authenticated
using (
  (user_id=(select auth.uid()) and verified_at is null)
  or private.is_org_admin(organisation_id)
)
with check (
  (user_id=(select auth.uid()) and organisation_id=private.current_org_id())
  or private.is_org_admin(organisation_id)
);
create policy "delete safeguarding evidence" on public.safeguarding_evidence
for delete to authenticated
using (private.is_org_admin(organisation_id));
