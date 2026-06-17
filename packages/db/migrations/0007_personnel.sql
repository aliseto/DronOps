-- ============================================================================
-- DOM — Migration 0007 — personnel system numbers + approved aircraft (M2)
-- ============================================================================

alter table public.personnel add column if not exists system_number text;

drop trigger if exists trg_personnel_sysno on public.personnel;
create trigger trg_personnel_sysno before insert on public.personnel
  for each row execute function app.assign_system_number('personnel_sn', 'PER');

-- Approved Aircraft tab: a person is cleared on a drone *model* (profile),
-- not an individual airframe (Spec M2).
create table if not exists public.approved_aircraft (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organisations(id) on delete cascade,
  personnel_id     uuid not null references public.personnel(id) on delete cascade,
  drone_profile_id uuid not null references public.drone_profiles(id),
  date_approved    date,
  notes            text,
  created_at       timestamptz not null default now(),
  unique (personnel_id, drone_profile_id)
);

alter table public.approved_aircraft enable row level security;
drop policy if exists approved_aircraft_read on public.approved_aircraft;
create policy approved_aircraft_read on public.approved_aircraft for select to authenticated
  using (org_id in (select app.accessible_org_ids()));
drop policy if exists approved_aircraft_write on public.approved_aircraft;
create policy approved_aircraft_write on public.approved_aircraft for all to authenticated
  using (org_id in (select app.accessible_org_ids()) and app.can_write_org(org_id))
  with check (org_id in (select app.accessible_org_ids()) and app.can_write_org(org_id));

drop trigger if exists trg_approved_aircraft_audit on public.approved_aircraft;
create trigger trg_approved_aircraft_audit after insert or update or delete on public.approved_aircraft
  for each row execute function app.audit_trigger();

-- end of migration 0007
