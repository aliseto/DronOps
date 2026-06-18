-- ============================================================================
-- DOM — Migration 0008 — storage buckets + storage RLS (M4 / M0 storage)
--
-- Creates the four content buckets and org-scoped Storage RLS. Guarded behind
-- the presence of the `storage` schema so plain Postgres (CI) skips it; on
-- Supabase it runs. Object paths are prefixed `<org_id>/…`; access is gated by
-- accessible_org_ids() so tenant isolation extends to files. Each DDL goes in
-- its own EXECUTE (one command per statement).
-- ============================================================================
do $$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    raise notice 'storage schema absent (CI); skipping bucket + storage RLS setup';
    return;
  end if;

  insert into storage.buckets (id, name, public)
  values ('logs','logs',false), ('media','media',false),
         ('documents','documents',false), ('branding','branding',false)
  on conflict (id) do nothing;

  execute 'drop policy if exists dom_objects_read on storage.objects';
  execute $p$
    create policy dom_objects_read on storage.objects for select to authenticated
      using (
        bucket_id in ('logs','media','documents','branding')
        and (storage.foldername(name))[1]::uuid in (select app.accessible_org_ids())
      )
  $p$;

  execute 'drop policy if exists dom_objects_write on storage.objects';
  execute $p$
    create policy dom_objects_write on storage.objects for all to authenticated
      using (
        bucket_id in ('logs','media','documents','branding')
        and (storage.foldername(name))[1]::uuid in (select app.accessible_org_ids())
      )
      with check (
        bucket_id in ('logs','media','documents','branding')
        and (storage.foldername(name))[1]::uuid in (select app.accessible_org_ids())
      )
  $p$;
end $$;

-- end of migration 0008
