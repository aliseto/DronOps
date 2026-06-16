-- ============================================================================
-- DOM — Migration 0003 — remaining M0 controls
--
-- Applies AFTER 0002. Adds the M0 locked decisions not yet covered:
--   * last-admin guard (cannot leave a tenant with zero owner/group_admin)
--   * notification preferences (per-user / per-trigger) + Realtime on notifications
--   * audit_log made append-only (revoke UPDATE/DELETE) + hard-DELETE tripwire
--     routed into system_events
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Last-admin guard
-- ----------------------------------------------------------------------------
create or replace function app.enforce_last_tenant_admin()
returns trigger language plpgsql set search_path = '' as $$
declare v_remaining int;
begin
  -- only relevant when an owner/group_admin grant is being removed or demoted
  if old.role not in ('owner','group_admin') then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE'
     and new.role in ('owner','group_admin')
     and new.tenant_id = old.tenant_id then
    return new;  -- still an admin grant on the same tenant; no net loss
  end if;
  select count(*) into v_remaining
    from public.user_tenant_roles
   where tenant_id = old.tenant_id
     and role in ('owner','group_admin')
     and id <> old.id;
  if v_remaining = 0 then
    raise exception 'cannot remove the last administrator of the tenant';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_utr_last_admin on public.user_tenant_roles;
create trigger trg_utr_last_admin
  before update or delete on public.user_tenant_roles
  for each row execute function app.enforce_last_tenant_admin();

-- ----------------------------------------------------------------------------
-- 2. Notification preferences + Realtime
-- ----------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger notification_trigger not null,
  in_app  boolean not null default true,
  email   boolean not null default false,
  primary key (user_id, trigger)
);

alter table public.notification_preferences enable row level security;
drop policy if exists np_self on public.notification_preferences;
create policy np_self on public.notification_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- in-app delivery rides Supabase Realtime (publication exists on Supabase only)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3. audit_log append-only + hard-DELETE tripwire
-- ----------------------------------------------------------------------------
-- audit is admin-read + insert-via-definer-only; never updated or deleted by app roles
revoke update, delete on public.audit_log from authenticated;

-- replace the generic audit trigger to add the tripwire (matches 0002's
-- system_events shape: tenant_id, org_id, source, severity, message, context)
create or replace function app.audit_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_tenant uuid; v_old jsonb; v_new jsonb;
begin
  if tg_op = 'DELETE' then
    v_old := to_jsonb(old); v_new := null; v_org := (v_old->>'org_id')::uuid;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old); v_new := to_jsonb(new); v_org := (v_new->>'org_id')::uuid;
  else
    v_old := null; v_new := to_jsonb(new); v_org := (v_new->>'org_id')::uuid;
  end if;
  select tenant_id into v_tenant from public.organisations where id = v_org;

  insert into public.audit_log(tenant_id, org_id, actor, entity, entity_id, action, before, after)
  values (
    v_tenant, v_org, auth.uid(), tg_table_name,
    coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid),
    tg_op, v_old, v_new
  );

  -- tripwire: hard deletes should never happen (soft-delete is the norm)
  if tg_op = 'DELETE' then
    insert into public.system_events(tenant_id, org_id, source, severity, message, context)
    values (v_tenant, v_org, 'audit', 'warning',
            'hard delete observed on ' || tg_table_name,
            jsonb_build_object('row', v_old));
  end if;

  return coalesce(new, old);
end $$;

-- ----------------------------------------------------------------------------
-- 4. Harden trigger functions (pin search_path) — flagged by the Supabase linter
-- ----------------------------------------------------------------------------
alter function app.set_updated_at() set search_path = '';
alter function app.bump_version() set search_path = '';

-- end of migration 0003
