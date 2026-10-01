create table public.school_setup_checkpoints(
organisation_id uuid not null references public.organisations(id) on delete cascade,
checkpoint_id text not null check(checkpoint_id in ('pilot_login','pilot_save','pilot_report','procurement_review')),
completed boolean not null default false,
completed_by uuid not null references auth.users(id),
updated_at timestamptz not null default now(),
primary key(organisation_id,checkpoint_id)
);
create index school_setup_checkpoints_completed_by_idx on public.school_setup_checkpoints(completed_by);
alter table public.school_setup_checkpoints enable row level security;
revoke all on public.school_setup_checkpoints from public,anon,authenticated;
grant select,insert,update on public.school_setup_checkpoints to authenticated;
create policy school_setup_read on public.school_setup_checkpoints for select to authenticated using (private.is_org_admin(organisation_id));
create policy school_setup_insert on public.school_setup_checkpoints for insert to authenticated with check (private.is_org_admin(organisation_id) and completed_by=(select auth.uid()));
create policy school_setup_update on public.school_setup_checkpoints for update to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id) and completed_by=(select auth.uid()));
create function private.stamp_school_checkpoint() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.completed_by:=(select auth.uid());new.updated_at:=now();return new;end;$$;
revoke all on function private.stamp_school_checkpoint() from public,anon,authenticated;
create trigger stamp_school_checkpoint before insert or update on public.school_setup_checkpoints for each row execute function private.stamp_school_checkpoint();
create function private.school_onboarding_snapshot_impl() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_org uuid;
begin
v_org:=private.current_org_id();
if (select auth.uid()) is null or v_org is null or not private.is_org_admin(v_org) then raise exception 'School administrator access required' using errcode='42501';end if;
return jsonb_build_object(
'generated_at',now(),'organisation_id',v_org,
'name',(select name from public.organisations where id=v_org),
'access_allowed',private.subscription_allows_access(v_org),
'domains',(select count(*) from public.organisation_domains where organisation_id=v_org and status='verified'),
'members',(select count(*) from public.staff_profiles sp where sp.organisation_id=v_org and exists(select 1 from public.organisation_memberships om where om.organisation_id=v_org and om.user_id=sp.id and om.active)),
'directory',(select count(*) from public.organisation_staff_directory where organisation_id=v_org and active),
'policies',(select count(*) from public.school_policies where organisation_id=v_org and active),
'requirements',(select count(*) from public.training_requirements where organisation_id=v_org and active and mandatory),
'assignments',(select count(*) from public.cpd_assignments where organisation_id=v_org and status<>'waived'),
'checkpoints',coalesce((select jsonb_agg(jsonb_build_object('checkpoint_id',checkpoint_id,'completed',completed,'updated_at',updated_at) order by checkpoint_id) from public.school_setup_checkpoints where organisation_id=v_org),'[]'::jsonb));
end;$$;
revoke all on function private.school_onboarding_snapshot_impl() from public,anon;
grant execute on function private.school_onboarding_snapshot_impl() to authenticated;
create function public.school_onboarding_snapshot() returns jsonb language sql stable security invoker set search_path='' as $$select private.school_onboarding_snapshot_impl();$$;
revoke all on function public.school_onboarding_snapshot() from public,anon;
grant execute on function public.school_onboarding_snapshot() to authenticated;
comment on table public.school_setup_checkpoints is 'School-admin attestations of pilot checks, not verified configuration or automatic launch approval.';
