create extension if not exists pgcrypto;

-- Staff Development sync: professional review records used by /appraisal.
-- Appraisal objectives/evidence already exist in the Teaching CPD schema.
create table if not exists public.appraisal_reviews (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,
  cycle_label text not null default 'Current cycle',
  review_type text not null default 'mid_year' check (review_type in ('initial','mid_year','final')),
  scheduled_on date,
  status text not null default 'draft' check (status in ('draft','scheduled','agreed','completed')),
  employee_reflection text not null default '',
  reviewer_summary text not null default '',
  agreed_actions jsonb not null default '[]'::jsonb,
  next_review_date date,
  shared_with_leadership boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appraisal_reviews_user_idx on public.appraisal_reviews(user_id, created_at desc);
create index if not exists appraisal_reviews_reviewer_idx on public.appraisal_reviews(reviewer_id, scheduled_on);
create index if not exists appraisal_reviews_org_idx on public.appraisal_reviews(organisation_id, status, scheduled_on);

alter table public.appraisal_reviews enable row level security;
revoke all on table public.appraisal_reviews from anon;
grant select, insert, update, delete on table public.appraisal_reviews to authenticated;

drop policy if exists appraisal_reviews_read on public.appraisal_reviews;
create policy appraisal_reviews_read on public.appraisal_reviews for select to authenticated
using (
  user_id = (select auth.uid())
  or reviewer_id = (select auth.uid())
  or (
    shared_with_leadership
    and exists (
      select 1 from public.staff_profiles me
      where me.id = (select auth.uid())
        and me.organisation_id = appraisal_reviews.organisation_id
        and me.role in ('CPD Lead','Admin')
    )
  )
);

drop policy if exists appraisal_reviews_insert on public.appraisal_reviews;
create policy appraisal_reviews_insert on public.appraisal_reviews for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.staff_profiles me
      join public.staff_profiles target on target.id = appraisal_reviews.user_id
      where me.id = (select auth.uid())
        and me.organisation_id = appraisal_reviews.organisation_id
        and target.organisation_id = appraisal_reviews.organisation_id
        and me.role in ('CPD Lead','Admin')
    )
  )
);

drop policy if exists appraisal_reviews_update on public.appraisal_reviews;
create policy appraisal_reviews_update on public.appraisal_reviews for update to authenticated
using (
  user_id = (select auth.uid())
  or reviewer_id = (select auth.uid())
  or exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = appraisal_reviews.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
)
with check (
  user_id = (select auth.uid())
  or reviewer_id = (select auth.uid())
  or exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = appraisal_reviews.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);

drop policy if exists appraisal_reviews_delete on public.appraisal_reviews;
create policy appraisal_reviews_delete on public.appraisal_reviews for delete to authenticated
using (
  exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = appraisal_reviews.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);

-- Role-based new-staff induction used by /induction.
create table if not exists public.staff_induction_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_focus text not null,
  start_date date not null default current_date,
  target_date date,
  mentor_id uuid references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active','paused','completed','cancelled')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_induction_tasks (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.staff_induction_assignments(id) on delete cascade,
  title text not null,
  description text not null default '',
  task_type text not null default 'checklist' check (task_type in ('course','policy','meeting','checklist','evidence')),
  linked_course_id text,
  linked_policy_id uuid references public.school_policies(id) on delete set null,
  due_date date,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','waived')),
  completed_at timestamptz,
  staff_note text not null default '',
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_induction_assignment_user_idx on public.staff_induction_assignments(user_id, status, start_date desc);
create index if not exists staff_induction_assignment_org_idx on public.staff_induction_assignments(organisation_id, status, target_date);
create index if not exists staff_induction_assignment_mentor_idx on public.staff_induction_assignments(mentor_id, status);
create index if not exists staff_induction_tasks_assignment_idx on public.staff_induction_tasks(assignment_id, sort_order);
create index if not exists staff_induction_tasks_due_idx on public.staff_induction_tasks(due_date, status);

alter table public.staff_induction_assignments enable row level security;
alter table public.staff_induction_tasks enable row level security;
revoke all on table public.staff_induction_assignments, public.staff_induction_tasks from anon;
grant select, insert, update, delete on table public.staff_induction_assignments, public.staff_induction_tasks to authenticated;

drop policy if exists staff_induction_assignments_read on public.staff_induction_assignments;
create policy staff_induction_assignments_read on public.staff_induction_assignments for select to authenticated
using (
  user_id = (select auth.uid())
  or mentor_id = (select auth.uid())
  or exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = staff_induction_assignments.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);

drop policy if exists staff_induction_assignments_insert on public.staff_induction_assignments;
create policy staff_induction_assignments_insert on public.staff_induction_assignments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.staff_profiles me
    join public.staff_profiles target on target.id = staff_induction_assignments.user_id
    where me.id = (select auth.uid())
      and me.organisation_id = staff_induction_assignments.organisation_id
      and target.organisation_id = staff_induction_assignments.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);

drop policy if exists staff_induction_assignments_update on public.staff_induction_assignments;
create policy staff_induction_assignments_update on public.staff_induction_assignments for update to authenticated
using (
  user_id = (select auth.uid())
  or mentor_id = (select auth.uid())
  or exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = staff_induction_assignments.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
)
with check (
  user_id = (select auth.uid())
  or mentor_id = (select auth.uid())
  or exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = staff_induction_assignments.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);

drop policy if exists staff_induction_assignments_delete on public.staff_induction_assignments;
create policy staff_induction_assignments_delete on public.staff_induction_assignments for delete to authenticated
using (
  exists (
    select 1 from public.staff_profiles me
    where me.id = (select auth.uid())
      and me.organisation_id = staff_induction_assignments.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);

drop policy if exists staff_induction_tasks_read on public.staff_induction_tasks;
create policy staff_induction_tasks_read on public.staff_induction_tasks for select to authenticated
using (
  exists (
    select 1 from public.staff_induction_assignments a
    where a.id = staff_induction_tasks.assignment_id
      and (
        a.user_id = (select auth.uid())
        or a.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.staff_profiles me
          where me.id = (select auth.uid())
            and me.organisation_id = a.organisation_id
            and me.role in ('CPD Lead','Admin')
        )
      )
  )
);

drop policy if exists staff_induction_tasks_insert on public.staff_induction_tasks;
create policy staff_induction_tasks_insert on public.staff_induction_tasks for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.staff_induction_assignments a
    join public.staff_profiles me on me.id = (select auth.uid())
    where a.id = staff_induction_tasks.assignment_id
      and me.organisation_id = a.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);

drop policy if exists staff_induction_tasks_update on public.staff_induction_tasks;
create policy staff_induction_tasks_update on public.staff_induction_tasks for update to authenticated
using (
  exists (
    select 1 from public.staff_induction_assignments a
    where a.id = staff_induction_tasks.assignment_id
      and (
        a.user_id = (select auth.uid())
        or a.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.staff_profiles me
          where me.id = (select auth.uid())
            and me.organisation_id = a.organisation_id
            and me.role in ('CPD Lead','Admin')
        )
      )
  )
)
with check (
  exists (
    select 1 from public.staff_induction_assignments a
    where a.id = staff_induction_tasks.assignment_id
      and (
        a.user_id = (select auth.uid())
        or a.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.staff_profiles me
          where me.id = (select auth.uid())
            and me.organisation_id = a.organisation_id
            and me.role in ('CPD Lead','Admin')
        )
      )
  )
);

drop policy if exists staff_induction_tasks_delete on public.staff_induction_tasks;
create policy staff_induction_tasks_delete on public.staff_induction_tasks for delete to authenticated
using (
  exists (
    select 1 from public.staff_induction_assignments a
    join public.staff_profiles me on me.id = (select auth.uid())
    where a.id = staff_induction_tasks.assignment_id
      and me.organisation_id = a.organisation_id
      and me.role in ('CPD Lead','Admin')
  )
);
