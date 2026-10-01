-- Phase 32: personal teaching resource library.
-- Resources are private to the signed-in user. Organisation IDs are metadata only;
-- they do not widen read access.

create table if not exists public.staff_development_saved_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.school_organizations(id) on delete set null,
  title text not null,
  resource_type text not null check (resource_type = any (array[
    'retrieval-question'::text,
    'quiz'::text,
    'exit-ticket'::text,
    'differentiation'::text,
    'learning-objective'::text,
    'worksheet'::text,
    'vocabulary'::text,
    'hinge-question'::text,
    'lesson-starter'::text
  ])),
  subject text not null default '',
  year_group text not null default '',
  topic text not null default '',
  content text not null,
  source text not null default 'edited' check (source = any (array['ai'::text, 'template'::text, 'edited'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_development_saved_resources_user_updated_idx
  on public.staff_development_saved_resources(user_id, updated_at desc);
create index if not exists staff_development_saved_resources_org_idx
  on public.staff_development_saved_resources(organization_id, updated_at desc)
  where organization_id is not null;

alter table public.staff_development_saved_resources enable row level security;

revoke all on public.staff_development_saved_resources from anon, authenticated;
grant select, insert, update, delete on public.staff_development_saved_resources to authenticated;

drop policy if exists saved_resources_read_own on public.staff_development_saved_resources;
create policy saved_resources_read_own
on public.staff_development_saved_resources
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists saved_resources_insert_own on public.staff_development_saved_resources;
create policy saved_resources_insert_own
on public.staff_development_saved_resources
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists saved_resources_update_own on public.staff_development_saved_resources;
create policy saved_resources_update_own
on public.staff_development_saved_resources
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists saved_resources_delete_own on public.staff_development_saved_resources;
create policy saved_resources_delete_own
on public.staff_development_saved_resources
for delete to authenticated
using ((select auth.uid()) = user_id);
