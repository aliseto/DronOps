-- ============================================================================
-- DOM — Migration 0004 — domain CHECK constraints
--
-- Conservative, spec-safe constraints only: the jurisdiction vocabulary
-- (UAE/KSA/Oman, defined in Spec §2.3) and non-negative numerics. Status/text
-- fields whose vocabularies the spec does not pin are intentionally left
-- unconstrained. Wrapped in DO/duplicate_object so re-running is a no-op.
-- ============================================================================

do $$ begin
  alter table public.organisations
    add constraint organisations_jurisdiction_ck
    check (jurisdiction is null or jurisdiction in ('UAE','KSA','OMAN'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.org_settings add constraint org_settings_currency_pos check (currency_window_days > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.org_settings add constraint org_settings_buffer_nonneg check (mobilisation_buffer_min >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.org_settings add constraint org_settings_duty_pos check (duty_max_min > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.org_settings add constraint org_settings_flight_pos check (flight_max_min > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.org_settings add constraint org_settings_rest_nonneg check (rest_min_min >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.drones add constraint drones_hours_nonneg check (total_flight_hours >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.operations
    add constraint operations_alt_nonneg check (max_altitude_m is null or max_altitude_m >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.flights add constraint flights_duration_nonneg check (duration_s is null or duration_s >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.flights add constraint flights_alt_nonneg check (max_altitude_m is null or max_altitude_m >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.flights add constraint flights_dist_nonneg check (max_distance_m is null or max_distance_m >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.flights add constraint flights_speed_nonneg check (max_speed_ms is null or max_speed_ms >= 0);
exception when duplicate_object then null; end $$;

-- end of migration 0004
