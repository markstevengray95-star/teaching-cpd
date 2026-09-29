create extension if not exists pgcrypto;

create table if not exists public.cpd_coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'CPD Coach conversation',
  goal text not null default '',
  messages jsonb not null default '[]'::jsonb,
  context_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_pathway_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_focus text not null,
  goal text not null default '',
  selected_course_ids text[] not null default '{}',
  rationale jsonb not null default '{}'::jsonb,
  target_completion date,
  status text not null default 'active' check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_walks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid,
  site_id uuid,
  created_by uuid not null references auth.users(id) on delete cascade,
  observed_on date not null default current_date,
  department text not null default '',
  focus text not null,
  evidence_notes text not null default '',
  strengths text[] not null default '{}',
  development_points text[] not null default '{}',
  signals jsonb not null default '{}'::jsonb,
  priority_id uuid references public.improvement_priorities(id) on delete set null,
  recommended_course_ids text[] not null default '{}',
  shared_for_aggregate boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.improvement_cpd_programmes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  site_id uuid,
  priority_id uuid not null references public.improvement_priorities(id) on delete cascade,
  title text not null,
  audience text not null default 'All staff',
  course_ids text[] not null default '{}',
  pathway_ids text[] not null default '{}',
  facilitator_minutes integer not null default 60 check (facilitator_minutes in (15,30,60,90)),
  review_days integer[] not null default array[7,30,90],
  success_measure text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_presenter_state (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  presenter_id uuid not null references auth.users(id) on delete cascade,
  course_id text,
  module_id text,
  slide_index integer not null default 0,
  show_results boolean not null default false,
  audience_questions_open boolean not null default false,
  word_cloud_open boolean not null default false,
  presenter_notes_open boolean not null default false,
  started_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists cpd_coach_conversations_user_idx on public.cpd_coach_conversations(user_id, updated_at desc);
create index if not exists personal_pathway_plans_user_idx on public.personal_pathway_plans(user_id, updated_at desc);
create index if not exists learning_walks_org_idx on public.learning_walks(organisation_id, observed_on desc);
create index if not exists learning_walks_creator_idx on public.learning_walks(created_by, observed_on desc);
create index if not exists improvement_cpd_programmes_org_idx on public.improvement_cpd_programmes(organisation_id, active);

alter table public.cpd_coach_conversations enable row level security;
alter table public.personal_pathway_plans enable row level security;
alter table public.learning_walks enable row level security;
alter table public.improvement_cpd_programmes enable row level security;
alter table public.live_presenter_state enable row level security;

grant select, insert, update, delete on public.cpd_coach_conversations to authenticated;
grant select, insert, update, delete on public.personal_pathway_plans to authenticated;
grant select, insert, update, delete on public.learning_walks to authenticated;
grant select, insert, update, delete on public.improvement_cpd_programmes to authenticated;
grant select, insert, update, delete on public.live_presenter_state to authenticated;

drop policy if exists coach_conversations_owner on public.cpd_coach_conversations;
create policy coach_conversations_owner on public.cpd_coach_conversations for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists personal_pathway_owner on public.personal_pathway_plans;
create policy personal_pathway_owner on public.personal_pathway_plans for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists learning_walk_insert on public.learning_walks;
create policy learning_walk_insert on public.learning_walks for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and exists (
    select 1 from public.staff_profiles sp
    where sp.id = (select auth.uid())
      and sp.organisation_id is not distinct from learning_walks.organisation_id
  )
);

drop policy if exists learning_walk_select on public.learning_walks;
create policy learning_walk_select on public.learning_walks for select to authenticated
using (
  created_by = (select auth.uid())
  or (
    shared_for_aggregate
    and exists (
      select 1 from public.staff_profiles me
      where me.id = (select auth.uid())
        and me.organisation_id is not null
        and me.organisation_id = learning_walks.organisation_id
        and me.role in ('Department Lead','CPD Lead','Admin')
    )
  )
);

drop policy if exists learning_walk_update on public.learning_walks;
create policy learning_walk_update on public.learning_walks for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

drop policy if exists learning_walk_delete on public.learning_walks;
create policy learning_walk_delete on public.learning_walks for delete to authenticated
using (created_by = (select auth.uid()));

drop policy if exists improvement_programmes_select on public.improvement_cpd_programmes;
create policy improvement_programmes_select on public.improvement_cpd_programmes for select to authenticated
using (
  exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = improvement_cpd_programmes.organisation_id
  )
);

drop policy if exists improvement_programmes_manage on public.improvement_cpd_programmes;
create policy improvement_programmes_manage on public.improvement_cpd_programmes for all to authenticated
using (
  exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = improvement_cpd_programmes.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = improvement_cpd_programmes.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);

drop policy if exists presenter_state_read on public.live_presenter_state;
create policy presenter_state_read on public.live_presenter_state for select to authenticated
using (
  presenter_id = (select auth.uid())
  or exists (
    select 1 from public.live_participants lp
    where lp.session_id = live_presenter_state.session_id
      and lp.user_id = (select auth.uid())
  )
);

drop policy if exists presenter_state_manage on public.live_presenter_state;
create policy presenter_state_manage on public.live_presenter_state for all to authenticated
using (presenter_id = (select auth.uid()))
with check (
  presenter_id = (select auth.uid())
  and exists (
    select 1 from public.live_sessions ls
    where ls.id = live_presenter_state.session_id
      and ls.presenter_id = (select auth.uid())
  )
);
