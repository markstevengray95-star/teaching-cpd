create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null default 'platform_terms',
  document_version text not null,
  document_hash text not null,
  signed_name text not null check (char_length(btrim(signed_name)) between 2 and 200),
  accepted_at timestamptz not null default now(),
  unique (user_id, document_type, document_version)
);

alter table public.legal_acceptances enable row level security;
revoke all on table public.legal_acceptances from anon;
revoke all on table public.legal_acceptances from authenticated;
grant select, insert on table public.legal_acceptances to authenticated;

drop policy if exists legal_acceptances_self_read on public.legal_acceptances;
create policy legal_acceptances_self_read
on public.legal_acceptances for select to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists legal_acceptances_self_insert on public.legal_acceptances;
create policy legal_acceptances_self_insert
on public.legal_acceptances for insert to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create index if not exists legal_acceptances_user_version_idx
on public.legal_acceptances(user_id, document_type, document_version);

create table if not exists public.staff_development_access_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null check (area in ('student_support','interventions','pastoral','staff_progress','timetable_leadership')),
  access_level text not null check (access_level in ('view','manage')),
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, area)
);

alter table public.staff_development_access_grants enable row level security;
revoke all on table public.staff_development_access_grants from anon;
revoke all on table public.staff_development_access_grants from authenticated;
grant select, insert, update, delete on table public.staff_development_access_grants to authenticated;

create index if not exists staff_development_access_grants_lookup_idx
on public.staff_development_access_grants(organization_id, user_id, area, access_level);

create or replace function private.staff_development_can_manage_sensitive_access(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.school_organizations o
      where o.id = target_org and o.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.school_organization_members m
      where m.organization_id = target_org
        and m.user_id = (select auth.uid())
        and m.role in ('owner','admin')
    )
    or exists (
      select 1 from public.staff_development_role_assignments r
      where r.organization_id = target_org
        and r.user_id = (select auth.uid())
        and r.role in ('administrator')
    )
  );
$$;

revoke all on function private.staff_development_can_manage_sensitive_access(uuid) from public, anon;
grant execute on function private.staff_development_can_manage_sensitive_access(uuid) to authenticated;

create or replace function private.staff_development_has_area_access(target_org uuid, target_area text, require_manage boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and private.sd_is_org_member(target_org)
    and exists (
      select 1 from public.staff_development_access_grants g
      where g.organization_id = target_org
        and g.user_id = (select auth.uid())
        and g.area = target_area
        and (not require_manage or g.access_level = 'manage')
    );
$$;

revoke all on function private.staff_development_has_area_access(uuid,text,boolean) from public, anon;
grant execute on function private.staff_development_has_area_access(uuid,text,boolean) to authenticated;

drop policy if exists sd_sensitive_grants_read on public.staff_development_access_grants;
create policy sd_sensitive_grants_read
on public.staff_development_access_grants for select to authenticated
using (
  user_id = (select auth.uid())
  or private.staff_development_can_manage_sensitive_access(organization_id)
);

drop policy if exists sd_sensitive_grants_insert on public.staff_development_access_grants;
create policy sd_sensitive_grants_insert
on public.staff_development_access_grants for insert to authenticated
with check (
  assigned_by = (select auth.uid())
  and private.staff_development_can_manage_sensitive_access(organization_id)
);

drop policy if exists sd_sensitive_grants_update on public.staff_development_access_grants;
create policy sd_sensitive_grants_update
on public.staff_development_access_grants for update to authenticated
using (private.staff_development_can_manage_sensitive_access(organization_id))
with check (
  assigned_by = (select auth.uid())
  and private.staff_development_can_manage_sensitive_access(organization_id)
);

drop policy if exists sd_sensitive_grants_delete on public.staff_development_access_grants;
create policy sd_sensitive_grants_delete
on public.staff_development_access_grants for delete to authenticated
using (private.staff_development_can_manage_sensitive_access(organization_id));

drop policy if exists sd_students_manage on public.staff_development_students;
drop policy if exists sd_students_read on public.staff_development_students;
create policy sd_students_read
on public.staff_development_students for select to authenticated
using (
  auth_user_id = (select auth.uid())
  or created_by = (select auth.uid())
  or private.staff_development_has_area_access(organization_id, 'student_support', false)
);
create policy sd_students_insert
on public.staff_development_students for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.staff_development_has_area_access(organization_id, 'student_support', true)
);
create policy sd_students_update
on public.staff_development_students for update to authenticated
using (private.staff_development_has_area_access(organization_id, 'student_support', true))
with check (private.staff_development_has_area_access(organization_id, 'student_support', true));
create policy sd_students_delete
on public.staff_development_students for delete to authenticated
using (private.staff_development_has_area_access(organization_id, 'student_support', true));

drop policy if exists sd_interventions_read on public.staff_development_interventions;
drop policy if exists sd_interventions_update on public.staff_development_interventions;
drop policy if exists sd_interventions_delete on public.staff_development_interventions;
create policy sd_interventions_read
on public.staff_development_interventions for select to authenticated
using (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'interventions', false))
);
create policy sd_interventions_update
on public.staff_development_interventions for update to authenticated
using (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'interventions', true))
)
with check (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'interventions', true))
);
create policy sd_interventions_delete
on public.staff_development_interventions for delete to authenticated
using (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'interventions', true))
);

drop policy if exists sd_checkins_read on public.staff_development_checkins;
drop policy if exists sd_checkins_update on public.staff_development_checkins;
drop policy if exists sd_checkins_delete on public.staff_development_checkins;
create policy sd_checkins_read
on public.staff_development_checkins for select to authenticated
using (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'pastoral', false))
);
create policy sd_checkins_update
on public.staff_development_checkins for update to authenticated
using (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'pastoral', true))
)
with check (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'pastoral', true))
);
create policy sd_checkins_delete
on public.staff_development_checkins for delete to authenticated
using (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'pastoral', true))
);

drop policy if exists sd_progress_read on public.staff_development_course_progress;
create policy sd_progress_read
on public.staff_development_course_progress for select to authenticated
using (
  user_id = (select auth.uid())
  or (organization_id is not null and private.staff_development_has_area_access(organization_id, 'staff_progress', false))
);
