insert into public.platform_admins(user_id, created_at)
select u.id, now()
from auth.users u
where lower(u.email)=lower('msgray95@hotmail.com')
on conflict (user_id) do nothing;

update public.staff_profiles sp
set role='Admin', legacy_standalone_access=true, updated_at=now()
from auth.users u
where sp.id=u.id and lower(u.email)=lower('msgray95@hotmail.com');
