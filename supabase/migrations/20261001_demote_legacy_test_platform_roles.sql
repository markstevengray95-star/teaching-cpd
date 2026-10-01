update public.staff_development_profiles p
set platform_role = 'user', updated_at = now()
where p.platform_role = 'admin'
  and exists (
    select 1
    from auth.users u
    where u.id = p.user_id
      and coalesce(u.raw_app_meta_data->>'platform_test_user','false') = 'true'
  )
  and not exists (
    select 1 from public.platform_admins pa where pa.user_id = p.user_id
  );
