update public.organisations
set name = 'Platform Managed Access', slug = 'platform-managed-access'
where slug = 'platform-test-school';

update public.school_sites
set name = 'Managed Access', code = 'MANAGED'
where organisation_id in (
  select id from public.organisations where slug = 'platform-managed-access'
)
and code = 'TEST';
