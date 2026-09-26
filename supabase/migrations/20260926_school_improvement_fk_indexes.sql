create index if not exists improvement_priorities_organisation_idx on public.improvement_priorities(organisation_id);
create index if not exists improvement_priorities_site_idx on public.improvement_priorities(site_id);
create index if not exists professional_observation_links_organisation_idx on public.professional_observation_links(organisation_id);
create index if not exists professional_observation_links_site_idx on public.professional_observation_links(site_id);
