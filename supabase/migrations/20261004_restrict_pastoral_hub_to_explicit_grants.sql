drop policy if exists pastoral_hub_items_read on public.pastoral_hub_items;
create policy pastoral_hub_items_read
on public.pastoral_hub_items for select to authenticated
using (
  created_by = (select auth.uid())
  or private.staff_development_has_area_access(organization_id, 'pastoral', false)
);

drop policy if exists pastoral_hub_items_insert on public.pastoral_hub_items;
create policy pastoral_hub_items_insert
on public.pastoral_hub_items for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.staff_development_has_area_access(organization_id, 'pastoral', true)
);

drop policy if exists pastoral_hub_items_update on public.pastoral_hub_items;
create policy pastoral_hub_items_update
on public.pastoral_hub_items for update to authenticated
using (
  created_by = (select auth.uid())
  or private.staff_development_has_area_access(organization_id, 'pastoral', true)
)
with check (
  created_by = (select auth.uid())
  or private.staff_development_has_area_access(organization_id, 'pastoral', true)
);

drop policy if exists pastoral_hub_items_delete on public.pastoral_hub_items;
create policy pastoral_hub_items_delete
on public.pastoral_hub_items for delete to authenticated
using (
  created_by = (select auth.uid())
  or private.staff_development_has_area_access(organization_id, 'pastoral', true)
);
