# AIR Forms Pack — platform disposition (PR-014 / module input)

The forms pack is NOT templatized as documents. Per the spec §4 rule, each form
resolves to either a platform-native module (its fields become the module’s
schema/validation) or a PR-014 form template. This file is the disposition map
CC implements; it closes the forms half of M1.

## Summary

|Form                                     |Disposition      |Target                                    |
|-----------------------------------------|-----------------|------------------------------------------|
|AIR-FRM-001 Pre-Flight Checklist         |**Form template**|M4 PREFLIGHT-01 (heavy auto-fill)         |
|AIR-FRM-002 Flight Log                   |**NOT a form**   |M6 flight record IS the log               |
|AIR-FRM-003 Post-Flight Report           |**Form template**|M4 POSTFLIGHT-01                          |
|AIR-FRM-013 Bid / No-Bid                 |**Form template**|generic (commercial)                      |
|AIR-FRM-015 Project Change Request       |**Form template**|generic (MoC; links mission/project)      |
|AIR-FRM-025 Job Safety Analysis          |**Module**       |M3 risk-assessment template               |
|AIR-FRM-027 Incident / Near-Miss / Hazard|**Module**       |M3 occurrence flow (+ escalate to finding)|
|AIR-FRM-035 Non-Conformance Report       |**Module**       |M2 findings + capas (1:1)                 |

## 1. AIR-FRM-001 Pre-Flight Checklist → M4 form template PREFLIGHT-01

Sections A–J. The platform advantage: most fields **auto-populate from mission
context** — the pilot confirms and records actuals rather than re-keying.

|Form section                                                                            |Platform behaviour                                                                                                                 |
|----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
|A Mission details (date, project, site, client, mission type, permit ref)               |Auto-filled from the mission; read-only                                                                                            |
|B Personnel (pilot, licence, type rating, **currency confirmed**, VO)                   |Auto-filled from mission crew + M7; **currency is system-computed, not a manual Y/N** — render the live currency pill, not an input|
|C Aircraft & payload (type, serial, total hours, last maint., calibration due, firmware)|Auto-filled from M5 asset record                                                                                                   |
|D Batteries (ID, charge %, cycle count, visual OK, init.)                               |Battery rows = picker from M5; cycle count auto; charge % + visual = pilot input                                                   |
|E Environment (wind, temp, visibility, precip, cloud base, irradiance, window)          |Pilot input; sunrise/sunset auto from site coordinates                                                                             |
|F Airspace & permits (NOTAM, permit, coordination, geofence, RTL)                       |Checklist items; permit ref ties to mission approval-basis                                                                         |
|G Site hazards + JSA reviewed                                                           |Links the AIR-FRM-025 risk assessment (M3) for the site                                                                            |
|H Emergency plan (landing zones, hospital, control room, emergency services)            |**Gap to flag:** these belong on the mission/site record so they persist across flights — capture on site, surface here read-only  |
|I Stop conditions                                                                       |Gate-style: incomplete critical items block the preflight completion that the M6 deviation rule checks (PREFLIGHT_INCOMPLETE)      |
|J Authorization (pilot/VO/site signatures)                                              |Signature fields; pilot signature is the lightweight flight sign-off                                                               |

Note: completion of PREFLIGHT-01 before takeoff is the input to the M6
deviation rule; an incomplete checklist on an executed flight raises a deviation.

## 2. AIR-FRM-002 Flight Log → M6 flight record (no form)

Every field maps to the flights schema — do not build this as a form:
date→flight date; pilot→pilot_person; aircraft S/N→aircraft; permit ref→mission
approval-basis; the sortie rows (T/O, land, duration, battery, area/task,
anomalies)→flight/sortie records (auto from telemetry where available, manual
entry otherwise); totals→computed; **pilot signature→the UAE-Dubai
end-of-operation sign-off** (DCAR-UAS requirement, already in the union schema).
Anomalies/incident ref→links to deviations/occurrences.

## 3. AIR-FRM-003 Post-Flight Report → M4 form template POSTFLIGHT-01

Sections: mission summary (auto from flights), capture-vs-plan + reshoot flag,
anomalies/issues/observations, equipment status, client interaction, sign-off.
Anomalies and equipment issues offer one-click escalate to M3 occurrence or M5
maintenance workorder.

## 4. AIR-FRM-013 Bid / No-Bid → form template (generic, commercial)

Stays a form template (genuinely document-like, no native module). Capture the
decision criteria/scoring and the go/no-go with approver. Links to client/project
registry. Bid value drives the §14 4-band approval routing (amendment B1).

## 5. AIR-FRM-015 Project Change Request → form template (generic)

Change identification, description, impact assessment, recommendation, Aironov
sign-off, client acceptance. This is the MoC instrument — links to the mission/
project; an approved change can trigger document-revision or re-approval where it
affects a controlled procedure.

## 6. AIR-FRM-025 Job Safety Analysis → M3 risk-assessment template

Site hazards × controls × residual risk. Becomes a risk_assessment instance
(simple profile) attachable to a mission; referenced by PREFLIGHT-01 §G; the
site hazard library can prefill from prior JSAs at the same site.

## 7. AIR-FRM-027 Incident / Near-Miss / Hazard → M3 occurrence flow

Sections map 1:1: type & severity → occurrence class; identification →
occurred_at/location/reporter; description; consequences; immediate actions;
**notifications → the jurisdiction deadline engine** (the form’s “immediate
verbal + notifications” becomes the 3h/72h/10d/Oman clock per the binding
jurisdiction); preliminary cause; reporter sign-off; investigation outcome
(QHSE Lead) → escalate-to-finding (M2). Hazard-observation type routes to the
hazard register.

## 8. AIR-FRM-035 Non-Conformance Report → M2 findings + capas (1:1)

Exact module match — do not build as a form. Section→field:
identification→finding ref/raised_by; source→source enum; description;
containment→capa.containment; root cause→capa.root_cause; corrective
action→capa.action/owner/due; **verification & effectiveness→capa.verified_by
(SoD: verifier ≠ raiser, enforced by close_finding)**; close-out→status=closed.
The form’s existence proves the SoD rule is original to the operator’s QMS, not
a platform imposition.

## Gaps to flag (not improvise)

1. PREFLIGHT-01 §H emergency-plan fields need a home on the mission/site record
   (persist across flights) — propose adding to sites/mission schema.
1. “Currency confirmed (Y/N)” must be replaced by the computed currency pill
   everywhere it appears as a manual input — manual confirmation of a
   system-known fact is exactly the dual-system pattern to avoid.
1. Site hazard library (prefill JSA from prior same-site assessments) is a nice-
   to-have, not P0 — flag, don’t build yet.