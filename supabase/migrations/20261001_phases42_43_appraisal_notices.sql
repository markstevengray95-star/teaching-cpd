-- Phases 42-43: appraisal upgrade and school notices centre.

alter table public.appraisal_objectives add column if not exists objective_area text not null default 'Professional practice';
alter table public.appraisal_objectives add column if not exists progress_summary text not null default '';
alter table public.appraisal_objectives add column if not exists next_step text not null default '';
alter table public.appraisal_objectives add column if not exists progress_percent integer not null default 0 check (progress_percent between 0 and 100);

alter table public.appraisal_reviews add column if not exists meeting_notes text not null default '';
alter table public.appraisal_reviews add column if not exists support_needed text not null default '';
alter table public.appraisal_reviews add column if not exists completion_summary text not null default '';

create table if not exists public.school_notices (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.school_organizations(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'General' check (category in ('General','Teaching','Pastoral','Safeguarding','SEND / EAL','CPD','Operations','Events','Urgent')),
  audience text not null default 'All staff' check (audience in ('All staff','Teaching staff','Tutors','Leadership','Support staff','Department')),
  target_department text not null default '',
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  pinned boolean not null default false,
  requires_acknowledgement boolean not null default false,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  published_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_notice_reads (
  notice_id uuid not null references public.school_notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  primary key (notice_id,user_id)
);

create index if not exists school_notices_org_active_idx on public.school_notices(organisation_id, starts_at desc, expires_at);
create index if not exists school_notice_reads_user_idx on public.school_notice_reads(user_id, read_at desc);

alter table public.school_notices enable row level security;
alter table public.school_notice_reads enable row level security;

revoke all on public.school_notices from anon, authenticated;
revoke all on public.school_notice_reads from anon, authenticated;
grant select, insert, update, delete on public.school_notices to authenticated;
grant select, insert, update, delete on public.school_notice_reads to authenticated;

drop policy if exists school_notices_read_org on public.school_notices;
create policy school_notices_read_org on public.school_notices for select to authenticated
using (private.sd_is_org_member(organisation_id));

drop policy if exists school_notices_publish_leader on public.school_notices;
create policy school_notices_publish_leader on public.school_notices for insert to authenticated
with check (private.sd_is_org_leader(organisation_id) and published_by=(select auth.uid()));

drop policy if exists school_notices_update_leader on public.school_notices;
create policy school_notices_update_leader on public.school_notices for update to authenticated
using (private.sd_is_org_leader(organisation_id))
with check (private.sd_is_org_leader(organisation_id));

drop policy if exists school_notices_delete_leader on public.school_notices;
create policy school_notices_delete_leader on public.school_notices for delete to authenticated
using (private.sd_is_org_leader(organisation_id));

drop policy if exists school_notice_reads_select_own on public.school_notice_reads;
create policy school_notice_reads_select_own on public.school_notice_reads for select to authenticated
using (user_id=(select auth.uid()));

drop policy if exists school_notice_reads_insert_own on public.school_notice_reads;
create policy school_notice_reads_insert_own on public.school_notice_reads for insert to authenticated
with check (user_id=(select auth.uid()) and exists(select 1 from public.school_notices n where n.id=notice_id and private.sd_is_org_member(n.organisation_id)));

drop policy if exists school_notice_reads_update_own on public.school_notice_reads;
create policy school_notice_reads_update_own on public.school_notice_reads for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists school_notice_reads_delete_own on public.school_notice_reads;
create policy school_notice_reads_delete_own on public.school_notice_reads for delete to authenticated
using (user_id=(select auth.uid()));
