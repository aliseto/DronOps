> Extracted text of DRO-REG-001 v2.0 (originally .docx). Readable engineering reference; original .docx is authoritative. Tables approximated with ` | `.

DRONOPS  by Aironov

Regulatory Reference
GCC UAS Regulatory Comparison & Platform Implementation Matrix
GCAA CAR-UAC · DCAA DCAR-UAS · GACA GACAR 107/48/AC · Oman CAA CAR-102/CAR-47/AWR 033 — mapped to DronOps jurisdiction modes, record schemas, gates, clocks and packs.

Document ID
 | DRO-REG-001
 |
Revision
 | 2.0 (Draft for QM review) — adds Oman (CAA)
 |
Date
 | 07 June 2026
 |
Owner
 | Quality & Compliance, DronOps / Aironov
 |
Source basis
 | Documents on file as listed in §1.1; paraphrased summaries are not legal advice
 |
Linked assets
 | requirement_defs seed v1.0 + Oman addendum v1.1 · AIR-PRD-001 v0.2 · DronOps jurisdiction settings
 |
Classification
 | Internal — Confidential
 |

Contents
TOC \h \o "1-2"

1. Purpose and Use
This document is the implementation reference mapping three GCC UAS regulatory regimes onto the DronOps platform: it defines, requirement by requirement, what each regulator demands, where the regimes overlap and diverge, which rule the platform builds to, and exactly which platform behavior implements it in each jurisdiction mode. It is written to be executable: every row resolves to a module, a record type, a gate, a clock, or a configuration.
How to use it: Product/engineering implement §6–§17 “Platform implementation” blocks; the Quality Manager uses the comparison tables to map evidence in the Compliance coverage matrix; sales uses §4 to demonstrate multi-jurisdiction value. Paraphrased summaries are operational interpretations — the source regulation text remains authoritative and must be consulted before any regulator-facing assertion.
1.1 Source documents
Regulator
 | Instrument
 | Version on file
 | Platform framework key
 |
GCAA (UAE Federal)
 | CAR-UAC — Unmanned Aircraft Commercial and Governmental Operations
 | Issue 02
 | UAE-Federal
 |
DCAA (Dubai)
 | DCAR-UAS — UAS Operations (DCAA/DCAR/2025/00007), incl. DUOSAM operations manual appendix
 | Issue 03
 | UAE-Dubai
 |
GACA (KSA)
 | GACAR Part 107 — Operation of UAS
 | Version 5.0
 | KSA
 |
GACA (KSA)
 | GACAR Part 48 — Registration and Marking
 | Current
 | KSA
 |
GACA (KSA)
 | AC 107-01 — Advanced Operations with UAS (guidance / acceptable means)
 | Current
 | KSA (guidance)
 |
CAA (Oman)
 | CAR-102 — Remote Piloted Aircraft (Drones)
 | v0.20 (JNC revised amendment — confirm current issue)
 | Oman
 |
CAA (Oman)
 | CAR-47 — Aircraft Registration Marks
 | Rev 05
 | Oman
 |
CAA (Oman)
 | AWR 033 — Drone Permit Application (+ May 2026 resumption circular: green zones / Serb platform)
 | Rev 8
 | Oman (guidance)
 |

1.2 Authority hierarchy — the Dubai dual layer
A Dubai-based operator answers to two regulators simultaneously: DCAA under Dubai Law No. 11 of 2020 and Law No. 4 of 2020 (local authority for UAS in the Emirate), and the GCAA federal layer (CAR-UAC) for UAE-wide obligations. CAR-UAC itself repeatedly defers to “GCAA or LAA, as the case” — the Local Aviation Authority, which in Dubai is the DCAA. Abu Dhabi-based operations follow CAR-UAC with their own LAA arrangements. KSA is single-layer under GACA.
Platform rule: enabling UAE-Dubai without UAE-Federal triggers an advisory (not a block) to enable Federal, because most Dubai operators carry both obligations. The two remain separate frameworks in coverage so federal vs. local evidence is distinguishable in audits.
 |
2. Jurisdiction Modes on the Platform
A jurisdiction mode is enabled per organization (Settings → Jurisdictions) and bound per record (each mission, occurrence, and registration carries one governing jurisdiction). Org-level enablement constrains the menu; record-level binding determines which deadlines, gates, retention clocks and pack formats govern that record.
Mode
 | Activates
 | Primary pack output
 |
UAE-Federal
 | CAR-UAC requirement set in coverage · 3-hour accident clock + ROSI occurrence flow · 24-month retention floor · GCAA finding CAPA defaults (7/60/90 d) · UOA validity tracking
 | GCAA UOA renewal / surveillance pack
 |
UAE-Dubai
 | DCAR-UAS + DUOSAM requirement sets · 72-hour occurrence clock · pilot flight-log sign-off · personnel & asset registration registers · duty/rest tracking (OSO#17) · 3-year advanced-category retention · DUOSAM OM structure templates
 | DCAA authorization / DUOSAM evidence pack
 |
KSA
 | GACAR 107 + Part 48 + AC 107-01 sets · 10-day occurrence clock + NTSC routing · §107.71 recency gate · Part 48 registration expiry gate (3-yr / 6-month window) · 3-year logbook & UOC record retention · SMS evidence expectations · Subpart E declaration workspace
 | GACA OA/UOC pack
 |
Oman
 | CAR-102 / CAR-47 / AWR 033 requirement sets · permit-per-operation workspace (AWR 033 structure: per-location coordinates, ≤122 m ceiling, flight window, permit number & type) · immediate + 3-day occurrence clocks · 36-month liability-records rule · green-zone (Serb) check field · Chief Remote Pilot postholder · media-attribution mission condition
 | Oman CAA permit & surveillance pack
 |
ISO 9001:2015
 | QMS clause set: documented information (7.5), operational control (8.5), internal audit (9.2), management review (9.3), nonconformity & corrective action (10.2)
 | ISO surveillance / certification pack
 |

Build-to-strictest principle. Where regimes differ on the same dimension, the platform implements the strictest rule as its single engine and renders jurisdiction-specific values for display and deadlines. Retention is built to 3 years (satisfying both 24-month UAE rules); flight-record schema is the union of all field lists; reporting deadlines are never harmonized — they bind per record.
3. Operator Authorization and Validity
Aspect
 | GCAA (CAR-UAC)
 | DCAA (DCAR-UAS)
 | GACA (GACAR 107)
 |
Instrument
 | UA Operator Authorisation (UOA) — UAC.010
 | Dubai UAS Operator Authorization; DCAR compliance declaration; DUOSAM safety approval for advanced category (UAS.ORG)
 | Operational Authorization (OA) per operation set, or UAS Operator Certificate (UOC) — §107.115–131
 |
Validity
 | 1 year (UAC.040)
 | Period as defined by DCAA
 | UOC duration per §107.131; renewal §107.137
 |
Continued-validity conditions
 | Compliance; valid security clearance; authority access to facility, equipment, documents, records at any time; not surrendered/suspended/revoked
 | Continued compliance; registrations of personnel and assets kept current; amendment notification
 | Compliance with conditions/limitations (§107.133); records availability (§107.7); change management (§107.135)
 |
Change notification
 | Before changes: accountable person, operator details, UA type, fleet size, type of operations (UAC.015c)
 | Notify DCAA of amendments to processes, procedures and manuals across all phases (UAS.UOR)
 | Changes to application basis managed per §107.135
 |

Platform implementation
M1 Documents: authorization certificates stored as category 'external' with validity dates; expiry surfaces in Needs attention at 90/30 days; UOA annual cycle gets a renewal checklist generated from the coverage matrix.
Change-control workflow: a 'Regulatory change notification' record type (M4 MoC) — any approved revision of an OM-class document or fleet/personnel registration change prompts “notify regulator?”, producing a dated notification record with the authority, channel, and acknowledgment; satisfies UAC.015c, UAS.UOR amendment duty, and §107.135 in one mechanism.
Authority access: the audit pack generator with time-boxed guest access is the standing implementation of “records available to the authority on request” in all three regimes (UAC.040, UAS.UOR, §107.7).
4. Records Management, Integrity and Retention
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Core duty
 | Procedures to control operation records; protection from damage, alteration, theft (UAC.015h)
 | Identical duty, near-identical wording (UAS.UOR); records/logs to DCAA on request
 | Records availability on request (§107.7); falsification prohibited (§107.5)
 |
Retention — operational
 | ≥ 24 months
 | ≥ 24 months (regulation level)
 | 3 years: flight logbook (§107.57); UOC crew-per-flight and maintenance records (§107.139)
 |
Retention — extended
 | —
 | DUOSAM (advanced category): all important documents ≥ 3 years after end of operation; personnel records 3 years after person leaves/changes position
 | Declaration records per Subpart E (§107.213); ownership transfer passes maintenance records (§107.139(b))
 |
Integrity standard
 | Protection from alteration
 | Protection from loss/alteration; available for inspection
 | Falsification = certificate action (§107.5); legibility required for maintenance records (AC 107-01)
 |

Platform implementation
Single integrity engine for all modes: append-only audit events, hashed evidence files, e-signatures, sealed records. This implements 'protection from damage, alteration and theft' (GCAA/DCAA) and the §107.5 falsification deterrent simultaneously — alterations are impossible silently, corrections are visible new events.
Retention clocks: default retain-until = creation + 36 months on all operational records (strictest rule); personnel records additionally hold until employment-end + 36 months when UAE-Dubai is enabled; clocks are display/blocking metadata only — the platform never auto-deletes.
Ownership transfer (KSA): aircraft disposal workflow exports the maintenance record bundle for handover per §107.139(b).
5. Flight Record — Field-Level Union Schema
The platform flight record carries the union of all required fields; each framework reads its subset. Source anchors: GCAA AMC to UAC.015(h); DCAA UAS.UOR flight-log duty + DUOSAM pilot logbook format; GACA §107.57 logbook, §107.139 crew record, AC 107-01 pilot logbook.
Field
 | GCAA
 | DCAA
 | GACA
 | DronOps source
 |
Date of flight
 | ●
 | ●
 | ●
 | telemetry / entry
 |
Start and end time / total flight time
 | ●
 | ●
 | ●
 | telemetry
 |
Pilot in command name
 | ●
 | ●
 | ●
 | mission crew link
 |
Other crew members per flight
 | ○
 | ●
 | ● (§107.139)
 | mission crew link
 |
Aircraft model / serial / registration
 | ●
 | ●
 | ●
 | aircraft registry link
 |
UA weight and main colour
 | ●
 | ○
 | ○
 | aircraft type profile
 |
Route / GPS coordinates
 | ●
 | ○
 | ○
 | telemetry trace
 |
Take-off and landing areas
 | ○
 | ●
 | ● (§107.57)
 | mission site + telemetry
 |
Type of operation / purpose
 | ○
 | ●
 | ●
 | mission op_type
 |
Applicable flight rules
 | ○
 | ○
 | ● (§107.57)
 | mission approval basis
 |
Observations / incidents / equipment failure
 | ●
 | ●
 | ● (deviations)
 | post-flight form + deviations
 |
Airspace approval reference
 | ●
 | ●
 | ○
 | mission approval basis
 |
Pilot end-of-operation signature
 | ○
 | ● (UAS.UOR)
 | ○
 | flight sign-off (lightweight signature)
 |
Outcome of flight (training/operational detail)
 | ○
 | ○
 | ● (AC 107-01)
 | mission type + reconcile status
 |
Pre/post-flight inspection completion
 | ○
 | ● (DUOSAM OSO#07)
 | ● (§107.57 checks)
 | form instances
 |

● = explicitly required · ○ = not explicit in that regime (still recorded — union schema). Implementation: required-field validation is jurisdiction-aware at reconcile time: a UAE-Dubai flight cannot reach 'reconciled' without pilot sign-off; a KSA flight without take-off/landing areas and flight rules is flagged incomplete. CSV import maps these columns; telemetry sources auto-fill what they can.
 |
6. Occurrence and Accident Reporting
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Deadline
 | 3 hours for accidents/serious incidents (UAC.035)
 | 72 hours from awareness (DUOSAM OM)
 | 10 calendar days (§107.9)
 |
Channel
 | Hotline + email aai@gcaa.gov.ae; accidents also to local Police; other occurrences via ROSI system
 | DCAA website portal
 | Manner acceptable to the President; serious incidents/accidents also to NTSC
 |
Reportable set
 | Crashes; signal interference; near miss; collisions; public nuisance; ops outside assigned area; serious/fatal injury; lost UA
 | Anything endangering aircraft, persons, equipment or installations + related safety info; accidents; serious incidents; property damage
 | Serious injury / loss of consciousness; property damage (other than UA); missing/inaccessible UA; fly-away; manned-aircraft interference; other GACA-required
 |
Follow-up
 | Follow-up report on preventive actions where relevant
 | Per OM investigation procedures
 | SMS analysis and recurrence prevention (§107.149)
 |

Platform implementation
Deadline engine: occurrence records carry jurisdiction (inherited from the linked mission) and reportable-category; the countdown StatusPill computes 3h / 72h / 10d; Needs-attention escalates at 50% elapsed and past-due; reported_to_authority_at + channel + reference stop the clock and form the submission record.
Category mapping: the occurrence form's category list is jurisdiction-filtered to the reportable sets above, each option carrying its clause tooltip; 'not reportable' remains selectable for internal-only events (SMS still applies).
Closing the loop: GCAA follow-up duty and GACA §107.149 recurrence-prevention are implemented by the existing escalate-to-finding action: occurrence → finding → CAPA → management review, with the CAPA record exportable as the follow-up report.
7. Personnel: Licensing, Competence, Recency, Duty
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Pilot certificate
 | GCAA UA Pilot Licence (UAC.020)
 | Registered with DCAA as operator personnel; qualified per DUOSAM
 | Open Remote Pilot Certificate (§107.63–85); Specific RPC + endorsement training (§107.91–92)
 |
Competence duty on operator
 | Ensure pilot competent: skills + knowledge of law/regs/procedures (UAC.015e)
 | Crews qualified and competent for intended operations (UAS.UOR); qualified-pilot list maintained (DUOSAM)
 | Ops Manager maintains qualification records and monitors standards/proficiency of each person (§107.117)
 |
Recency
 | — (licence regime)
 | Per OM competency scheme
 | Knowledge test/training within previous 24 calendar months (§107.71)
 |
Medical
 | Per licence requirements
 | Preventive health care section in OM
 | Medical condition rule (§107.21); psychoactive substances (§107.31, §107.63)
 |
Crew authorization & training records
 | Pilot training certificate/licence in records (AMC 015h)
 | Lists: authorized maintenance personnel, inspection-authorized personnel, qualified pilots; ERP training log (DUOSAM)
 | Observers/support crew trained and authorized in writing; ongoing training and site-authorization records (AC 107-01)
 |
Duty & rest
 | —
 | Explicit duty-hour maxima and rest minima for all crew (DUOSAM OSO#17); company agreements may only tighten
 | —
 |
Personnel record retention
 | Within 24-month records duty
 | 3 years after person leaves or changes position (DUOSAM)
 | Qualification records per §107.117; crew-per-flight 3 years (§107.139)
 |

Platform implementation (M7 + currency engine)
Credential wallet holds GCAA licences, DCAA registrations, GACA RPCs and endorsements as distinct credential kinds with authority + jurisdiction; verification status distinguishes operator-verified external credentials.
Recency as a credential kind: KSA mode evaluates a 'knowledge_recency' event ≤ 24 months for any pilot assigned to a KSA mission; absence → currency 'lapsed (§107.71)' → assignment gate.
Authorized-personnel lists (DCAA) are queries, not documents: the DUOSAM lists (maintenance-authorized, inspection-authorized, qualified pilots, ERP-trained) are generated live from credentials + type approvals + training records and exportable as the standard DUOSAM annex forms — always current, never stale.
Duty engine (UAE-Dubai mode): duty records with configurable scheme implementing OSO#17 maxima/minima; rostering warnings at projection, breach → deviation → finding. Disabled in modes that do not require it, available voluntarily.
Personnel retention: employment-end date on person triggers the +36-month personnel retention clock when UAE-Dubai is enabled.
8. Aircraft: Registration, Condition, Maintenance
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Registration
 | All UA registered + insured before operation (UAC.015b)
 | All assets registered with DCAA incl. UA, ground controllers, payloads, safety add-ons; updates on change (UAS.ORG)
 | Part 48: ≥ 250 g MTOM; certificate expires ≤ 3 years; renewal window 6 months pre-expiry; unique identifier displayed (§§48.3–48.21); Specific-category label/QR (§48.23)
 |
Safe condition
 | Instruments/equipment available, serviceable, maintained per manufacturer + operator instructions (UAC.015d); pilot confirms safe condition pre-flight
 | OM maintenance part (Part M) incl. software updates; pre/post-flight inspections by authorized personnel
 | No operation unless in condition for safe operation (§107.19); pre-flight checks (§107.57)
 |
Maintenance records
 | Within operational records (24 mo)
 | Technical logbook with records; flight-test evidence for contingency/emergency procedures (DUOSAM Part M)
 | Maintenance/modification/repair records: who, dates, parts, instructions; 3-year retention; transfer with ownership (§107.139). AC 107-01 logbook contents: model/serial, engine, props, GCS, defects & rectifications, time-in-service, life-limited items, AD/service-info tracking, inspections with date+inspector, modifications
 |
Modification control
 | Prohibited without permission where affecting LoC functionality (UAC.015)
 | Software/firmware update control documented
 | Modification records incl. parts and manufacturer details (§107.139); declared-UAS mandatory actions (§107.211)
 |
Controlled release
 | UA stored securely, released to pilots in controlled documented manner (UAC.015f)
 | Asset registration + OM procedures
 | —
 |

Platform implementation (M5 + gates)
Registration tracking per jurisdiction: aircraft registrations jsonb keyed by jurisdiction with number + expiry; KSA defaults 3-year validity and shows the 6-month renewal window; expired/expiring registration gates KSA mission assignment (override pattern). DCAA asset registration extends beyond aircraft: ground controllers, payloads and safety add-ons carry registration references in equipment records.
Maintenance logbook = AC 107-01 superset: the maintenance record schema implements the AC field list (the most detailed of the three) so one record satisfies all regimes; time-in-service and life-limited components compute from auto-tabulated flight data; firmware register implements DCAA software-update control and §107.211 mandatory-action tracking.
Controlled release (GCAA): mission asset assignment + pre-flight form constitutes the documented release; an asset checkout log view renders it explicitly for GCAA audits.
9. Missions, Approvals and Operating Rules
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Category model
 | Operation-type scoping in UOA; airspace approval per operation (UAC.025)
 | Basic vs Advanced category; advanced requires DUOSAM safety approval; Operation Authorization per intended operation/mission
 | Open vs Specific; Specific via OA/UOC with ORA; Subpart B operating rules (daylight §107.35, VLOS §107.37, observers §107.39, airspace §107.49–60, limitations §107.59)
 |
Per-mission approvals
 | Airspace approval reference held in records
 | OA per mission for registered operators
 | Operate within OA/UOC conditions (§107.133)
 |
Pre-flight duties
 | Pilot ensures safe operating condition; safety procedures incl. give-way, privacy, min safe distance (UAC.015)
 | Pre-flight inspections by authorized personnel; multi-crew coordination; flight planning per OM
 | Environment assessment (weather, airspace, persons/property, hazards); participant briefing on conditions, emergency/contingency, roles; control-link and power checks (§107.57)
 |
In-flight constraints
 | Give way to manned aircraft and land on proximity; min safe distance; privacy
 | OM Part C flight areas with operational limitations per area; contingency + emergency procedures
 | Right-of-way (§107.45); over-people (§107.47); hazardous ops (§107.27); moving vehicle (§107.29); ops limitations (§107.59)
 |

Platform implementation (M4)
Approval-basis structure: missions carry structured approval references per jurisdiction (UAE: airspace approval / OA reference and permit numbers; KSA: OA/UOC reference + conditions). The reconcile gate requires the references the jurisdiction expects.
Pre-flight form templates per jurisdiction: the seeded PREFLIGHT template family includes the §107.57 assessment items and briefing confirmation for KSA missions, and the DUOSAM inspection sign-off for Dubai missions; completion is the deviation rule's input.
Category & limitation fields (basic/advanced, Open/Specific, night, BVLOS, over-people) drive which risk-assessment profile and approval chain the mission requires — the existing gate framework, parameterized by jurisdiction.
10. Risk Assessment, SMS and Emergency Response
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Risk methodology
 | Light-touch; safety procedures duty (UAC.015)
 | SORA-based: OSO-coded OM obligations; DUOSAM safety approval assessing advanced operations
 | Operational Risk Assessment in OA/UOC application: hazards to people/property/aircraft + mitigation measures (§107.123(b)(5))
 |
SMS
 | Not explicit
 | Embedded across OM (safety statement, occurrence reporting, safety meetings minuted and retained)
 | Explicit for UOC (§107.149): policy, risk management, internal reporting & analysis, recurrence prevention, measurable goals, internal audits, regular management reviews, competency training; documented and scaled
 |
ERP
 | Emergency/abnormal procedures established (UAC.015)
 | OM Part E: ERP creation, briefing, post-emergency reporting; ERP training recorded per crew
 | Within OM/contingency expectations; AC guidance
 |

Platform implementation (M2/M3)
One risk module, two profiles: mission RA templates cover the simple profile (GCAA) and the SORA-style/ORA profile (Dubai advanced, KSA Specific) — GRC/ARC-style determinations captured as structured form data attached to missions and reusable in OA applications.
§107.149 maps 1:1 to existing machinery: internal reporting = occurrences; analysis & recurrence prevention = findings/CAPA; measurable goals = KPI engine; internal audits = M2 audits; regular reviews = management reviews; competency training = M7/TMS records. The KSA coverage matrix links each SMS sub-requirement to its module — SMS compliance becomes demonstrable from daily operation rather than a binder.
Safety meeting minutes (DCAA retention item) are the management review and safety review records — already retained, signed and exportable.
11. Documentation, Manuals and Document Control
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Required library
 | Procedures for compliance + emergency/abnormal; accessible to staff with clear roles (AMC 015i)
 | DUOSAM OM structure: Parts A (org, retention, doc control, personnel, duty), B (procedures, occurrence), C (flight areas), D (training), E (ERP), T (technical), M (maintenance) + pilot logbook format
 | Ops Manager reference library (§107.117): OM, operational flight plans, RPCs, OAs, ORAs, DoCs, UOC, SMS; §107.123 application content; §107.211 declared-UAS operating manual content
 |
Document control
 | Implied via records control
 | Current-version discipline; revision distribution to employees; revision list available; documentation lists maintained (DUOSAM)
 | Amendment process with list of effective pages, chronological amendment record, control sheet (AC 107-01 §107.123(b)(15))
 |

Platform implementation (M1)
Manual suite templates follow the DUOSAM part structure (the most prescriptive of the three) so one OM satisfies Dubai natively and maps to GACA §107.123 application sections via requirement links; the §107.117 reference library is the Documents register filtered to those categories — a saved view named 'Ops Manager library'.
LEP and amendment record are generated, not maintained: list of effective pages and the chronological amendment log render automatically from document_revisions — the AC 107-01 amendment-control expectation as a by-product of the revision engine.
Distribution & acknowledgement implements the DUOSAM employee-distribution duty; ack records are the evidence.
12. Oversight, Findings and Corrective Action
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Surveillance basis
 | Post-UOA surveillance program (UAC.045)
 | DCAA oversight under authorization
 | GACA inspection/testing (§107.7); enforcement via Part 13 (§107.141)
 |
Finding classes & deadlines
 | Level 1: significant non-compliance — CAP within 7 calendar days (spot action possible e.g. grounding); Level 2: non-compliance/non-conformance — 60 days (adjustable); Level 3: improvement opportunities — 90 days, case-by-case closure; repeated Level 2 → Level 1
 | Per DCAA process
 | Per Part 13 procedures
 |
Internal audit duty
 | —
 | Via OM/safety meetings
 | Within SMS: internal audits + regular reviews (§107.149)
 |

Platform implementation (M2)
External findings are findings with source 'audit' + authority; GCAA classifications map Level 1/2/3 → major/minor/observation with CAPA due-date defaults 7/60/90 days and an escalation rule: a second minor against the same requirement within 12 months prompts reclassification review (the repeated-Level-2 rule).
Grounding on the spot: a Level 1 finding referencing an aircraft offers one-click status → grounded, audit-logged, satisfying the immediate-action expectation.
13. Insurance, Security and KSA Declarations
Aspect
 | GCAA
 | DCAA
 | GACA
 |
Insurance
 | Appropriate insurance before any operation (UAC.015b)
 | Per authorization conditions
 | Adequate third-party + cargo liability for every flight regardless of ownership/lease; covering war, terrorism, hijacking, sabotage, seizure, civil commotion; DG carriage explicitly listed (§107.171)
 |
Security / info protection
 | Security rules (UAC.030); security clearance condition of UOA validity
 | Security & privacy statement in OM
 | Security for Specific ops (§107.181); measures against unauthorized access to information and record-keeping systems (AC 107-01)
 |
Declarations
 | —
 | DCAR compliance declaration at authorization
 | Subpart E: Declaration of Compliance where performance standards required (§107.203–207); declarant documentation duties to owners (§107.211); declaration record retention (§107.213); GACA validation possible
 |

Platform implementation
Insurance as external documents subtype with expiry + scope flags (DG coverage y/n); KSA mode warns when a mission's operation type implies coverage scope the policy record lacks; expiring insurance blocks new mission approval (override pattern) since both UAC.015b and §107.171 condition operations on coverage.
Declaration workspace (KSA mode): DoC records linking the UAS model, the performance standard, supporting evidence files, validity, and §107.211 documentation made available to owners; retention per §107.213. This is also the architecture STS-class declared operations will use.
Information security (AC 107-01): satisfied by the platform's own controls — RLS tenancy, RBAC, audit trail — documented as a coverage-matrix evidence note pointing at the Settings 'Data & security' card.
14. Oman (CAA) — Permit-Based Regime
Oman regulates UAS under CAR-102 (Remote Piloted Aircraft), with registration marks under CAR-47 and a per-operation permit administered via form AWR 033. After a blanket suspension (3 March 2026), the CAA resumed permit issuance effective 25 May 2026 for governmental, commercial and recreational operations within designated green zones identified on the Serb platform. The regime is single-layer (CAA only) and permit-centric: where the other three regimes authorize an operator, Oman additionally authorizes each operation.
14.1 Comparison against the other regimes
Aspect
 | Oman (CAR-102 / AWR 033)
 | Nearest equivalent elsewhere
 |
Authorization model
 | Per-operation permit (AWR 033: new/extension/renewal; per-location coordinates; flight window) on top of ROC certification for certain operations (CAR 102.065, Subpart F)
 | DCAA OA-per-mission is closest; GCAA/GACA authorize the operator with airspace approvals per operation
 |
Records
 | Operational records control, protection from damage/alteration/theft, 24 months (CAR 102.115 — wording matches GCAA/DCAA); PLUS liability-relevant records 36 months (CAR 102.025(12))
 | UAE 24-month rules; KSA 3-year rules — Oman's 36-month liability rule lands at the platform's build-to-strictest value
 |
Occurrence reporting
 | Immediate to 24-hour CAA Flight Safety (accidents/serious: injury, crash, jeopardy to aircraft/public); listed incident types within 3 days via the CAA incident reporting system
 | Two-tier like GCAA (3-hour accidents + ROSI); deadlines differ: immediate / 72 h / 3 d / 10 d across the four regimes
 |
Personnel
 | Remote pilot certification (Subpart D) and Remote Pilot Licence (Subpart E); medical condition and incapacitation rules (102.185/190); Chief Remote Pilot postholder with defined duties (102.320); compliance with operator procedures (102.335)
 | Postholder duty closest to GACA §107.117 Ops Manager; procedure-compliance clause mirrors GACA §107.145
 |
Aircraft
 | Five-class size classification (102.010); maintenance & safe condition (102.180); Large RPA certificate, maintenance and approval (102.050–070); registration marks under CAR-47; manufacturer declarations (Subpart I)
 | Class-based like EU/DCAA basic-advanced thinking; declaration regime echoes GACA Subpart E
 |
Operating constraints
 | Approved areas only / green zones (102.020 + Serb); populous-area prohibition (102.075); controlled-airspace special approval with sense-and-avoid (102.150/240); 122 m ceiling on permits (AWR 033); autonomous ops conditions (102.125); C2 link service provider requirements (102.135)
 | Green-zone model is unique among the four; 122 m ≈ the common 400 ft ceiling
 |
Distinctive quirks
 | Media announcements of drone operations must credit CAA authorization (AWR 033); falsification clause (102.015)
 | Falsification mirrors GACA §107.5
 |

Platform implementation (Oman mode)
Permit workspace (M4): mission approval-basis for Oman missions follows the AWR 033 structure: permit type (new/extension/renewal), permit number, per-location rows (governorate, wilayat, village, lat/long — the mission's sites map directly), required operational altitude with a 122 m AGL/MSL hard default on the ceiling field, and the proposed flying window. The mission pack renders an AWR-033-aligned annex so the permit application and the mission record are the same data.
Deadline engine: two Oman clocks — 'immediate' (rendered as report-now with the 24-hour Flight Safety contacts surfaced on the occurrence) for accidents/serious incidents, and 3 calendar days for listed incident types.
Retention: the 36-month liability-records rule (102.025(12)) is exactly the platform's build-to-strictest default — no engine change; the retention display cites the Oman clause for Oman-jurisdiction records.
Gates and fields: green-zone confirmation is a required pre-approval field on Oman missions (manual check against the Serb platform, recorded with who/when — no API integration assumed); populous-area and controlled-airspace flags route to the risk-assessment and special-approval paths; the media-attribution rule renders as a standing mission condition on Oman missions.
Personnel: Oman credential kinds (remote pilot certification, RPL) join the wallet; Chief Remote Pilot maps to the ops_manager domain role with a postholder label; medical credential required for currency in Oman mode.
Version caution: the CAR-102 text on file is a draft amendment revision (v0.20, JNC 2021). Before any regulator-facing assertion or content-pack release, confirm the currently promulgated issue with Oman CAA — and note the post-resumption framework (green zones, Serb) is circular-based and may evolve faster than the CAR text.
 |
15. Module × Mode Behavior Matrix
Module
 | UAE-Federal on
 | UAE-Dubai on
 | KSA on
 | Oman on
 |
M1 Documents
 | UOA certificate tracking; procedures accessible to staff
 | DUOSAM OM templates; distribution + acks; revision lists
 | §107.117 library view; LEP/amendment log; §107.211 manuals for declared UAS
 | ROC documentation; operator procedures (102.335); permit certificates as EXT
 |
M2 Compliance
 | CAR-UAC set; 7/60/90-day CAPA defaults; UOA renewal checklist
 | DCAR + DUOSAM sets; safety-meeting minutes as reviews
 | GACAR/Part 48/AC sets; SMS sub-requirements mapped; OA/UOC pack
 | CAR-102/47/AWR sets; CAA permit & surveillance pack
 |
M3 Safety & Risk
 | 3-hour accident clock; ROSI categories
 | 72-hour clock; DCAA categories; ERP records
 | 10-day clock; NTSC routing; ORA profile; SMS loop
 | Immediate clock + 24-h contacts; 3-day incident clock; populous-area RA path
 |
M4 Operations
 | Airspace-approval reference; controlled-release log
 | Basic/advanced category; OA-per-mission; flight-area limits; pilot log sign-off
 | Open/Specific; §107.133 conditions; §107.57 preflight; flight-rules field
 | AWR 033 permit workspace (locations, ≤122 m, window, permit no.); green-zone check; media-attribution condition
 |
M5 Fleet
 | Registration + insurance pre-operation check
 | Asset registration incl. GCS/payloads; firmware control
 | Part 48 expiry gate; identifier field; AC logbook schema; transfer export
 | Five-class classification field; CAR-47 marks; Large-RPA cert tracking; safe-condition (102.180)
 |
M6 Flight Evidence
 | AMC 015h fields validated; GPS route retained
 | Pilot signature to reconcile; inspection-completion rule
 | §107.57 fields validated; 3-year retention clock
 | Permit-window conformance rule; 122 m ceiling rule; 36-month liability retention display
 |
M7 Personnel
 | GCAA licence kind; competence evidence
 | Authorized-personnel exports; duty/rest engine; retention clock
 | RPC/endorsement kinds; §107.71 recency gate; written authorizations
 | RP certification + RPL kinds; medical gate (102.185); Chief Remote Pilot postholder
 |

16. Build Decisions and Open Items
16.1 Strictest-rule decisions (locked)
Dimension
 | Rule built
 | Rationale
 |
Retention engine
 | 36 months default on all operational records; +employment-end clock for personnel (Dubai); never auto-delete
 | 3-year KSA/DUOSAM rules subsume both 24-month UAE rules
 |
Flight record schema
 | Union of all field lists; jurisdiction-aware completeness validation at reconcile
 | One record satisfies any auditor; subsets render per pack
 |
Maintenance record schema
 | AC 107-01 logbook field list (most detailed)
 | Superset satisfies GCAA/DCAA implicitly
 |
Integrity
 | Append-only + hashing + signatures everywhere, all modes
 | Meets alteration-protection (UAE) and falsification deterrence (§107.5) jointly
 |
Reporting deadlines
 | Never harmonized; per-record by jurisdiction
 | Deadlines are legal obligations, not preferences
 |

16.2 Open items requiring confirmation
DCAA authorization validity period: “as defined by the DCAA” — confirm current practice and configure the renewal reminder accordingly.
GCAA ROSI occurrence taxonomy: align the in-app category list with current ROSI submission categories at next GCAA touchpoint.
DUOSAM OSO#17 numeric duty/rest limits: extract the specific hour values from the OM template tables into the duty scheme configuration (values present in source; transcribe at duty-engine build).
GACA STS standard-scenario specifics: AC 107-01 covers advanced-operation guidance; STS-B1 declaration record requirements to be confirmed against the STS publication when issued/obtained, then added to the KSA pack as a content update.
Abu Dhabi: CAR-UAC federal layer is covered; any ADCAA emirate-level instrument would be added as a further framework if operations require it.
Oman — CAR-102 issue status: the text on file is draft amendment v0.20 (2021); confirm the promulgated current issue with Oman CAA before content-pack release.
Oman — green zones: Serb platform zone data is not integrated; the green-zone confirmation is a manual recorded check. Monitor post-resumption circulars for changes to the permit regime.

Content governance: this document and the requirement_defs seed are revision-controlled together. When any source regulation revs, the comparison tables, the seed, and the mode behaviors update as one change package, peer-reviewed against the source text — the platform's own M1 discipline applied to its content.
 |
