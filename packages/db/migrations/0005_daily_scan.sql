-- ============================================================================
-- DOM — Migration 0005 — daily expiry scanner + scheduler hook
--
-- app.run_daily_scan() inserts in-app notifications for documents and
-- certifications at/near expiry, one per user with a role in the owning org,
-- de-duplicated within a 20-hour window. Realtime publishes the inserts.
--
-- The pg_cron registration is guarded: on plain Postgres (CI) pg_cron is not
-- installed, so the scheduling is skipped with a notice rather than failing.
-- On Supabase, pg_cron runs the scan daily at 06:00 UTC.
-- ============================================================================

create or replace function app.run_daily_scan()
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- documents at/near expiry → notify everyone with a role in the org
  insert into public.notifications (org_id, trigger, title, body, target_user_id)
  select d.org_id, 'document_expiry', 'Document expiring: ' || d.title,
         'Expires ' || d.expires_on, r.user_id
  from public.documents d
  join public.user_org_roles r on r.org_id = d.org_id
  where d.expires_on is not null
    and d.expires_on <= current_date + 30
    and d.archived_at is null
    and not exists (
      select 1 from public.notifications n
       where n.target_user_id = r.user_id
         and n.org_id = d.org_id
         and n.trigger = 'document_expiry'
         and n.title = 'Document expiring: ' || d.title
         and n.created_at > now() - interval '20 hours'
    );

  -- certifications at/near expiry → notify everyone with a role in the org
  insert into public.notifications (org_id, trigger, title, body, target_user_id)
  select c.org_id, 'document_expiry', 'Certification expiring: ' || c.type,
         'Expires ' || c.expires_on, r.user_id
  from public.certifications c
  join public.user_org_roles r on r.org_id = c.org_id
  where c.expires_on is not null
    and c.expires_on <= current_date + 30
    and c.archived_at is null
    and not exists (
      select 1 from public.notifications n
       where n.target_user_id = r.user_id
         and n.org_id = c.org_id
         and n.trigger = 'document_expiry'
         and n.title = 'Certification expiring: ' || c.type
         and n.created_at > now() - interval '20 hours'
    );
end $$;

-- Schedule it (Supabase). Guarded so plain Postgres without pg_cron still migrates.
do $$
begin
  execute 'create extension if not exists pg_cron';
  perform cron.schedule('dom-daily-scan', '0 6 * * *', 'select app.run_daily_scan();');
exception when others then
  raise notice 'pg_cron unavailable; daily scan not scheduled (%)', sqlerrm;
end $$;

-- end of migration 0005
