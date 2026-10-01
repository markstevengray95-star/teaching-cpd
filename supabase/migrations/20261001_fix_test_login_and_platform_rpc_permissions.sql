-- Repair server-side test-login provisioning and Platform Owner school controls.
-- The public RPC wrappers delegate to functions in the private schema, and
-- server-side profile/membership writes fire private trigger functions.
-- Keep these grants narrow: normal authorization checks remain inside the
-- SECURITY DEFINER implementations (for example private.is_platform_admin()).

grant usage on schema private to authenticated, service_role;

-- Edge Function test-account provisioning needs these trigger/guard functions
-- while operating with the Supabase service role.
grant execute on function private.is_global_admin() to service_role;
grant execute on function private.prevent_profile_school_change() to service_role;
grant execute on function private.protect_staff_profile_scope() to service_role;
grant execute on function private.set_updated_at() to service_role;
grant execute on function private.sync_membership_profile() to service_role;
grant execute on function private.assign_default_onboarding_from_membership() to service_role;

-- Platform Owner school/trial controls use public wrappers which delegate to
-- these private implementations. The functions still perform their own
-- Platform Admin authorization checks before changing school data.
grant execute on function private.platform_create_school_impl(text,text,text,text,text,integer) to authenticated, service_role;
grant execute on function private.platform_list_schools_impl() to authenticated, service_role;
grant execute on function private.platform_set_subscription_impl(uuid,text,text,integer,timestamptz,timestamptz) to authenticated, service_role;
grant execute on function private.platform_verify_domain_impl(uuid,boolean) to authenticated, service_role;
