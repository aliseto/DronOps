> Extracted text of the source document `AIR-PRD-001 v0.2` (originally .docx).
> Readable reference copy for engineering; the original .docx remains
> authoritative. Table layout is approximated with ` | ` separators.

AIRONOV

Product Specification
Aironov DronOps
UAV Operations & Quality Management Platform
Enterprise record-keeping compliant with ISO 9001 and GCC UAS regulation — with a Training Management System (TMS) sibling product on a shared platform spine.

Document ID
 | AIR-PRD-001
 |
Revision
 | 0.2 (Draft for review)
 |
Date
 | 06 June 2026
 |
Owner
 | CEO, Aironov
 |
Status
 | Working name ‘DronOps’ — pending brand decision
 |
Classification
 | Internal — Confidential
 |
Rev 0.1 → 0.2
 | Added M7 Personnel & Crew; ops calendar, client/project registry, external share & mission request, report template engine, drone type profiles, night-flight deviation rule, multi-org groups; roadmap and appendices updated
 |

Contents
TOC \h \o "1-2"Contents	 PAGEREF _Toc231723638 \h 1
1. Executive Summary	 PAGEREF _Toc231723639 \h 1
1.1 Why this product wins	 PAGEREF _Toc231723640 \h 1
1.2 Strategic fit	 PAGEREF _Toc231723641 \h 1
2. Scope and Context	 PAGEREF _Toc231723642 \h 1
2.1 In scope (this specification)	 PAGEREF _Toc231723643 \h 1
2.2 Out of scope (this release)	 PAGEREF _Toc231723644 \h 1
2.3 Target customers and jurisdictions at launch	 PAGEREF _Toc231723645 \h 1
3. Product Suite Architecture	 PAGEREF _Toc231723646 \h 1
3.1 The two-sided network effect	 PAGEREF _Toc231723647 \h 1
3.2 Module architecture	 PAGEREF _Toc231723648 \h 1
4. Personas and Roles (RBAC)	 PAGEREF _Toc231723649 \h 1
5. Module Specifications	 PAGEREF _Toc231723650 \h 1
5.1 M1 — Documents (controlled documentation)	 PAGEREF _Toc231723651 \h 1
5.2 M2 — Compliance (audits, findings, CAPA, management review)	 PAGEREF _Toc231723652 \h 1
5.3 M3 — Safety & Risk	 PAGEREF _Toc231723653 \h 1
5.4 M4 — Operations (mission lifecycle)	 PAGEREF _Toc231723654 \h 1
5.5 M5 — Fleet (assets, inspections, maintenance)	 PAGEREF _Toc231723655 \h 1
5.6 M6 — Flight Evidence (ingestion, auto-tabulation, deviation engine)	 PAGEREF _Toc231723656 \h 1
5.7 M7 — Personnel & Crew	 PAGEREF _Toc231723657 \h 1
6. TMS ↔ DronOps Integration Contract	 PAGEREF _Toc231723658 \h 1
7. Regulatory Content Library (the moat)	 PAGEREF _Toc231723659 \h 1
7.1 Launch coverage	 PAGEREF _Toc231723660 \h 1
7.2 Authoring and assurance	 PAGEREF _Toc231723661 \h 1
8. Non-Functional Requirements	 PAGEREF _Toc231723662 \h 1
9. Technical Architecture	 PAGEREF _Toc231723663 \h 1
9.1 Multi-tenancy and jurisdictions	 PAGEREF _Toc231723664 \h 1
10. Packaging and Pricing (initial hypothesis)	 PAGEREF _Toc231723665 \h 1
11. Phased Roadmap	 PAGEREF _Toc231723666 \h 1
11.1 Build-order rationale	 PAGEREF _Toc231723667 \h 1
12. Risks, Dependencies, Open Questions	 PAGEREF _Toc231723668 \h 1
12.1 Risks	 PAGEREF _Toc231723669 \h 1
12.2 Open questions (decide before P1)	 PAGEREF _Toc231723670 \h 1
Appendix A — Module-to-Source Lineage Map	 PAGEREF _Toc231723671 \h 1
Appendix B — Record Type Catalogue (initial)	 PAGEREF _Toc231723672 \h 1

1. Executive Summary
Aironov DronOps (working name) is a UAV operations and quality management platform for licensed drone operators and enterprise drone programs that must keep records compliant with both a formal Quality Management System (ISO 9001 / IMS) and local aviation regulation (DCAA, GCAA, GACA, DGCA). It pairs with Aironov TMS, the existing Training Management System for drone academies, on a shared platform spine.
The product thesis in one sentence: every flight audits itself. Flight logs are ingested automatically, tabulated against assets, operations, and organization, and bound to controlled forms and checklists as objective evidence. When a deviation is detected — a skipped checklist, an exceeded parameter, an overdue asset flown, a non-current pilot — the system automatically raises a nonconformity with the flight record attached, routes it through CAPA, and feeds closure into management review. No incumbent closes this loop today.
1.1 Why this product wins
Competitor class
 | What they have
 | What they lack
 |
Aviation QMS platforms (Centrik 5, Q-Pulse, iQSMS, Air Maestro)
 | Deep QMS: document control, audits, findings, CAPA, risk, training records; regulator credibility
 | No drone telemetry ingestion; airline-grade pricing and ~3-month implementations; no GCC UAS regulatory content (DCAR-UAS, GACAR 107); equipment model thinks in aircraft, not serialized batteries and firmware
 |
Drone ops platforms (DroneLogbook, AirData, FlyFreely, Dronedesk)
 | Flight log import (80+ formats), inspection triggers, pilot currency, deviation alerts, mission planning
 | No real QMS: no controlled documents with revision/approval workflow, no NCR/CAPA, no internal audit module, no management review records, no ISO clause mapping; no GCC content
 |
The actual incumbent: SharePoint + Excel + paper forms
 | Zero licence cost; familiar
 | Audit prep takes weeks; evidence chains break; single-person dependency; no telemetry linkage; fails tender scrutiny
 |

DronOps occupies the empty intersection: Centrik-class QMS depth + DroneLogbook-class flight evidence + a versioned GCC regulatory content library that no competitor has built. The content library — requirement matrices mapping ISO 9001 clauses and DCAR-UAS / GACAR 107 / GCAA / DGCA requirements to record types, forms, and retention rules — is the durable moat: it is data, not code, and it is validated by Aironov’s own multi-regulator operations.
1.2 Strategic fit
Built first as Aironov’s internal operations system (dogfooding under three-plus regulators), then productized — consistent with the “internal investment becomes future SaaS asset” thesis.
Sold per organization/site (USD 8–30K+/year), not per pilot per month — aviation-QMS economics, not logbook economics.
Bundles naturally with the existing consulting motion (OC setup, manual suites, accreditation document packs), replicating TrustFlight’s proven software + regulatory services model.
TMS becomes a sibling product on the shared spine: academies issue qualifications, operators consume currency status. Each product strengthens the other’s network.
2. Scope and Context
2.1 In scope (this specification)
Aironov DronOps: seven modules (Documents, Compliance, Safety & Risk, Operations, Fleet, Flight Evidence, Personnel & Crew), the regulatory content library, the audit pack generator, mobile field capture, and integrations.
The TMS ↔ DronOps integration contract (shared identity, qualification and currency service).
Non-functional requirements: audit-trail immutability, e-signatures, retention, data residency, bilingual EN/AR output, offline capture.
2.2 Out of scope (this release)
Flight control, live UTM/airspace authorization brokering, and real-time dock command-and-control (FlytBase / FlightHub 2 territory — DronOps consumes their outputs as evidence; it does not fly aircraft).
Photogrammetry, mapping, or AI analytics (Aironov Detect territory).
A dedicated Meetings module — management review and safety review board are implemented as record types inside Compliance (M2), not as a calendar product.
Full CRM, quoting, invoicing (Dronedesk territory). A client/project registry with mass import is in scope (M4); pipeline and billing are not.
2.3 Target customers and jurisdictions at launch
Segment
 | Profile
 | Primary jurisdictions
 | Buying trigger
 |
Licensed DaaS operators
 | 5–50 staff, ROC/OC holders, ISO-certified or certifying
 | UAE (DCAA, GCAA), KSA (GACA)
 | OC issue/renewal audit; client tender requiring evidence of QMS + regulatory records
 |
Enterprise internal drone programs
 | Energy, utilities, municipalities, industrial; drones inside an existing IMS
 | UAE, KSA
 | Internal audit findings; corporate mandate to bring UAS under the IMS
 |
Government / public-safety UAS units
 | Police, civil defence, inspection authorities
 | UAE, KSA
 | Programme professionalization; accountability mandates
 |
Aironov + AKSA (internal)
 | Dogfood tenant; reference customer
 | UAE, KSA, Indonesia (DGCA)
 | Own OC compliance; ISO 9001 certification
 |
3. Product Suite Architecture
The suite is two products on one spine. TMS serves training organizations; DronOps serves operators and enterprise programs. The spine carries the assets both need: a single personnel identity, the qualification and currency service, the regulatory content library, the append-only audit trail with e-signature, and the shared design system and auth.

Figure 1 — Product suite architecture: two products, one shared spine
3.1 The two-sided network effect
A pilot certified through any TMS academy carries one identity into any DronOps operator tenant. The operator sees live currency status (RPC validity, ratings, medicals, recency) without re-keying records; the academy gains distribution because operators prefer hiring pilots whose records arrive machine-readable. Every academy on TMS makes DronOps more valuable, and vice versa. No competitor in either category owns both sides.
3.2 Module architecture
DronOps is seven modules in two bands. The QMS spine (M1–M3) descends from the Centrik-class architecture; the flight operations engine (M4–M7) descends from the DroneLogbook-class architecture, with M7 Personnel & Crew additionally drawing on crew/duty patterns from manned-aviation systems (Air Maestro-class). The regulatory content library underlies both.

Figure 2 — DronOps module architecture and lineage
4. Personas and Roles (RBAC)
Role
 | Persona & needs
 | Key permissions
 |
Accountable Manager
 | Owner/GM; legally accountable to the regulator; wants one screen of red/amber/green
 | Read-everything; sign management review; approve high-risk missions; cannot edit records
 |
Quality / Safety Manager
 | Runs the QMS & SMS; today drowns in spreadsheets before audits
 | Manage documents, audits, NCR/CAPA, risk register; configure deviation rules; generate audit packs
 |
Operations Manager
 | Plans and approves missions; balances commercial pressure vs compliance
 | Create/approve missions; assign crew & assets; manage clients/projects; cannot close own NCRs
 |
Chief Remote Pilot / Pilot
 | Field user on mobile; wants zero duplicate data entry
 | Execute assigned missions; complete forms/checklists offline; report occurrences; view own currency
 |
Maintenance Technician
 | Keeps fleet airworthy; works from inspection queue
 | Log maintenance/inspections; manage components & batteries; release-to-service sign-off
 |
External Auditor (guest)
 | Regulator or ISO/client auditor; time-boxed access
 | Read-only scoped access to a generated audit pack; cannot browse the tenant
 |
Client Viewer (optional)
 | Enterprise client verifying their projects
 | Read-only: mission packs and deliverables tagged to their projects only
 |

Segregation-of-duties rules are enforced in code: the raiser of an NCR cannot verify its closure; pilots cannot edit flight evidence; release-to-service requires a maintenance role; management review requires the Accountable Manager’s e-signature.
 |
5. Module Specifications
Each module is specified as: purpose · core entities · functional requirements with priority (M = must-have for MVP, S = should-have for first commercial release, C = could-have / later) · key workflows · acceptance criteria.
5.1 M1 — Documents (controlled documentation)
Purpose
Demonstrable document control to ISO 9001 cl. 7.5 and regulator expectations: every manual, procedure, and form template exists in exactly one controlled version, with approval history, controlled distribution, and read-acknowledgement. Ships pre-loaded with the Aironov UAS manual suite (operations manual, standards manual, forms pack) as configurable templates — a new operator is documented in days, not months.
Core entities
Entity
 | Key fields
 | Notes
 |
Document
 | doc_id (e.g. OPS-MAN-002), title, type (manual/procedure/form template/external), owner, status (draft/in review/approved/obsolete), jurisdiction tags, requirement refs
 | Container for revisions; numbering scheme configurable per tenant
 |
Revision
 | rev no., effective date, change summary, file/body, approval chain state, e-signatures, hash
 | Immutable once approved; supersedes previous
 |
Distribution
 | audience (roles/users), ack required (y/n), ack deadline
 | Read-and-acknowledge tracked per user with timestamp
 |
Form Template
 | schema (fields, validations, signatures), linked record type, print layout
 | Versioned like documents; instances captured in M4/M6
 |

Functional requirements
#
 | Requirement
 | Pri
 |
D-01
 | Draft → review → approve workflow with configurable approver chain per document type; e-signature with reason at each approval step
 | M
 |
D-02
 | Single current-revision rule: users can only open the effective revision; obsolete revisions watermarked and access-logged
 | M
 |
D-03
 | Controlled distribution with read-acknowledgement tracking and overdue-ack escalation
 | M
 |
D-04
 | Pre-loaded UAS manual suite and forms pack, parameterized (operator name, OC refs, jurisdictions) at tenant onboarding
 | M
 |
D-05
 | Form template builder: field types incl. text, number, select, photo, GPS stamp, signature; conditional sections; bilingual labels (EN/AR)
 | M
 |
D-06
 | Document ↔ requirement linkage: each document declares which requirement objects it satisfies (feeds M2 coverage view)
 | M
 |
D-07
 | External document register (regulations, client specs) with review-due reminders
 | S
 |
D-08
 | Change-impact view: when a content-library requirement revs, list affected documents as review tasks
 | S
 |
D-09
 | In-app diff between revisions; print/PDF with controlled-copy stamping
 | S
 |
D-10
 | Word/PDF import with section mapping for legacy manuals
 | C
 |

Acceptance criteria (selected)
An ISO auditor can be shown, for any document: current revision, full approval history with signatures, distribution list, and acknowledgement status — in under 30 seconds.
Approving a new revision automatically obsoletes the prior one, notifies the distribution list, and opens ack tasks.
A form template revision does not alter previously captured form instances (instances pin the template version).
5.2 M2 — Compliance (audits, findings, CAPA, management review)
Purpose
The system of record for conformity: requirement coverage, internal/external audit management, nonconformities and corrective action, and management review. This module turns the regulatory content library into daily work and generates the audit packs that win OC renewals and tenders.
Core entities
Entity
 | Key fields
 | Notes
 |
Requirement (from content library)
 | source, clause ref, jurisdiction, version, applicability rules, mapped record types & retention
 | Read-only content; tenant maps evidence to it
 |
Audit
 | type (internal/regulator/ISO/client), scope (requirements set), schedule, auditor, checklist, status
 | Checklist auto-built from scoped requirements
 |
Finding / NCR
 | source (audit/deviation engine/occurrence/manual), classification (major/minor/observation), requirement refs, evidence links, status
 | Auto-raised NCRs carry flight evidence (see M6)
 |
CAPA
 | containment, root cause (5-why/fishbone template), corrective action, owner, due date, effectiveness check, verifier
 | Verifier ≠ raiser (SoD enforced)
 |
Management Review
 | period, auto-compiled inputs (KPIs, findings, occurrences, audit results, resource needs), decisions/outputs, attendees, AM signature
 | Satisfies ISO 9.3 without a Meetings module
 |

Functional requirements
#
 | Requirement
 | Pri
 |
C-01
 | Coverage view: for the tenant’s active jurisdictions, every requirement shows mapped documents, records, and live evidence count — gaps surface as tasks
 | M
 |
C-02
 | Internal audit scheduler with checklist auto-generated from selected requirement sets; findings raised inline with photo/file evidence
 | M
 |
C-03
 | NCR lifecycle: open → containment → root cause → corrective action → implemented → effectiveness verified → closed; SLA timers and escalation
 | M
 |
C-04
 | Accept auto-raised NCRs from the M6 deviation engine with evidence pre-attached; triage queue with accept/downgrade-to-observation/false-positive (reason required, logged)
 | M
 |
C-05
 | Management review record type: one-click compile of period inputs (trend charts, open findings, occurrence stats, training/currency status, fleet availability); decisions logged as tasks; AM e-signature seals the record
 | M
 |
C-06
 | Audit pack generator: select audience (GACA OC, DCAA ROC, ISO surveillance, client tender) → system assembles requirement-by-requirement evidence bundle as paginated PDF + verifiable link with time-boxed guest access
 | M
 |
C-07
 | External audit log: record regulator/ISO audit events, findings received, and map responses
 | S
 |
C-08
 | KPI engine: configurable quality objectives (e.g. NCR closure time, checklist completion rate, on-time inspections) with targets and trend charts
 | S
 |
C-09
 | Custom report template engine: drag-and-drop dataset snippets (flights, findings, KPIs, fleet, personnel) into reusable PDF/CSV report layouts, beyond the fixed audit pack templates
 | S
 |
C-10
 | Cross-tenant anonymized benchmarking (opt-in)
 | C
 |

Acceptance criteria (selected)
Generating a DCAA ROC audit pack for a 12-month period completes in under 60 seconds and includes a coverage matrix with zero unexplained gaps (every gap carries a task or justification).
An NCR cannot be closed without a completed effectiveness check by a user other than the raiser.
A management review record cannot be sealed without the Accountable Manager’s e-signature; sealed records are immutable.
5.3 M3 — Safety & Risk
Purpose
Occurrence reporting and risk management sized for UAS operations: a hazard register, reusable mission risk assessment templates (including SORA-style assessments where the jurisdiction or operation type requires them), and full linkage so that risks, occurrences, findings, and flights reference each other.
Functional requirements
#
 | Requirement
 | Pri
 |
S-01
 | Occurrence reporting: anyone (incl. mobile, offline) can file in <2 minutes; classification (incident/accident/hazard observation); auto-links pilot, asset, mission, and flight log when filed from a mission context
 | M
 |
S-02
 | Hazard register with risk matrix (likelihood × severity, configurable 5×5 default), residual risk after mitigation, review cycles
 | M
 |
S-03
 | Mission risk assessment templates versioned in M1; instances attach to missions (gate in M4); template library includes VLOS, EVLOS/BVLOS, night, populated-area profiles
 | M
 |
S-04
 | SORA-style assessment workflow (GRC/ARC determination, mitigations, SAIL) for jurisdictions/operations requiring it (e.g. supporting STS-B1 declarations)
 | S
 |
S-05
 | Occurrence investigation workflow with findings → raises NCR/CAPA in M2 where systemic
 | S
 |
S-06
 | Regulator occurrence-report export formats per jurisdiction
 | S
 |
S-07
 | Safety performance dashboard: occurrence rates per 100 flights, leading indicators (checklist completion, deviation counts)
 | S
 |

Acceptance criteria (selected)
An occurrence filed from the field offline syncs with original capture timestamp preserved and appears in the QM triage queue.
A mission flagged as BVLOS cannot pass the approval gate without an attached risk assessment of the required profile.
5.4 M4 — Operations (mission lifecycle)
Purpose
The operational workflow that generates compliant records as a by-product of doing the work: plan → risk assess → approve → pre-flight → execute → reconcile → archive. Gates enforce the rules a regulator and a QMS both expect: no approval without a valid risk assessment; no pre-flight with a non-current pilot or an overdue asset.

Figure 3 — Mission lifecycle with records generated at every step
Core entities
Entity
 | Key fields
 | Notes
 |
Mission
 | ref, client, project, location (geo), operation type (VLOS/EVLOS/BVLOS/night/dock), approval basis (OC ref, NOTAM/permit refs, STS-B1 declaration ref), crew & roles, assets, schedule, status
 | The spine that everything links to
 |
Approval
 | chain steps, approver, decision, conditions, e-signature, timestamp
 | Configurable per operation type & risk level
 |
Form Instance
 | template version pin, captured values, photos, GPS, signatures, offline flag
 | Pre/post-flight, checklists, site survey
 |
STS-B1 Declaration
 | declaration scope, conformance evidence refs, validity, regulator submission record
 | KSA autonomous/BVLOS standard scenario support
 |
Change (MoC)
 | trigger, impact assessment, affected documents/processes, approval
 | Management of change record
 |

Functional requirements
#
 | Requirement
 | Pri
 |
O-01
 | Mission builder with client/project/location, operation type, crew and asset assignment; conflict warnings (double-booked asset, crew duty overlap)
 | M
 |
O-02
 | Currency gate: assigning crew checks the Qualification & Currency service; non-current crew blocks progression with explicit override (privileged role + reason, logged as deviation)
 | M
 |
O-03
 | Asset gate: assigning an aircraft/battery checks M5 inspection status; overdue assets block with the same override pattern
 | M
 |
O-04
 | Approval chains configurable by operation type and risk level; approvals signed; conditions captured and surfaced on the pilot’s mobile view
 | M
 |
O-05
 | Mobile execution view (offline-first): mission brief, conditions, assigned forms/checklists, occurrence quick-file
 | M
 |
O-06
 | Post-flight reconciliation: imported logs auto-match to missions (time + asset + pilot heuristics; manual match fallback); unmatched flights queue for review — an unmatched flight is itself a deviation
 | M
 |
O-07
 | Mission pack: one PDF/bundle per mission (plan, RA, approvals, forms, flight records, deliverable references) — sealed at archive
 | M
 |
O-08
 | STS-B1 declaration workspace: scope wizard, conformance evidence checklist drawn from the content library, declaration document generation, validity tracking, renewal reminders
 | S
 |
O-09
 | Management of change workflow linked to affected documents (M1) and risks (M3)
 | S
 |
O-10
 | Recurring mission templates (e.g. weekly solar-site inspection) with auto-cloned plans and RAs requiring delta review
 | S
 |
O-11
 | Operations calendar: year/month/week/day views of planned missions and executed flights, filterable by crew, asset, client, site; crew availability overlay from M7
 | M
 |
O-12
 | Client & project registry: clients, projects, sites, contacts; mass import from existing customer database (CSV); every mission/deliverable tags to client/project for rollup reporting
 | M
 |
O-13
 | Airspace and site map layers in mission planning: drawn flight areas/geofences (feed the M6 deviation engine), jurisdiction-aware advisory layers where data is available; GCC permit/NOC references captured as structured fields (regulator portals remain the source of authorization)
 | S
 |
O-14
 | External sharing: PIN-protected, expiring links exposing mission detail or an ops calendar slice to clients/site owners without accounts
 | S
 |
O-15
 | Mission request intake: approved external contacts submit requests via protected form → triage queue → convert to mission with requester linked
 | C
 |
O-16
 | Client portal exposure of sealed mission packs per project (read-only)
 | C
 |

Acceptance criteria (selected)
A mission with a non-current pilot cannot reach pre-flight without a logged privileged override; the override automatically appears in the next management review inputs.
Archiving a mission seals the pack: subsequent edits are impossible; corrections happen via linked amendment records.
5.5 M5 — Fleet (assets, inspections, maintenance)
Purpose
Airworthiness-grade asset management at drone granularity: airframes, serialized components, batteries as first-class cycle-tracked assets, payloads, ground equipment, docks, and firmware versions — with an inspection engine driven automatically by ingested flight data (the proven DroneLogbook pattern, extended with QMS-grade release-to-service).
Core entities
Entity
 | Key fields
 | Notes
 |
Aircraft
 | type, serial, registration (per jurisdiction), status (operational/maintenance/grounded), total flights/hours, firmware version
 | Status changes are logged events
 |
Component
 | type (motor, prop CW/CCW, ESC, gimbal…), serial, parent aircraft, installed date, life limit
 | Custom component lists per aircraft type
 |
Battery
 | serial, chemistry, cycle count (auto from logs), health metrics, charge log, flag thresholds
 | First-class asset, not an accessory
 |
Payload / Equipment
 | cameras, LiDAR, chargers, cases; calibration records and due dates
 | Calibration certificates stored in M1
 |
Dock
 | site, dock health telemetry refs, environmental limits, maintenance plan
 | Dock 3 era requirement
 |
Inspection Plan
 | trigger basis: flights and/or hours and/or days (any two-of-three on one schedule), component checklist, assigned technician
 | DLB-proven trigger model
 |
Maintenance Record
 | scheduled/unscheduled, work performed, parts replaced (serials), technician, release-to-service signature
 | RTS is an e-signed gate
 |

Functional requirements
#
 | Requirement
 | Pri
 |
F-01
 | Inspection engine: schedules trigger from auto-ingested flight data the moment a log lands; early-warning at configurable 10%/20% thresholds; overdue → asset auto-moves to maintenance status (configurable)
 | M
 |
F-02
 | Operating an overdue asset is detected from logs and raises a deviation → NCR (M6 → M2)
 | M
 |
F-03
 | Battery management: cycle counts from log import; flag after N cycles/age; charge log; retirement workflow
 | M
 |
F-04
 | Maintenance workflow: open → work → parts → QC → release-to-service (signed, role-gated) → asset returns to operational
 | M
 |
F-05
 | Firmware register per aircraft type: approved versions; aircraft on unapproved firmware flagged at mission assignment
 | S
 |
F-06
 | 20+ configurable fleet notifications (DLB parity): due/overdue inspections, battery flags, registration expiry, calibration due
 | S
 |
F-07
 | Fleet availability dashboard: operational vs maintenance vs grounded; utilization per asset
 | S
 |
F-08
 | Drone type profiles: brand/model presets (geometry, weight, default component list, default inspection schedules) so a new airframe is configured in one step and fleet-wide schedule updates propagate per type
 | S
 |
F-09
 | Spares/inventory with min-stock alerts
 | C
 |

Acceptance criteria (selected)
Importing a flight log updates the relevant inspection counters and battery cycles within 60 seconds, with the source log linked from the counter history.
An aircraft past an inspection limit cannot be assigned to a new mission without privileged override; if flown anyway, the system raises the NCR automatically on log import.
5.6 M6 — Flight Evidence (ingestion, auto-tabulation, deviation engine)
Purpose
The engine that makes records generate themselves. Logs from aircraft, ground control software, cloud APIs, and docks are imported, normalized into a canonical FlightRecord, auto-tabulated against assets, operations, and organization, bound to forms and checklists as evidence, and screened by the deviation engine — which closes the loop by raising nonconformities in M2.

Figure 4 — Ingestion and auto-tabulation pipeline
Ingestion sources and priority
Source
 | Method
 | Pri
 |
DJI flight logs (TXT/encrypted)
 | File upload + mobile sync app; server-side parser
 | M
 |
DJI FlightHub 2
 | Cloud API pull per organization credentials
 | M
 |
DJI Dock telemetry (Dock 3 / M4TD)
 | Cloud API / MQTT bridge; flights + dock health
 | S
 |
PX4 / ArduPilot (.ulg/.bin)
 | File upload parser
 | S
 |
Autel / others
 | File upload parsers, prioritized by customer demand
 | S
 |
Manual entry
 | Structured form fallback; flagged as non-telemetry evidence grade
 | M
 |

Canonical FlightRecord (normalized)
aircraft serial · battery serial(s) and end cycles · pilot (from mission or GCS account mapping) · UTC + local start/end · duration · home point and GPS trace · max altitude AGL · max distance · firmware · GCS app/version · source file hash · evidence grade (telemetry / cloud / manual). Raw source files are retained immutably alongside the normalized record.
Functional requirements
#
 | Requirement
 | Pri
 |
E-01
 | Format auto-detection and parsing for priority sources; failed parses queue with diagnostics, never silently drop
 | M
 |
E-02
 | Auto-tabulation: every flight updates asset counters (M5), mission records (M4), pilot hours/recency (spine), and org rollups (project/client/location)
 | M
 |
E-03
 | Log↔mission auto-match (time/asset/pilot heuristics); unmatched-flight queue; unmatched beyond SLA → deviation
 | M
 |
E-04
 | Deviation engine rules (tenant-configurable, content-library defaults): checklist incomplete before takeoff time; altitude above mission ceiling; flight outside approved geofence/window; night flight without night approval (computed from local sunset/sunrise at flight location); overdue asset flown; non-current pilot flew; battery below floor at landing; mission flown without approval
 | M
 |
E-05
 | Deviation → auto-NCR in M2 with flight record, rule, and threshold attached; severity mapping configurable; duplicate-suppression window
 | M
 |
E-06
 | GPS trace viewer with mission geofence overlay; export KML
 | S
 |
E-07
 | Evidence integrity: SHA-256 of source files; normalized records reference hashes; tamper-evident chain in audit trail
 | M
 |
E-08
 | 3D playback of traces
 | C
 |

The closed loop

Figure 5 — Closed-loop conformance: detection to management review
Acceptance criteria (selected)
A flight that exceeded the mission altitude ceiling produces, without human action: a deviation event, an NCR in triage with the trace attached, and a pending CAPA task once accepted — end-to-end in under 5 minutes of log arrival.
Marking an auto-NCR false-positive requires a reason and tunes nothing silently: rule-change suggestions go to the QM as explicit configuration tasks.
5.7 M7 — Personnel & Crew
Purpose
The operator-side system of record for people: licences and ratings from any source (not only TMS academies), medicals, skills and approved aircraft types, duty and fatigue limits, crew scheduling, and site inductions. The spine’s Qualification & Currency service computes status from M7 data plus TMS-issued qualifications plus M6 recency events — and that status drives the gates in M4. Lineage: DroneLogbook’s advanced personnel profiling for the competency model; manned-aviation crew systems (Air Maestro-class) for duty and scheduling.
Core entities
Entity
 | Key fields
 | Notes
 |
Person
 | identity (national ID/passport-keyed), contact, employment status, roles, photo
 | One identity across TMS and DronOps (spine)
 |
Licence / Certificate
 | type (RPC, ratings, endorsements, instructor), issuing authority & jurisdiction, number, issue/expiry, document scan, verification status (unverified / verified-by / TMS-issued)
 | Externally-issued licences are first-class; TMS-issued arrive pre-verified
 |
Medical
 | class, issuer, issue/expiry, restrictions
 | Document stored in M1-controlled storage; visibility restricted
 |
Skill / Capability
 | category (regulations, operations, payloads/tools, business), level, evidence ref, assessor
 | Pre-defined library + tenant custom skills (DLB parity)
 |
Type Approval
 | person × aircraft type, basis (training/assessment ref), validity
 | ‘Approved drone models’ per pilot; gates asset assignment in M4
 |
Duty Record
 | duty start/end, flight time (auto from M6), rest period, cumulative counters (day/week/28-day), limit scheme ref
 | Limits configurable per tenant policy or jurisdiction scheme
 |
Roster Assignment
 | person × mission/shift × role, status (assigned/confirmed/stood-down), conflicts
 | Feeds M4 ops calendar availability overlay
 |
Induction / Access
 | site or client induction, pass/visa/permit type, expiry, document
 | Site access blockers surfaced at mission assignment
 |

Functional requirements
#
 | Requirement
 | Pri
 |
P-01
 | Licence wallet: register externally-issued licences/ratings/medicals with scans; expiry tracking with configurable lead-time alerts to the person and the QM; expired credential → currency status lapses automatically
 | M
 |
P-02
 | Verification workflow: privileged role marks external credentials verified (who/when logged); audit packs distinguish verified vs unverified credentials
 | M
 |
P-03
 | Skills & capabilities profile per person: pre-defined library plus tenant-defined custom skills; skill requirements attachable to mission templates (e.g. thermography missions require IRT skill)
 | S
 |
P-04
 | Type approvals: person-to-aircraft-type authorization; assigning a pilot to an unapproved type in M4 blocks with the standard privileged-override pattern
 | M
 |
P-05
 | Flight & duty tracking: flight time auto-accumulated from M6; duty periods captured (mobile clock-in/out or roster-derived); cumulative counters vs configurable limit scheme; breach risk warnings at rostering time, actual breach → deviation → NCR
 | S
 |
P-06
 | Crew scheduling: roster view by day/week; availability (leave, duty rest, expiring credentials) overlaid; conflict detection with M4 mission assignments
 | S
 |
P-07
 | Site inductions & access passes: per-client/site requirements checklist; missing induction blocks assignment to that site’s missions
 | S
 |
P-08
 | Person dashboard (mobile): my currency, my expiring documents, my roster, my flights/hours, one-tap occurrence report
 | M
 |
P-09
 | Currency snapshot export: per-person or whole-team currency report (the ‘who can fly tomorrow’ view) as PDF/CSV; included in audit packs
 | M
 |
P-10
 | Training-need handoff: expiring/lapsed credentials or CAPA-driven training actions raise requests visible to a linked TMS academy (consent-gated)
 | C
 |

Acceptance criteria (selected)
A pilot whose RPC expires mid-roster is flagged at rostering time; if the credential lapses, every future mission assignment for that pilot moves to blocked status automatically and the ops calendar shows the gap.
The ‘who can fly tomorrow’ view answers, for any date and site: current pilots, with valid type approval, within duty limits, with site induction — in one screen.
Privacy: medical details visible only to privileged roles; auditors see validity status, not diagnoses.
6. TMS ↔ DronOps Integration Contract
TMS remains a separate product for training centers (cohorts, syllabus, enrolment, assessments, certificates). The integration is deliberately narrow and one-way-dominant:
Interface
 | Direction
 | Contract
 |
Identity
 | shared
 | One person record (national ID/passport-keyed) across products; person links to tenant-scoped roles
 |
Qualification issue
 | TMS → spine
 | On certification, TMS publishes qualification objects: type (RPC, rating, endorsement), jurisdiction, issue/expiry, evidence ref — arriving pre-verified
 |
External licence registration
 | M7 → spine
 | Operator-registered licences/medicals join the same qualification model with a verification-status flag (P-01/P-02); currency computation treats both sources uniformly
 |
Currency status
 | spine → DronOps
 | Computed status per person per jurisdiction: current / expiring(n days) / lapsed, from qualifications + recency rules + medicals
 |
Recency events
 | DronOps → spine
 | Flight hours and recent-experience events from M6 feed recency computation (e.g. takeoffs/landings in period)
 |
Training needs
 | DronOps → TMS
 | CAPA actions of type ‘training’ can raise a training request visible to a linked academy (optional, S-priority)
 |

Privacy boundary: an academy never sees an operator’s missions; an operator sees only currency status and certificate metadata, not training transcripts, unless the person grants record-sharing consent at enrolment.
 |
7. Regulatory Content Library (the moat)
The library converts regulation and standard text into versioned, machine-usable requirement objects, each mapped to the record types, form templates, and retention rules that satisfy it. Product code never hardcodes a regulation; when a framework revs, only content updates and the coverage view re-evaluates — surfacing new gaps as tasks.

Figure 6 — Requirement matrix model and audit pack generation
7.1 Launch coverage
Pack
 | Contents
 | Release
 |
ISO 9001:2015 core
 | Clauses 4–10 mapped to QMS record types; emphasis 7.5 documented information, 8.5 production/service, 9.2 internal audit, 9.3 management review, 10.2 nonconformity
 | MVP
 |
UAE — DCAA (DCAR-UAS Issue 03)
 | Operator record-keeping, personnel, UAS airworthiness/maintenance, operational requirements; ROC audit pack template
 | MVP
 |
UAE — GCAA
 | Federal UAS operator requirements; registration/permit record mapping
 | R1
 |
KSA — GACAR Part 107 v5.0
 | Operator + remote pilot record requirements; STS-B1 standard scenario: declaration scope, conformance evidence checklist, ongoing record obligations; OC audit pack template
 | R1
 |
Indonesia — DGCA PM 37/2020
 | Operator approval and record mapping (Aironov internal use first)
 | R2
 |
ISO 9001 × UAS crosswalk
 | Combined matrix showing where one record satisfies multiple frameworks (the audit-prep killer feature)
 | R1
 |

7.2 Authoring and assurance
Content authored internally (regulatory expertise is the company’s asset); stored as versioned structured data with effective dates and change logs; every requirement carries its source citation.
Each pack peer-reviewed against the source regulation before release; review record kept (the content library itself is under document control in M1 — the product eats its own cooking).
Disclaimer model: the library is a compliance aid, not legal advice; the operator remains accountable — mirrored in contract terms.
8. Non-Functional Requirements
Area
 | Requirement
 |
Audit trail
 | Append-only event log for every create/update/state-change/view-of-sensitive-record; events carry actor, timestamp (UTC), tenant, entity ref, before/after; no hard deletes — corrections are new events
 |
E-signatures
 | Signature = authenticated re-confirmation (password or passkey) + meaning ('approved as Ops Manager') + hash of signed content; rendered on documents and packs
 |
Integrity
 | SHA-256 on all evidence files; periodic chain verification job; export packs carry verification manifest
 |
Retention
 | Retention clocks per record type per jurisdiction from the content library (e.g. multi-year flight/maintenance record retention); legal hold flag; deletion only after clock expiry via privileged workflow
 |
Data residency
 | Tenant-selectable region at onboarding: UAE region and KSA region required for target customers; Indonesia later; backups stay in-region
 |
Security
 | RBAC with SoD rules; SSO (OIDC) for enterprise; MFA default for privileged roles; tenant isolation at row level + per-tenant object storage prefixes; SOC 2 readiness posture from day one (controls documented even before audit)
 |
Offline
 | Mobile field capture (forms, checklists, occurrences) fully offline with conflict-safe sync; capture timestamps preserved from device
 |
Languages
 | UI EN first; all regulator-facing outputs (forms, packs, reports) bilingual EN/AR templates; RTL-safe PDF rendering; Bahasa Indonesia later
 |
Performance
 | Log parse → visible flight record p95 < 60s; audit pack (12 months, 1,000 flights) < 60s; dashboards < 2s
 |
Availability
 | 99.5% target initially; RPO ≤ 24h, RTO ≤ 8h; status page
 |
9. Technical Architecture
Maximum reuse of the proven TMS stack — this is a sibling codebase, not a third platform.
Layer
 | Choice
 | Rationale
 |
Web app
 | Next.js 15 (App Router), TypeScript
 | TMS-proven; shared design system (dark theme, Inter/JetBrains Mono, fg-* tokens)
 |
Data
 | PostgreSQL + Drizzle ORM
 | TMS-proven; row-level tenant isolation; JSONB for form instances and normalized telemetry summaries
 |
Auth
 | Auth.js v5 + OIDC SSO; passkeys for signature re-auth
 | TMS-proven, extended for e-signature ceremony
 |
Events/audit
 | Append-only events table (partitioned) + outbox pattern for notifications
 | Simple, queryable, defensible in audit
 |
Background jobs
 | Queue workers (log parsing, matching, deviation evaluation, pack rendering)
 | Parsing must be off the request path
 |
File storage
 | Object storage per region (raw logs, photos, signed PDFs), content-addressed by hash
 | Residency + integrity
 |
Parsers
 | Isolated parser services per vendor format with golden-file test suites
 | Vendor formats change; contain the blast radius
 |
Mobile field capture
 | PWA first (offline via service worker + IndexedDB); native wrapper only if device APIs force it
 | One codebase; fastest to ship
 |
PDF/pack rendering
 | Server-side HTML→PDF with bilingual/RTL templates
 | Audit packs and mission packs are the product’s face
 |

9.1 Multi-tenancy and jurisdictions
Tenant = one operator/enterprise organization; tenants select region (residency) and active jurisdiction packs.
All requirement evaluation is (tenant × jurisdiction × version)-scoped; a UAE+KSA operator sees a merged coverage view with per-jurisdiction filters.
Multi-organization groups (Enterprise tier): parent–child organization structure with consolidated dashboards and reporting rollup, and controlled sharing of documents, checklists, drone type profiles, and inventory across child organizations — directly serving groups operating separate legal entities (e.g. a UAE FZ-LLC plus an Indonesian PT) under one quality system.
White-label/private-instance deployment (Centrik-style) reserved as an Enterprise option, not MVP.
10. Packaging and Pricing (initial hypothesis)
Tier
 | Scope
 | Indicative price (USD/yr)
 |
Core
 | One jurisdiction pack, ≤5 aircraft, ≤10 users, file-upload ingestion, audit packs
 | 8,000
 |
Professional
 | Multi-jurisdiction, unlimited aircraft, cloud API ingestion (FlightHub 2), STS-B1 workspace, client viewer
 | 18,000–24,000
 |
Enterprise
 | SSO, data-residency choice, dock telemetry, white-label/private instance option, premium SLA
 | 30,000+
 |
Implementation packages
 | Onboarding + manual-suite parameterization + legacy import + audit-readiness review (consulting-led)
 | 5,000–40,000 one-time
 |
TMS (separate product)
 | Per academy: existing model; bridge included where both products present
 | existing
 |

Pricing logic: the buyer is paying for regulatory survivability and tender-readiness, benchmarked against aviation QMS platforms (typically tens of thousands per year) — not against $15/pilot/month logbooks. DroneLogbook’s own model (per-pilot seats at $7–25/month, unlimited non-pilot users) is deliberately rejected: per-seat pricing punishes exactly the crew growth we want customers to have, and anchors the product in the logbook category. Implementation services protect margin and replicate the TrustFlight software+services model.
 |
11. Phased Roadmap
Phase
 | Window
 | Scope
 | Exit criteria
 |
P0 — Internal dogfood
 | M0–M3
 | M1 Documents (suite pre-load), M5 Fleet core, M6 DJI file ingestion + auto-tabulation, M4 missions + forms + ops calendar (mobile PWA), M7 licence wallet + type approvals + person dashboard, ISO core pack
 | Aironov runs 100% of its own ops in the system for 30 consecutive days; zero parallel spreadsheets
 |
P1 — MVP commercial (UAE)
 | M4–M8
 | M2 Compliance full (NCR/CAPA, audits, management review, audit packs), deviation→NCR loop, DCAR-UAS pack, FlightHub 2 ingestion, M4 client registry + external share links, M7 currency exports, e-signatures, EN/AR packs
 | First 3 paying UAE tenants; one tenant passes a real DCAA/ISO audit using generated packs
 |
P2 — KSA + autonomy
 | M9–M14
 | GACAR 107 pack + STS-B1 workspace, GCAA pack, dock telemetry ingestion, M3 SORA-style RA, M7 duty limits + crew scheduling + inductions, TMS currency bridge, KSA data region
 | First KSA tenant; first STS-B1 declaration prepared through the system
 |
P3 — Scale
 | M15+
 | Crosswalk matrix, custom report template engine, API for enterprise integration, client portal + mission request intake, multi-org groups, benchmarking, white-label, Bahasa pack (DGCA)
 | 20 paying tenants; NRR > 100%
 |

11.1 Build-order rationale
Evidence before compliance: ingestion and fleet ship first because the closed loop is worthless without trustworthy flight data underneath.
UAE before KSA: the dogfood tenant and nearest regulator relationships are UAE-based; KSA follows with the STS-B1 wedge as that operator base grows.
Speed beats completeness: Centrik could localize GCC content within roughly a year of smelling demand — launch coverage depth in two jurisdictions beats shallow coverage in five.
12. Risks, Dependencies, Open Questions
12.1 Risks
Risk
 | Severity
 | Mitigation
 |
Centrik/TrustFlight localizes GCC UAS content (already landing UAE manned customers)
 | High
 | Speed + depth in DCAR/GACAR; regulator relationships; bundle with consulting they cannot replicate locally; two-sided TMS network
 |
DJI log format/API changes break ingestion
 | Medium
 | Isolated parsers with golden-file tests; manual-entry fallback keeps compliance unbroken; multi-source strategy
 |
Regulators extend their own portals into operator tooling
 | Medium
 | Position as the operator-side system of record that feeds portals; export adapters; stay regulator-friendly
 |
Small near-term operator base limits ARR
 | Medium
 | Enterprise programs + government units widen the buyer set; per-org pricing keeps small N viable; KSA growth under STS scales the base
 |
Engineering capacity contention with Detect/TMS
 | High
 | Sibling-stack reuse; P0 doubles as Aironov’s own ops necessity, not pure product investment; sequential PRs discipline
 |
Deviation engine false positives erode trust
 | Medium
 | Conservative default thresholds; triage queue with reasoned dismissal; tenant tuning; precision metrics tracked from P0
 |

12.2 Open questions (decide before P1)
Product name and brand fit: does it join the Acquire / Detect / Autonomous family, and under which naming logic? (‘DronOps’ is a placeholder.)
Commercial home: Aironov product line vs. adjacency to the academy/consulting business — where do the regulator relationships and the sales motion sit cleanest?
Anchor design partners: which two UAE operators and which enterprise program get design-partner pricing in exchange for audit-cycle access?
Evidence-grade policy: how are manual-entry flights treated in audit packs relative to telemetry-backed flights (labeling vs. exclusion)?
Insurance angle: do underwriters accept the deviation/KPI data for premium relief, and is that a P3 revenue lever?
Appendix A — Module-to-Source Lineage Map
DronOps capability
 | Reference implementation studied
 | Delta in DronOps
 |
Document control, distribution, acknowledgement
 | Centrik 5 Documents
 | Pre-loaded UAS manual suite; requirement linkage; bilingual output
 |
Audits, findings, embedded regulations
 | Centrik 5 Compliance
 | GCC UAS + ISO content; auto-raised NCRs from telemetry
 |
Management review
 | Centrik 5 Meetings (folded in)
 | Record type inside Compliance; auto-compiled inputs; AM signature seal
 |
Risk linked to findings/SMS
 | Centrik 5 Risk + Safety
 | UAS-scale templates; SORA-style profile; mission gating
 |
Inspection triggers (flights/hours/days), early warnings, auto-grounding
 | DroneLogbook fleet suite
 | Adds signed release-to-service, firmware register, dock assets
 |
Log import + auto-tabulation (assets/operations/org)
 | DroneLogbook workflow engine
 | Adds evidence binding, hashing, and the deviation→NCR closed loop
 |
Deviation alerting (checklists, parameters, expiry)
 | DroneLogbook notifications
 | Alerts become workflow objects (NCR/CAPA), not emails
 |
Multi-jurisdiction content switching
 | FlyFreely jurisdictions
 | Deeper: requirement-level matrices with coverage and audit packs, not workflow presets only
 |
Per-pilot currency & training records
 | Aironov TMS (existing)
 | Consumed via spine; not rebuilt
 |
Personnel profiling (certifications, approved drone models, skills incl. custom)
 | DroneLogbook Enterprise tiers
 | Becomes M7 with verification workflow, type-approval gating, and audit-pack integration
 |
Crew duty/fatigue & rostering
 | Air Maestro-class manned-aviation systems
 | Right-sized for UAS: configurable limit schemes, roster-time warnings, breach→NCR
 |
Ops calendar, client registry, PIN-link sharing, mission request intake, report template engine, drone type profiles, multi-org
 | DroneLogbook Enterprise/Enterprise+/Private Label
 | Adopted with QMS-grade audit trail underneath (DLB reserves audit trail for Private Label; DronOps has it everywhere)
 |

Appendix B — Record Type Catalogue (initial)
Every record type carries: id, tenant, jurisdiction tags, requirement refs, evidence links, hash, signatures where applicable, retention clock, and audit-trail lineage.
Record type
 | Generated by
 | Typical requirement anchors
 |
Controlled document / revision
 | M1
 | ISO 7.5; regulator manual requirements
 |
Form instance (pre/post-flight, checklist, site survey)
 | M4 mobile
 | Operational record-keeping; ISO 7.5/8.5
 |
Flight record (+raw log)
 | M6
 | Regulator flight-record retention; evidence base
 |
Maintenance / inspection record (+RTS signature)
 | M5
 | UAS continuing airworthiness; ISO 8.5
 |
Battery lifecycle record
 | M5/M6
 | Manufacturer + operator maintenance programme
 |
Qualification / currency snapshot
 | Spine (TMS + M7-fed)
 | Personnel licensing & recency
 |
Licence / medical / induction record
 | M7
 | Personnel requirements; site access obligations
 |
Duty & flight-time record
 | M7/M6
 | Fatigue management policy; duty-limit schemes
 |
Crew roster (point-in-time)
 | M7
 | Operational control evidence; ‘who can fly’ proof
 |
Risk assessment (mission / SORA-style)
 | M3
 | Operational risk requirements; STS-B1 support
 |
Occurrence report + investigation
 | M3
 | Occurrence reporting obligations; ISO 10.2
 |
NCR / CAPA
 | M2 (incl. auto from M6)
 | ISO 10.2; regulator findings response
 |
Internal audit record
 | M2
 | ISO 9.2; regulator self-audit expectations
 |
Management review record
 | M2
 | ISO 9.3
 |
Mission pack (sealed)
 | M4
 | Client deliverable; tender evidence
 |
STS-B1 declaration + conformance set
 | M4
 | GACAR Part 107 v5.0 standard scenario
 |
Audit pack (per audience)
 | M2 generator
 | OC/ROC renewal; ISO surveillance; tenders
 |
