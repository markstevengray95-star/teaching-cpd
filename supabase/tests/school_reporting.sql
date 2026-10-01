-- Transaction-only fixtures: no test schools or users persist.
begin;
do $test$
declare admin_a uuid:=gen_random_uuid(); staff_a uuid:=gen_random_uuid(); admin_b uuid:=gen_random_uuid(); inactive_a uuid:=gen_random_uuid();
org_a uuid:=gen_random_uuid(); org_b uuid:=gen_random_uuid(); snapshot jsonb;
begin
insert into auth.users(id,email,raw_user_meta_data) values
(admin_a,admin_a::text||'@example.invalid','{}'),(staff_a,staff_a::text||'@example.invalid','{}'),
(admin_b,admin_b::text||'@example.invalid','{}'),(inactive_a,inactive_a::text||'@example.invalid','{}');
insert into public.organisations(id,name,slug,created_by) values
(org_a,'Fixture school A',org_a::text,admin_a),(org_b,'Fixture school B',org_b::text,admin_b);
update public.staff_profiles set organisation_id=org_a, role='Admin',full_name='Fixture admin A' where id=admin_a;
update public.staff_profiles set organisation_id=org_a, role='Staff',full_name='Fixture staff A' where id=staff_a;
update public.staff_profiles set organisation_id=org_b, role='Admin',full_name='Fixture admin B' where id=admin_b;
update public.staff_profiles set organisation_id=org_a, role='Admin',full_name='Fixture inactive A' where id=inactive_a;
insert into public.organisation_memberships(organisation_id,user_id,member_role,active) values
(org_a,admin_a,'org_admin',true),(org_a,staff_a,'member',true),(org_b,admin_b,'org_admin',true),(org_a,inactive_a,'org_admin',false)
on conflict(organisation_id,user_id) do update set active=excluded.active,member_role=excluded.member_role;
insert into public.course_progress(user_id,course_id,completed_at,reflections) values
(staff_a,'effective-questioning',now(),'{"private":"DO NOT EXPORT"}'),(admin_b,'effective-questioning',now(),'{"private":"OTHER SCHOOL"}');
perform set_config('request.jwt.claim.sub',admin_a::text,true);
execute 'set local role authenticated';
snapshot:=public.school_reporting_snapshot();
if snapshot->'organisation'->>'id'<>org_a::text then raise exception 'Wrong school'; end if;
if jsonb_array_length(snapshot->'staff')<>2 or jsonb_array_length(snapshot->'progress')<>1 then raise exception 'Membership isolation failed'; end if;
if snapshot::text like '%DO NOT EXPORT%' or snapshot::text like '%OTHER SCHOOL%' or snapshot::text like '%reflections%' then raise exception 'Private information leaked'; end if;
if (select count(*) from public.course_progress)<>0 then raise exception 'Raw progress permissions broadened'; end if;
perform set_config('request.jwt.claim.sub',admin_b::text,true);
snapshot:=public.school_reporting_snapshot();
if jsonb_array_length(snapshot->'staff')<>1 or snapshot->'organisation'->>'id'<>org_b::text then raise exception 'Cross-school isolation failed'; end if;
perform set_config('request.jwt.claim.sub',staff_a::text,true);
begin perform public.school_reporting_snapshot(); raise exception 'Staff could report'; exception when insufficient_privilege then null; end;
perform set_config('request.jwt.claim.sub',inactive_a::text,true);
begin perform public.school_reporting_snapshot(); raise exception 'Inactive admin could report'; exception when insufficient_privilege then null; end;
execute 'set local role anon';
begin perform public.school_reporting_snapshot(); raise exception 'Anonymous could report'; exception when insufficient_privilege then null; end;
execute 'reset role';
raise notice 'PASS: own-school reporting, two-school isolation, private reflections omitted, unchanged raw RLS, staff/inactive/anonymous denied';
end;
$test$;
rollback;
