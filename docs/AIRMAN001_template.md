<!-- TEMPLATIZED: {{group.key}} = onboarding variable · [[param:...]] = configurable default · [[jurisdiction:X]]…[[/jurisdiction]] = renders only when X enabled · '> DronOps platform note' blocks describe platform behaviour. Verbatim prose otherwise unchanged from AIR-MAN-001 v1.0. -->

**{{organization.trade_name}}** · Standards & Operations Manual

**{{organization.trade_name}}**

*Autonomous Drone Intelligence*

**COMPANY STANDARDS ****&**

**OPERATIONS MANUAL**

Document Reference: {{organization.doc_prefix}}-MAN-001

Version 1.0  |  Issue Date: 2026

*Classification: Internal — Controlled Document*

Aligned with ISO 9001:2015  |  {{jurisdictions.active_display}}  |  IEC 62446-3:2017

# **Document Control**

### **Approval ****&**** Issue**

|**Role**                                         |**Name**|**Signature**|**Date**|
|-------------------------------------------------|--------|-------------|--------|
|Prepared by — {{roles.ops_manager_title}}        |        |             |        |
|Reviewed by — {{roles.quality_lead_title}}       |        |             |        |
|Approved by — {{roles.accountable_manager_title}}|        |             |        |

### **Revision History**

|**Version**|**Date**|**Section(s) Changed**|**Author**                 |**Summary**             |
|-----------|--------|----------------------|---------------------------|------------------------|
|1.0        |—       |All — initial issue   |{{organization.trade_name}}|First controlled release|
|           |        |                      |                           |                        |
|           |        |                      |                           |                        |

### **Distribution**

Controlled master copy: {{organization.trade_name}} shared drive › /QMS/Manual/. Printed copies are uncontrolled unless stamped ‘Controlled Copy’. Distributed to all employees and key subcontractors at onboarding; acknowledgement recorded via HR onboarding checklist ({{organization.doc_prefix}}-FRM-HR-01).

### **Document Hierarchy**

This manual sits at Tier 1 of the {{organization.trade_name}} documentation system:

- Tier 1 — Standards & Operations Manual (this document): policies, principles, framework.
- Tier 2 — Standard Operating Procedures (SOPs): step-by-step task instructions.
- Tier 3 — Work instructions, checklists, forms, templates: point-of-use job aids.
- Tier 4 — Records: completed forms, logs, reports — evidence the system was followed.

# **Contents**

**PART 1 — FOUNDATION**

1. Company Profile, Scope & Context
1. Mission, Vision, Quality Policy & Objectives
1. Interested Parties & Stakeholder Map
1. Organizational Structure, Roles & Responsibilities
1. Risk & Opportunity Register
1. Document & Record Control

**PART 2 — OPERATIONS**

1. Flight Operations Framework
1. Autonomous & Dock-Based Operations
1. Mapping & Survey Operations
1. Solar PV Inspection (IEC 62446-3:2017)
1. Data Processing, AI/ML & Deliverable QC
1. Equipment, Calibration & Asset Management
1. Subcontractor & Pilot Management

**PART 3 — COMMERCIAL**

1. Sales, Tendering & Bid/No-Bid
1. Contract Review & Customer Requirements
1. Project Delivery & Client Communication
1. Customer Satisfaction & Feedback
1. Consulting Engagements

**PART 4 — HUMAN RESOURCES**

1. Recruitment, Onboarding & Offboarding
1. Competence, Training & Pilot Currency
1. Performance Management & Code of Conduct
1. Compensation, Leave & Labour Law Compliance

**PART 5 — FINANCE ****&**** ADMINISTRATION**

1. Financial Controls & Approval Authority
1. Supplier Evaluation & Approved Vendor List
1. Invoicing, Collections & Cash Management
1. Insurance & Legal Register

**PART 6 — QHSE**

1. QHSE Policy & Hazard Framework
1. Site Safety — Drone Operations
1. Incident Reporting & Investigation
1. Environmental Management

**PART 7 — IT ****&**** DATA**

1. IT Acceptable Use & Access Control
1. Data Classification, Storage & Retention
1. Cybersecurity & Incident Response
1. Business Continuity & Disaster Recovery

**PART 8 — PERFORMANCE ****&**** IMPROVEMENT**

1. KPI Dashboard & Management Review
1. Internal Audit Programme
1. Nonconformity & Corrective Action

**APPENDICES**

A. Glossary & Acronyms

B. Regulatory Reference Index

C. Document Register

D. Form Templates

# **Part 1 — Foundation**

## **1. Company Profile, Scope ****&**** Context***   ISO 9001 cl. 4.1, 4.3*

### **1.1 Company Profile**

|**Legal name**             |{{organization.legal_name}}                                                                                                                          |
|---------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
|**Trading name**           |{{organization.trade_name}}                                                                                                                          |
|**Headquarters**           |{{organization.hq_city_country}}                                                                                                                     |
|**Operating geography**    |{{organization.operating_geography}}                                                                                                                 |
|**Service lines**          |Drone-as-a-Service: mapping & survey, asset & infrastructure inspection, solar PV inspection, autonomous/dock-based operations, advisory & consulting|
|**Headcount band**         |{{organization.headcount_band}}                                                                                                                      |
|**Primary client channels**|Direct enterprise clients and EPC / system integrator partners                                                                                       |

### **1.2 Scope of the Management System**

This manual applies to all {{organization.trade_name}} activities relating to the sale, planning, execution, processing and delivery of drone data acquisition, autonomous drone operations, mapping & survey, asset and solar PV thermographic inspection, geospatial analytics and advisory services across the GCC and Indonesia, performed by {{organization.trade_name}} employees and qualified subcontractors operating under {{organization.trade_name}} contracts.

### **1.3 Exclusions**

{{organization.trade_name}} does not design or manufacture drone hardware or sensors. Design control (ISO 9001 cl. 8.3) is limited to the design of service workflows, data products, software tooling and client deliverables — not airframes or payloads. This exclusion does not affect {{organization.trade_name}}’s ability to consistently provide conforming products and services.

### **1.4 Context of the Organization**

Internal context: small specialist team with deep regional regulatory experience; strong DJI Enterprise relationships from founding team’s background; GCC + Indonesia footprint; brand positioning as a regulator-aware, IEC-anchored inspection provider; key dependency on a small number of senior people.

External context: rapid regulatory evolution (GCAA UAE, GACA KSA, DKPPU Indonesia); commoditisation pressure on basic drone services; premium pricing sustainable mainly on specialised inspection and autonomous operations; growing client demand for ISO/IEC-anchored evidence in tenders; supply chain exposure to single-vendor (DJI) restrictions in some markets; FX volatility across AED / SAR / IDR.

## **2. Mission, Vision, Quality Policy ****&**** Objectives***   cl. 5.2, 6.2*

### **2.1 Mission**

To deliver decision-grade aerial intelligence across the GCC and Indonesia — combining autonomous drone operations, IEC-anchored inspection methods and AI-driven analytics — so clients can manage assets with measurable confidence.

### **2.2 Vision**

To be the region’s reference operator for autonomous drone intelligence: the company clients call when the answer has to be defensible.

### **2.3 Quality Policy**

|**Quality Policy Statement** {{organization.trade_name}} commits to: (1) deliver every service in compliance with applicable aviation regulations (GCAA, DCAA, GACA, DKPPU and equivalents) and industry standards including IEC 62446-3:2017 for PV thermography; (2) plan, execute and verify each engagement so deliverables meet documented client requirements first-time; (3) operate every flight under a documented safety risk assessment with a clearly accountable Remote Pilot in Command; (4) maintain the competence of every pilot, analyst and project manager through structured training and currency requirements; (5) measure performance against defined KPIs and continually improve. This policy is reviewed at each management review and signed by the {{roles.accountable_manager_title}}.|
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

### **2.4 Strategic Quality Objectives**

Objectives are SMART, owned by a named role, and reviewed at the cadence shown. Baseline set at first management review; targets revised annually.

|**Objective**                    |**Metric**                           |**Target Yr 1**|**Owner**                  |**Review** |
|---------------------------------|-------------------------------------|---------------|---------------------------|-----------|
|Zero reportable flight incidents |Incidents reported to regulator      |0              |{{roles.ops_manager_title}}|Monthly    |
|On-time deliverable rate         |% delivered by contractual date      |≥ 95%          |Project Mgr                |Monthly    |
|First-pass deliverable acceptance|% accepted without rework            |≥ 90%          |Data Lead                  |Monthly    |
|PV inspection IEC-conformance    |% with full IEC 62446-3 evidence pack|100%           |PV Lead                    |Per project|
|Pilot currency compliance        |% pilots within currency window      |100%           |Training Lead              |Monthly    |
|Client satisfaction              |Avg post-project survey score        |≥ 8/10         |Commercial                 |Quarterly  |
|Tender win rate                  |Wins / qualified bids                |≥ 25%          |Commercial                 |Quarterly  |
|Days Sales Outstanding           |AR days                              |≤ 60           |Finance                    |Monthly    |

## **3. Interested Parties ****&**** Stakeholder Map***   cl. 4.2*

Identified parties whose needs and expectations affect or are affected by the management system:

|**Party**                                    |**Primary expectations**                                          |**How {{organization.trade_name}} addresses**                      |
|---------------------------------------------|------------------------------------------------------------------|-------------------------------------------------------------------|
|Clients (enterprise + EPC)                   |On-spec, on-time, defensible deliverables; safe ops on their sites|Contract review (§15), project plan, IEC-anchored methods, HSE pack|
|Aviation regulators (GCAA, DCAA, GACA, DKPPU)|Compliant flight operations, licensed pilots, accurate records    |Flight Ops Framework (§7), pilot currency (§20), records (§6)      |
|Employees                                    |Safe workplace, clear roles, fair pay, development                |HR sections (§19–22), QHSE (§27–30)                                |
|Subcontractors / freelance pilots            |Clear scope, prompt payment, safe sites                           |Subcontractor management (§13), payment terms (§25)                |
|Suppliers (DJI, sensors, software)           |Predictable orders, paid on terms                                 |Supplier management (§24)                                          |
|Insurers                                     |Risk control, incident transparency                               |Risk register (§5), incident reporting (§29)                       |
|Site owners / public                         |No nuisance, no privacy breach, no safety risk                    |Site safety (§28), data classification (§32)                       |
|Shareholders / founders                      |Sustainable growth, governed risk                                 |KPIs (§35), management review (§35)                                |

## **4. Organizational Structure, Roles ****&**** Responsibilities***   cl. 5.3*

At 6–15 headcount, {{organization.trade_name}} runs a flat structure: a {{roles.accountable_manager_title}}, three function leads (Operations, Commercial, Finance/Admin) and specialist roles. Some roles are combined where headcount is tight; combined roles are listed against the primary holder.

### **4.1 Role Definitions**

|**Role**                                |**Reports to**             |**Primary accountabilities**                                                                                                                                          |
|----------------------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|{{roles.accountable_manager_title}} (MD)|Board / shareholders       |Strategy, financial performance, approval of quality policy & objectives, chairs management review, ultimate accountability for safety culture and regulatory standing|
|Head of Operations / Accountable Manager|MD                         |Holds aviation regulatory accountability per GCAA/GACA, approves flight operations, owns SOPs §7–§13, signs Operations Manual                                         |
|{{roles.chief_pilot_title}} / RPIC Lead |{{roles.ops_manager_title}}|Pilot competency, currency, RPIC nomination per mission, flight authorisations, post-flight reviews                                                                   |
|PV / Inspection Service Lead            |{{roles.ops_manager_title}}|Owns §10 IEC 62446-3 methodology, validates inspection deliverables, QA of thermographic reports                                                                      |
|Data & Analytics Lead                   |{{roles.ops_manager_title}}|Photogrammetry, GIS, AI/ML pipelines, deliverable QC (§11)                                                                                                            |
|{{roles.project_manager_title}}(s)      |{{roles.ops_manager_title}}|Day-to-day execution, client communication, risk log, change control                                                                                                  |
|{{roles.commercial_lead_title}}         |MD                         |Sales pipeline, tender response, contract review, customer satisfaction                                                                                               |
|Finance & Admin Lead                    |MD                         |Bookkeeping, invoicing, procurement, HR admin, insurance renewals                                                                                                     |
|QHSE Officer (may be combined)          |MD (functional)            |Risk register, audits, incident investigation, training records — independence from line ops on QHSE matters                                                          |
|IT / Data Custodian (may be combined)   |{{roles.ops_manager_title}}|Storage, backups, access control, cybersecurity baseline                                                                                                              |

### **4.2 RACI — Key Processes**

R = Responsible, A = Accountable, C = Consulted, I = Informed.

|**Process**              |**MD**|**Ops**|**Pilot**|**PM**|**Comm**|**Fin**|**QHSE**|
|-------------------------|------|-------|---------|------|--------|-------|--------|
|Bid/no-bid > AED 500k    |A     |C      |I        |I     |R       |C      |I       |
|Contract signature       |A     |C      |I        |I     |R       |C      |I       |
|Flight authorisation     |I     |A      |R        |C     |I       |—      |C       |
|Pilot competency sign-off|I     |A      |R        |I     |—       |—      |C       |
|Deliverable QC sign-off  |I     |A      |C        |R     |I       |—      |—       |
|Incident investigation   |A     |C      |C        |I     |I       |I      |R       |
|Management review        |A     |R      |C        |C     |R       |R      |R       |

## **5. Risk ****&**** Opportunity Register***   cl. 6.1*

{{organization.trade_name}} maintains a live risk register reviewed at least quarterly and after every incident. Risks scored Likelihood (1–5) × Impact (1–5); scores ≥ 12 require named treatment with target date. Live register: /QMS/Registers/{{organization.doc_prefix}}-REG-RISK-01.xlsx. Baseline entries:

|**#**|**Risk**                                                 |**L**|**I**|**Score**|**Treatment ****&**** Owner**                          |
|-----|---------------------------------------------------------|-----|-----|---------|-------------------------------------------------------|
|R-01 |Loss of GCAA/GACA operator approval due to non-compliance|2    |5    |10       |Quarterly internal audit of flight ops · Ops Head      |
|R-02 |Pilot incident causing third-party injury                |2    |5    |10       |JSA per site, currency program, TPL cover · QHSE       |
|R-03 |DJI / single-vendor supply disruption (KSA, Indonesia)   |3    |4    |12       |Qualify secondary platform · Procurement + Ops         |
|R-04 |Cybersecurity breach exposing client imagery             |2    |5    |10       |Access control, encryption, IR plan · IT Custodian     |
|R-05 |Client non-payment / DSO blowout                         |3    |3    |9        |Credit check, milestone billing · Finance              |
|R-06 |Key-person dependency (founder, chief pilot)             |3    |4    |12       |Documented SOPs, cross-training · MD                   |
|R-07 |Regulatory change in Indonesia disrupting PT PMA ops     |3    |3    |9        |Local counsel retainer, monitoring · MD                |
|R-08 |Thermal misdiagnosis → client claim                      |2    |4    |8        |IEC 62446-3 procedure, QC checklist, PI cover · PV Lead|
|R-09 |Loss of data in transit/storage                          |2    |4    |8        |Encrypted transfer, 3-2-1 backup · IT Custodian        |
|R-10 |FX exposure (AED / IDR / SAR)                            |3    |2    |6        |Quote in client currency where possible · Finance      |

### **5.1 Opportunities**

- O-01 — Regulator-driven mandatory PV inspections in GCC: position {{organization.trade_name}} as IEC-anchored default provider.
- O-02 — Dock/BVLOS approvals maturing in UAE & KSA: productise recurring autonomous inspection contracts.
- O-03 — Indonesia infrastructure spend: leverage local entity for government and EPC work.
- O-04 — Consulting line: monetise regulatory know-how (GCAA/GACA accreditation support, training).

## **6. Document ****&**** Record Control***   cl. 7.5*

### **6.1 Document Numbering**

Format: {{organization.doc_prefix}}-[TYPE]-[FUNC]-[SEQ]. TYPE: MAN, POL, SOP, WI, FRM, REG, REC. FUNC: OPS, COM, HR, FIN, QHSE, IT, GEN.

Example: {{organization.doc_prefix}}-SOP-OPS-07 = Operations SOP, sequence 07 (pre-flight checklist).

### **6.2 Version Control**

Major changes increment integer (1.0 → 2.0); minor edits increment decimal (1.0 → 1.1). Every controlled document carries a footer with reference number, version, issue date, page X of Y. Superseded versions archived in /QMS/Archive/ for ≥ 7 years.

### **6.3 Approval Authority**

|**Document type**               |**Prepared by**|**Reviewed by**      |**Approved by**                             |
|--------------------------------|---------------|---------------------|--------------------------------------------|
|Manual (Tier 1)                 |Function lead  |QHSE + affected leads|MD                                          |
|SOP (Tier 2)                    |Function lead  |QHSE                 |{{roles.ops_manager_title}} or function head|
|Work instruction / form (Tier 3)|Process owner  |Function lead        |Function lead                               |
|Record (Tier 4)                 |Task performer |—                    |Per process (e.g. RPIC for flight log)      |

### **6.4 Record Retention**

> **DronOps platform note —** records are retained in their originating DronOps modules; the platform displays a ‘retain until’ date per record. The platform default is a 36-month floor (build-to-strictest across enabled jurisdictions); operator categories below that exceed the floor are honoured as the longer value. Nothing is auto-deleted.

|**Record category**                         |**Retention**                                                                       |**Owner**                      |
|--------------------------------------------|------------------------------------------------------------------------------------|-------------------------------|
|Flight logs, mission records, RPIC sign-offs|7 years (or as required by regulator)                                               |{{roles.chief_pilot_title}}    |
|Training & competency records               |Duration of employment + 5 years                                                    |Training Lead                  |
|Incident reports & investigations           |10 years                                                                            |QHSE                           |
|Calibration & maintenance records           |Life of asset + 2 years                                                             |Equipment Custodian            |
|Client deliverables & project files         |7 years from project close                                                          |{{roles.project_manager_title}}|
|Contracts, tenders, financial records       |[[jurisdiction:UAE]]Per UAE Commercial Companies Law (min 5 yrs)[[/jurisdiction]]   |{{roles.finance_lead_title}}   |
|Audit reports, NCRs, CARs                   |5 years                                                                             |QHSE                           |
|HR records (general)                        |[[jurisdiction:UAE]]Per UAE Labour Law (min 2 yrs post-termination)[[/jurisdiction]]|HR / Finance                   |

# **Part 2 — Operations**

## **7. Flight Operations Framework***   cl. 8.1, 8.5*

This section is the spine of {{organization.trade_name}} field operations. It governs every flight regardless of service line (mapping, inspection, autonomous, training). Where service-specific procedures exist (§8–§10), they supplement — not replace — this section.

### **7.1 Regulatory Baseline by Geography**

|**Jurisdiction**|**Primary regulation**                               |**Operator/pilot requirement**                                                                  |
|----------------|-----------------------------------------------------|------------------------------------------------------------------------------------------------|
|UAE — Dubai     |DCAA UAS Regulation (Dubai)                          |DCAA operator certificate, registered aircraft, DCAA-approved pilot                             |
|UAE — Federal   |GCAA CAR Part VIII / UAS Reg                         |GCAA registration, operator approval for commercial ops                                         |
|KSA             |GACAR Part 107 v5.0                                  |GACA RPAS Operator Approval, GACA-approved RPIC, mission-specific authorisation for STS-B1/BVLOS|
|Indonesia       |DKPPU CASR Part 107, PM 37/2020                      |Operator certificate, DKPPU-approved pilot, AirNav coordination                                 |
|Other GCC       |Per host regulator (CAAB, QCAA, CAA Oman, CAA Kuwait)|Verify per project before bid                                                                   |

### **7.2 Mission Authorisation — Decision Gates**

No flight may take place until ALL gates below are signed off. Sign-offs may be electronic but must be timestamped and traceable to the named role.

|**Gate**       |**Question**                                                             |**Owner**                      |**Evidence**                                                |
|---------------|-------------------------------------------------------------------------|-------------------------------|------------------------------------------------------------|
|G1 — Regulatory|Do we hold valid operator approval in this jurisdiction for this op type?|{{roles.ops_manager_title}}    |Operator certificate copy in mission folder                 |
|G2 — Airspace  |Is the airspace clear (CTR, restricted, NOTAM)? Permission obtained?     |{{roles.chief_pilot_title}}    |Airspace approval / NOTAM screenshot                        |
|G3 — Site      |Site survey complete? JSA signed? Emergency plan in place?               |{{roles.project_manager_title}}|{{organization.doc_prefix}}-FRM-OPS-02 Site Risk Assessment |
|G4 — Crew      |RPIC and crew named, current, briefed?                                   |{{roles.chief_pilot_title}}    |{{organization.doc_prefix}}-FRM-OPS-03 Crew Briefing        |
|G5 — Equipment |Airframe airworthy? Batteries cycled OK? Sensor calibrated?              |Equipment Custodian            |{{organization.doc_prefix}}-FRM-OPS-04 Pre-flight Inspection|
|G6 — Weather   |Forecast within ops envelope? Go/no-go criteria met?                     |RPIC                           |Logged weather snapshot at T-30 min                         |
|G7 — Client    |Client site contact confirmed? Access granted? Stakeholders informed?    |{{roles.project_manager_title}}|Email confirmation in mission folder                        |

### **7.3 Weather Go/No-Go Criteria**

Default {{organization.trade_name}} limits, applied unless the airframe OEM or operator approval is more restrictive (then the stricter applies).

|**Parameter**           |**Multirotor — visual**       |**Multirotor — PV/thermal** |**Notes**                                 |
|------------------------|------------------------------|----------------------------|------------------------------------------|
|Surface wind (sustained)|≤ 10 m/s (≈ 20 kt)            |≤ 8 m/s                     |Gust < 1.5× sustained                     |
|Visibility              |≥ 5 km                        |≥ 5 km                      |VLOS at all times unless BVLOS-approved   |
|Cloud base              |≥ 150 ft above max op altitude|Same                        |                                          |
|Precipitation           |No rain                       |No rain                     |Stop ops at first drops                   |
|Temperature             |Per OEM (typically 0 to +40°C)|+5 to +40°C                 |Battery performance degrades < 10°C       |
|Solar irradiance (PV)   |n/a                           |≥ 600 W/m² (per IEC 62446-3)|Measured at site, recorded                |
|Lightning               |No activity within 15 km      |Same                        |Suspend; cooldown 30 min after last strike|
|Dust storm / sandstorm  |Visibility < 5 km → no-go     |Same                        |GCC-specific — common Apr–Aug             |

### **7.4 Standard Mission Workflow**

Every mission follows the seven-stage workflow below. Stage gates are recorded in the Mission File ({{organization.doc_prefix}}-REC-OPS-MISSION-[YYYY-NNNN]).

- Mission Request — received from PM with scope, site, dates, deliverables. Logged in mission tracker.
- Planning — airspace check, site survey (remote then physical if first visit), flight plan, JSA, crew assignment, equipment reservation.
- Authorisation — Gates G1–G7 (§7.2) signed off. Mission Authorisation Form ({{organization.doc_prefix}}-FRM-OPS-01) issued by {{roles.chief_pilot_title}}.
- Mobilisation — equipment packed per checklist, transport arranged, client/site contact confirmed 24 h prior.
- Execution — on-site: crew brief, pre-flight inspection, weather check, flight(s), continuous risk monitoring, post-flight inspection.
- Data handover — raw data offloaded to encrypted media on-site, chain-of-custody form signed, uploaded to /Projects/[client]/[project]/01-RAW/ within 24 h.
- Mission close — flight log filed, NCRs raised if any, lessons captured in tracker, equipment returned to inventory.

### **7.5 Emergency Procedures (summary)**

Full procedures in {{organization.doc_prefix}}-SOP-OPS-EMG. RPIC carries the laminated quick-reference card on every flight.

- Loss of link / GPS — initiate Return-to-Home (RTH). If RTH compromised, controlled descent in safest sector. Notify site supervisor.
- Battery emergency — land immediately at nearest safe spot. Do not exceed manufacturer’s emergency landing threshold.
- Flyaway / loss of control — call STOP on radio, alert site personnel, attempt force-disarm if airframe is over open area only, log GPS last known.
- Injury — STOP all flights, render first aid, call local emergency services, notify {{organization.trade_name}} Ops Head within 30 minutes, preserve evidence.
- Aircraft damage / hard landing — STOP flights with that airframe, photograph, ground the unit pending engineering inspection per §12.
- Public encroachment — pause flights, ask supervisor to clear area, resume only when cleared.

### **7.6 Records (Flight Operations)**

- Flight Log (per flight) — {{organization.doc_prefix}}-REC-OPS-FLT — retained 7 years.
- Mission File (per project) — closed-out within 5 working days of demob.
- Maintenance log per airframe — §12.
- Incident report (if any) — §29.

## **8. Autonomous ****&**** Dock-Based Operations**

Autonomous operations use a dock-stationed drone executing pre-programmed missions with limited or no on-site crew. {{organization.trade_name}} supplements — does not replace — §7 with the controls below.

### **8.1 Approval Prerequisites**

- UAE: GCAA/DCAA approval for autonomous operations including BVLOS waiver where required.
- KSA: GACA STS-B1 or specific category approval, BVLOS authorisation.
- Indonesia: DKPPU approval and AirNav coordination per mission.
- Site-level: detect-and-avoid arrangement (radar, observers, geofencing) appropriate to airspace.

### **8.2 Remote Pilot in Command (R-PIC) — Autonomous**

Even unmanned at the dock, every autonomous flight has a named R-PIC monitoring telemetry remotely. R-PIC qualifications: full RPIC currency per §20, plus dock-platform type rating, plus minimum 10 supervised autonomous missions.

### **8.3 Site Survey ****&**** Geofence Design**

Pre-deployment: full site survey including identification of all permanent obstacles, dynamic hazards (cranes, vehicles), no-fly zones (over occupied buildings, public roads). Geofence configured with: (a) operational area, (b) emergency descent zones, (c) hard exclusion zones. Geofence file is version-controlled and signed off by {{roles.chief_pilot_title}} before activation.

### **8.4 Pre-Mission Automated Checks**

|**Check**                                  |**Acceptance**              |**Action if failed**                       |
|-------------------------------------------|----------------------------|-------------------------------------------|
|Weather telemetry within envelope (§7.3)   |All green                   |Mission postponed; alert R-PIC             |
|Aircraft self-test (motors, sensors, comms)|All green                   |Mission aborted; maintenance ticket        |
|Battery state and cycle count              |≥ 90% SOC, < OEM cycle limit|Aircraft swap or postpone                  |
|Dock status (door, charging, cooling)      |All green                   |Mission aborted; field service             |
|GNSS satellites and HDOP                   |≥ 14 sats, HDOP ≤ 1.5       |Wait and retry, else postpone              |
|Geofence and mission file checksum         |Match                       |Mission aborted; investigate file integrity|
|Link to R-PIC console                      |Verified bidirectional      |Mission aborted                            |

### **8.5 In-Flight Monitoring**

R-PIC monitors continuously with attention to: link quality (RSSI/latency), battery state, deviation from planned path (alert if > 2 m horizontally or > 1 m vertically from waypoint), nearby air traffic (ADS-B or radar feed), weather telemetry. R-PIC has manual takeover authority and exercises it on any anomaly.

### **8.6 Post-Flight**

- Automated landing verified; dock cycle completes.
- Data offload triggered to secure storage; checksum verified.
- Auto-generated flight log reviewed and signed off by R-PIC within 24 h.
- Any anomaly raised as NCR per §37 within 24 h.

### **8.7 Dock Maintenance**

Weekly: visual inspection, lens cleaning, debris check. Monthly: full diagnostic, firmware check, mechanical actuator test. Quarterly: deep clean, calibration verification, comms test. All entries in dock maintenance log {{organization.doc_prefix}}-REC-OPS-DOCK-[ID].

## **9. Mapping ****&**** Survey Operations**

Mapping and survey covers photogrammetric and LiDAR data acquisition for topographic, volumetric, construction-progress and asset-mapping deliverables. Quality is defined by accuracy class agreed with the client in writing before mobilisation.

### **9.1 Accuracy Classes ({{organization.trade_name}} default tiers)**

|**Class**             |**Horizontal RMSE**|**Vertical RMSE**|**Typical use**                              |**Method**                                  |
|----------------------|-------------------|-----------------|---------------------------------------------|--------------------------------------------|
|Class A — Survey grade|≤ 3 cm             |≤ 5 cm           |Stockpile audit, engineering survey, as-built|PPK/RTK + GCPs + checkpoints, LiDAR optional|
|Class B — Engineering |≤ 10 cm            |≤ 15 cm          |Construction progress, corridor mapping      |PPK or GCPs only                            |
|Class C — Planning    |≤ 50 cm            |≤ 1 m            |Site planning, visualisation, marketing      |Onboard GNSS, no GCPs                       |

### **9.2 Ground Control ****&**** Check Points**

- Class A: minimum 5 GCPs per site for sites ≤ 10 ha, +1 per additional 5 ha, plus ≥ 3 independent checkpoints (not used in processing).
- Class B: 3 GCPs minimum or full PPK; checkpoints recommended.
- GCPs surveyed with dual-frequency GNSS rover, occupation ≥ 30 s, reported in agreed CRS (typically UAE: MGRS / WGS84 UTM 39N or 40N; KSA: Ain el Abd 1970 / MTM zones; Indonesia: WGS84 UTM zones 46–54).
- GCP layout documented in mission file with photos of each marker.

### **9.3 Acquisition Parameters**

|**Output**             |**GSD target**|**Overlap fwd / side** |**Notes**                                  |
|-----------------------|--------------|-----------------------|-------------------------------------------|
|Orthomosaic — Class A  |≤ 2 cm/px     |80% / 70%              |Nadir; oblique passes for verticals        |
|Orthomosaic — Class B/C|3–5 cm/px     |75% / 65%              |                                           |
|3D model / building    |1–2 cm/px     |80% / 70% + oblique 45°|Cross-grid recommended                     |
|LiDAR corridor         |≥ 100 pts/m²  |30% swath overlap      |Speed ≤ 6 m/s; calibration pass each flight|
|Volumetric             |2 cm/px       |80% / 70%              |Single contiguous flight where possible    |

### **9.4 QC Checks Before Delivery**

- Checkpoint residuals within accuracy class — recorded in QC report.
- Visual inspection of orthomosaic for blurring, seamlines, gaps, colour balance.
- Point cloud density verification (LiDAR/photogrammetry) — sample plots across site.
- Coordinate system and units verified against contract.
- Deliverable formats verified (e.g. GeoTIFF, LAS/LAZ, DXF, IFC) and load-tested in a second software.
- Metadata / lineage report attached.

## **10. Solar PV Inspection (IEC 62446-3:2017)**

Solar PV thermographic inspection is {{organization.trade_name}}’s flagship technical service. All PV inspections are performed and reported in conformance with IEC 62446-3:2017 — Photovoltaic (PV) systems – Requirements for testing, documentation and maintenance – Part 3: PV modules and plants – Outdoor infrared thermography. Deviations from the standard, where unavoidable, are documented and disclosed to the client.

### **10.1 Pre-Inspection Requirements**

|**Requirement**                  |**Threshold per IEC 62446-3**                                    |**{{organization.trade_name}} practice**                                                      |
|---------------------------------|-----------------------------------------------------------------|----------------------------------------------------------------------------------------------|
|Solar irradiance (plane of array)|≥ 600 W/m²                                                       |Measured at site with calibrated pyranometer or reference cell; logged at start, midpoint, end|
|Plant operating condition        |Modules connected to inverter, operating near MPP                |Confirmed with plant SCADA / operator before flight                                           |
|Wind                             |Steady, low; rapid changes affect readings                       |≤ 8 m/s; if higher, defer or annotate                                                         |
|Soiling                          |Modules in representative condition                              |Photographed; heavy soiling triggers consultation with client                                 |
|Time of day                      |Near solar noon ±2 h preferred                                   |Mission window pre-planned                                                                    |
|Thermal camera                   |Calibrated, NETD ≤ 80 mK, resolution adequate for GSD requirement|Annual calibration; certificate filed                                                         |
|GSD (thermal)                    |≤ 3 cm/px on module surface (recommended)                        |Default 3 cm/px; tighter for cell-level analysis                                              |

### **10.2 Flight Acquisition Parameters**

- Camera angle: nadir ±5° (perpendicular to module plane; for tilted arrays, adjust flight to maintain perpendicularity to module surface).
- Altitude: derived from GSD requirement and camera FOV; typically 25–45 m AGL for utility-scale plants.
- Speed: ≤ 5 m/s for thermal acquisition to avoid motion blur.
- Overlap: ≥ 75% forward / ≥ 65% side for thermal mosaic; concurrent RGB imagery at same overlap.
- Emissivity setting: 0.85 for glass-front modules unless project-specific value provided.
- Reflected apparent temperature: measured on-site and entered into camera before flight.

### **10.3 Anomaly Classification**

Anomalies classified per IEC 62446-3 categories. Severity assigned based on ΔT relative to operating modules and pattern.

|**Class**                          |**Description**                              |**Typical ΔT**         |**Severity**               |
|-----------------------------------|---------------------------------------------|-----------------------|---------------------------|
|String / multiple modules off      |Entire string warmer/cooler than peers       |Variable               |Critical — immediate notify|
|Module off / bypassed              |Whole module elevated                        |≥ 20 K                 |Critical                   |
|Substring / bypass-diode activation|1/3 or 2/3 of module elevated                |10–20 K                |Major                      |
|Multi-cell hotspot                 |Cluster of cells elevated                    |5–15 K                 |Major                      |
|Single-cell hotspot                |Single cell elevated                         |≥ 10 K above neighbours|Moderate — trend track     |
|PID / shading pattern              |Gradient consistent with PID or partial shade|Variable               |Moderate                   |
|Junction box / cable hotspot       |Localised heating at j-box                   |≥ 10 K                 |Major — fire risk          |

### **10.4 Deliverable Pack**

Every PV inspection delivery includes the following items in a structured folder set:

- Inspection report (PDF) — plant ID, inspection conditions table (irradiance, ambient temp, wind, time), method statement referencing IEC 62446-3, equipment list with calibration dates, RPIC details, summary findings, anomaly statistics by class, recommendations.
- Anomaly register (XLSX + CSV) — one row per anomaly: unique ID, GPS coordinates, module address (combiner/string/row/position), class, severity, ΔT, RGB photo ref, IR photo ref, notes.
- Geo-tagged anomaly map (KMZ + GeoJSON + interactive web map) showing plant boundaries, strings, anomaly markers colour-coded by severity.
- Thermal orthomosaic (GeoTIFF) and RGB orthomosaic (GeoTIFF).
- Raw IR sequences (radiometric, e.g. R-JPEG) for client archival — included on request.
- Conditions log — instrument readings timestamped.

### **10.5 QC Sign-off**

Before release, the PV Service Lead reviews and signs the IEC 62446-3 Conformance Checklist ({{organization.doc_prefix}}-FRM-OPS-PV-01). No deliverable leaves {{organization.trade_name}} without this sign-off.

## **11. Data Processing, AI/ML ****&**** Deliverable QC***   cl. 8.5, 8.6*

Data processing is where raw acquisition becomes a defensible deliverable. This section governs the pipeline from chain-of-custody intake to client release.

### **11.1 Pipeline Stages**

- Ingest — chain-of-custody confirmed, checksums computed, raw archived in /Projects/[client]/[project]/01-RAW/ (read-only).
- Pre-process — image quality screen (blur, exposure), GNSS log conditioning, GCP/checkpoint import.
- Process — photogrammetry (Pix4D / Metashape / OpenDroneMap), LiDAR (OEM tools + LAStools), thermal mosaic ({{organization.trade_name}} pipeline).
- Analyse — AI/ML inference where applicable (PV anomaly detection, asset classification, change detection). Human review of all AI outputs (§11.4).
- QC — Data Lead runs deliverable QC checklist ({{organization.doc_prefix}}-FRM-OPS-QC-01).
- Internal release — Service Lead approves; deliverable moved to /04-DELIVERY/.
- Client release — PM delivers via agreed channel (secure portal, encrypted link), client acknowledges receipt.

### **11.2 Storage Layout**

Standard project folder structure — enforced for every project:

- 01-RAW/  — raw acquisitions, read-only after ingest checksum.
- 02-WORKING/  — intermediate processing files; cleared after delivery.
- 03-OUTPUT/  — internal QC versions.
- 04-DELIVERY/  — final deliverables sent to client (frozen, immutable).
- 05-DOCS/  — contract, scope, correspondence, QC reports, sign-offs.
- 06-GCP/  — survey control data.

### **11.3 AI/ML Models**

- Each production model has a model card: version, training data summary, validation metrics, known limitations, intended use.
- Model retraining requires sign-off by Data Lead; previous version archived for re-runs.
- Model outputs are never delivered to client without human review by a qualified analyst.
- Confidence thresholds documented per model; outputs below threshold flagged for analyst attention, never auto-published.

### **11.4 Human-in-the-Loop Review**

For PV anomaly detection: analyst reviews 100% of high/critical severity flags and a 10% sample of moderate/low flags; the sample is uplifted to 100% if review finds > 5% disagreement with the model.

### **11.5 Deliverable QC Checklist (core items)**

- Scope match — every item in contract scope present in delivery folder.
- Coordinate system / units verified against contract.
- File integrity — opens cleanly in independent software, checksums logged.
- Accuracy report (mapping) or conformance checklist (PV) attached.
- Metadata / lineage attached.
- Confidentiality classification stamped on all reports.
- No personally identifying data (faces, plates) in public-facing outputs.
- Internal release form ({{organization.doc_prefix}}-FRM-OPS-REL-01) signed by Service Lead.

## **12. Equipment, Calibration ****&**** Asset Management***   cl. 7.1.5*

### **12.1 Asset Register**

Every airframe, payload, battery, GNSS rover, calibrated instrument and high-value tool is recorded in the asset register ({{organization.doc_prefix}}-REG-AST-01) with: asset ID, type, serial, purchase date, custodian, location, status (in service / maintenance / retired), calibration due date where applicable.

### **12.2 Calibration Programme**

|**Asset class**                  |**Frequency**                                                 |**Method**                                                                    |**Owner**          |
|---------------------------------|--------------------------------------------------------------|------------------------------------------------------------------------------|-------------------|
|Thermal camera (IR)              |Annual                                                        |OEM lab or ISO 17025 third party; pre/post check at site with reference target|PV Lead            |
|GNSS rover (RTK/PPK base)        |Annual                                                        |OEM service; on-site baseline check before each project                       |Survey Lead        |
|Pyranometer / irradiance ref     |Annual or per manufacturer                                    |ISO 9847 / IEC 61724                                                          |PV Lead            |
|RGB / mapping camera             |Self-calibration per project; full when lens swapped or impact|On-site test pattern                                                          |Survey Lead        |
|LiDAR sensor                     |Per OEM (typically annual)                                    |Calibration flight + boresight check each mobilisation                        |Survey Lead        |
|Multirotor airframe (IMU/compass)|Pre-flight; full re-cal after firmware or impact              |OEM tool                                                                      |Equipment Custodian|

### **12.3 Maintenance**

- Daily — pre/post-flight inspection per {{organization.doc_prefix}}-FRM-OPS-04. Defects raised on the form; airframe grounded until cleared.
- Scheduled — per OEM service interval (hours/cycles/months — whichever first).
- Unscheduled — after any hard landing, impact, water ingress, or anomaly. Triggers engineering inspection before return to service.
- Records — maintenance log per asset ({{organization.doc_prefix}}-REC-OPS-MAINT-[ID]). Entries dated, signed, parts referenced.

### **12.4 Battery Management**

- Each battery has unique ID and cycle log.
- Retirement thresholds: cycle count per OEM, capacity ≤ 80% of nameplate, or visible swelling/damage.
- Storage: 50–60% SOC if idle > 7 days; fireproof container; temperature-controlled.
- Transport: per IATA/ADR rules — {{organization.trade_name}} holds an internal LiPo handling SOP.

## **13. Subcontractor ****&**** Pilot Management***   cl. 8.4*

{{organization.trade_name}} operates with a core team plus a roster of qualified subcontracted pilots and specialists for capacity scaling and geographic reach. The principle: subcontractors operate to {{organization.trade_name}} standards, not their own.

### **13.1 Pre-Qualification**

No subcontractor flies an {{organization.trade_name}} mission until pre-qualified. Pre-qualification pack ({{organization.doc_prefix}}-FRM-OPS-SUB-01) verifies:

- Valid pilot licence(s) for the jurisdiction(s) of intended work.
- Logbook evidence of recent currency on the airframe class.
- Personal third-party liability insurance OR explicit cover under {{organization.trade_name}}’s policy for this engagement.
- Completed {{organization.trade_name}} familiarisation: this manual, §7 flight ops, §29 incident reporting, §28 site safety.
- Right-to-work documentation per country.
- Reference check on at least one prior commercial engagement.

### **13.2 Approved Subcontractor Register**

Live register {{organization.doc_prefix}}-REG-SUB-01 with: name, jurisdictions, ratings, equipment owned, day rate, last-engagement performance score (1–5), next currency expiry. Reviewed quarterly. Any score ≤ 2 triggers performance discussion; consecutive ≤ 2 scores remove from register.

### **13.3 Engagement Terms**

- Written engagement letter for every mission — scope, dates, day rate, payment terms, IP assignment to {{organization.trade_name}}, confidentiality, indemnities.
- Insurance verified within validity window for the engagement dates.
- Equipment provenance — if subcontractor supplies their own, serial recorded and added to mission file.

### **13.4 On-Engagement Supervision**

Each subcontracted mission has a named {{organization.trade_name}} supervising role (PM or {{roles.chief_pilot_title}}). The subcontractor operates as RPIC but reports to the named supervisor. {{organization.trade_name}} retains full responsibility to the client.

### **13.5 Performance Evaluation**

After each engagement, PM scores the subcontractor on: technical execution, safety, communication, deliverable quality, professionalism (1–5 each, average to overall). Recorded in {{organization.doc_prefix}}-REG-SUB-01.

# **Part 3 — Commercial**

## **14. Sales, Tendering ****&**** Bid/No-Bid***   cl. 8.2*

The commercial pipeline is the controlled gateway between an opportunity and a signed engagement. Discipline here protects margin, capacity and reputation.

### **14.1 Pipeline Stages**

|**Stage**          |**Definition**                                              |**Exit criteria**           |**Owner**                           |
|-------------------|------------------------------------------------------------|----------------------------|------------------------------------|
|1. Lead            |Inbound enquiry or outbound contact, not yet qualified      |Qualification call completed|{{roles.commercial_lead_title}}     |
|2. Qualified       |Confirmed need, budget indicative, decision-maker identified|Bid/no-bid decision recorded|{{roles.commercial_lead_title}}     |
|3. Proposing       |Bid/no-bid = bid; proposal in preparation                   |Proposal sent               |{{roles.commercial_lead_title}} + PM|
|4. Negotiating     |Proposal under client review; commercial/technical Q&A      |Verbal/written acceptance   |{{roles.commercial_lead_title}} + MD|
|5. Won             |Contract signed                                             |Mobilisation handover to Ops|{{roles.commercial_lead_title}} → PM|
|6. Lost / Withdrawn|Closed without win                                          |Reason logged for analysis  |{{roles.commercial_lead_title}}     |

### **14.2 Bid/No-Bid Decision**

Every qualified opportunity passes a bid/no-bid review before proposal effort begins. Decision documented on {{organization.doc_prefix}}-FRM-COM-BID-01.

|**Criterion**                                    |**Weight**|**Pass threshold**       |
|-------------------------------------------------|----------|-------------------------|
|Strategic fit (service line, geography, sector)  |20%       |≥ 3/5                    |
|Technical capability (do we have what’s needed?) |20%       |≥ 4/5                    |
|Capacity (can we deliver within timeline?)       |15%       |≥ 3/5                    |
|Commercial attractiveness (margin, payment terms)|15%       |Target gross margin ≥ 35%|
|Win probability                                  |10%       |≥ 30%                    |
|Client quality (paying record, behaviour)        |10%       |≥ 3/5                    |
|Risk profile (HSE, regulatory, financial)        |10%       |No red flags             |

### **14.3 Approval Authority for Bid**

|**Bid value**                          |**Approval**                                                      |
|---------------------------------------|------------------------------------------------------------------|
|≤ AED 150,000                          |{{roles.commercial_lead_title}}                                   |
|AED 150,001 – 500,000                  |{{roles.commercial_lead_title}} + {{roles.ops_manager_title}}     |
|AED 500,001 – 2,000,000                |{{roles.commercial_lead_title}} + {{roles.ops_manager_title}} + MD|
|> AED 2,000,000 or > 12 months duration|MD + Board (where applicable)                                     |

### **14.4 Proposal ****&**** Tender Response**

Proposals follow a standard structure unless the tender mandates otherwise:

- Executive summary.
- Understanding of requirement.
- Technical approach — methodology, standards (e.g. IEC 62446-3), deliverables, acceptance criteria.
- Programme — timeline, milestones, dependencies.
- Team — named roles with CVs and certifications.
- HSE & quality — extract from this manual, regulatory approvals, insurance summary.
- Commercial — fee structure, payment milestones, validity period.
- Terms — {{organization.trade_name}} standard T&Cs or response to client’s T&Cs.
- Appendices — case studies, certifications, references.

### **14.5 Pricing Discipline**

All quotes built from the cost model {{organization.doc_prefix}}-REG-COM-PRC-01 with these floors:

- Day-rate services: minimum gross margin 35% on internal cost (40% on subcontracted resources).
- PV inspections: minimum AED [confidential floor per MW range — see internal pricing sheet].
- Consulting: minimum day rate AED [confidential]; min engagement 3 days.
- Autonomous monitoring contracts: minimum 12-month term; setup fee covers commissioning at cost; recurring fee at target margin.

Floor pricing below these levels requires MD approval and explicit strategic rationale.

### **14.6 Tender Response Records**

- Tender pack saved to /Tenders/[client]/[ref]/ at receipt.
- Final submission archived with submission timestamp.
- Outcome (win/loss/withdrawn) and reason logged.
- Win-loss analysis presented at quarterly commercial review.

## **15. Contract Review ****&**** Customer Requirements***   cl. 8.2.3*

Before any contract is signed, {{organization.trade_name}} verifies it can meet what’s being committed — and that what’s been agreed is unambiguous. This is the gate between sales optimism and operational reality.

### **15.1 Contract Review Checklist**

Performed by {{roles.commercial_lead_title}} with input from Ops Head and Finance. Recorded on {{organization.doc_prefix}}-FRM-COM-REV-01.

- Scope: deliverables, formats, accuracy class, exclusions explicit.
- Standards: where applicable, named (IEC 62446-3, ISO 9001, client-specific specs).
- Timeline: milestones, acceptance windows, delay liabilities.
- Acceptance criteria: objective and measurable — not ‘to client satisfaction’.
- Regulatory: operator approvals required, who obtains them, who pays.
- Site access: who arranges, who escorts, who provides PTW.
- Insurance: limits required, cover provided, indemnity caps.
- Liability: cap (target ≤ 100% of contract value or AED 1m, whichever lower), exclusion of consequential loss.
- IP: ownership of raw data vs deliverables — {{organization.trade_name}} retains tooling and methodology IP.
- Confidentiality: term and survival.
- Payment: terms, currency, milestones, retention if any.
- Termination: notice, payment for work-in-progress.
- Governing law and dispute resolution — UAE: DIFC or onshore; KSA: KSA courts or DIFC-LCIA; Indonesia: BANI or Singapore.
- Subcontracting: client consent terms understood.
- Data protection: applicable laws (UAE PDPL, Saudi PDPL, Indonesia UU PDP 27/2022).

### **15.2 Change Control**

Any change to scope, timeline, deliverables or commercial terms after signature requires a written change order signed by both parties before work proceeds. Form: {{organization.doc_prefix}}-FRM-COM-CHG-01.

### **15.3 Records**

- Executed contract — countersigned, stored in /Contracts/[client]/[year]/.
- Contract review checklist — signed.
- Change orders — numbered sequentially per contract.

## **16. Project Delivery ****&**** Client Communication***   cl. 8.5*

### **16.1 Project Initiation**

On contract signature, {{roles.commercial_lead_title}} hands over to assigned PM via formal handover meeting within 5 working days. PM produces:

- Project Initiation Document ({{organization.doc_prefix}}-FRM-COM-PID-01): scope summary, key dates, team, deliverables, risks, communication plan.
- Project folder structure created per §11.2.
- Kick-off meeting with client within 10 working days of signature.

### **16.2 Communication Cadence**

|**Project size / duration**   |**Status report**       |**Steering meeting**|**Channel**                      |
|------------------------------|------------------------|--------------------|---------------------------------|
|≤ 2 weeks                     |End-of-project only     |Optional            |Email + final report             |
|2–8 weeks                     |Weekly written update   |Mid-project review  |Email + 30-min call              |
|> 8 weeks or > AED 500k       |Weekly + dashboard      |Bi-weekly           |Status report + scheduled meeting|
|Autonomous monitoring contract|Monthly performance pack|Quarterly review    |Dashboard + meeting              |

### **16.3 Status Reporting**

Standard weekly status report covers: progress vs plan, milestones achieved/upcoming, risks and issues, decisions needed from client, change requests, look-ahead. Issued every Friday by close of business unless agreed otherwise.

### **16.4 Issue Escalation**

|**Level**            |**Trigger**                                                  |**Escalation to**                                         |**Response time**|
|---------------------|-------------------------------------------------------------|----------------------------------------------------------|-----------------|
|L1 — Operational     |Day-to-day issue resolvable by PM                            |PM ↔ client counterpart                                   |Same day         |
|L2 — Project material|Schedule slip > 5 days, deliverable concern, scope dispute   |PM → {{roles.ops_manager_title}}; client manager          |Within 24 h      |
|L3 — Contractual     |Payment dispute, scope dispute > AED 100k, contractual breach|{{roles.ops_manager_title}} → MD; client senior management|Within 48 h      |
|L4 — Incident        |Safety incident, data breach, regulatory event               |Immediate to MD and client; per §29                       |Immediate        |

### **16.5 Project Closeout**

Closeout is a discipline, not a formality. Within 10 working days of final delivery:

- Client acceptance documented in writing — or deemed accepted after agreed acceptance window (typically 10–15 working days).
- Final invoice issued.
- Lessons-learned session held internally; entries to lessons register {{organization.doc_prefix}}-REG-OPS-LL-01.
- Subcontractor evaluations completed per §13.5.
- Client satisfaction survey issued (§17).
- Project folder archived to read-only; working folder cleared.
- Case study draft prepared (subject to client consent) for marketing.

## **17. Customer Satisfaction ****&**** Feedback***   cl. 9.1.2*

### **17.1 Channels**

- Post-project survey ({{organization.doc_prefix}}-FRM-COM-CSAT-01) — sent within 5 days of final delivery.
- Mid-engagement check-in calls — on engagements > 8 weeks.
- Account reviews — quarterly for clients > AED 250k annual spend.
- Inbound complaints — logged in complaints register {{organization.doc_prefix}}-REG-COM-CMP-01.

### **17.2 Survey Content**

Five dimensions, each 1–10 score plus free comment: technical quality of deliverable, on-time performance, communication, safety/professionalism on site, value for money. Plus overall NPS (0–10, ‘how likely to recommend’).

### **17.3 Complaints Handling**

|**Step**                             |**SLA**               |**Owner**                            |
|-------------------------------------|----------------------|-------------------------------------|
|Acknowledge receipt to client        |Within 1 working day  |{{roles.commercial_lead_title}}      |
|Investigate root cause               |Within 5 working days |PM + {{roles.ops_manager_title}}     |
|Respond with findings and action     |Within 10 working days|{{roles.commercial_lead_title}} or MD|
|Implement corrective action (per §37)|Per CAR timeline      |Process owner                        |
|Verify effectiveness with client     |30 days after closure |{{roles.commercial_lead_title}}      |

### **17.4 Analysis**

Quarterly trend analysis presented at management review: average scores by dimension, NPS trend, complaint themes, repeat-business rate, client churn reasons.

## **18. Consulting Engagements**

Consulting covers advisory work where {{organization.trade_name}}’s product is expertise rather than data: regulatory accreditation support (e.g. GACA training centre accreditation), operations design, drone programme strategy, training-needs analysis, technology selection.

### **18.1 Engagement Types**

|**Type**                                   |**Typical duration**|**Pricing model**        |
|-------------------------------------------|--------------------|-------------------------|
|Regulatory accreditation support           |8–16 weeks          |Fixed fee with milestones|
|Drone programme strategy                   |4–12 weeks          |Fixed fee or daily rate  |
|Training-needs analysis & curriculum design|2–8 weeks           |Fixed fee per deliverable|
|Technology selection / RFP support         |2–6 weeks           |Fixed fee or daily rate  |
|Embedded advisor / fractional              |3–12 months         |Monthly retainer         |

### **18.2 Engagement Principles**

- Independence: where {{organization.trade_name}} advises on technology or vendor selection, any potential conflict (e.g. preferred-vendor relationship) is disclosed in writing before engagement.
- Confidentiality: stronger than default — mutual NDA standard; document classification = Confidential by default for all consulting outputs.
- Deliverable focus: every engagement has named deliverables with acceptance criteria — not ‘advice as required’.
- Methodology transparency: {{organization.trade_name}} shares its framework and rationale; client retains the output, {{organization.trade_name}} retains the methodology.

### **18.3 Documentation Standards**

- All consulting deliverables follow {{organization.trade_name}} template (cover, executive summary, table of contents, methodology, findings, recommendations, appendices).
- Draft → review → final cycle, with named reviewer at minimum Service Lead level.
- Source references documented for every claim of fact or regulatory citation.
- Watermark/classification on every page.

# **Part 4 — Human Resources**

## **19. Recruitment, Onboarding ****&**** Offboarding***   cl. 7.1.2*

### **19.1 Recruitment Principles**

- Every role has a written job description in the role library ({{organization.doc_prefix}}-REG-HR-JD-01) defining purpose, accountabilities, must-have qualifications, nice-to-have, reporting line.
- Openings approved by MD against approved headcount plan. Off-plan hires require written MD approval with budget impact note.
- Selection panel: minimum two people including the line manager. Operational roles (pilot, analyst) require technical assessment in addition to interview.
- Reference checks on at least two professional references before offer. Right-to-work and qualification certificates verified before joining date.

### **19.2 Onboarding (first 30 days)**

|**Day**  |**Action**                                                                   |**Owner**        |
|---------|-----------------------------------------------------------------------------|-----------------|
|Pre-day-1|Workstation, accounts, email, equipment ready; welcome pack issued           |IT + HR          |
|Day 1    |Welcome, HR documentation, this manual issued, IT briefing, office tour      |HR               |
|Day 1    |Quality, HSE and security induction (mandatory)                              |QHSE             |
|Week 1   |Role-specific training plan agreed; pilot competency assessment if applicable|Line manager     |
|Week 2   |Shadowing on live project (where possible); first 1:1                        |Line manager     |
|Day 30   |Onboarding checklist closed; first feedback session                          |Line manager + HR|
|Day 90   |Probation review; confirm or extend                                          |Line manager + MD|

### **19.3 Onboarding Acknowledgements**

Every joiner signs:

- This manual acknowledgement.
- Code of conduct (§21).
- Confidentiality & IP assignment.
- Acceptable use of IT (§31).
- HSE policy (§27).

### **19.4 Probation**

Standard probation: 6 months in UAE (per Labour Law); 3 months elsewhere unless local law dictates otherwise. Probation review at month 3 (interim) and month 6 (decision). Outcomes: confirm, extend once with documented plan, or terminate per local law.

### **19.5 Offboarding**

- Resignation acknowledged in writing; notice period per contract and law.
- Knowledge handover plan agreed within first week of notice.
- Exit interview conducted by HR or MD in last week.
- Last-day checklist ({{organization.doc_prefix}}-FRM-HR-EXIT-01): equipment return, access revoked (all systems), credentials cleared, final settlement processed.
- Final payment, gratuity (UAE: per Labour Law tenure) and clearance issued within statutory timeline.
- Confidentiality and post-employment obligations confirmed in writing.

## **20. Competence, Training ****&**** Pilot Currency***   cl. 7.2*

### **20.1 Competency Framework**

Every operational role has a competency matrix listing required skills, the level needed (Aware / Practitioner / Expert / Trainer) and the evidence accepted (certification, assessment, supervised hours). Master register: {{organization.doc_prefix}}-REG-HR-COMP-01.

### **20.2 Mandatory Training (all employees)**

- Quality & this manual — at induction and on major revisions.
- HSE induction — at induction; refreshed annually.
- Cybersecurity / data handling — at induction; refreshed annually.
- Anti-bribery & code of conduct — at induction; refreshed every 2 years.
- First aid (named personnel per office) — refreshed every 2 years.

### **20.3 Pilot Currency Requirements**

|**Requirement**                |**Threshold**                                                                                                     |**Action if not met**                                                |
|-------------------------------|------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
|[[param:thresholds.recency_rule|default: ≥3 flights / 90 days / per airframe class]]                                                              |                                                                     |
|Recent flights                 |≥ {{thresholds.recency_min_flights}} flights in last {{thresholds.recency_window_days}} days on the airframe class|Refresher flight with {{roles.chief_pilot_title}} before next mission|
|Annual flight hours            |≥ {{thresholds.annual_hours}} hours commercial ops per year                                                       |Top-up via training flights or shadowing                             |
|Licence validity               |Current per jurisdiction                                                                                          |Suspended from RPIC duties until renewed                             |
|Medical / fitness (if required)|Current per regulator                                                                                             |Suspended                                                            |
|Manual revision familiarisation|≤ 30 days after a major revision                                                                                  |Cannot fly until acknowledged                                        |
|Type rating (if added platform)|OEM or {{organization.trade_name}} in-house assessment before solo RPIC                                           |Restricted to dual or supervised ops                                 |

### **20.4 Competency Assessment**

New pilots and on type-change: practical assessment by {{roles.chief_pilot_title}} covering pre-flight, normal ops, abnormal handling, emergency procedures, post-flight, paperwork. Aligned to AC 107-02 Appendix A where GACA-relevant. Recorded on {{organization.doc_prefix}}-FRM-HR-PASS-01. Two attempts maximum; second failure requires remedial plan signed by {{roles.ops_manager_title}}.

### **20.5 Training Plan**

Annual training needs analysis at Q4 management review. Outputs the annual training calendar ({{organization.doc_prefix}}-REG-HR-TRN-01) by individual, role, type (regulatory, technical, soft-skill), provider, cost, completion date. Training budget set as % of payroll at annual budget review.

### **20.6 Records**

- Training register per person — courses, dates, scores, certificates.
- Logbooks — pilots maintain personal logbook countersigned monthly by {{roles.chief_pilot_title}}.
- Certifications stored in HR file with renewal alerts (60 / 30 / 7 days).

## **21. Performance Management ****&**** Code of Conduct**

### **21.1 Performance Cycle**

|**Event**                |**Cadence**                |**Output**                                               |
|-------------------------|---------------------------|---------------------------------------------------------|
|1:1 check-in             |Bi-weekly (minimum monthly)|Notes in shared folder                                   |
|Goal setting             |Annual (Jan)               |Individual scorecard                                     |
|Mid-year review          |July                       |Progress review, mid-year adjustments                    |
|Year-end review          |December                   |Performance rating, development plan, comp recommendation|
|360 feedback (leadership)|Annual                     |Confidential summary to individual                       |

### **21.2 Rating Scale**

- Exceptional — consistently exceeds expectations on every dimension.
- Strong — exceeds on most dimensions.
- Solid — meets expectations.
- Developing — meets some, gaps in others; clear improvement plan needed.
- Underperforming — formal PIP triggered.

### **21.3 Performance Improvement Plan**

Triggered by ‘Underperforming’ rating, or any quarter of significantly missed targets. Duration 60–90 days. Documented expectations, support provided, review cadence, consequence of non-improvement. Signed by employee, line manager, MD. Exit follows local labour law if no improvement.

### **21.4 Code of Conduct (summary — full text in {{organization.doc_prefix}}-POL-HR-COC-01)**

- Safety first: no employee, contractor or visitor takes a flight or task they believe to be unsafe. ‘STOP’ is always free.
- Integrity: no bribery, no kickbacks, no facilitation payments. Gifts and hospitality declared and recorded above AED 500.
- Conflicts of interest: declared in writing on joining and as they arise. Personal drone work for clients of {{organization.trade_name}} is prohibited without written MD consent.
- Confidentiality: client data and {{organization.trade_name}} IP protected during and after employment.
- Respect: zero tolerance for harassment, discrimination, bullying. Anonymous reporting channel via QHSE Officer.
- Compliance: full compliance with applicable aviation, data protection, labour, and tax laws in every jurisdiction {{organization.trade_name}} operates.
- Social media: employees do not post images, client identifiers, or operational details without PM sign-off.
- Substance: zero alcohol / impairing substances during flight ops; bottle-to-throttle 12 hours minimum.

### **21.5 Disciplinary**

Progressive: verbal warning → written warning → final written → termination. Gross misconduct (e.g. safety violation, theft, fraud, harassment) may justify summary termination per local law. All disciplinary actions documented and reviewed by HR before issue.

## **22. Compensation, Leave ****&**** Labour Law Compliance**

### **22.1 Compensation Principles**

- Pay set against published market data for the role and location; reviewed annually.
- Total comp structure: base salary + housing/transport allowance (UAE practice) + performance bonus + benefits.
- Pay confidentiality respected; pay bands documented internally.
- Equity and long-term incentive eligibility per individual offer (MD approval).

### **22.2 Allowances (UAE default model)**

- Housing allowance: per band (typical 25–35% of base).
- Transport allowance: per band (typical 8–12% of base).
- Field allowance: paid per day on site away from base location > 50 km.
- Mobile/data: company line or fixed allowance.

### **22.3 Leave**

|**Type**               |**UAE entitlement**                          |**KSA entitlement** |**Indonesia entitlement**|
|-----------------------|---------------------------------------------|--------------------|-------------------------|
|Annual leave           |30 calendar days (after 1 year)              |21 days (5+ yrs: 30)|12 working days          |
|Public holidays        |Per UAE government calendar                  |Per KSA calendar    |Per government calendar  |
|Sick leave             |Per Labour Law (90 days tiered)              |Per Labour Law      |Per Labour Law           |
|Maternity leave        |Per Labour Law                               |Per Labour Law      |3 months                 |
|Paternity leave        |5 working days                               |Per Labour Law      |Per Labour Law           |
|Bereavement            |3–5 days (relation-dependent)                |Per Labour Law      |Per Labour Law           |
|Hajj (Muslim employees)|30 days unpaid, once per tenure (per UAE Law)|Per Labour Law      |Per Labour Law           |

### **22.4 Working Hours**

- Standard: 40 hours/week core; Friday–Saturday weekend (UAE government cadence) unless project requires Saturday/Sunday.
- Pilot duty: maximum flight duty time per regulator (typical 12-hour duty; 8-hour flight). Rest periods minimum 10 hours between duties, 36 hours weekly.
- Ramadan: working hours reduced per local law for Muslim employees; non-Muslims may be impacted operationally.

### **22.5 End of Service ****&**** Gratuity**

- UAE: per Labour Law — 21 days basic per year for first 5 years, 30 days per year thereafter, on unlimited contract; reduced on resignation under certain conditions. Note: from 1 Jan 2023, all new private-sector contracts are limited-term.
- KSA: per Labour Law — half-month per year for first 5 years, full month thereafter.
- Indonesia: severance and long-service award per Manpower Law (UU Cipta Kerja amendments).
- WPS (Wage Protection System) compliance for UAE payroll.

### **22.6 Insurance ****&**** Statutory Benefits**

- Health insurance: per local mandate (UAE DHA / Abu Dhabi DoH; KSA CCHI; Indonesia BPJS Kesehatan).
- Workmen’s compensation / employer liability per local law.
- Indonesia: BPJS Ketenagakerjaan (employment social security).
- Personal accident cover for pilots — uplifted limits.

# **Part 5 — Finance ****&**** Administration**

## **23. Financial Controls ****&**** Approval Authority**

### **23.1 Approval Matrix — Expenditure**

[[param:thresholds.financial_approval_matrix | band edges below are onboarding-configurable; defaults shown]]

|**Amount (AED equivalent)**                               |**Approver(s)**                                    |**Notes**                             |
|----------------------------------------------------------|---------------------------------------------------|--------------------------------------|
|≤ {{thresholds.fin_b1_max}}                               |Function Lead                                      |Single signature, recorded            |
|{{thresholds.fin_b1_max_plus}} – {{thresholds.fin_b2_max}}|Function Lead + {{roles.finance_lead_title}}       |Two signatures                        |
|{{thresholds.fin_b2_max_plus}} – {{thresholds.fin_b3_max}}|{{roles.ops_manager_title}} or Commercial + Finance|Plus 3 quotes for non-listed suppliers|
|{{thresholds.fin_b3_max_plus}} – {{thresholds.fin_b4_max}}|MD + Finance                                       |Plus written justification, 3 quotes  |
|> {{thresholds.fin_b4_max}} (single item)                 |MD + Board where applicable                        |Capex approval per annual plan        |
|Recurring contracts > 12 months                           |MD                                                 |Recorded in commitments register      |

### **23.2 Segregation of Duties**

- Vendor creation, payment release, and bank reconciliation are performed by different people. Where headcount limits this, MD provides compensating control (monthly review of payment register).
- Payroll prepared by Finance, approved by MD, executed by Finance.
- Invoice raising and collections may be by the same person; bad-debt write-off requires MD approval.

### **23.3 Procurement**

- Purchase Requisition ({{organization.doc_prefix}}-FRM-FIN-PR-01) for all spend > AED 5,000 — captures purpose, supplier, budget code, urgency.
- Purchase Order ({{organization.doc_prefix}}-FRM-FIN-PO-01) issued for all approved procurement; suppliers requested to quote PO number on invoice.
- Three-way match (PO ↔ Goods Receipt ↔ Invoice) before payment.
- Three-quote requirement for items > AED 25,000 unless sole-source justified.

### **23.4 Expenses**

- Out-of-pocket and corporate-card spend submitted within 30 days of incurring on {{organization.doc_prefix}}-FRM-FIN-EXP-01 with receipts.
- Per diem rates by country in {{organization.doc_prefix}}-REG-FIN-PERDIEM-01; receipts required for over-per-diem claims.
- Travel: economy class as default for flights < 6 hours; premium economy or business permitted by MD approval for longer or back-to-back work travel.
- Hotels: company-rate hotels where available; reasonable cost otherwise.

### **23.5 Bank ****&**** Cash**

- Bank signatories per board resolution; dual approval for payments > AED 25,000.
- Petty cash float: AED 5,000 per office, reconciled weekly, replenished against receipts.
- Bank reconciliation monthly within 5 working days of statement; signed off by MD.

### **23.6 Budgeting ****&**** Forecasting**

- Annual budget approved by MD/Board before start of financial year — revenue plan, opex plan, capex plan, cash plan.
- Monthly management accounts within 10 working days of month-end: P&L, cash, AR/AP ageing, pipeline.
- Quarterly reforecast for the remainder of the year if YTD variance > 10%.
- Rolling 13-week cashflow forecast updated weekly when DSO > 75 or cash runway < 6 months.

### **23.7 Audit ****&**** Statutory Compliance**

- External audit annual (per UAE Commercial Companies Law and freezone requirement).
- UAE Corporate Tax registration and filings per FTA timeline.
- VAT registration and filings (where threshold met) per FTA.
- Economic Substance Regulations (ESR) assessment annual.
- Ultimate Beneficial Owner (UBO) register maintained and filed.
- Indonesia: PT PMA annual reports — Investment Activity Report (LKPM) quarterly; tax filings per DGT.

## **24. Supplier Evaluation ****&**** Approved Vendor List***   cl. 8.4*

### **24.1 Categorisation**

|**Category**        |**Definition**                                                                |**Evaluation depth**                               |
|--------------------|------------------------------------------------------------------------------|---------------------------------------------------|
|Strategic / critical|Drone OEMs, primary sensor suppliers, key software (e.g. processing platforms)|Full pre-qualification + annual review             |
|Important           |Equipment hire, specialist subcontractors, professional services              |Pre-qualification + bi-annual review               |
|Standard            |Office supplies, general logistics, hospitality                               |Light qualification, no annual review unless issues|

### **24.2 Pre-Qualification (Strategic / Important)**

- Trade licence and legal standing.
- Financial soundness (audited accounts where available).
- Technical capability and references.
- Quality certifications (ISO 9001 / 14001 / 45001 where applicable).
- HSE policy and incident record.
- Insurance cover (limits appropriate to scope).
- Code of conduct / anti-bribery alignment.
- Data protection posture (if handling {{organization.trade_name}} / client data).

### **24.3 Approved Vendor List**

{{organization.doc_prefix}}-REG-FIN-AVL-01 — live register with: vendor, category, products/services, status (Approved / Conditional / Suspended / Removed), last review date, performance score (1–5).

### **24.4 Performance Monitoring**

- Strategic suppliers: scorecard reviewed quarterly — quality, on-time, cost, responsiveness, HSE.
- Important: scorecard reviewed bi-annually.
- Repeated underperformance triggers improvement plan; persistent issues result in suspension.

### **24.5 Conflict of Interest**

- {{organization.trade_name}} staff with any personal interest in a supplier (relative, equity, ongoing benefit) must declare it in writing.
- Single-source decisions documented with rationale.

## **25. Invoicing, Collections ****&**** Cash Management**

### **25.1 Standard Payment Terms**

|**Client type**             |**Default terms**                               |**Approval to vary**           |
|----------------------------|------------------------------------------------|-------------------------------|
|New SME / first project     |50% advance, 40% on milestone, 10% on acceptance|Finance + MD                   |
|Established mid-market      |30% advance, balance net 30 from acceptance     |{{roles.commercial_lead_title}}|
|Enterprise / blue-chip      |Milestone billing, net 30–45                    |{{roles.commercial_lead_title}}|
|Government / semi-government|Per tender; typically 30–60 days from acceptance|MD                             |
|EPC partner — recurring     |Net 45–60 against PO/work order                 |{{roles.commercial_lead_title}}|

### **25.2 Invoice Issuance**

- Invoice raised within 2 working days of milestone achievement or month-end (for retainer services).
- UAE: VAT-compliant tax invoice — TRN, line items, VAT %, total.
- KSA: ZATCA e-invoicing format (Fatoorah Phase 2).
- Indonesia: e-Faktur per DGT requirements where PT PMA is VAT-registered.

### **25.3 Collections**

|**Stage**        |**Trigger (days past due)**|**Action**                                       |
|-----------------|---------------------------|-------------------------------------------------|
|Friendly reminder|+3                         |Email from Finance                               |
|Phone follow-up  |+10                        |Finance to client AP contact                     |
|Escalation 1     |+20                        |{{roles.commercial_lead_title}} to client manager|
|Escalation 2     |+45                        |MD to client senior management                   |
|Final notice     |+60                        |Formal letter; new work suspended                |
|Legal action     |+90                        |MD decision; counsel engaged                     |

### **25.4 Bad Debt Provision**

- AR > 90 days reviewed monthly; provision applied per ageing profile.
- Write-off > AED 25,000 requires MD approval; > AED 100,000 requires board approval.

### **25.5 Cash Management**

- Minimum cash buffer: 3 months operating cost; topped from credit line if it falls below.
- Surplus cash > 6 months runway placed in conservative deposits per MD direction.
- FX exposure managed by quoting in local currency where possible; large foreign-currency holdings reviewed monthly.

## **26. Insurance **

> **DronOps platform note —** the insurance and legal register is the DronOps EXT-document category plus credentials and aircraft registrations — each with expiry tracking and renewal alerts. The register described here is maintained as live platform records, not a separate spreadsheet.**&**** Legal Register**

### **26.1 Insurance Programme**

|**Cover**                                      |**Minimum limit (AED)**                    |**Owner**   |
|-----------------------------------------------|-------------------------------------------|------------|
|Aviation third-party liability (per occurrence)|10,000,000 (uplift per project as required)|Finance     |
|Hull (per airframe)                            |Replacement value                          |Finance     |
|Professional indemnity / E&O                   |5,000,000 per claim and aggregate          |Finance     |
|Public / general liability                     |5,000,000                                  |Finance     |
|Workmen’s compensation / employer liability    |Per law                                    |HR / Finance|
|Cyber liability                                |5,000,000 (review annually)                |Finance + IT|
|Personal accident — pilots & field staff       |Uplifted per role                          |HR          |
|Cargo / transit (equipment in transit)         |Per shipment value                         |Finance     |

### **26.2 Insurance Process**

- Renewal cycle managed 60 / 30 / 7 days ahead — Finance is owner.
- Project-specific uplifts checked at contract review (§15).
- Claims protocol: notify broker within 24 hours of incident; preserve evidence per §29.
- Certificates of insurance issued to clients on request; in-force certificates filed in /Legal/Insurance/.

### **26.3 Legal ****&**** Regulatory Register**

{{organization.doc_prefix}}-REG-GEN-LEG-01 — live register of: trade licences, freezone permits, operator certificates, pilot licences, individual qualifications, environmental permits, data-protection registrations, tax registrations, IP rights. Each entry has issue date, expiry, renewal-trigger date, owner.

### **26.4 Contracts ****&**** Counsel**

- Standard contract templates (services agreement, NDA, subcontractor agreement, IP assignment) maintained in /Legal/Templates/ — reviewed annually with counsel.
- Material deviations from templates referred to counsel.
- Retained counsel for UAE, KSA and Indonesia. Counsel contact list in /Legal/Counsel/.
- Litigation log maintained — any claim notified to MD within 24 hours.

# **Part 6 — Quality, Health, Safety ****&**** Environment**

## **27. QHSE Policy ****&**** Hazard Framework**

### **27.1 QHSE Policy**

|**QHSE Policy Statement** {{organization.trade_name}} is committed to: (1) the safety of every employee, contractor, client representative and member of the public who may be affected by our operations; (2) compliance with all applicable aviation, occupational health and environmental laws in every jurisdiction we operate; (3) prevention of injury, ill health, environmental harm and damage to assets; (4) the right and duty of every person to stop any task they believe to be unsafe, without fear of penalty; (5) continual improvement of the QHSE management system through hazard identification, risk assessment, audit and learning from incidents. This policy is reviewed at each management review and signed by the {{roles.accountable_manager_title}}.|
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

### **27.2 Hazard Identification ****&**** Risk Assessment**

Hazard identification is continuous and structured. Three levels:

- Strategic hazards — captured in §5 risk register.
- Operational hazards — Hazard Identification & Risk Assessment (HIRA) per service line ({{organization.doc_prefix}}-REG-QHSE-HIRA-01). Updated at least annually.
- Job-specific hazards — Job Safety Analysis (JSA) per site/mission ({{organization.doc_prefix}}-FRM-QHSE-JSA-01). Mandatory before every site mobilisation.

### **27.3 Risk Scoring (QHSE)**

|**Likelihood (L)**|**Impact (I)**                        |**Risk = L × I**|**Action**                                                    |
|------------------|--------------------------------------|----------------|--------------------------------------------------------------|
|1 — Rare          |1 — Minor first-aid                   |1–4 Low         |Monitor; standard controls                                    |
|2 — Unlikely      |2 — Lost time < 1 day                 |5–9 Medium      |Reduce where reasonably practicable                           |
|3 — Possible      |3 — Lost time > 3 days                |10–14 High      |Active treatment plan with owner & date                       |
|4 — Likely        |4 — Major injury / damage > AED 100k  |15–20 Very high |Senior approval to proceed; controls verified                 |
|5 — Almost certain|5 — Fatality / major damage > AED 500k|21–25 Extreme   |Stop. Do not proceed without MD approval and control re-design|

### **27.4 Hierarchy of Controls**

Apply in order: (1) Eliminate the hazard; (2) Substitute with a lower-risk option; (3) Engineering controls; (4) Administrative controls (procedures, training, signage); (5) PPE. PPE is the last line, never the first.

### **27.5 Permit-to-Work**

{{organization.trade_name}} works on client sites that frequently operate under PTW systems. Crew must:

- Confirm PTW process at planning stage.
- Hold valid PTW for the day of operations before any flight.
- Comply with all conditions on the permit (timing, area, isolations).
- Close out PTW at end of shift.

## **28. Site Safety — Drone Operations**

### **28.1 Mandatory Site Documents**

- Site Risk Assessment ({{organization.doc_prefix}}-FRM-OPS-02) — completed remote and updated on arrival.
- Job Safety Analysis ({{organization.doc_prefix}}-FRM-QHSE-JSA-01) — task-level.
- Emergency Response Plan — site-specific: muster point, nearest hospital, emergency numbers, communication channel.
- Crew Briefing record ({{organization.doc_prefix}}-FRM-OPS-03).
- Public / third-party management plan if operating near public areas.

### **28.2 Site-Specific Hazards**

|**Site type**              |**Primary hazards**                                                  |**Key controls**                                                                         |
|---------------------------|---------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
|Solar PV farm              |Electrical (DC), heat stress, snake/scorpion, remote location, glare |Site induction, electrical isolation awareness, hydration, cooling breaks, PPE incl. UV  |
|Urban / built environment  |GNSS multipath, public proximity, RF interference, vertical obstacles|Reduced ops area, observers, lower altitudes, plan B routes                              |
|Industrial plant / refinery|Explosive atmospheres, hot work permits, complex airspace at site    |Intrinsically safe equipment where required, full PTW compliance, escort                 |
|Construction site          |Cranes, moving vehicles, dust, falling objects                       |Coordinate with site superintendent, no-fly during lifting ops, dust covers              |
|Marine / offshore          |Salt spray, GNSS over water, helicopter ops, vessel motion           |Saltwater rinse, return-to-vessel procedure, deconflict with helicopter, sea state limits|
|Desert / remote            |Heat, dust storm, no comms, wildlife, medevac time                   |Sat-phone, vehicle pair, water reserves, daily check-in, route plan filed                |
|Power transmission         |EMI/EMF, high-voltage proximity, restricted airspace                 |Approach distances per voltage class, observer-based separation, utility coordination    |

### **28.3 Heat Stress (GCC critical)**

UAE/KSA Midday Break: outdoor work between 12:30 and 15:00 prohibited from 15 June to 15 September unless exempt. {{organization.trade_name}} respects the rule including for drone ops.

- Hydration: 1 litre per hour minimum on hot sites; cool water and electrolytes available.
- Shade: rest cover within 100 m of operating area.
- Watch for: confusion, cramping, nausea, hot dry skin — STOP and cool the affected person.
- Time-weighted operations: longer pre-dawn / late-afternoon windows in summer.

### **28.4 PPE Standard Kit**

- Safety footwear (S3 minimum) — all field operations.
- Hi-vis vest — all field operations.
- Hard hat — construction, industrial, overhead work.
- Safety glasses — outdoor flight ops, eye protection.
- Gloves — equipment handling, battery work.
- UV protection — long sleeves, hat, sunscreen for outdoor work in summer.
- Hearing protection — high-noise sites.
- Site-specific PPE per JSA (e.g. FRC, fall arrest).

### **28.5 Public Safety**

- No flight over uninvolved persons unless operator-approval and airframe certification expressly permit.
- Distance from uninvolved persons: minimum 30 m unless reduced by operator approval and risk assessment.
- Cordon and signage where ground operations could affect the public.
- Observers (visual / spotters) where field of view is limited.

## **29. Incident Reporting ****&**** Investigation***   cl. 10.2*

### **29.1 Definitions**

- Accident — event resulting in injury, death, or material damage.
- Incident — event with potential for harm; no actual harm occurred (‘near miss’).
- Occurrence — anything not normal: technical malfunction, procedure breach, unexpected behaviour, third-party complaint.
- Aviation occurrence (per regulator) — reportable per host regulator’s definition; in case of doubt, report.

### **29.2 Immediate Response**

|**Step**|**Action**                                                                |**Timeframe**               |
|--------|--------------------------------------------------------------------------|----------------------------|
|1       |Make the area safe; render first aid; preserve life                       |Immediate                   |
|2       |Stop all related operations; do not resume without sign-off               |Immediate                   |
|3       |Call emergency services if injury, fire, third party affected             |Immediate                   |
|4       |Notify {{organization.trade_name}} MD/{{roles.ops_manager_title}} by phone|Within 30 minutes           |
|5       |Preserve evidence — photos, equipment state, witness contact              |Immediate                   |
|6       |Notify regulator if reportable per local rules                            |Per regulator (often 24–72h)|
|7       |Notify insurer/broker                                                     |Within 24 hours             |
|8       |Inform client formally (written) per contract                             |Within 24 hours             |

### **29.3 Reporting**

- Initial report ({{organization.doc_prefix}}-FRM-QHSE-INC-01) raised within 24 hours by RPIC or witness.
- Investigation appointed by MD — for major incidents an independent investigator; for lesser, QHSE Officer.
- Investigation timeline: report within 14 days; complex cases up to 30 days with MD approval.

### **29.4 Investigation Method**

{{organization.trade_name}} uses a structured method (e.g. ICAM or 5-Whys + Bow-Tie for complex cases). Outputs:

- Sequence of events with timestamps.
- Immediate causes (acts and conditions at the point of failure).
- Underlying causes (procedural, training, supervision, equipment, design).
- Root causes (systemic — management, culture, resourcing).
- Recommendations with named owners and deadlines.
- Lessons learned — entered into {{organization.doc_prefix}}-REG-OPS-LL-01.

### **29.5 Just Culture**

{{organization.trade_name}} operates a Just Culture: honest reporting is rewarded; cover-up is the violation. Errors and lapses are investigated for system improvement, not blame. Knowingly reckless or intentional violations may be subject to disciplinary action.

### **29.6 Closure**

- MD signs off investigation report and CARs.
- CAR effectiveness verified after 30/90/180 days as appropriate.
- Incident metrics presented at management review.

## **30. Environmental Management**

### **30.1 Environmental Principles**

- Comply with UAE / KSA / Indonesia environmental laws and any client site environmental conditions.
- Minimise waste, prioritise reuse and responsible disposal.
- Manage Li-Po batteries and electronic waste through licensed channels.
- Avoid unnecessary disturbance to wildlife, especially in protected areas — {{organization.trade_name}} holds and respects no-fly buffers around designated wildlife sites.

### **30.2 Battery ****&**** E-Waste**

- Battery retirement per §12.4 thresholds.
- Retired batteries discharged to safe SOC and routed to licensed e-waste handler. Disposal records kept ({{organization.doc_prefix}}-REC-QHSE-EWS-01).
- Damaged/swollen batteries quarantined in fireproof container; transported only with appropriate dangerous-goods controls.

### **30.3 Site Conduct**

- No littering, spills, or disturbance of vegetation/wildlife.
- Vehicle access on designated tracks; no off-track driving in protected areas.
- Fuel spills (vehicles or generators) cleaned per client environmental plan and reported.

### **30.4 Travel ****&**** Office**

- Combine site visits where practical to reduce travel emissions.
- Office: reduce paper, monitor energy use, recycle where infrastructure permits.
- Cloud services preferred over local server proliferation.

### **30.5 Reporting**

- Environmental performance reported at management review: e-waste volumes, fuel use, energy use, any complaints/incidents.
- Client-mandated environmental reporting per contract.

# **Part 7 — IT ****&**** Data**

## **31. IT Acceptable Use ****&**** Access Control**

### **31.1 Acceptable Use**

{{organization.trade_name}} IT systems and accounts are provided for business use. Limited personal use is permitted where it does not interfere with work, consume material resources, or violate this policy. Prohibited uses include:

- Storing or transmitting illegal content.
- Operating personal business or commercial activity using {{organization.trade_name}} accounts.
- Installing unlicensed or unapproved software.
- Disabling security controls (antivirus, MDM, VPN, screen lock).
- Sharing accounts, passwords, MFA tokens with anyone — including colleagues.
- Connecting unapproved external devices to corporate equipment.
- Transmitting client data through personal channels (WhatsApp, personal email, personal cloud).

### **31.2 Identity ****&**** Access Management**

- Identity provider: single sign-on (SSO) for all corporate apps where supported.
- Multi-factor authentication mandatory on all corporate accounts and remote access. SMS not accepted as second factor where authenticator app or hardware key is available.
- Password requirements: ≥ 14 characters, unique per account, password manager required and provided.
- Least privilege — access granted only to systems and folders needed for the role; reviewed quarterly.
- Privileged access (admin) limited to named IT custodians; activity logged.
- Joiner/Mover/Leaver process: access provisioned on day 1; modified within 1 day of role change; revoked on the last working day.

### **31.3 Devices**

- All laptops corporate-provisioned with full-disk encryption, antivirus, MDM, automatic patching.
- Mobile phones used for corporate email or apps enrolled in MDM with selective wipe capability.
- Bring-your-own-device permitted only with MDM enrolment and acceptance of remote-wipe terms.
- Lost/stolen devices reported to IT immediately for remote wipe and credential rotation.
- End-of-life: corporate devices wiped to NIST 800-88 standard before disposal or reassignment.

### **31.4 Email ****&**** Messaging**

- Corporate email is the system of record for external client communication.
- Instant messaging (e.g. Slack/Teams) for internal coordination; not for decisions of record.
- WhatsApp / SMS for time-critical contact only; substantive content must be confirmed by email.
- External email warnings displayed; phishing reporting button visible to all staff.

## **32. Data Classification, Storage ****&**** Retention**

### **32.1 Data Classification**

|**Class**   |**Definition**                                                                                                        |**Handling**                                                             |
|------------|----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
|Public      |Material approved for public release (marketing, published reports)                                                   |No restriction                                                           |
|Internal    |Day-to-day business material not approved for public release                                                          |{{organization.trade_name}} staff only; no public sharing                |
|Confidential|Client data, project deliverables, financials, contracts, employee records                                            |Need-to-know; encrypted at rest and in transit; access logged            |
|Restricted  |Source code with security implications, security configurations, critical infrastructure imagery, personal/health data|Named-access list; encrypted; access logged; export only with MD approval|

### **32.2 Default Classifications**

- Client raw acquisition data: Confidential by default; Restricted if subject matter is sensitive (critical infrastructure, defence, individuals identifiable).
- Client deliverables: Confidential — client may redesignate.
- {{organization.trade_name}} financials, contracts, salaries: Confidential.
- {{organization.trade_name}} methodology, model weights, source code: Confidential or Restricted depending on commercial sensitivity.
- Employee personal data: Confidential or Restricted (health, biometric).

### **32.3 Storage**

- Primary storage: managed cloud (vendor with regional data residency where required).
- Project working files: shared drive with access by project membership.
- Local laptop storage: avoid for client data; if used, encrypted and synced to cloud daily.
- External media: only {{organization.trade_name}}-issued, encrypted drives; tracked and registered.
- Personal cloud accounts (Google Drive, Dropbox, iCloud) prohibited for any classified {{organization.trade_name}} or client data.

### **32.4 Data Residency**

- UAE clients: data residency in UAE where contractually required or sensitive (critical infrastructure, government).
- KSA clients: data residency in KSA per Personal Data Protection Law (PDPL) requirements; data export agreements where applicable.
- Indonesia: data residency per UU PDP 27/2022 where required, particularly for personal data and government engagements.

### **32.5 Retention**

Aligned to §6.4. Specifics for digital data:

- Raw acquisitions: 1 year online + 6 years offline archive (encrypted).
- Deliverables: 1 year online + 6 years offline.
- Project working files: deleted 90 days after project close, after archive.
- Email retention per legal hold policy; default 7 years.
- Personal data subject to deletion requests per applicable PDPL within statutory timeline.

### **32.6 Data Transfer**

- Client deliverable transfer via secure portal (SFTP / managed file transfer / signed download link) — never bare email attachments for Confidential+.
- Encryption in transit (TLS 1.2+) and at rest (AES-256) for Confidential and Restricted data.
- Chain-of-custody form ({{organization.doc_prefix}}-FRM-IT-COC-01) for physical media handover.
- Cross-border transfer assessed against applicable laws before sending.

## **33. Cybersecurity ****&**** Incident Response**

### **33.1 Baseline Controls**

- Endpoint protection (EDR) on all laptops and servers.
- Patching: critical patches within 14 days, high within 30, others within 90.
- Firewall and DNS filtering at office network; corporate VPN for remote access to internal resources.
- Email security: SPF, DKIM, DMARC; anti-phishing and anti-malware filtering.
- Backup: 3-2-1 — three copies, two media types, one off-site/cloud. Tested restore quarterly.
- Logging: authentication, admin actions, file access on Restricted data retained ≥ 12 months.
- Annual third-party security review (vulnerability scan / penetration test).

### **33.2 Phishing ****&**** Social Engineering**

- Awareness training at induction and refreshed annually; simulated phishing exercises quarterly.
- Verified callback for any out-of-band payment instruction (always call the known number, never the number in the message).
- Suspicious messages forwarded to IT for analysis; not opened in detail by the recipient.

### **33.3 Incident Response Plan**

|**Phase**|**Actions**                                                                                      |**Owner**                           |
|---------|-------------------------------------------------------------------------------------------------|------------------------------------|
|Detect   |Identify abnormal activity; user reports, EDR alerts, log review                                 |Any user / IT                       |
|Triage   |Classify severity (1–4) within 1 hour                                                            |IT Custodian                        |
|Contain  |Isolate affected systems; revoke compromised credentials                                         |IT Custodian                        |
|Eradicate|Remove malicious artefacts; patch root vulnerability                                             |IT Custodian + external IR if needed|
|Recover  |Restore from backups; verify integrity; resume operations                                        |IT Custodian                        |
|Notify   |Per legal/contractual obligation (UAE PDPL 72h, KSA PDPL, Indonesia UU PDP, clients per contract)|MD + Legal                          |
|Learn    |Post-incident review; CAR per §37; update controls                                               |QHSE + IT                           |

### **33.4 Notification Triggers**

- Confirmed unauthorised access to Confidential or Restricted data.
- Loss of unencrypted device containing Confidential+ data.
- Ransomware / destructive malware on {{organization.trade_name}} systems.
- Client / regulator data exposed externally.
- Personal data breach as defined under applicable PDPL.

## **34. Business Continuity ****&**** Disaster Recovery**

### **34.1 Scope**

BC/DR addresses scenarios that disrupt the ability to deliver services or protect {{organization.trade_name}} data: prolonged office unavailability, key-person absence, supplier failure, cyber incident, country-level disruption (geopolitical, natural).

### **34.2 Recovery Objectives**

|**Asset / process**                         |**RTO**       |**RPO**  |
|--------------------------------------------|--------------|---------|
|Email & collaboration                       |4 hours       |Last sync|
|Project working files                       |24 hours      |24 hours |
|Active project deliverable workflow         |48 hours      |24 hours |
|Financial records & invoicing               |48 hours      |24 hours |
|Flight operations (regulatory records, logs)|72 hours      |24 hours |
|Marketing / web assets                      |5 working days|1 week   |

### **34.3 Continuity Scenarios**

- Office unavailable — remote work default; pre-authorised laptops and VPN for all staff.
- Cyber incident — invoke §33; alternate clean infrastructure (cloud) standby.
- Key-person absence — documented SOPs (this manual) + cross-training register identifies primary and backup for every critical role.
- Country-level disruption (geopolitical, evacuation) — KBRI / embassy registration, evacuation cover for staff, work transfer to unaffected office.
- Supplier failure — secondary supplier qualified for strategic categories (§24).

### **34.4 Testing**

- Backup restore test: quarterly.
- Tabletop BC exercise: annual.
- DR drill (full failover): annual or biennial depending on scope.
- Findings logged and treated as CARs.

# **Part 8 — Performance ****&**** Improvement**

## **35. KPI Dashboard ****&**** Management Review***   cl. 9.1, 9.3*

### **35.1 KPI Dashboard**

{{organization.trade_name}} maintains a single performance dashboard ({{organization.doc_prefix}}-REG-GEN-KPI-01) updated monthly. KPIs are aligned to the strategic objectives (§2.4) and broken down by function:

|**Function**|**KPI**                                 |**Cadence**|**Owner**                      |
|------------|----------------------------------------|-----------|-------------------------------|
|Operations  |Reportable flight incidents             |Monthly    |{{roles.ops_manager_title}}    |
|Operations  |On-time deliverable rate (%)            |Monthly    |{{roles.project_manager_title}}|
|Operations  |First-pass acceptance (%)               |Monthly    |Data Lead                      |
|Operations  |Pilot currency compliance (%)           |Monthly    |Training Lead                  |
|Operations  |Equipment availability (%)              |Monthly    |Equipment Custodian            |
|Quality     |Open NCRs (count, ageing)               |Monthly    |QHSE                           |
|Quality     |CAR closure rate (%)                    |Monthly    |QHSE                           |
|Quality     |Internal audit findings — closed on time|Quarterly  |QHSE                           |
|HSE         |Lost-time incidents (LTI)               |Monthly    |QHSE                           |
|HSE         |Near-miss reports submitted             |Monthly    |QHSE                           |
|HSE         |HSE training compliance (%)             |Monthly    |Training Lead                  |
|Commercial  |Pipeline value (qualified)              |Monthly    |{{roles.commercial_lead_title}}|
|Commercial  |Tender win rate (%)                     |Quarterly  |{{roles.commercial_lead_title}}|
|Commercial  |Customer satisfaction (avg / NPS)       |Quarterly  |{{roles.commercial_lead_title}}|
|Commercial  |Repeat client revenue (%)               |Quarterly  |{{roles.commercial_lead_title}}|
|Finance     |Revenue vs budget (%)                   |Monthly    |{{roles.finance_lead_title}}   |
|Finance     |Gross margin (%)                        |Monthly    |{{roles.finance_lead_title}}   |
|Finance     |DSO (days)                              |Monthly    |{{roles.finance_lead_title}}   |
|Finance     |Cash runway (months)                    |Monthly    |{{roles.finance_lead_title}}   |
|HR          |Headcount vs plan                       |Monthly    |HR                             |
|HR          |Voluntary turnover (%)                  |Quarterly  |HR                             |
|HR          |Training plan completion (%)            |Quarterly  |Training Lead                  |

### **35.2 Management Review**

Held twice per year (minimum); additional reviews triggered by major incident, major regulatory change, or significant performance variance. Chaired by MD; attended by all function leads and QHSE Officer.

### **35.3 Standard Agenda (per ISO 9001 cl. 9.3.2)**

- Status of actions from previous management review.
- Changes in external and internal issues relevant to the management system.
- Customer satisfaction and feedback from interested parties.
- Extent to which quality objectives have been met.
- Process performance and product/service conformity (KPI dashboard).
- Nonconformities and corrective actions — open NCRs and CARs.
- Audit results (internal and external).
- Performance of external providers (subcontractors, suppliers).
- Adequacy of resources (people, equipment, infrastructure, cash).
- Effectiveness of actions taken to address risks and opportunities.
- Opportunities for improvement.
- Decisions and actions — new objectives, resource needs, system changes.

### **35.4 Outputs**

- Minutes ({{organization.doc_prefix}}-REC-GEN-MR-[YYYY-NN]) issued within 5 working days.
- Action items with owners and due dates; tracked in dashboard.
- Updated objectives / targets where revised.
- Resource decisions (hiring, capex, training budget).

## **36. Internal Audit Programme***   cl. 9.2*

### **36.1 Programme**

All sections of this manual are audited at least once every 24 months. High-risk and high-change areas (flight operations, PV inspection methodology, finance) audited annually.

### **36.2 Annual Audit Plan**

Issued by QHSE Officer at the start of each year ({{organization.doc_prefix}}-REG-QHSE-AUD-01). Plan shows: section to be audited, audit window, lead auditor, evidence required, prior-year findings to verify.

### **36.3 Auditor Competence ****&**** Independence**

- Auditors trained in ISO 19011 (lead auditor or internal auditor course).
- Auditors do not audit their own work — alternate assignments or external auditor used for small-team areas.
- External auditor (independent) used for at least one audit per cycle and where independence cannot be assured internally.

### **36.4 Audit Lifecycle**

|**Stage**|**Activity**                                                  |**Output**                                                |
|---------|--------------------------------------------------------------|----------------------------------------------------------|
|Plan     |Scope, criteria, sample, schedule confirmed with auditee      |Audit plan ({{organization.doc_prefix}}-FRM-QHSE-AP-01)   |
|Open     |Opening meeting — confirm scope and ground rules              |Attendance record                                         |
|Conduct  |Document review, interviews, observation, sampling            |Working papers, evidence                                  |
|Findings |Classify: Conformity / Observation / Minor NC / Major NC      |Findings list                                             |
|Close    |Closing meeting — present findings, agree timelines           |Audit report ({{organization.doc_prefix}}-REC-QHSE-ARP-01)|
|Follow up|CARs raised per §37; effectiveness verified by auditor or QHSE|CAR closure record                                        |

### **36.5 Finding Classification**

- Major NC — system failure: requirement not met, requirement entirely absent, or a pattern of minor NCs indicating systemic weakness. Triggers immediate CAR with senior owner.
- Minor NC — isolated lapse: requirement met overall but isolated instance of failure. Triggers CAR.
- Observation — practice is conforming but improvement opportunity exists. May or may not trigger action.
- Positive finding — strength worth recognising and propagating.

### **36.6 External Audits**

- ISO 9001 surveillance audits per certification cycle.
- Regulatory audits (GCAA, GACA, DKPPU) — scheduled or unannounced.
- Client audits (per contract right-to-audit clauses).
- All external audits prepared for using prior-year reports and current internal audit findings.

## **37. Nonconformity ****&**** Corrective Action***   cl. 10.2*

### **37.1 Definitions**

- Nonconformity (NC) — non-fulfilment of a requirement (contractual, regulatory, internal procedure, standard).
- Correction — immediate action to address the NC (containment, fix the deliverable, re-fly the mission).
- Corrective Action (CAR) — action to eliminate the cause so the NC does not recur.
- Preventive Action — proactive change to prevent a potential NC (within risk-based thinking, may not need a separate process).

### **37.2 NC Sources**

- Internal audit findings.
- External audit findings.
- Customer complaints (§17).
- Incident investigation (§29).
- Deliverable QC fails (§11).
- Subcontractor performance issues (§13).
- Management review actions.
- Anyone in the team — STOP card / observation card system.

### **37.3 CAR Process (8-step)**

- Capture — NC raised on {{organization.doc_prefix}}-FRM-QHSE-CAR-01 by anyone, processed by QHSE within 2 working days.
- Containment — what immediate action makes the situation safe / acceptable now? Done within 5 working days.
- Define — clear, factual statement of the NC, with evidence.
- Root cause — 5-Whys for simple cases, fishbone (Ishikawa) for multi-factor, structured method (e.g. ICAM) for incidents. Avoid ‘human error’ as a stopping point — ask why the system permitted it.
- Action plan — proposed corrective action, owner, target completion date.
- Implement — actions executed and evidence captured.
- Verify effectiveness — after defined period (30 / 90 / 180 days per case), QHSE confirms the NC has not recurred and the corrective action is working.
- Close — CAR formally closed by QHSE; lessons added to {{organization.doc_prefix}}-REG-OPS-LL-01.

### **37.4 Timeliness Targets**

|**Severity**             |**Containment by**|**Root cause by**|**Close by**    |
|-------------------------|------------------|-----------------|----------------|
|Major NC                 |5 working days    |20 working days  |60 working days |
|Minor NC                 |10 working days   |30 working days  |90 working days |
|Observation (if actioned)|n/a               |60 working days  |120 working days|

### **37.5 CAR Register**

{{organization.doc_prefix}}-REG-QHSE-CAR-01 — live register: ID, source, raised date, severity, owner, status, target date, actual close date, effectiveness verified Y/N.

### **37.6 Trending ****&**** Continual Improvement**

- Quarterly trend analysis of NCs by source, function, root-cause category — presented at management review.
- Recurring NCs (same root cause appearing twice within 12 months) escalated as systemic — require management-review-level action plan.
- Improvement ideas captured continuously through the same form; not all improvements come from failures.

# **Appendix A — Glossary ****&**** Acronyms**

|**Term**           |**Definition**                                                                                |
|-------------------|----------------------------------------------------------------------------------------------|
|Accountable Manager|Named senior person who holds regulatory accountability for the operator (GCAA/GACA term)     |
|AVL                |Approved Vendor List                                                                          |
|BANI               |Badan Arbitrase Nasional Indonesia — Indonesian National Arbitration Board                    |
|BVLOS              |Beyond Visual Line of Sight — drone operation where pilot cannot see the aircraft directly    |
|BC/DR              |Business Continuity / Disaster Recovery                                                       |
|CAA / CAAB / CAAI  |Civil Aviation Authority (Bahrain / Israel etc.)                                              |
|CAR (regulatory)   |Civil Aviation Regulation (GCAA)                                                              |
|CAR (quality)      |Corrective Action Request                                                                     |
|CASR               |Civil Aviation Safety Regulation (Indonesia)                                                  |
|CTR                |Controlled Traffic Region — airspace around airports                                          |
|DaaS               |Drone-as-a-Service                                                                            |
|DCAA               |Dubai Civil Aviation Authority                                                                |
|DKPPU              |Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara — Indonesia airworthiness directorate|
|DSO                |Days Sales Outstanding                                                                        |
|EDR                |Endpoint Detection & Response                                                                 |
|EPC                |Engineering, Procurement & Construction (contractor)                                          |
|ESR                |Economic Substance Regulations (UAE)                                                          |
|FTA                |Federal Tax Authority (UAE)                                                                   |
|GACA / GACAR       |General Authority of Civil Aviation (KSA) / GACA Regulations                                  |
|GCAA               |General Civil Aviation Authority (UAE federal)                                                |
|GCP                |Ground Control Point                                                                          |
|GNSS / GPS         |Global Navigation Satellite System (e.g. GPS, GLONASS, Galileo)                               |
|GSD                |Ground Sample Distance — pixel size on the ground                                             |
|HIRA               |Hazard Identification and Risk Assessment                                                     |
|ICAM               |Incident Cause Analysis Method                                                                |
|IEC 62446-3:2017   |International standard for outdoor IR thermography of PV systems                              |
|JSA                |Job Safety Analysis                                                                           |
|KBLI               |Klasifikasi Baku Lapangan Usaha Indonesia (business classification)                           |
|KBRI               |Kedutaan Besar Republik Indonesia (Indonesian Embassy)                                        |
|LiPo               |Lithium Polymer battery                                                                       |
|LTI                |Lost-Time Incident                                                                            |
|MDM                |Mobile Device Management                                                                      |
|MFA                |Multi-Factor Authentication                                                                   |
|MOIAT              |Ministry of Industry & Advanced Technology (UAE)                                              |
|NETD               |Noise Equivalent Temperature Difference — thermal camera sensitivity                          |
|NC / NCR           |Nonconformity / Nonconformity Report                                                          |
|NOTAM              |Notice to Airmen — airspace notice                                                            |
|NPS                |Net Promoter Score                                                                            |
|OEM                |Original Equipment Manufacturer                                                               |
|PDPL               |Personal Data Protection Law (UAE / KSA equivalents)                                          |
|PI                 |Professional Indemnity insurance                                                              |
|PIP                |Performance Improvement Plan                                                                  |
|PPK                |Post-Processed Kinematic (GNSS technique)                                                     |
|PT PMA             |Perseroan Terbatas Penanaman Modal Asing — Indonesian foreign-investment company              |
|PTW                |Permit to Work                                                                                |
|PV                 |Photovoltaic (solar)                                                                          |
|QHSE               |Quality, Health, Safety & Environment                                                         |
|RACI               |Responsible, Accountable, Consulted, Informed                                                 |
|RPIC / R-PIC       |Remote Pilot in Command                                                                       |
|RPO                |Recovery Point Objective                                                                      |
|RTH                |Return to Home                                                                                |
|RTK                |Real-Time Kinematic (GNSS technique)                                                          |
|RTO                |Recovery Time Objective                                                                       |
|SOC                |State of Charge (battery)                                                                     |
|SOP                |Standard Operating Procedure                                                                  |
|SSO                |Single Sign-On                                                                                |
|STS-B1             |Standard Scenario B1 (GACA — beyond visual line of sight category)                            |
|TPL                |Third-Party Liability                                                                         |
|UAS                |Unmanned Aircraft System                                                                      |
|UBO                |Ultimate Beneficial Owner                                                                     |
|UU PDP             |Undang-Undang Pelindungan Data Pribadi — Indonesia’s data protection law (No. 27/2022)        |
|VLOS               |Visual Line of Sight                                                                          |
|VPN                |Virtual Private Network                                                                       |
|WPS                |Wage Protection System (UAE)                                                                  |
|ZATCA              |Zakat, Tax and Customs Authority (KSA)                                                        |
|ΔT                 |Temperature difference (in PV thermography, between anomaly and reference module)             |

# **Appendix B — Regulatory Reference Index**

Primary references used throughout this manual. Versions current at issue date; the live register ({{organization.doc_prefix}}-REG-GEN-LEG-01) tracks updates.

### **Aviation**

|**Reference**                       |**Scope**                                           |
|------------------------------------|----------------------------------------------------|
|GCAA CAR Part VIII (UAS)            |UAE federal UAS regulation                          |
|DCAA UAS Regulation                 |Dubai-specific commercial drone operations          |
|GACAR Part 107 v5.0                 |KSA UAS regulation, operator and pilot certification|
|GACA AC 107-02                      |Pilot competency framework (KSA)                    |
|Indonesia CASR Part 107 / PM 37/2020|Indonesian UAS operations                           |
|ICAO Doc 10019 / Annex 2            |International standards for RPAS                    |

### **Quality, Safety ****&**** Environment**

|**Reference** |**Scope**                                          |
|--------------|---------------------------------------------------|
|ISO 9001:2015 |Quality management systems                         |
|ISO 14001:2015|Environmental management systems (reference)       |
|ISO 45001:2018|Occupational health & safety management (reference)|
|ISO 19011:2018|Guidelines for auditing management systems         |
|ISO 31000:2018|Risk management (reference)                        |
|ISO 27001:2022|Information security management (reference)        |

### **Service Standards**

|**Reference**                      |**Scope**                                                                                    |
|-----------------------------------|---------------------------------------------------------------------------------------------|
|IEC 62446-3:2017                   |Outdoor IR thermography of PV systems ({{organization.trade_name}} default for PV inspection)|
|IEC 61724                          |PV system performance monitoring (referenced for pyranometer use)                            |
|IEC 17025                          |General requirements for testing & calibration laboratories                                  |
|ASPRS Positional Accuracy Standards|Geospatial accuracy reporting (reference)                                                    |

### **Data Protection**

|**Reference**                           |**Scope**                         |
|----------------------------------------|----------------------------------|
|UAE Federal Decree-Law 45 of 2021 (PDPL)|UAE personal data protection      |
|KSA PDPL (Royal Decree M/19, amended)   |Saudi personal data protection    |
|Indonesia UU PDP 27/2022                |Indonesia personal data protection|

### **Labour ****&**** Corporate**

|**Reference**                                   |**Scope**               |
|------------------------------------------------|------------------------|
|UAE Federal Decree-Law 33 of 2021 (Labour Law)  |UAE employment relations|
|KSA Labour Law (Royal Decree M/51)              |KSA employment          |
|Indonesia UU Cipta Kerja / UU 13/2003 as amended|Indonesia manpower      |
|UAE Commercial Companies Law                    |UAE corporate governance|
|UAE Economic Substance Regulations              |Substance reporting     |
|UAE Corporate Tax Law (FTA)                     |Corporate income tax    |

# **Appendix C — Document Register**

> **DronOps platform note —** in DronOps this register is generated, not maintained by hand: the document list, current revisions, owners and statuses come from M1. Where a row below is a form, it maps to a platform-native module (see Appendix D note) rather than a controlled document.

Reference list of documents and records cited in this manual. Versions managed in /QMS/Register/.

### **Manuals ****&**** Policies**

|**Reference**                            |**Title**                                    |
|-----------------------------------------|---------------------------------------------|
|{{organization.doc_prefix}}-MAN-001      |Standards & Operations Manual (this document)|
|{{organization.doc_prefix}}-POL-HR-COC-01|Code of Conduct                              |
|{{organization.doc_prefix}}-POL-IT-AUP-01|Acceptable Use Policy                        |
|{{organization.doc_prefix}}-POL-QHSE-01  |QHSE Policy                                  |

### **Standard Operating Procedures (selected)**

|**Reference**                           |**Title**                               |
|----------------------------------------|----------------------------------------|
|{{organization.doc_prefix}}-SOP-OPS-FLT |Flight Operations SOP                   |
|{{organization.doc_prefix}}-SOP-OPS-PV  |PV Inspection SOP (IEC 62446-3 anchored)|
|{{organization.doc_prefix}}-SOP-OPS-SURV|Mapping & Survey SOP                    |
|{{organization.doc_prefix}}-SOP-OPS-AUTO|Autonomous / Dock Operations SOP        |
|{{organization.doc_prefix}}-SOP-OPS-EMG |Emergency Procedures SOP                |
|{{organization.doc_prefix}}-SOP-OPS-DATA|Data Processing & Pipeline SOP          |

### **Forms**

|**Reference**                              |**Title**                        |
|-------------------------------------------|---------------------------------|
|{{organization.doc_prefix}}-FRM-OPS-01     |Mission Authorisation Form       |
|{{organization.doc_prefix}}-FRM-OPS-02     |Site Risk Assessment             |
|{{organization.doc_prefix}}-FRM-OPS-03     |Crew Briefing                    |
|{{organization.doc_prefix}}-FRM-OPS-04     |Pre/Post-Flight Inspection       |
|{{organization.doc_prefix}}-FRM-OPS-PV-01  |IEC 62446-3 Conformance Checklist|
|{{organization.doc_prefix}}-FRM-OPS-QC-01  |Deliverable QC Checklist         |
|{{organization.doc_prefix}}-FRM-OPS-REL-01 |Internal Release Form            |
|{{organization.doc_prefix}}-FRM-OPS-SUB-01 |Subcontractor Pre-Qualification  |
|{{organization.doc_prefix}}-FRM-COM-BID-01 |Bid/No-Bid Decision              |
|{{organization.doc_prefix}}-FRM-COM-REV-01 |Contract Review Checklist        |
|{{organization.doc_prefix}}-FRM-COM-PID-01 |Project Initiation Document      |
|{{organization.doc_prefix}}-FRM-COM-CHG-01 |Change Order                     |
|{{organization.doc_prefix}}-FRM-COM-CSAT-01|Customer Satisfaction Survey     |
|{{organization.doc_prefix}}-FRM-HR-01      |Onboarding Checklist             |
|{{organization.doc_prefix}}-FRM-HR-EXIT-01 |Offboarding Checklist            |
|{{organization.doc_prefix}}-FRM-HR-PASS-01 |Pilot Practical Assessment       |
|{{organization.doc_prefix}}-FRM-FIN-PR-01  |Purchase Requisition             |
|{{organization.doc_prefix}}-FRM-FIN-PO-01  |Purchase Order                   |
|{{organization.doc_prefix}}-FRM-FIN-EXP-01 |Expense Claim                    |
|{{organization.doc_prefix}}-FRM-QHSE-INC-01|Incident Report                  |
|{{organization.doc_prefix}}-FRM-QHSE-JSA-01|Job Safety Analysis              |
|{{organization.doc_prefix}}-FRM-QHSE-CAR-01|Corrective Action Request        |
|{{organization.doc_prefix}}-FRM-QHSE-AP-01 |Audit Plan                       |
|{{organization.doc_prefix}}-FRM-IT-COC-01  |Chain of Custody (Data Media)    |

### **Registers**

|**Reference**                                 |**Title**                               |
|----------------------------------------------|----------------------------------------|
|{{organization.doc_prefix}}-REG-RISK-01       |Risk & Opportunity Register             |
|{{organization.doc_prefix}}-REG-AST-01        |Asset Register                          |
|{{organization.doc_prefix}}-REG-SUB-01        |Approved Subcontractor Register         |
|{{organization.doc_prefix}}-REG-COM-PRC-01    |Pricing Model                           |
|{{organization.doc_prefix}}-REG-FIN-AVL-01    |Approved Vendor List                    |
|{{organization.doc_prefix}}-REG-FIN-PERDIEM-01|Per Diem Rates                          |
|{{organization.doc_prefix}}-REG-HR-JD-01      |Job Description Library                 |
|{{organization.doc_prefix}}-REG-HR-COMP-01    |Competency Matrix                       |
|{{organization.doc_prefix}}-REG-HR-TRN-01     |Training Calendar                       |
|{{organization.doc_prefix}}-REG-QHSE-HIRA-01  |Hazard Identification & Risk Assessments|
|{{organization.doc_prefix}}-REG-QHSE-AUD-01   |Internal Audit Programme                |
|{{organization.doc_prefix}}-REG-QHSE-CAR-01   |CAR Register                            |
|{{organization.doc_prefix}}-REG-OPS-LL-01     |Lessons Learned Register                |
|{{organization.doc_prefix}}-REG-GEN-KPI-01    |KPI Dashboard                           |
|{{organization.doc_prefix}}-REG-GEN-LEG-01    |Legal & Regulatory Register             |

# **Appendix D — Form Templates (Outline)**

> **DronOps platform note —** forms map to platform features, not documents: pre/post-flight checklists are M4 form templates; the flight log is the M6 flight record; incident/near-miss is the M3 occurrence flow; the NCR is the M2 findings module; JSA is an M3 risk-assessment template. Only the genuinely document-like forms (bid/no-bid, change request, improvement) remain as form templates.

The templates below show the field structure for the most-used forms. Live editable versions are in /QMS/Forms/. Copying or detaching from this manual is permitted only via controlled-issue.

### **D.1 Mission Authorisation Form ({{organization.doc_prefix}}-FRM-OPS-01)**

|**Mission ID**                                         |[YYYY-NNNN]                      |
|-------------------------------------------------------|---------------------------------|
|**Client / Project**                                   |                                 |
|**Site location**                                      |Lat/Long + description           |
|**Mission window**                                     |Date/time start–end              |
|**Service line**                                       |Mapping / PV / Autonomous / Other|
|**RPIC**                                               |Name + licence ref               |
|**Crew**                                               |Names + roles                    |
|**Airframe(s) ****&**** sensors**                      |Serial(s)                        |
|**Airspace authorisation**                             |Reference + expiry               |
|**Operator approval**                                  |Reference + jurisdiction         |
|**Site authority**                                     |PTW / access confirmation ref    |
|**JSA / SRA reference**                                |Form ref                         |
|**Gate sign-offs (G1–G7)**                             |Names, timestamps                |
|**Authorising signatory ({{roles.chief_pilot_title}})**|Signature + date                 |

### **D.2 Site Risk Assessment ({{organization.doc_prefix}}-FRM-OPS-02)**

- Site description and location.
- Operations planned.
- Hazards identified (people, environment, equipment, airspace, third party).
- Risk score per hazard (L × I).
- Controls in place / additional controls required.
- Residual risk after controls.
- Emergency response: nearest medical, muster point, contacts.
- Sign-off: assessor, RPIC, PM.

### **D.3 Pre/Post-Flight Inspection ({{organization.doc_prefix}}-FRM-OPS-04)**

- Airframe: physical inspection — arms, propellers, payload mount, antennae.
- Battery: SOC, cycle count, no swelling/damage.
- Payload: lens clean, calibration verified, mount secure.
- Comms: controller bind, video link, telemetry.
- GNSS: satellites acquired, HDOP.
- Compass / IMU: calibrated, no warnings.
- Failsafes: RTH altitude, signal loss action.
- Post-flight: log download, visual inspection, damage check, defects raised.

### **D.4 IEC 62446-3 Conformance Checklist ({{organization.doc_prefix}}-FRM-OPS-PV-01)**

- Solar irradiance ≥ 600 W/m² at acquisition (measured, logged).
- Plant operating near MPP (confirmed with SCADA/operator).
- Wind ≤ 8 m/s (logged).
- Camera calibration in date (cert ref).
- Camera NETD ≤ 80 mK.
- GSD ≤ 3 cm/px on module surface.
- Camera angle nadir ±5° to module plane.
- Speed ≤ 5 m/s.
- Forward overlap ≥ 75%; side overlap ≥ 65%.
- Emissivity set 0.85 (or project value).
- Reflected apparent temp measured and entered.
- Anomalies classified per IEC 62446-3 categories.
- Anomaly register includes coordinates, severity, ΔT, photos.
- Conditions log attached.
- Reviewed and signed by PV Service Lead.

### **D.5 Incident Report ({{organization.doc_prefix}}-FRM-QHSE-INC-01)**

- Report ID, date/time of incident, reporter.
- Location, weather, operation in progress.
- Persons / aircraft / property involved.
- Description of event.
- Immediate actions taken.
- Injuries / damage / losses.
- Notifications made (internal, regulator, insurer, client).
- Evidence captured (photos, logs, statements).
- Sign-off: RPIC, PM, MD.

### **D.6 Bid/No-Bid Decision ({{organization.doc_prefix}}-FRM-COM-BID-01)**

- Opportunity ID, client, scope summary.
- Estimated value and duration.
- Scores against criteria (§14.2) with comments.
- Weighted total.
- Decision: BID / NO-BID / CONDITIONAL (with conditions).
- Approver(s) per §14.3.

### **D.7 Contract Review Checklist ({{organization.doc_prefix}}-FRM-COM-REV-01)**

Items per §15.1 — each ticked with notes; signed by {{roles.commercial_lead_title}}, Ops Head, {{roles.finance_lead_title}}. Outstanding items resolved before signature.

### **D.8 Customer Satisfaction Survey ({{organization.doc_prefix}}-FRM-COM-CSAT-01)**

- Technical quality of deliverable (1–10).
- On-time performance (1–10).
- Communication (1–10).
- Safety & professionalism on site (1–10).
- Value for money (1–10).
- Overall NPS: ‘How likely are you to recommend {{organization.trade_name}}?’ (0–10).
- What did we do well?
- What could we improve?
- Open comment.

### **D.9 Onboarding Checklist ({{organization.doc_prefix}}-FRM-HR-01)**

- Pre-day-1: workstation, accounts, equipment, welcome pack.
- Day 1: HR documents, manual issued, IT briefing, office tour.
- Day 1: QHSE induction, security briefing.
- Week 1: role-specific training plan, manager 1:1, project shadow.
- Day 30: feedback session.
- Day 90: probation review.
- Acknowledgements signed: manual, COC, IT AUP, HSE.

# **End of Document**

This document is the {{organization.trade_name}} Standards & Operations Manual — {{organization.doc_prefix}}-MAN-001, Version 1.0. Maintained under the document control process at §6. The next scheduled review is at the first management review after issue; ad-hoc revisions may be triggered by regulatory change, incident, or strategic change.

For questions or proposed revisions, contact the Quality function via the QHSE Officer or the {{roles.accountable_manager_title}}.

{{organization.doc_prefix}}-MAN-001  |  v1.0  |  Internal — Controlled Document  |  Page  of