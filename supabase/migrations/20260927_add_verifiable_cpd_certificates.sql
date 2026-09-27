create table if not exists public.cpd_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_ref text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  course_id text not null,
  completed_at timestamptz not null,
  recipient_name_snapshot text not null default '',
  organisation_name_snapshot text not null default 'Teaching CPD Hub',
  status text not null default 'active' check (status in ('active','revoked')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text not null default '',
  constraint cpd_certificates_unique_completion unique (user_id, course_id, completed_at)
);

alter table public.cpd_certificates enable row level security;

revoke all on table public.cpd_certificates from anon, authenticated;
grant select, insert on table public.cpd_certificates to authenticated;

create or replace function private.prepare_cpd_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_org_id uuid;
  v_org_name text;
  v_completed_at timestamptz;
begin
  if (select auth.uid()) is null or new.user_id <> (select auth.uid()) then
    raise exception 'Certificate can only be issued for the signed-in user';
  end if;

  select sp.full_name, sp.organisation_id
    into v_name, v_org_id
  from public.staff_profiles sp
  where sp.id = new.user_id;

  if v_name is null then
    raise exception 'Staff profile not found';
  end if;

  select cp.completed_at
    into v_completed_at
  from public.course_progress cp
  where cp.user_id = new.user_id
    and cp.course_id = new.course_id
    and cp.completed_at is not null
  limit 1;

  if v_completed_at is null or v_completed_at <> new.completed_at then
    raise exception 'A matching completed course record is required';
  end if;

  if v_org_id is not null then
    select coalesce(nullif(o.brand_name,''), o.name)
      into v_org_name
    from public.organisations o
    where o.id = v_org_id;
  end if;

  new.organisation_id := v_org_id;
  new.recipient_name_snapshot := coalesce(nullif(btrim(v_name),''), 'Staff member');
  new.organisation_name_snapshot := coalesce(nullif(btrim(v_org_name),''), 'Teaching CPD Hub');
  new.status := 'active';
  new.revoked_at := null;
  new.revoked_reason := '';

  if new.certificate_ref is null
     or new.certificate_ref !~ '^CPD-[0-9]{8}-[A-Z0-9]{7,16}$' then
    new.certificate_ref := 'CPD-'
      || to_char(new.completed_at at time zone 'UTC','YYYYMMDD')
      || '-'
      || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  else
    new.certificate_ref := upper(new.certificate_ref);
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_cpd_certificate() from public, anon, authenticated;

drop trigger if exists prepare_cpd_certificate_before_insert on public.cpd_certificates;
create trigger prepare_cpd_certificate_before_insert
before insert on public.cpd_certificates
for each row execute function private.prepare_cpd_certificate();

create policy "staff read own certificates"
on public.cpd_certificates
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "school admins read organisation certificates"
on public.cpd_certificates
for select
to authenticated
using (organisation_id is not null and private.is_org_admin(organisation_id));

create policy "staff issue certificates from own completed courses"
on public.cpd_certificates
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.course_progress cp
    where cp.user_id = (select auth.uid())
      and cp.course_id = cpd_certificates.course_id
      and cp.completed_at = cpd_certificates.completed_at
      and cp.completed_at is not null
  )
);

create index if not exists cpd_certificates_user_idx on public.cpd_certificates(user_id, issued_at desc);
create index if not exists cpd_certificates_org_idx on public.cpd_certificates(organisation_id, issued_at desc);
create index if not exists cpd_certificates_ref_idx on public.cpd_certificates(certificate_ref);
