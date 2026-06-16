-- ============================================================================
-- DOM — Drone Operation Management
-- Migration 0001 — management-side schema (foundation, registry, personnel,
--                  logbook, maintenance, calendar source, cross-cutting)
--
-- Deferred to a later migration (compliance ingestion): parameters,
-- classification_rules, category_limits, requirement_bindings,
-- operation_evaluations, and the log-parser pipeline.
--
-- Forward hooks present now so no rework later:
--   * regulators            (seeded with the 4 authorities)
--   * organisation_regulators (org→regulator binding; resolver added later)
--   * operations.descriptor  (jsonb — the regulator-neutral descriptor slot)
--
-- Conventions:
--   * uuid PKs (gen_random_uuid)
--   * every org-scoped row carries org_id (denormalised) for fast, flat RLS
--   * two-tier access: tenant boundary + organisation-membership boundary
-- ============================================================================

create extension if not exists pgcrypto;

create schema if not exists app;

-- ============================================================================
-- ENUMS
-- ============================================================================
create type tenant_role          as enum ('owner','group_admin');
create type org_role             as enum ('org_admin','ops_manager','pilot','maintenance','viewer');
create type operation_type       as enum ('flight','mission');
create type operation_status     as enum ('draft','planned','approved','completed','cancelled');
create type incident_severity    as enum ('low','medium','high','critical');
create type parse_status         as enum ('pending','processing','parsed','failed');
create type inspection_status    as enum ('scheduled','due','completed','overdue','skipped');
create type share_resource_type  as enum ('document','checklist','inventory_item','project');
create type notification_trigger as enum ('document_expiry','low_currency','mission_overdue',
                                          'inspection_overdue','part_replacement_overdue','night_flight');

-- ============================================================================
-- SHARED HELPERS
-- ============================================================================
create or replace function app.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ============================================================================
-- TENANCY & IDENTITY
-- ============================================================================
create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  branding    jsonb not null default '{}',          -- logo url, colours
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.regulators (
  id    uuid primary key default gen_random_uuid(),
  code  text not null unique,                        -- GCAA | DCAA | GACA | OMAN
  name  text not null
);
insert into public.regulators (code, name) values
  ('GCAA','General Civil Aviation Authority (UAE Federal)'),
  ('DCAA','Dubai Civil Aviation Authority'),
  ('GACA','General Authority of Civil Aviation (Saudi Arabia)'),
  ('OMAN','Civil Aviation Authority (Oman)');

create table public.organisations (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  name                 text not null,
  home_country         text,
  primary_regulator_id uuid references public.regulators(id),
  status               text not null default 'active',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- usually one row per org; >1 only for genuine cross-border operations
create table public.organisation_regulators (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  regulator_id  uuid not null references public.regulators(id),
  is_primary    boolean not null default false,
  unique (org_id, regulator_id)
);

create table public.user_tenant_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  role        tenant_role not null,
  unique (user_id, tenant_id, role)
);

create table public.user_org_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  org_id      uuid not null references public.organisations(id) on delete cascade,
  role        org_role not null,
  unique (user_id, org_id, role)
);

-- ----------------------------------------------------------------------------
-- Access helpers (security definer; used inside RLS policies)
-- ----------------------------------------------------------------------------
create or replace function app.accessible_tenant_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select tenant_id from public.user_tenant_roles where user_id = auth.uid()
  union
  select o.tenant_id from public.user_org_roles r
    join public.organisations o on o.id = r.org_id
   where r.user_id = auth.uid()
$$;

create or replace function app.accessible_org_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select org_id from public.user_org_roles where user_id = auth.uid()
  union
  select o.id from public.organisations o
   where o.tenant_id in (select tenant_id from public.user_tenant_roles where user_id = auth.uid())
$$;

create or replace function app.can_admin_tenant(p_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_tenant_roles
     where user_id = auth.uid() and tenant_id = p_tenant and role in ('owner','group_admin')
  )
$$;

create or replace function app.can_write_org(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_org_roles
     where user_id = auth.uid() and org_id = p_org and role <> 'viewer'
  ) or exists (
    select 1 from public.user_tenant_roles t
      join public.organisations o on o.id = p_org
     where t.user_id = auth.uid() and t.tenant_id = o.tenant_id and t.role in ('owner','group_admin')
  )
$$;

-- ============================================================================
-- M1 — ASSET & INVENTORY REGISTRY
-- ============================================================================
create table public.drone_profiles (
  id                        uuid primary key default gen_random_uuid(),
  tenant_id                 uuid not null references public.tenants(id) on delete cascade,
  brand                     text not null,
  model                     text not null,
  default_type              text,
  default_weight_g          numeric,
  default_max_dim_m         numeric,
  default_specs             jsonb not null default '{}',
  default_inspection_config jsonb not null default '{}',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.drones (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organisations(id) on delete cascade,
  profile_id        uuid references public.drone_profiles(id),
  name              text not null,
  serial            text,
  registration      text,
  regulator_reg_ids jsonb not null default '{}',     -- {GCAA:"...", DCAA:"..."}
  mtom_g            numeric,
  max_dim_m         numeric,
  max_speed_ms      numeric,
  propulsion        text,
  status            text not null default 'active',
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.batteries (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  drone_id     uuid references public.drones(id),
  serial       text,
  chemistry    text,
  capacity_mah numeric,
  cycle_count  integer not null default 0,
  status       text not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- charge sessions (own records, feed battery health over time)
create table public.battery_charges (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  battery_id   uuid not null references public.batteries(id) on delete cascade,
  charged_at   timestamptz,
  start_pct    numeric,
  end_pct      numeric,
  max_temp_c   numeric,
  capacity_mah numeric,
  efficiency   numeric,
  notes        text,
  created_at   timestamptz not null default now()
);

create table public.equipment (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organisations(id) on delete cascade,
  name       text not null,
  type       text,
  serial     text,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  drone_id      uuid references public.drones(id) on delete cascade,
  name          text not null,
  serial        text,
  lifespan_hours numeric,
  installed_at  timestamptz,
  status        text not null default 'installed',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.part_replacements (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations(id) on delete cascade,
  part_id     uuid not null references public.parts(id) on delete cascade,
  replaced_at timestamptz not null default now(),
  reason      text,
  new_serial  text,
  created_at  timestamptz not null default now()
);

create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organisations(id) on delete cascade,
  name       text not null,
  lat        numeric,
  lng        numeric,
  geom       jsonb,                                   -- GeoJSON; swap to PostGIS later
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  owner_type   text not null,                         -- drone|personnel|flight|operation|organisation
  owner_id     uuid,
  title        text not null,
  doc_type     text,
  storage_path text,
  issued_on    date,
  expires_on   date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.medias (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  flight_id    uuid,
  operation_id uuid,
  title        text,
  media_type   text,
  storage_path text,
  captured_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- M2 — PERSONNEL & CREW
-- ============================================================================
create table public.personnel (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organisations(id) on delete cascade,
  profile_id uuid references public.profiles(id),     -- optional link to a login user
  full_name  text not null,
  role_title text,
  email      text,
  phone      text,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references public.tenants(id) on delete cascade,  -- null = global predefined
  category   text not null,                           -- Regulations|Operations|Business|Tools
  name       text not null,
  is_custom  boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.personnel_skills (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  personnel_id uuid not null references public.personnel(id) on delete cascade,
  skill_id     uuid not null references public.skills(id) on delete cascade,
  level        text,
  created_at   timestamptz not null default now(),
  unique (personnel_id, skill_id)
);

create table public.certifications (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  personnel_id uuid not null references public.personnel(id) on delete cascade,
  type         text not null,                         -- licence|rating|endorsement|medical
  scope        text,
  issuer       text,
  number       text,
  issued_on    date,
  expires_on   date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================================
-- M3 — LOGBOOK & OPERATIONS  (Project scoped to a single organisation)
-- ============================================================================
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations(id) on delete cascade,
  name        text not null,
  code        text,
  description text,
  status      text not null default 'active',
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.operations (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  project_id    uuid references public.projects(id),
  type          operation_type not null,
  title         text not null,
  status        operation_status not null default 'draft',
  planned_start timestamptz,
  planned_end   timestamptz,
  area_geom     jsonb,                                 -- drawn flight area (GeoJSON)
  descriptor    jsonb not null default '{}',           -- forward hook for compliance engine
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.flights (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organisations(id) on delete cascade,
  operation_id      uuid references public.operations(id),
  project_id        uuid references public.projects(id),
  pilot_personnel_id uuid references public.personnel(id),
  drone_id          uuid references public.drones(id),
  battery_id        uuid references public.batteries(id),
  location_id       uuid references public.locations(id),
  started_at        timestamptz,
  ended_at          timestamptz,
  duration_s        integer,
  purpose           text,
  is_night          boolean not null default false,
  track_ref         text,                              -- storage path to parsed track
  source            text not null default 'manual',    -- manual|import|cloud|auto
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.incidents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  operation_id uuid references public.operations(id),
  flight_id    uuid references public.flights(id),
  occurred_at  timestamptz,
  severity     incident_severity not null default 'low',
  summary      text,
  reportable   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ingestion record (parser pipeline deferred; manual path needs no parser)
create table public.flight_logs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  operation_id  uuid references public.operations(id),
  flight_id     uuid references public.flights(id),
  source_format text,
  storage_path  text,
  size_bytes    bigint,
  parse_status  parse_status not null default 'pending',
  parse_error   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================================
-- M6 — MAINTENANCE & INSPECTIONS
-- ============================================================================
create table public.inspection_schedules (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organisations(id) on delete cascade,
  drone_id       uuid references public.drones(id) on delete cascade,
  part_id        uuid references public.parts(id) on delete cascade,
  name           text not null,
  interval_type  text not null default 'calendar',     -- calendar|hours
  interval_value numeric,
  last_done_at   timestamptz,
  next_due_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.inspections (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  schedule_id  uuid references public.inspection_schedules(id),
  drone_id     uuid references public.drones(id),
  part_id      uuid references public.parts(id),
  due_at       timestamptz,
  performed_at timestamptz,
  performed_by uuid references auth.users(id),
  status       inspection_status not null default 'scheduled',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================================
-- M0 — CROSS-CUTTING (sharing, notifications, audit)
-- ============================================================================
create table public.shares (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  resource_type      share_resource_type not null,
  resource_id        uuid not null,
  shared_with_org_id uuid not null references public.organisations(id) on delete cascade,
  granted_by         uuid references auth.users(id),
  created_at         timestamptz not null default now()
);

create table public.notification_templates (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  trigger    notification_trigger not null,
  name       text not null,
  channel    text not null default 'in_app',
  body       text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organisations(id) on delete cascade,
  trigger            notification_trigger,
  title              text not null,
  body               text,
  target_user_id     uuid references auth.users(id),
  target_personnel_id uuid references public.personnel(id),
  status             text not null default 'unread',
  created_at         timestamptz not null default now()
);

create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid,
  org_id     uuid,
  actor      uuid,
  entity     text not null,
  entity_id  uuid,
  action     text not null,
  before     jsonb,
  after      jsonb,
  at         timestamptz not null default now()
);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'tenants','profiles','organisations','drone_profiles','drones','batteries',
    'equipment','parts','locations','documents','personnel','certifications',
    'projects','operations','flights','incidents','flight_logs',
    'inspection_schedules','inspections','notification_templates'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$I
         for each row execute function app.set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- Generic audit trigger (writes to audit_log; bypasses RLS via security definer)
-- ============================================================================
create or replace function app.audit_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_old jsonb; v_new jsonb;
begin
  if tg_op = 'DELETE' then
    v_old := to_jsonb(old); v_new := null; v_org := (v_old->>'org_id')::uuid;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old); v_new := to_jsonb(new); v_org := (v_new->>'org_id')::uuid;
  else
    v_old := null; v_new := to_jsonb(new); v_org := (v_new->>'org_id')::uuid;
  end if;
  insert into public.audit_log(tenant_id, org_id, actor, entity, entity_id, action, before, after)
  values (
    (select tenant_id from public.organisations where id = v_org),
    v_org, auth.uid(), tg_table_name,
    coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid),
    tg_op, v_old, v_new
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'drones','batteries','equipment','parts','part_replacements','documents',
    'personnel','certifications','projects','operations','flights','incidents',
    'inspection_schedules','inspections'
  ] loop
    execute format(
      'create trigger trg_%1$s_audit after insert or update or delete on public.%1$I
         for each row execute function app.audit_trigger();', t);
  end loop;
end $$;

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
grant usage on schema app to authenticated;
grant execute on all functions in schema app to authenticated;

-- ---- org-scoped tables: read = accessible orgs, write = accessible + non-viewer
do $$
declare t text;
begin
  foreach t in array array[
    'organisation_regulators','drones','batteries','battery_charges','equipment',
    'parts','part_replacements','locations','documents','medias','personnel',
    'personnel_skills','certifications','projects','operations','flights',
    'incidents','flight_logs','inspection_schedules','inspections','notifications'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy %1$s_read on public.%1$I for select to authenticated
         using (org_id in (select app.accessible_org_ids()));', t);
    execute format(
      'create policy %1$s_write on public.%1$I for all to authenticated
         using (org_id in (select app.accessible_org_ids()) and app.can_write_org(org_id))
         with check (org_id in (select app.accessible_org_ids()) and app.can_write_org(org_id));', t);
  end loop;
end $$;

-- ---- tenants
alter table public.tenants enable row level security;
create policy tenants_read on public.tenants for select to authenticated
  using (id in (select app.accessible_tenant_ids()));
create policy tenants_write on public.tenants for all to authenticated
  using (app.can_admin_tenant(id)) with check (app.can_admin_tenant(id));

-- ---- organisations  (org-scoped read so siblings stay hidden from org-only users)
alter table public.organisations enable row level security;
create policy orgs_read on public.organisations for select to authenticated
  using (id in (select app.accessible_org_ids()));
create policy orgs_write on public.organisations for all to authenticated
  using (app.can_admin_tenant(tenant_id)) with check (app.can_admin_tenant(tenant_id));

-- ---- regulators (global reference, read-only to users)
alter table public.regulators enable row level security;
create policy regulators_read on public.regulators for select to authenticated using (true);

-- ---- profiles
alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from public.user_org_roles r
                where r.user_id = profiles.id and r.org_id in (select app.accessible_org_ids()))
    or exists (select 1 from public.user_tenant_roles r
                where r.user_id = profiles.id and r.tenant_id in (select app.accessible_tenant_ids()))
  );
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---- role tables
alter table public.user_tenant_roles enable row level security;
create policy utr_read on public.user_tenant_roles for select to authenticated
  using (user_id = auth.uid() or app.can_admin_tenant(tenant_id));
create policy utr_admin on public.user_tenant_roles for all to authenticated
  using (app.can_admin_tenant(tenant_id)) with check (app.can_admin_tenant(tenant_id));

alter table public.user_org_roles enable row level security;
create policy uor_read on public.user_org_roles for select to authenticated
  using (user_id = auth.uid()
         or app.can_admin_tenant((select tenant_id from public.organisations where id = org_id)));
create policy uor_admin on public.user_org_roles for all to authenticated
  using (app.can_admin_tenant((select tenant_id from public.organisations where id = org_id)))
  with check (app.can_admin_tenant((select tenant_id from public.organisations where id = org_id)));

-- ---- tenant-scoped reference/config tables
alter table public.drone_profiles enable row level security;
create policy dp_read on public.drone_profiles for select to authenticated
  using (tenant_id in (select app.accessible_tenant_ids()));
create policy dp_write on public.drone_profiles for all to authenticated
  using (app.can_admin_tenant(tenant_id)) with check (app.can_admin_tenant(tenant_id));

alter table public.skills enable row level security;
create policy skills_read on public.skills for select to authenticated
  using (tenant_id is null or tenant_id in (select app.accessible_tenant_ids()));
create policy skills_write on public.skills for all to authenticated
  using (tenant_id is not null and app.can_admin_tenant(tenant_id))
  with check (tenant_id is not null and app.can_admin_tenant(tenant_id));

alter table public.notification_templates enable row level security;
create policy nt_read on public.notification_templates for select to authenticated
  using (tenant_id in (select app.accessible_tenant_ids()));
create policy nt_write on public.notification_templates for all to authenticated
  using (app.can_admin_tenant(tenant_id)) with check (app.can_admin_tenant(tenant_id));

alter table public.shares enable row level security;
create policy shares_read on public.shares for select to authenticated
  using (tenant_id in (select app.accessible_tenant_ids()));
create policy shares_write on public.shares for all to authenticated
  using (app.can_admin_tenant(tenant_id)) with check (app.can_admin_tenant(tenant_id));

-- ---- audit_log (read across accessible orgs; inserts only via definer trigger)
alter table public.audit_log enable row level security;
create policy audit_read on public.audit_log for select to authenticated
  using (org_id in (select app.accessible_org_ids()));

-- ============================================================================
-- Optional: auto-create a profile row when an auth user signs up
-- ============================================================================
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ============================================================================
-- Helpful indexes
-- ============================================================================
create index on public.organisations (tenant_id);
create index on public.user_org_roles (user_id);
create index on public.user_tenant_roles (user_id);
create index on public.drones (org_id);
create index on public.batteries (org_id);
create index on public.flights (org_id);
create index on public.flights (operation_id);
create index on public.operations (org_id);
create index on public.documents (org_id, expires_on);
create index on public.certifications (org_id, expires_on);
create index on public.inspection_schedules (org_id, next_due_at);
create index on public.audit_log (org_id, at);

-- end of migration 0001
