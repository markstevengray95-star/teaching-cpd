-- School timetable builder and personal planner integration.
-- Private storage; public RPCs execute as caller and delegate to guarded private functions.
begin;
create schema if not exists private;
create table private.school_timetable_workspaces (
 organization_id uuid primary key references public.school_organizations(id) on delete cascade,
 draft jsonb not null default '{}'::jsonb, links jsonb not null default '{}'::jsonb,
 revision bigint not null default 0, published jsonb, published_links jsonb,
 publication_id uuid, published_at timestamptz, sync_revision bigint not null default 0,
 updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
alter table private.school_timetable_workspaces enable row level security;
revoke all on private.school_timetable_workspaces from public,anon,authenticated;
create function private.timetable_member(org_id uuid,uid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select uid is not null and (exists(select 1 from public.school_organizations o where o.id=org_id and o.owner_user_id=uid)
 or exists(select 1 from public.school_organization_members m where m.organization_id=org_id and m.user_id=uid));
$$;
create function private.timetable_manager(org_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.timetable_member(org_id,auth.uid()) and
 (exists(select 1 from public.school_organizations o where o.id=org_id and o.owner_user_id=auth.uid())
 or exists(select 1 from public.school_organization_members m where m.organization_id=org_id and m.user_id=auth.uid() and m.role in ('owner','admin','slt','administrator'))
 or exists(select 1 from public.staff_development_role_assignments r where r.organization_id=org_id and r.user_id=auth.uid() and r.role in ('slt','administrator')));
$$;
revoke all on function private.timetable_member(uuid,uuid),private.timetable_manager(uuid) from public,anon,authenticated;
create function private.timetable_context_impl() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'canManage',private.timetable_manager(o.id),
 'staff',case when private.timetable_manager(o.id) then
 (select coalesce(jsonb_agg(jsonb_build_object('id',u.uid,'name',coalesce(nullif(p.display_name,''),'Staff account '||left(u.uid::text,8))) order by p.display_name,u.uid),'[]'::jsonb)
 from (select user_id uid from public.school_organization_members where organization_id=o.id union select o.owner_user_id) u
 left join public.staff_development_profiles p on p.user_id=u.uid) else '[]'::jsonb end) order by o.name),'[]'::jsonb)
 from public.school_organizations o where private.timetable_member(o.id,auth.uid());
$$;
create function private.timetable_admin_impl(org_id uuid,operation text,expected_revision bigint,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w private.school_timetable_workspaces; new_links jsonb; schedule jsonb;
begin
 if not private.timetable_manager(org_id) then raise exception 'School owner, administrator or SLT access required' using errcode='42501'; end if;
 if operation='load' then
  select * into w from private.school_timetable_workspaces where organization_id=org_id;
  return jsonb_build_object('revision',coalesce(w.revision,0),'data',coalesce(w.draft,'{}'::jsonb),'links',coalesce(w.links,'{}'::jsonb),'publicationId',w.publication_id,'publishedAt',w.published_at);
 end if;
 if operation not in ('save','publish','daily') then raise exception 'Unknown timetable operation'; end if;
 insert into private.school_timetable_workspaces(organization_id) values(org_id) on conflict do nothing;
 select * into w from private.school_timetable_workspaces where organization_id=org_id for update;
 if expected_revision is distinct from w.revision then raise exception 'Another timetabler changed this draft. Reload before saving or publishing.' using errcode='40001'; end if;
 if operation in ('save','publish') then
  if jsonb_typeof(payload->'data') is distinct from 'object' or octet_length(payload::text)>10485760 then raise exception 'Invalid timetable data or upload exceeds 10 MB'; end if;
  new_links=coalesce(payload->'links',w.links);
  if jsonb_typeof(new_links) is distinct from 'object' then raise exception 'Invalid staff links'; end if;
  if exists(select 1 from jsonb_each_text(new_links) l where not exists(select 1 from jsonb_array_elements(coalesce(payload->'data'->'staff','[]')) t where t->>'id'=l.key)
   or not private.timetable_member(org_id,l.value::uuid)) then raise exception 'Every linked account must belong to this school and have a timetable staff record'; end if;
  if (select count(*) from jsonb_each_text(new_links))<>(select count(distinct value) from jsonb_each_text(new_links)) then raise exception 'Link each CPD account to only one timetable staff record'; end if;
 end if;
 if operation='save' then
  update private.school_timetable_workspaces set draft=payload->'data',links=new_links,revision=revision+1,updated_by=auth.uid(),updated_at=now() where organization_id=org_id returning * into w;
 elsif operation='publish' then
  schedule=payload->'data'->'publishedTimetable';
  if jsonb_typeof(schedule->'assignments') is distinct from 'array' or jsonb_array_length(schedule->'assignments')=0
   or schedule->>'id' is distinct from payload->'data'->>'activeTimetableId'
   or jsonb_array_length(coalesce(schedule->'unscheduled','[]'))>0
   or coalesce((schedule->>'scheduledPeriods')::integer,0)<coalesce((schedule->>'requiredPeriods')::integer,0)
   then raise exception 'Choose a complete, approved timetable before publishing'; end if;
  if not exists(select 1 from jsonb_each_text(new_links)) then raise exception 'Link at least one timetable teacher to a CPD account before publishing'; end if;
  if exists(select 1 from jsonb_array_elements(schedule->'assignments') a where not exists(select 1 from jsonb_array_elements(payload->'data'->'staff') t where t->>'id'=a->>'teacherId')) then raise exception 'Timetable references a missing teacher'; end if;
  update private.school_timetable_workspaces set draft=payload->'data',links=new_links,published=payload->'data',published_links=new_links,
   publication_id=gen_random_uuid(),published_at=now(),sync_revision=sync_revision+1,revision=revision+1,updated_by=auth.uid(),updated_at=now() where organization_id=org_id returning * into w;
 else
  if w.published is null then raise exception 'Publish the timetable before syncing daily changes'; end if;
  update private.school_timetable_workspaces set published=published||jsonb_build_object('dailyChanges',coalesce(draft->'dailyChanges','[]'),'coverPlans',coalesce(draft->'coverPlans','[]'),'rooms',coalesce(draft->'rooms','[]')),
   sync_revision=sync_revision+1,revision=revision+1,updated_by=auth.uid(),updated_at=now() where organization_id=org_id returning * into w;
 end if;
 return jsonb_build_object('revision',w.revision,'publicationId',w.publication_id,'publishedAt',w.published_at);
end;
$$;
create function private.timetable_clean_lesson(a jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each(a) where key=any(array['id','requirementId','subject','groupId','groupName','year','week','dayKey','dayLabel','periodId','periodName','periodIndex','periodIndices','slotIds','duration','teacherId','teacherName','teacherInitials','roomId','roomName','roomCode']);
$$;
revoke all on function private.timetable_clean_lesson(jsonb) from public,anon,authenticated;
create function private.timetable_personal_impl(org_id uuid,on_date date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare w private.school_timetable_workspaces; teacher text; master jsonb; daily jsonb; school jsonb; cycle_week text; anchor date; day_key text; d date;
begin
 if not private.timetable_member(org_id,auth.uid()) then raise exception 'School membership required' using errcode='42501'; end if;
 select * into w from private.school_timetable_workspaces where organization_id=org_id;
 select key into teacher from jsonb_each_text(coalesce(w.published_links,'{}')) where value=auth.uid()::text;
 if w.published is null or teacher is null then return jsonb_build_object('linked',false,'organizationId',org_id); end if;
 school=w.published->'publishedSchool';
 d=coalesce(on_date,(now() at time zone coalesce(school->'school'->>'timezone','Europe/London'))::date);
 anchor=coalesce(nullif(school->'operationsSettings'->>'cycleAnchor','')::date,nullif(w.published->'terms'->0->>'start','')::date,'2026-09-07'::date);
 anchor=anchor-((extract(isodow from anchor)::int)-1);
 cycle_week=case when school->'school'->>'cycle'='two-week' and ((floor((d-anchor)/7.0)::int%2)+2)%2=1 then 'B' else 'A' end;
 day_key=(array['mon','tue','wed','thu','fri','sat','sun'])[extract(isodow from d)::int];
 select coalesce(jsonb_agg(private.timetable_clean_lesson(a) order by a->>'week',a->>'dayKey',(a->>'periodIndex')::int),'[]') into master
 from jsonb_array_elements(w.published->'publishedTimetable'->'assignments') a where a->>'teacherId'=teacher;
 select coalesce(jsonb_agg(private.timetable_clean_lesson(a)||jsonb_build_object('cancelled',coalesce(ch.cancelled,false),'cover',cv.cover is not null,
  'teacherId',coalesce(cv.cover->>'teacherId',a->>'teacherId'),'teacherName',coalesce(t.staff->>'name',a->>'teacherName'),'roomCode',coalesce(r.room->>'code',a->>'roomCode'),'roomName',coalesce(r.room->>'name',a->>'roomName'),
  'roomChanged',ch.room_id is not null,'originalTeacherId',a->>'teacherId') order by (a->>'periodIndex')::int),'[]') into daily
 from jsonb_array_elements(w.published->'publishedTimetable'->'assignments') a
 left join lateral (select c cover from jsonb_array_elements(coalesce(w.published->'coverPlans','[]')) p cross join lateral jsonb_array_elements(coalesce(p->'assignments','[]')) c
  where p->>'date'=d::text and p->>'timetableId'=w.published->'publishedTimetable'->>'id' and c->>'lessonId'=a->>'id' limit 1) cv on true
 left join lateral (select bool_or(c->>'type' in ('trip','exam','cancelled')) cancelled,
  (array_agg(c->>'roomId' order by n desc) filter(where c->>'type'='room'))[1] room_id
  from jsonb_array_elements(coalesce(w.published->'dailyChanges','[]')) with ordinality x(c,n)
  where c->>'date'=d::text and (coalesce(c->>'lessonId','')='' or c->>'lessonId'=a->>'id')
   and (coalesce(c->>'groupId','')='' or c->>'groupId'=a->>'groupId')
   and (coalesce(c->>'slotId','')='' or coalesce(a->'slotIds','[]') ? (c->>'slotId'))) ch on true
 left join lateral (select s staff from jsonb_array_elements(coalesce(school->'staff','[]')) s where s->>'id'=coalesce(cv.cover->>'teacherId',a->>'teacherId') limit 1) t on true
 left join lateral (select s room from jsonb_array_elements(coalesce(w.published->'rooms',school->'rooms','[]')) s where s->>'id'=coalesce(ch.room_id,cv.cover->>'roomId',a->>'roomId') limit 1) r on true
 where a->>'week'=cycle_week and a->>'dayKey'=day_key and (a->>'teacherId'=teacher or cv.cover->>'teacherId'=teacher);
 return jsonb_build_object('linked',true,'organizationId',org_id,'publicationId',w.publication_id,'publishedAt',w.published_at,'syncRevision',w.sync_revision,'teacherId',teacher,
  'school',jsonb_build_object('name',school->'school'->>'name','cycle',school->'school'->>'cycle','cycleAnchor',anchor,'timezone',school->'school'->>'timezone'),
  'days',school->'days','blocks',school->'blocks','dayOverrides',coalesce(school->'dayOverrides','{}'),'date',d,'week',cycle_week,'assignments',master,'today',daily);
end;
$$;
revoke all on function private.timetable_context_impl(),private.timetable_admin_impl(uuid,text,bigint,jsonb),private.timetable_personal_impl(uuid,date) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.timetable_context_impl(),private.timetable_admin_impl(uuid,text,bigint,jsonb),private.timetable_personal_impl(uuid,date) to authenticated;
create function public.school_timetable_context() returns jsonb language sql stable security invoker set search_path='' as $$ select private.timetable_context_impl(); $$;
create function public.school_timetable_admin(org_id uuid,operation text,expected_revision bigint default 0,payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$ select private.timetable_admin_impl(org_id,operation,expected_revision,payload); $$;
create function public.school_timetable_personal(org_id uuid,on_date date default null) returns jsonb
language sql stable security invoker set search_path='' as $$ select private.timetable_personal_impl(org_id,on_date); $$;
revoke all on function public.school_timetable_context(),public.school_timetable_admin(uuid,text,bigint,jsonb),public.school_timetable_personal(uuid,date) from public,anon;
grant execute on function public.school_timetable_context(),public.school_timetable_admin(uuid,text,bigint,jsonb),public.school_timetable_personal(uuid,date) to authenticated;
commit;
