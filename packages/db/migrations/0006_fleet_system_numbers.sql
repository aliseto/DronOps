-- ============================================================================
-- DOM — Migration 0006 — fleet system-number auto-assignment (M1)
--
-- Every aircraft/battery/controller/equipment instance gets an automatic
-- human-readable system number on insert (DRN/BAT/CTL/EQP-NNNN), per-org,
-- via the 0002 next_ref_code allocator. Idempotent (drop trigger if exists).
-- ============================================================================

create or replace function app.assign_system_number()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.system_number is null then
    new.system_number := app.next_ref_code(new.org_id, tg_argv[0], tg_argv[1]);
  end if;
  return new;
end $$;

drop trigger if exists trg_drones_sysno on public.drones;
create trigger trg_drones_sysno before insert on public.drones
  for each row execute function app.assign_system_number('aircraft_sn', 'DRN');

drop trigger if exists trg_batteries_sysno on public.batteries;
create trigger trg_batteries_sysno before insert on public.batteries
  for each row execute function app.assign_system_number('battery_sn', 'BAT');

drop trigger if exists trg_controllers_sysno on public.controllers;
create trigger trg_controllers_sysno before insert on public.controllers
  for each row execute function app.assign_system_number('controller_sn', 'CTL');

drop trigger if exists trg_equipment_sysno on public.equipment;
create trigger trg_equipment_sysno before insert on public.equipment
  for each row execute function app.assign_system_number('equipment_sn', 'EQP');

-- end of migration 0006
