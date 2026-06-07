// AUTO-GENERATED from docs/dronops_requirements_seed.sql (seed v1.0 + Oman v1.1 + ISO v1.2 + category re-tag v1.3 (2026-06-07)).
// Do not hand-edit — re-run scripts/convert-seed.mjs. Summaries are verbatim,
// QM-reviewed content; kind/jurisdiction are derived per the seed conversion rules.
import type { RequirementDef } from "./types";

export const awr033: RequirementDef[] = [
  {"id":"AWR033:PERMIT","framework":"CAA AWR 033","clause":"AWR 033 Rev 8","title":"Drone permit application per operation (new / extension / renewal)","summary":"Operations require a CAA permit; the application captures operation type, company category, purpose, full aircraft particulars (type, model, serial, weights, frequency, ceiling, range, speed, endurance, navigation systems, camera, control method, VLOS/BVLOS), investor/owner/operator particulars, declarations, per-location coordinates (governorate/wilayat/village, lat/long), required operational altitude (max 400 ft / 122 m AGL-MSL), and proposed flying dates and times; permit number issued on approval.","recordTypes":["mission_record","registration"],"version":"Rev 8","kind":"guidance","jurisdiction":"Oman","categoryNative":"Registration / permit — all operations","riskTier":"baseline"},
  {"id":"AWR033:MEDIA","framework":"CAA AWR 033","clause":"AWR 033 Rev 8 (Attention note)","title":"Media announcements must credit CAA authorization","summary":"Any announcement of drone operations in media (TV, radio, press, social media) must state that the operation is authorized by the Civil Aviation Authority.","recordTypes":["mission_record"],"version":"Rev 8","kind":"guidance","jurisdiction":"Oman","categoryNative":"Registration / permit — all operations","riskTier":"baseline"},
];
