-- ============================================================================
-- DOM — Drone Operation Management
-- Migration 0002 — bring the schema up to Specification v2.1
--
-- Applies AFTER 0001 on a fresh database (0001 then 0002).
-- 0001 is the management skeleton; 0002 adds every decision taken after it:
--   * roles: HSE Manager + QC Manager (nine roles total)
--   * fleet restructured to profile -> instance for battery / controller /
--     equipment; aircraft system-numbering; drops parts/medias/locations/
--     battery_charges (battery health now via inspections)
--   * onboarding: invitations + RPCs
--   * managed lists: mission types, clients (tenant-level), checklist templates
--   * operations: mandatory category, mission types, operating-volume altitude,
--     site fields, external-approval block
--   * maintenance: defects; inspections target aircraft/equipment/battery
--   * organisation profile fields
--   * hygiene: updated_by, version, archived_at/by everywhere; reference codes;
--     system_events dead-letter; org settings (currency window, mobilisation buffer)
--
-- NOTE on enums: new values added to org_role here are intentionally NOT
-- referenced elsewhere in this same migration (Postgres forbids using a newly
-- added enum value in the same transaction). Seed any role-keyed config later.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM EXTENSIONS & NEW ENUMS
-- ----------------------------------------------------------------------------
alter type org_role add value if not exists 'hse_manager';
alter type org_role add value if not exists 'qc_manager';

create type invite_status   as enum ('pending','accepted','revoked','expired');
create type defect_severity as enum ('minor','major','grounding');
create type defect_status   as enum ('open','in_repair','deferred','resolved');
create type employment_type as enum ('employee','contractor','freelance');

-- ----------------------------------------------------------------------------
-- 2. ROW HYGIENE — updated_by, version, soft-delete on operational tables
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organisations','drone_profiles','drones','batteries','equipment',
    'documents','personnel','certifications','projects','operations',
    'flights','incidents','flight_logs','inspection_schedules','inspections'
  ] loop
    execute format('alter table public.%I add column if not exists updated_by uuid;', t);
    execute format('alter table public.%I add column if not exists version integer not null default 1;', t);
    execute format('alter table public.%I add column if not exists archived_at timestamptz;', t);
    execute format('alter table public.%I add column if not exists archived_by uuid;', t);
  end loop;
end $$;

-- bump version automatically on update
create or replace function app.bump_version()
returns trigger language plpgsql as $$
begin new.version := coalesce(old.version,1) + 1; return new; end $$;

-- ----------------------------------------------------------------------------
-- 3. REFERENCE CODES — per-org sequences (PRJ / OP / FL / INS / DEF)
-- ----------------------------------------------------------------------------
create table public.ref_counters (
  org_id  uuid not null references public.organisations(id) on delete cascade,
  entity  text not null,
  last_no bigint not null default 0,
  primary key (org_id, entity)
);

create or replace function app.next_ref_code(p_org uuid, p_entity text, p_prefix text)
returns text language plpgsql security definer set search_path = '' as $$
declare n bigint;
begin
  insert into public.ref_counters(org_id, entity, last_no) values (p_org, p_entity, 1)
    on conflict (org_id, entity) do update set last_no = public.ref_counters.last_no + 1
    returning last_no into n;
  return p_prefix || '-' || lpad(n::text, 4, '0');
end $$;

-- attach ref_code columns + triggers
alter table public.projects   add column if not exists ref_code text;
alter table public.operations add column if not exists ref_code text;
alter table public.flights    add column if not exists ref_code text;
alter table public.inspections add column if not exists ref_code text;

create or replace function app.assign_ref_code()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.ref_code is null then
    new.ref_code := app.next_ref_code(new.org_id, tg_argv[0], tg_argv[1]);
  end if;
  return new;
end $$;

create trigger trg_projects_ref   before insert on public.projects
  for each row execute function app.assign_ref_code('project','PRJ');
create trigger trg_operations_ref before insert on public.operations
  for each row execute function app.assign_ref_code('operation','OP');
create trigger trg_flights_ref    before insert on public.flights
  for each row execute function app.assign_ref_code('flight','FL');
create trigger trg_inspections_ref before insert on public.inspections
  for each row execute function app.assign_ref_code('inspection','INS');

-- ----------------------------------------------------------------------------
-- 4. ONBOARDING — invitations + RPCs
-- ----------------------------------------------------------------------------
create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  org_id          uuid references public.organisations(id) on delete cascade, -- null = tenant-level invite
  email           text not null,
  role            text not null,                       -- text to avoid enum coupling
  token_hash      text not null,
  status          invite_status not null default 'pending',
  invited_by      uuid references auth.users(id),
  expires_at      timestamptz not null default (now() + interval '7 days'),
  accepted_user_id uuid references auth.users(id),
  created_at      timestamptz not null default now()
);
create index on public.invitations (tenant_id);
create index on public.invitations (token_hash);

-- bootstrap: a signed-up user with no memberships creates a tenant and becomes owner
create or replace function app.create_tenant(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.tenants(name) values (p_name) returning id into v_tenant;
  insert into public.user_tenant_roles(user_id, tenant_id, role) values (auth.uid(), v_tenant, 'owner');
  return v_tenant;
end $$;

-- create an invitation (caller must admin the target tenant)
create or replace function app.create_invitation(p_tenant uuid, p_org uuid, p_email text, p_role text, p_token_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not app.can_admin_tenant(p_tenant) then raise exception 'forbidden'; end if;
  -- simple rate guard: max 50 pending invites per tenant
  if (select count(*) from public.invitations where tenant_id = p_tenant and status = 'pending') >= 50 then
    raise exception 'invitation rate limit reached';
  end if;
  insert into public.invitations(tenant_id, org_id, email, role, token_hash, invited_by)
    values (p_tenant, p_org, lower(p_email), p_role, p_token_hash, auth.uid())
    returning id into v_id;
  return v_id;
end $$;

-- accept an invitation (strict email-match; idempotent)
create or replace function app.accept_invitation(p_token_hash text)
returns void language plpgsql security definer set search_path = '' as $$
declare inv public.invitations;
begin
  select * into inv from public.invitations where token_hash = p_token_hash for update;
  if inv.id is null then raise exception 'invalid invitation'; end if;
  if inv.status <> 'pending' then return; end if;                  -- idempotent
  if inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = inv.id; raise exception 'invitation expired';
  end if;
  if lower(coalesce(auth.email(),'')) <> inv.email then            -- strict email-match
    raise exception 'invitation is for a different email address';
  end if;
  if inv.org_id is null then
    insert into public.user_tenant_roles(user_id, tenant_id, role)
      values (auth.uid(), inv.tenant_id, inv.role::tenant_role) on conflict do nothing;
  else
    insert into public.user_org_roles(user_id, org_id, role)
      values (auth.uid(), inv.org_id, inv.role::org_role) on conflict do nothing;
  end if;
  update public.invitations set status = 'accepted', accepted_user_id = auth.uid() where id = inv.id;
end $$;

create or replace function app.revoke_invitation(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.invitations where id = p_id;
  if not app.can_admin_tenant(v_tenant) then raise exception 'forbidden'; end if;
  update public.invitations set status = 'revoked' where id = p_id and status = 'pending';
end $$;

-- ----------------------------------------------------------------------------
-- 5. SYSTEM EVENTS — dead-letter (platform/null-org aware)
-- ----------------------------------------------------------------------------
create table public.system_events (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid,
  org_id     uuid,
  source     text not null,        -- parser | email | scheduler | webhook ...
  severity   text not null default 'error',
  message    text,
  context    jsonb,
  at         timestamptz not null default now()
);
create index on public.system_events (org_id, at);

-- ----------------------------------------------------------------------------
-- 6. ORG SETTINGS & PROFILE (currency window, mobilisation buffer, profile fields)
-- ----------------------------------------------------------------------------
create table public.org_settings (
  org_id                 uuid primary key references public.organisations(id) on delete cascade,
  currency_window_days   integer not null default 90,
  mobilisation_buffer_min integer not null default 30,
  duty_max_min           integer not null default 780,   -- 13h
  flight_max_min         integer not null default 240,   -- 4h
  rest_min_min           integer not null default 480,   -- 8h
  updated_at             timestamptz not null default now()
);

alter table public.organisations add column if not exists legal_name text;
alter table public.organisations add column if not exists trade_license_no text;
alter table public.organisations add column if not exists jurisdiction text;  -- UAE | KSA | OMAN (mirrors regulator binding)

-- ----------------------------------------------------------------------------
-- 7. MANAGED LISTS — mission types, clients, checklist templates (tenant-level)
-- ----------------------------------------------------------------------------
create table public.mission_types (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  is_custom  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  company    text not null,
  industry   text,
  website    text,
  notes      text,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.client_contacts (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  client_id  uuid not null references public.clients(id) on delete cascade,
  name       text not null,
  phone      text,
  email      text,
  created_at timestamptz not null default now()
);

create table public.checklist_templates (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  items      jsonb not null default '[]',   -- ordered checklist items
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. FLEET RESTRUCTURE — profile -> instance (battery / controller / equipment)
--    drop battery_charges, parts, part_replacements, medias, locations
-- ----------------------------------------------------------------------------
-- drone_profiles: align to spec
alter table public.drone_profiles add column if not exists airframe_type text;
alter table public.drone_profiles add column if not exists propulsion text;
alter table public.drone_profiles add column if not exists max_speed_ms numeric;
alter table public.drone_profiles add column if not exists remote_id_capable boolean default false;

-- drones = Aircraft (table name kept to preserve 0001 FKs; this IS the Aircraft entity)
alter table public.drones add column if not exists system_number text;
alter table public.drones add column if not exists date_added date default current_date;
alter table public.drones add column if not exists remote_id text;
alter table public.drones add column if not exists colour text;
alter table public.drones add column if not exists total_flight_hours numeric not null default 0;
alter table public.drones drop column if exists regulator_reg_ids;

-- battery profiles (new) + lean batteries
create table public.battery_profiles (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  brand         text, model text,
  battery_type  text,
  capacity_mah  numeric, voltage_v numeric,
  cycle_limit   integer,
  health_check_recommendation text,
  compatible_aircraft jsonb not null default '[]',   -- drone_profile ids/models
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.batteries add column if not exists profile_id uuid references public.battery_profiles(id);
alter table public.batteries add column if not exists system_number text;
alter table public.batteries add column if not exists date_added date default current_date;
alter table public.batteries drop column if exists drone_id;     -- not fixed to an aircraft
alter table public.batteries drop column if exists chemistry;     -- now on profile
alter table public.batteries drop column if exists capacity_mah;  -- now on profile
alter table public.batteries drop column if exists cycle_count;   -- now via inspections

-- controllers (new profile -> instance)
create table public.controller_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brand text, model text, type text, firmware text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.controllers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  profile_id uuid references public.controller_profiles(id),
  rc_serial text, system_number text, date_added date default current_date,
  paired_aircraft_id uuid references public.drones(id),
  status text not null default 'active', notes text,
  created_by uuid, updated_by uuid, version integer not null default 1,
  archived_at timestamptz, archived_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- equipment profiles (new) + align equipment
create table public.equipment_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brand text, model text, category text, maintenance_schedule text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.equipment add column if not exists profile_id uuid references public.equipment_profiles(id);
alter table public.equipment add column if not exists system_number text;
alter table public.equipment add column if not exists date_added date default current_date;

-- drop removed entities (order: dependents first)
alter table public.flights drop column if exists location_id;
drop table if exists public.battery_charges cascade;
drop table if exists public.part_replacements cascade;
alter table public.inspection_schedules drop column if exists part_id;
alter table public.inspections drop column if exists part_id;
drop table if exists public.parts cascade;
drop table if exists public.medias cascade;
drop table if exists public.locations cascade;

-- ----------------------------------------------------------------------------
-- 9. PERSONNEL — name split + detail fields
-- ----------------------------------------------------------------------------
alter table public.personnel add column if not exists first_name text;
alter table public.personnel add column if not exists last_name text;
alter table public.personnel add column if not exists photo_path text;
alter table public.personnel add column if not exists employment_type employment_type;
alter table public.personnel add column if not exists nationality text;
alter table public.personnel add column if not exists address text;
alter table public.personnel add column if not exists emergency_contact_name text;
alter table public.personnel add column if not exists emergency_contact_phone text;

-- ----------------------------------------------------------------------------
-- 10. OPERATIONS / FLIGHT LOG — category, mission types, volume, site, approval
-- ----------------------------------------------------------------------------
alter table public.operations add column if not exists operation_category text;  -- jurisdiction scheme; mandatory at app level
alter table public.operations add column if not exists max_altitude_m numeric;    -- operating-volume ceiling (with area_geom)
alter table public.operations add column if not exists site_name text;
alter table public.operations add column if not exists site_lat numeric;
alter table public.operations add column if not exists site_lng numeric;
-- external regulator approval block
alter table public.operations add column if not exists submitted_by uuid;
alter table public.operations add column if not exists submitted_at timestamptz;
alter table public.operations add column if not exists approving_authority text;     -- DCAA | GCAA | GACA | OMAN
alter table public.operations add column if not exists approval_reference text;
alter table public.operations add column if not exists approved_at timestamptz;
alter table public.operations add column if not exists approved_by uuid;
alter table public.operations add column if not exists cancellation_reason text;
-- approval documents are stored in public.documents (owner_type='operation', doc_type='approval'); one-or-many supported.

-- mission types are many-to-many
create table public.operation_mission_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  mission_type_id uuid not null references public.mission_types(id),
  unique (operation_id, mission_type_id)
);

-- projects link to a client
alter table public.projects add column if not exists client_id uuid references public.clients(id);
alter table public.projects add column if not exists project_lead_id uuid references public.personnel(id);

-- flight log: actual figures + site (locations dropped)
alter table public.flights add column if not exists site_name text;
alter table public.flights add column if not exists site_lat numeric;
alter table public.flights add column if not exists site_lng numeric;
alter table public.flights add column if not exists max_altitude_m numeric;
alter table public.flights add column if not exists max_distance_m numeric;
alter table public.flights add column if not exists max_speed_ms numeric;
alter table public.flights add column if not exists controller_id uuid references public.controllers(id);
alter table public.flights add column if not exists has_deviation boolean not null default false;

-- incident: which authority it is reportable to
alter table public.incidents add column if not exists reportable_authority text;

-- ----------------------------------------------------------------------------
-- 11. MAINTENANCE — inspections target aircraft/equipment/battery; battery health; defects
-- ----------------------------------------------------------------------------
alter table public.inspection_schedules add column if not exists equipment_id uuid references public.equipment(id) on delete cascade;
alter table public.inspection_schedules add column if not exists battery_id uuid references public.batteries(id) on delete cascade;

alter table public.inspections add column if not exists equipment_id uuid references public.equipment(id);
alter table public.inspections add column if not exists battery_id uuid references public.batteries(id);
alter table public.inspections add column if not exists result text;          -- pass | fail | pass-with-findings
alter table public.inspections add column if not exists findings text;
-- battery health captured within an inspection (replaces the old manual health tab)
alter table public.inspections add column if not exists battery_cycle_count integer;
alter table public.inspections add column if not exists battery_health_pct numeric;
alter table public.inspections add column if not exists battery_capacity_mah numeric;

create table public.defects (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  ref_code      text,
  asset_type    text not null,                 -- aircraft | equipment | battery | controller
  asset_id      uuid not null,
  raised_from   text,                          -- asset | flight | incident | inspection
  flight_id     uuid references public.flights(id),
  incident_id   uuid references public.incidents(id),
  inspection_id uuid references public.inspections(id),
  description   text,
  severity      defect_severity not null default 'minor',
  grounds_asset boolean not null default false,
  status        defect_status not null default 'open',
  raised_by     uuid, resolved_by uuid, resolved_at timestamptz,
  deferral_reason text,
  resolution    text,
  created_by uuid, updated_by uuid, version integer not null default 1,
  archived_at timestamptz, archived_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger trg_defects_ref before insert on public.defects
  for each row execute function app.assign_ref_code('defect','DEF');

-- ----------------------------------------------------------------------------
-- 12. updated_at + audit + version triggers for new tables
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'clients','checklist_templates','battery_profiles','controller_profiles',
    'equipment_profiles','controllers','defects','org_settings'
  ] loop
    execute format('create trigger trg_%1$s_updated before update on public.%1$I
      for each row execute function app.set_updated_at();', t);
  end loop;
  foreach t in array array['controllers','defects'] loop
    execute format('create trigger trg_%1$s_audit after insert or update or delete on public.%1$I
      for each row execute function app.audit_trigger();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 13. RLS for new tables
-- ----------------------------------------------------------------------------
-- org-scoped new tables -> read accessible orgs, write accessible + non-viewer
do $$
declare t text;
begin
  foreach t in array array['controllers','defects','operation_mission_types','org_settings'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy %1$s_read on public.%1$I for select to authenticated
      using (org_id in (select app.accessible_org_ids()));', t);
    execute format('create policy %1$s_write on public.%1$I for all to authenticated
      using (org_id in (select app.accessible_org_ids()) and app.can_write_org(org_id))
      with check (org_id in (select app.accessible_org_ids()) and app.can_write_org(org_id));', t);
  end loop;
end $$;

-- tenant-scoped new tables -> read tenant members, write tenant admins
do $$
declare t text;
begin
  foreach t in array array['mission_types','clients','client_contacts','checklist_templates',
                           'battery_profiles','controller_profiles','equipment_profiles'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy %1$s_read on public.%1$I for select to authenticated
      using (tenant_id in (select app.accessible_tenant_ids()));', t);
    execute format('create policy %1$s_write on public.%1$I for all to authenticated
      using (app.can_admin_tenant(tenant_id)) with check (app.can_admin_tenant(tenant_id));', t);
  end loop;
end $$;

-- invitations: tenant admins manage; an invitee may read their own pending invite by email
alter table public.invitations enable row level security;
create policy invitations_admin on public.invitations for all to authenticated
  using (app.can_admin_tenant(tenant_id)) with check (app.can_admin_tenant(tenant_id));
create policy invitations_self_read on public.invitations for select to authenticated
  using (lower(coalesce(auth.email(),'')) = email and status = 'pending');

-- system_events: readable by tenant admins of the row's tenant; platform rows (null tenant) hidden from tenants
alter table public.system_events enable row level security;
create policy system_events_read on public.system_events for select to authenticated
  using (tenant_id is not null and app.can_admin_tenant(tenant_id));

-- ref_counters: no direct tenant access (written only by the security-definer function)
alter table public.ref_counters enable row level security;

-- ----------------------------------------------------------------------------
-- 14. SOFT-DELETE INDEX RULES
--   reference codes unique INCLUDING archived; serials unique EXCLUDING archived
-- ----------------------------------------------------------------------------
create unique index if not exists uq_projects_ref   on public.projects   (org_id, ref_code);
create unique index if not exists uq_operations_ref on public.operations (org_id, ref_code);
create unique index if not exists uq_flights_ref    on public.flights    (org_id, ref_code);
create unique index if not exists uq_inspections_ref on public.inspections (org_id, ref_code);

create unique index if not exists uq_drones_serial_live
  on public.drones (org_id, serial) where archived_at is null and serial is not null;
create unique index if not exists uq_batteries_serial_live
  on public.batteries (org_id, serial) where archived_at is null and serial is not null;

-- ----------------------------------------------------------------------------
-- 15. grants
-- ----------------------------------------------------------------------------
grant execute on all functions in schema app to authenticated;

-- end of migration 0002
