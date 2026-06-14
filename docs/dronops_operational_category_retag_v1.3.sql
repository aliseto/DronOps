-- DronOps requirement re-tag v1.3 (2026-06-07) — OPERATIONAL CATEGORY
-- ============================================================================
-- PURPOSE: prevent the engine from mixing high-risk-operation requirements with
-- standard/low-risk-operation requirements. Each requirement is tagged with the
-- operational category it governs WITHIN ITS OWN FRAMEWORK, plus a normalized
-- risk_tier the engine compares against a mission's category.
--
-- TWO NEW FIELDS on every requirement object:
--   category_native : the framework's own term (honest label, shown in UI)
--   risk_tier       : normalized engine enum — one of:
--       'baseline'          applies to ALL operations in the framework (the
--                           floor: registration, licensing, records, occurrence
--                           reporting, condition-for-safe-operation, insurance
--                           basics, permit). Included for every mission.
--       'low'               applies ONLY to open / standard / low-risk ops.
--                           NOT included on specific/advanced missions (those
--                           replace open limits with tailored OA conditions).
--       'high'              applies ONLY to specific / advanced / higher-risk
--                           ops (DUOSAM, OA/UOC, SMS, ROC, BVLOS, autonomous,
--                           controlled airspace, AC 107-01 advanced guidance).
--                           NEVER included on a standard/low-risk mission.
--       'management_system' ISO 9001 — not operation-tiered; governs the QMS
--                           org-wide. NEVER mission-gated by category; appears
--                           in the org QMS/compliance view, not per-mission.
--
-- ENGINE RULE (M2/M4): applicable requirements for a mission =
--   risk_tier = 'baseline'
--   OR risk_tier = (mission.operational_category mapped to low|high)
--   ['management_system' is excluded from per-mission evaluation entirely]
-- A 'high' requirement must NEVER attach to a low-risk mission, and vice versa.
-- A mission's operational_category is derived from its authorization basis
-- (open/standard vs specific/advanced) per jurisdiction — set in M4.
--
-- Framework → native category vocabulary:
--   CAR-UAC (GCAA)   : UOA operator floor → mostly baseline (open/specific
--                      airspace handled per-operation, not as a requirement tier)
--   DCAR-UAS (DCAA)  : 'standard' vs 'specific-category (DUOSAM)'
--   GACAR 107 (GACA) : 'Open category' vs 'Specific category (OA/UOC)'
--   GACAR 48 (GACA)  : registration → baseline; specific-eligibility label → high
--   AC 107-01 (GACA) : advanced operations guidance → high
--   CAR-102 (Oman)   : 'standard operating conditions' vs 'ROC / large / special
--                      approval (autonomous, controlled airspace)'
--   CAR-47, AWR 033 (Oman) : registration / permit → baseline
--   ISO 9001         : management_system (org-wide)
-- ============================================================================

alter table requirement_defs
  add column if not exists category_native text,
  add column if not exists risk_tier text
    check (risk_tier in ('baseline','low','high','management_system'));

-- ---------------------------------------------------------------------------
-- BASELINE — applies to all operations in the framework (the floor)
-- ---------------------------------------------------------------------------
update requirement_defs set risk_tier='baseline',
  category_native='UOA operator requirement — all operations'
 where id in ('CARUAC:015a','CARUAC:015b','CARUAC:015c','CARUAC:015d',
  'CARUAC:015e','CARUAC:015f','CARUAC:015h','CARUAC:015h-AMC','CARUAC:020',
  'CARUAC:025','CARUAC:035a','CARUAC:035d','CARUAC:040','CARUAC:045');

update requirement_defs set risk_tier='baseline',
  category_native='DCAR operator requirement — all operations'
 where id in ('DCAR:ORG-AUTH','DCAR:ORG-REG','DCAR:UOR-RECORDS','DCAR:UOR-AMEND',
  'DCAR:UOR-CREW','DCAR:UOR-FLTLOG','DCAR:OM-OCC72','DCAR:OM-RETENTION');

update requirement_defs set risk_tier='baseline',
  category_native='Applies to all § 107 small-UA operations'
 where id in ('GACAR107:107.5','GACAR107:107.7','GACAR107:107.9','GACAR107:107.19',
  'GACAR107:107.57','GACAR107:107.71');

update requirement_defs set risk_tier='baseline',
  category_native='Registration — all UA (MTOM ≥ 250 g)'
 where id in ('GACAR48:48.3','GACAR48:48.11','GACAR48:48.13','GACAR48:48.19');

update requirement_defs set risk_tier='baseline',
  category_native='CAR-102 — all operations / standard conditions'
 where id in ('CAR102:015','CAR102:020','CAR102:025-12','CAR102:075','CAR102:115',
  'CAR102:180','CAR102:185','CAR102:195','CAR102:G-IMM','CAR102:G-3D');

update requirement_defs set risk_tier='baseline',
  category_native='Registration / permit — all operations'
 where id in ('CAR47:MARKS','AWR033:PERMIT','AWR033:MEDIA');

-- ---------------------------------------------------------------------------
-- LOW — open / standard category only (replaced by tailored conditions in
-- specific operations; must NOT attach to a specific-category mission)
-- ---------------------------------------------------------------------------
update requirement_defs set risk_tier='low',
  category_native='Open category — operating limitations for small UA'
 where id in ('GACAR107:107.59');

-- ---------------------------------------------------------------------------
-- HIGH — specific / advanced / higher-risk only (NEVER on a low-risk mission)
-- ---------------------------------------------------------------------------
update requirement_defs set risk_tier='high',
  category_native='Specific-category (DUOSAM) operations manual'
 where id in ('DCAR:OM-DOCCTRL','DCAR:OM-DUTY','DCAR:OM-ERP','DCAR:OM-MAINT');

update requirement_defs set risk_tier='high',
  category_native='Specific category — OA/UOC holders'
 where id in ('GACAR107:107.117','GACAR107:107.123','GACAR107:107.133',
  'GACAR107:107.135','GACAR107:107.139','GACAR107:107.145','GACAR107:107.149',
  'GACAR107:107.171','GACAR107:107.203','GACAR107:107.211','GACAR107:107.213');

update requirement_defs set risk_tier='high',
  category_native='Specific-category eligibility label'
 where id in ('GACAR48:48.23');

update requirement_defs set risk_tier='high',
  category_native='Advanced operations guidance (AC 107-01)'
 where id in ('AC107-01:PILOT-LOG','AC107-01:MAINT-LOG','AC107-01:CREW-AUTH',
  'AC107-01:DOC-AMEND','AC107-01:INFOSEC');

update requirement_defs set risk_tier='high',
  category_native='ROC / special-approval operations (autonomous, controlled airspace)'
 where id in ('CAR102:065','CAR102:125','CAR102:150','CAR102:320','CAR102:335');

-- ---------------------------------------------------------------------------
-- MANAGEMENT_SYSTEM — ISO 9001, org-wide, never mission-gated
-- ---------------------------------------------------------------------------
update requirement_defs set risk_tier='management_system',
  category_native='QMS — applies org-wide, not per-operation'
 where framework = 'ISO 9001';

-- ---------------------------------------------------------------------------
-- INTEGRITY CHECK — every requirement must be tagged; none left null.
-- (Converter/test should assert: 0 rows where risk_tier is null; and that no
--  mission ever resolves a requirement whose risk_tier is 'high' when the
--  mission is low-risk, or 'low' when the mission is specific.)
-- ---------------------------------------------------------------------------
-- select id, framework from requirement_defs where risk_tier is null;  -- expect 0
-- Counts by tier (verified against source seeds, sum = 92):
--   baseline 45 · low 1 · high 26 · management_system 20  =  92
--   baseline   = CAR-UAC 14 + DCAR 8 + GACAR107 6 + GACAR48 4 + CAR-102 10 + CAR-47/AWR 3
--   low        = GACAR107 1 (§107.59 open-category limits)
--   high       = DCAR 4 (DUOSAM) + GACAR107 11 + GACAR48 1 + AC107-01 5 + CAR-102 5
--   management_system = ISO 9001 20
-- Converter/count test should assert these totals and 0 null risk_tier rows.
