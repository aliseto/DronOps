<!-- TEMPLATIZED: {{group.key}} = onboarding variable · [[jurisdiction:X]]…[[/jurisdiction]] = renders only when X enabled (UAE-Federal, UAE-Dubai, KSA, Oman live; IDN future) · '> DronOps platform note' describes platform behaviour. Verbatim prose otherwise unchanged from AIR-MAN-002 v1.0. -->

**AIRONOV  ·  **Flight Operations Manual  ·  {{organization.doc_prefix}}-MAN-002 Rev. 1.0

**{{organization.trade_name}}**

*Autonomous Drone Intelligence*

**Flight Operations Manual**

**{{organization.doc_prefix}}-MAN-002**

*Operating procedures, limitations, and emergency response for all {{organization.trade_name}} UAS operations*

Rev. 1.0   ·   May 2026

*Confidential — Operational and Regulatory Reference*

# **Document Control**

|**Document Title**    |{{organization.trade_name}} Flight Operations Manual             |
|----------------------|-----------------------------------------------------------------|
|**Document Code**     |{{organization.doc_prefix}}-MAN-002                              |
|**Revision**          |1.0                                                              |
|**Effective Date**    |01 June 2026                                                     |
|**Next Review**       |01 June 2027 (annual) or on regulatory / fleet change            |
|**Owner**             |{{roles.ops_manager_title}}                                      |
|**Approver**          |{{roles.accountable_manager_title}}                              |
|**Companion Document**|{{organization.doc_prefix}}-MAN-001 Standards & Operations Manual|

## **Purpose ****&**** Hierarchy**

This Flight Operations Manual (FOM) is the controlling document for the conduct of every {{organization.trade_name}} flight. It contains the operating limitations, normal procedures, abnormal and emergency procedures, crew responsibilities, and reporting obligations for each aircraft type {{organization.trade_name}} operates.

Where this FOM is silent or in conflict with a published civil aviation regulation in the jurisdiction of flight, the regulation prevails. Where this FOM is in conflict with a manufacturer’s published flight manual or limitations, the manufacturer’s limits prevail.

Pilots, observers, and operations staff are required to read this FOM in full upon onboarding and again upon any revision. Familiarity is verified as part of competence ({{organization.doc_prefix}}-MAN-001 Section 18).

## **Revision History**

|**Rev.**|**Date**|**Author** |**Summary**  |
|--------|--------|-----------|-------------|
|1.0     |May 2026|Ops Manager|Initial issue|
|        |        |           |             |
|        |        |           |             |

## **Approvals**

|**Role**                           |**Name**|**Signature**|**Date**|
|-----------------------------------|--------|-------------|--------|
|{{roles.ops_manager_title}}        |        |             |        |
|{{roles.quality_lead_title}}       |        |             |        |
|{{roles.accountable_manager_title}}|        |             |        |

# **Table of Contents**

*Right-click the field below and select **’**Update Field**’** in Word to populate page numbers.*

# **Chapter 1 — General**

## **1.1 Scope of Operations**

This FOM covers all Unmanned Aircraft System (UAS) operations conducted by {{organization.trade_name}}, including:

- Visual Line of Sight (VLOS) operations within the operator’s direct visual range.
- Extended VLOS (EVLOS) operations with trained visual observers.
- Beyond Visual Line of Sight (BVLOS) operations under specific regulator authorization.
- Autonomous and dock-based operations under specific regulator authorization.
- Day and night operations, where night operations are separately authorized.
- Aerial mapping, photogrammetry, LiDAR survey.
- Asset inspection — solar PV (IEC 62446-3:2017), industrial, infrastructure, construction.
- Advisory flights, training flights, and capability demonstrations.

## **1.2 Operating Jurisdictions**

> **DronOps platform note —** this lists the jurisdictions the operator is licensed to fly in (operator scope). In DronOps it maps to the org’s enabled jurisdiction modes; rows for jurisdictions with an active compliance pack (UAE-Federal, UAE-Dubai, KSA, Oman) drive deadlines, gates and packs, and render per the org’s enabled set. Jurisdictions without a content pack yet (e.g. Qatar, Bahrain, Kuwait) are listed for operator reference only; Indonesia (DGCA PM 37/2020) renders when the Indonesia pack and mode are enabled.

{{organization.trade_name}} operates, or plans to operate, UAS in the jurisdictions listed below. Each jurisdiction has primary authority over flights conducted within its airspace. {{organization.trade_name}} holds the relevant operator authorization in each **Active** jurisdiction before operations commence; **In progress** and **Planned** jurisdictions are shown for transparency and are not operated until the required authorization is held. The **Status** column reflects current operating reality, not intent.

|**Jurisdiction**                                                                 |**Civil Aviation Authority**    |**Primary Regulation**           |**Status** |**{{organization.trade_name}} Authorization Reference**|
|---------------------------------------------------------------------------------|--------------------------------|---------------------------------|-----------|-------------------------------------------------------|
|[[jurisdiction:UAE-Federal+UAE-Dubai]]United Arab Emirates (UAE)[[/jurisdiction]]|GCAA / DCAA / sector authorities|CAR-VI Part X UAS; DCAA UAS Rules|Active     |(see Licenses register)                                |
|[[jurisdiction:KSA]]Kingdom of Saudi Arabia (KSA)[[/jurisdiction]]               |GACA                            |GACAR Part 107 v5.0              |Active     |(see Licenses register)                                |
|[[jurisdiction:Oman]]Sultanate of Oman[[/jurisdiction]]                          |CAA Oman                        |CAR-102; AWR 033 permit          |Active     |(see Licenses register)                                |
|[[jurisdiction:IDN]]Republic of Indonesia[[/jurisdiction]]                       |DGCA Kemenhub                   |PM 37/2020; CASR Part 107        |In progress|(see Licenses register)                                |
|State of Qatar                                                                   |QCAA                            |QCAA UAS Regulations             |Planned    |(see Licenses register)                                |
|Kingdom of Bahrain                                                               |BCAA                            |BCAA UAS Regulations             |Planned    |(see Licenses register)                                |
|State of Kuwait                                                                  |DGCA Kuwait                     |DGCA UAS Regulations             |Planned    |(see Licenses register)                                |

|**Cardinal Rule** No {{organization.trade_name}} flight commences without a valid operator authorization in the jurisdiction of flight and any required mission-specific permit. Where regulator rules in one jurisdiction differ from another, the rule of the jurisdiction of flight applies. Pilots must verify they are operating to the rules of the country they are flying in.|
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

## **1.3 Applicable Standards**

- ICAO Annex 2 — Rules of the Air (foundational airspace principles).
- ICAO Annex 6 Part IV — International Operations - Remotely Piloted Aircraft Systems.
- Local UAS regulations of jurisdiction of flight (Table 1.2 above).
- Manufacturer’s flight manuals and operating limitations for each aircraft.
- IEC 62446-3:2017 for solar PV thermographic inspection methods.
- ISO 9001:2015 (as foundation for the {{organization.trade_name}} management system, {{organization.doc_prefix}}-MAN-001).
- IATA Dangerous Goods Regulations — UN3480 / UN3481 for lithium-ion battery handling.

## **1.4 Definitions ****&**** Abbreviations**

|**Term** |**Meaning**                             |
|---------|----------------------------------------|
|AGL      |Above Ground Level                      |
|AMSL     |Above Mean Sea Level                    |
|ATC      |Air Traffic Control                     |
|BVLOS    |Beyond Visual Line of Sight             |
|CofA     |Certificate of Airworthiness            |
|EVLOS    |Extended Visual Line of Sight           |
|FOM      |Flight Operations Manual (this document)|
|GCS      |Ground Control Station                  |
|JSA      |Job Safety Analysis                     |
|NOTAM    |Notice to Airmen / Air Missions         |
|PIC      |Pilot-in-Command                        |
|RPAS     |Remotely Piloted Aircraft System        |
|RTH / RTL|Return to Home / Return to Launch       |
|SMS      |Safety Management System                |
|UAS      |Unmanned Aircraft System                |
|VLOS     |Visual Line of Sight                    |
|VO       |Visual Observer                         |

# **Chapter 2 — Organization ****&**** Responsibilities**

## **2.1 {{roles.accountable_manager_title}}**

The {{roles.accountable_manager_title}} is the {{roles.accountable_manager_title}} of {{organization.trade_name}}. The {{roles.accountable_manager_title}} is responsible for the overall safe conduct of flight operations, the resources to do so, and the relationship with civil aviation regulators.

## **2.2 {{roles.ops_manager_title}}**

The {{roles.ops_manager_title}} is the postholder responsible for the day-to-day conduct of flight operations and the integrity of this FOM. Responsibilities include:

- Maintaining this FOM and ensuring it is current with regulation and fleet changes.
- Authorizing flights and verifying pilot currency before assignment.
- Managing the aircraft fleet, maintenance programme, and asset register.
- Investigating incidents and ensuring corrective action.
- Interfacing with civil aviation regulators on operational matters.
- Reporting to the {{roles.accountable_manager_title}} on operational performance and safety.

## **2.3 {{roles.quality_lead_title}}**

The {{roles.quality_lead_title}} is responsible for maintaining operator and pilot authorizations, type approvals for equipment, training accreditations, and the legal register. Reports to the MD; coordinates closely with the {{roles.ops_manager_title}}.

## **2.4 Pilot-in-Command (PIC)**

> **DronOps platform note —** the forms the PIC works with map to platform modules: the pre-flight checklist is an M4 form template, the flight log IS the M6 flight record (no separate form), the post-flight report is an M4 template, and incident reporting is the M3 occurrence flow. PIC and VO are operational crew roles bound to the mission in M4, distinct from postholder RBAC roles.

For every flight, one pilot is designated PIC. The PIC is the final authority on the conduct of that flight.

- Has authority to refuse to take off or to terminate any flight if safety is in doubt.
- Is responsible for completing the pre-flight checklist ({{organization.doc_prefix}}-FRM-001) and verifying authorization to fly.
- Maintains positive control of the aircraft at all times during flight.
- Maintains the flight log ({{organization.doc_prefix}}-FRM-002) for each sortie.
- Submits the post-flight report ({{organization.doc_prefix}}-FRM-003) within 24 hours.
- Reports incidents, near misses, and hazards per Chapter 9.

## **2.5 Visual Observer (VO)**

Where the operation requires a visual observer (EVLOS, certain BVLOS authorizations, or per company policy):

- The VO has no other duties during the flight.
- Maintains scan for traffic, obstacles, persons, and weather.
- Communicates with the PIC via agreed comms — voice direct, radio, or headset.
- Has authority to call for the flight to be terminated.
- Is qualified and current per Chapter 4.

## **2.6 Stop-Work Authority**

|**Stop-Work Authority** Every member of the flight team — PIC, VO, ground crew, client escort — has authority and obligation to stop or refuse a flight if any safety concern arises. This authority is unconditional. No commercial, schedule, or client pressure overrides it.|
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# **Chapter 3 — Aircraft ****&**** Equipment**

## **3.1 Fleet Register Reference**

The current fleet is listed in the Asset Register ({{organization.doc_prefix}}-MAN-001 Section 11). This chapter contains the operational summaries; the master fleet list is in the live register.

## **3.2 Aircraft Categories Operated**

|**Category**                 |**Examples**                             |**Typical Use**                         |
|-----------------------------|-----------------------------------------|----------------------------------------|
|Multirotor — small (sub-2 kg)|DJI Mavic 3 Enterprise series            |Reconnaissance, light mapping, indoor   |
|Multirotor — medium (2–7 kg) |DJI Matrice 30/M30T, M350 RTK            |Inspection, photogrammetry, LiDAR       |
|Multirotor — heavy (7–25 kg) |Custom and specialist platforms          |Heavy payload, LiDAR, specialist sensors|
|Fixed-wing / VTOL hybrid     |WingtraOne, equivalent                   |Large-area mapping                      |
|Dock-based autonomous        |DJI Dock 3 + M3D / M30 docked, equivalent|Recurring autonomous missions           |

## **3.3 Aircraft-Specific Limitations (Master Reference)**

The following limits apply across the fleet at the operational level. Manufacturer-specific limits in individual flight manuals always prevail where stricter.

|**Parameter**                           |**Standard Limit (use stricter of OEM and below)**                      |
|----------------------------------------|------------------------------------------------------------------------|
|Maximum operating wind (steady)         |Per OEM, typically 10–12 m/s for small/medium multirotor                |
|Maximum operating wind (gust)           |Per OEM; +2 m/s tolerance not permitted by {{organization.trade_name}}  |
|Minimum visibility (VLOS)               |5 km horizontal                                                         |
|Minimum visibility (EVLOS / BVLOS)      |Per specific authorization, never less than 5 km                        |
|Operating temperature range             |Per OEM (typically -10°C to +50°C ambient)                              |
|Precipitation                           |No flight in rain or snow unless aircraft IP-rated; light mist permitted|
|Maximum altitude AGL (VLOS, baseline)   |120 m (400 ft); regulator may impose lower                              |
|Minimum distance from uninvolved persons|Per regulator + risk assessment; never less than 5 m for sub-2kg in VLOS|
|Minimum distance from aerodromes        |Per regulator and NOTAM; default 5 km no-fly without coordination       |

## **3.4 Battery Management**

- All batteries individually tagged and tracked in the asset register.
- Charge cycles logged; battery retired per OEM cycle limit or any swelling, damage, or capacity drop below 80%.
- Storage at OEM-recommended storage charge state (typically 40–60%).
- Charging on non-combustible surface in fireproof bag, with attendant or fire detection.
- Minimum charge for take-off: 90% on first sortie, 75% on subsequent sorties (after warm-up).
- Return-to-home (RTH) triggered at minimum 25% capacity remaining or per RTH calculation, whichever earlier.
- Transport by air: per IATA UN3480/UN3481; transport by road: in fireproof case.
- End-of-life batteries: discharged where possible, recycled via licensed e-waste provider.

## **3.5 Payload ****&**** Sensor Standards**

- Thermal cameras used for IEC 62446-3 inspection: radiometric, NETD ≤50 mK, calibration current.
- LiDAR: manufacturer calibration current; flight planning per specified ground sample density.
- RGB cameras: lens cleanliness verified pre-flight; SD card formatted and integrity-checked.
- RTK GNSS base: position verified before survey; logging started before aircraft launch.

## **3.6 Ground Control Station (GCS)**

- Charged controllers, backup controller available for multi-day operations.
- Firmware aligned across aircraft, controller, and ground station before mission start.
- Field laptop secured per {{organization.trade_name}} IT policy; encryption on.
- Connectivity confirmed for any cloud-linked mission planning.

# **Chapter 4 — Crew Qualifications, Currency ****&**** Fatigue**

## **4.1 Pilot Qualifications**

Every {{organization.trade_name}} pilot must hold, as a minimum:

- A current pilot license / remote pilot certificate valid in the jurisdiction of flight.
- A current medical declaration (renewable annually) — self-declared minimum, regulator-required medical where applicable.
- A type rating or equivalent training record on each aircraft they will fly as PIC.
- Completed {{organization.trade_name}} internal induction including this FOM, {{organization.doc_prefix}}-MAN-001, and applicable SOPs.
- Where the operation includes BVLOS, night, or autonomous components — additional specific training and currency for that operation.

## **4.2 Recency / Currency Requirements**

> **DronOps platform note —** currency is computed by the platform from credentials plus recency events derived from M6 flights, per airframe class; a pilot below the threshold is gated from assignment to a mission of that class (override requires a privileged role, reason and audit event). The KSA §107.71 24-month knowledge recency rule is applied automatically for KSA-jurisdiction missions.

|**Requirement**           |**Minimum**                                          |**Verified By**             |
|--------------------------|-----------------------------------------------------|----------------------------|
|Recent experience — total |3 flights as PIC in last 90 days                     |Ops Manager (logbook)       |
|Recent experience on type |3 flights on type in last 90 days                    |Ops Manager                 |
|Night currency            |1 night flight in last 90 days                       |Ops Manager                 |
|BVLOS currency            |1 BVLOS operation in last 90 days + scenario training|Ops Manager + Compliance    |
|Autonomous / dock currency|1 supervised autonomous mission in last 90 days      |Ops Manager                 |
|Recurrent training        |Completed within last 12 months                      |{{roles.quality_lead_title}}|
|First aid                 |Valid certificate                                    |HR                          |

|**Lapsed currency** A pilot whose currency has lapsed in any required area may not act as PIC for that type of operation until currency is restored by supervised flights or formal re-training. A lapse exceeding 6 months requires reassessment by the {{roles.ops_manager_title}} before solo PIC duty is restored.|
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

## **4.3 Visual Observer Qualifications**

- Trained per {{organization.trade_name}} internal VO training — airspace awareness, communications, sterile cockpit, traffic scan, weather awareness.
- Familiar with the aircraft being operated.
- Holds first aid qualification.
- Briefed on each specific mission, including expected flight profile, emergency procedures, and comms.

## **4.4 Duty ****&**** Rest Periods**

|**Limit**                                                 |**Value**                                               |
|----------------------------------------------------------|--------------------------------------------------------|
|Maximum flight duty period (active operations)            |10 hours from start of pre-flight to end of post-flight |
|Maximum continuous flying time (single sortie or rotation)|60 minutes without break                                |
|Minimum rest before duty                                  |10 consecutive hours, of which 8 sleep opportunity      |
|Maximum flight hours in 7 consecutive days                |30 hours airborne                                       |
|Maximum flight hours in 28 consecutive days               |90 hours airborne                                       |
|Minimum days off in 28 days                               |4 days, including at least 1 block of 2 consecutive days|

## **4.5 Fatigue Management**

- Self-assessment by PIC and VO before duty — verbal confirmation to Ops Manager during morning brief.
- Any factor compromising fitness for flight (illness, medication, lack of sleep, stress, alcohol within 12h) is grounds for self-removal from duty without penalty.
- Heat — outdoor work in summer (May–September UAE/KSA) follows extended rest and rotation protocols per {{organization.doc_prefix}}-MAN-001 Section 26.3.
- Cross-time-zone travel — minimum 24 hours rest after >5h time zone change before solo PIC duty.

## **4.6 Drugs ****&**** Alcohol Policy**

- Zero alcohol within 12 hours of any flight duty; zero alcohol during duty.
- Zero illicit substances at any time.
- Prescription or OTC medication that may impair must be declared to the Ops Manager before duty; the Ops Manager decides fitness.
- {{organization.trade_name}} reserves the right to test for cause.

# **Chapter 5 — Normal Flight Operations**

## **5.1 Mission Planning (T-24 hours)**

- Receive mission brief from Project Lead. Confirm scope, deliverables, client point of contact, site access.
- Identify regulatory requirements — operator authorization, mission permit, NOTAM coordination, airspace restrictions.
- Build flight plan in mission planning software — waypoints, altitude, overlap (mapping), sensor parameters.
- Weather forecast — wind, gusts, visibility, precipitation, temperature, irradiance for PV. Compare to limits.
- Plan transport — vehicles, equipment manifest, batteries (charge state, transport classification).
- Plan contingencies — alternate landing zones, weather windows, equipment backup.
- Brief team — PIC, VO, ground crew. Confirm currency and fitness. Assign roles.

## **5.2 On-Site Setup (T-2 hours)**

- Arrive on site with margin; confirm access; meet client escort.
- Walk the takeoff/landing zone — clear of obstacles, persons, surface defects.
- Set up GCS in safe location — shaded if possible, stable surface, away from vehicle traffic.
- Cordon the operating area if uninvolved persons could enter; signage.
- Conduct site safety brief — PIC, VO, client escort, any other site personnel. Sign JSA ({{organization.doc_prefix}}-FRM-025).
- Complete pre-flight checklist ({{organization.doc_prefix}}-FRM-001) — pilot signs; VO countersigns; site authority countersigns.
- Pre-flight aircraft checks per OEM — visual, propeller security, IMU/compass calibration if required, sensor mount, payload.
- Receive authorization to fly from Ops Manager / on-site authority.

## **5.3 Take-Off**

- Verify all warnings green, GPS lock acquired (minimum satellite count per OEM, typically 12+).
- Verify home point set correctly.
- Verify RTH altitude appropriate for terrain and obstacles.
- Verbal call: “Clear above, clear around, taking off.”
- Initial hover at 5 m for 5–10 seconds; verify stable response and instrumentation.
- Proceed with mission profile.

## **5.4 In-Flight Operations**

- PIC maintains positive aircraft control and situational awareness; no secondary tasks.
- VO continuously scans for traffic, obstacles, persons entering operating area; calls hazards to PIC.
- Comms between PIC and VO are concise, professional, and protocol-driven — “Traffic, 10 o’clock, 200 m, level”.
- Aircraft kept within VLOS unless operating under specific EVLOS / BVLOS authorization.
- Battery state monitored — RTH initiated at minimum threshold without delay.
- Weather monitored — wind, visibility, cloud base. Trends matter as much as current readings.
- Flight log ({{organization.doc_prefix}}-FRM-002) annotated per sortie with anomalies.

## **5.5 Landing**

- Approach designated landing zone from upwind where possible.
- Verbal call: “Returning, clear pad?” — VO confirms landing zone clear.
- Descend with control; hover briefly at low altitude to verify stability; touchdown.
- Disarm motors; confirm propellers stopped before approaching.
- Power down per OEM sequence.

## **5.6 Battery Swap ****&**** Sortie Turnaround**

- Confirm aircraft and battery cool enough to handle (touch test).
- Remove depleted battery, label and place in cool-down/charging case.
- Visually inspect aircraft — propellers, gimbal, sensors, body. Note anything unusual in flight log.
- Fit fresh battery (≥75% charge); confirm seated and clicked.
- Verify mission resumption point in GCS; brief VO.
- Repeat pre-flight checklist abbreviated form for subsequent sorties (Section 5.2 items 3–8).

## **5.7 Post-Flight**

- Final landing checks — aircraft, batteries, payload all accounted for and inspected.
- Data offload — verify file count, capture quality, checksum on critical data, backup to second medium.
- Equipment packed — propellers secured, batteries in safe transport case, sensors in cases.
- Site walk — confirm nothing left behind, gates closed, signage retrieved.
- Demobilization — client sign-off if required by contract.
- Within 24 hours: post-flight report ({{organization.doc_prefix}}-FRM-003); update logbook; raise incident report if applicable.

# **Chapter 6 — Abnormal ****&**** Emergency Procedures**

These procedures cover the principal abnormal and emergency situations that can occur in UAS operations. They are generic across multirotor platforms; manufacturer-specific procedures take precedence where they differ. Pilots are expected to know these from memory and to have rehearsed them.

## **6.1 General Emergency Principles**

- Aviate — fly the aircraft. Maintain control above all else.
- Navigate — manoeuvre to a safe place. Away from people, structures, traffic, water.
- Communicate — once aircraft is controlled, alert VO and any required external party.
- If in doubt, terminate the flight — land or activate RTH early. Do not press on.

## **6.2 Low Battery**

- Low battery warning (typically 30%) — assess time to home + reserve. Consider early RTH if mission allows.
- Critical battery warning (typically 15%) — automatic RTH triggers; do not override unless RTH path is unsafe.
- Forced landing warning — land at nearest safe spot immediately; do not attempt RTH.
- Post-event: log event in flight log; investigate cause (planning, weather, headwind, battery health).

## **6.3 GPS Loss / Degradation**

- Aircraft transitions to ATTI mode (attitude only, no position hold) — PIC takes manual control.
- Maintain visual reference; do not panic. Aircraft is still flyable in ATTI by competent pilot.
- Manoeuvre toward landing zone using visual reference.
- Land manually as soon as practical.
- Post-event: log; investigate magnetic interference, satellite environment, calibration.

## **6.4 Loss of Radio Link**

- Aircraft enters lost-link procedure per its programmed behavior — typically RTH at the set altitude.
- PIC: do not attempt to reacquire by chasing — move to a position with better line-of-sight.
- Be ready to take manual control if link recovers, or to wait for the aircraft to auto-RTH and land.
- VO: scan for the aircraft visually; report any sightings.
- Post-event: log; check for RF interference, range planning, antenna orientation.

## **6.5 Compass / IMU Error**

- In-flight IMU or compass warning — switch to ATTI mode if possible; land at nearest safe spot.
- Do not attempt prolonged flight with degraded navigation.
- Recalibrate per OEM on the ground in a clean magnetic environment before any further flight.
- If error persists post-calibration — aircraft grounded pending investigation.

## **6.6 Motor Failure**

- On detection (warning, asymmetric vibration, loss of authority) — initiate immediate landing at nearest safe spot.
- Most multirotors cannot maintain controlled flight with motor failure; some have limited fail-safe.
- Cordon area; preserve aircraft for investigation; do not attempt re-flight until inspected.
- Report as incident ({{organization.doc_prefix}}-FRM-027).

## **6.7 Fly-Away / Loss of Control**

|**Fly-Away — Immediate Actions** 1. Do not pursue the aircraft on foot or by vehicle without thinking through the safety risk. 2. Note last known position, altitude, heading, time. 3. Notify Ops Manager and, if airspace impact possible, the relevant air traffic authority IMMEDIATELY. 4. Initiate search and recovery only when safe to do so. 5. Treat as a P1 incident. Preserve all logs and SD cards.|
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

## **6.8 In-Flight Fire / Smoke**

- Land immediately at nearest safe spot, away from people, vehicles, flammable materials, and dry vegetation.
- Do not approach the aircraft until smoke / fire has visibly stopped and battery has cooled — minimum 15 minutes; longer if available.
- Use a Class D / dry-powder / sand extinguisher only as last resort; water can worsen lithium fires.
- Cordon area; notify Ops Manager; notify emergency services if uncontrolled fire risk.
- Preserve scene for investigation; treat as P1 incident.

## **6.9 Loss of Visual Contact (VLOS Operations)**

- PIC immediately initiates RTH or hover where last seen.
- VO assists with re-acquisition.
- If not re-acquired within 30 seconds and RTH is engaged, monitor GCS for aircraft progress.
- If re-acquired, resume normal operations; if not, complete RTH and post-flight investigation.

## **6.10 Bird Strike / Foreign Object**

- Continue flight if aircraft response is stable; assess for damage on next safe landing.
- If response is unstable, land immediately at nearest safe spot.
- Document on flight log; inspect aircraft before next flight; report to OEM if structural damage.

## **6.11 Inadvertent Entry into Cloud / Precipitation**

- Initiate immediate manoeuvre to clear airspace — typically descend below cloud base.
- If aircraft is not IP-rated, RTH and land before water ingress can occur.
- Do not continue mission in conditions outside operating envelope.

## **6.12 Third-Party Intrusion into Operating Area**

- PIC immediately moves aircraft away from intruder; gain altitude if safe; hover or RTH.
- VO or ground crew warns intruder verbally; physical intervention only if safe to do so.
- Pause operation until area is secure.
- Log incident; assess whether cordon and signage need improvement for future operations.

# **Chapter 7 — Specific Operations**

## **7.1 Night Operations**

Night operations require specific regulator authorization and additional pilot currency. {{organization.trade_name}} conducts night ops only with these in place.

- Aircraft must have appropriate position and anti-collision lighting per regulation.
- Operating area lit sufficiently for VO to maintain visual reference, or VO uses appropriate night-vision aids.
- Pre-flight site survey conducted in daylight where possible to identify obstacles.
- Pilot night currency per Chapter 4.2 — minimum 1 night flight in last 90 days.
- Lower thresholds for caution — terminate at any compromise to visual reference.

## **7.2 BVLOS Operations**

Beyond Visual Line of Sight operations require specific regulator authorization (UAE GCAA specific category, KSA GACA STS-B1, etc.) and a documented Concept of Operations approved by the regulator.

- Mission plan must match the approved CONOPS exactly.
- Detect-and-avoid means (visual observers along the corridor, electronic surveillance, or both) must match the approval.
- Communications continuity — primary and backup link, both tested before launch.
- Contingency procedures — what happens if link is lost, what happens at airspace edge, what happens if intruder detected.
- Real-time monitoring — flight crew remain attentive to telemetry for the entire mission.

## **7.3 Autonomous ****&**** Dock-Based Operations**

Autonomous and dock-based operations are conducted only at sites where the deployment has been individually authorized and where the mission library has been peer-reviewed and signed off.

- Site survey complete per {{organization.doc_prefix}}-MAN-001 Section 9.2 before commissioning.
- Authorized flight envelope geofenced; deviations trigger automatic safe response.
- Remote pilot on call during operating hours; response time per SLA.
- Daily dock health check; weekly missed-mission review; monthly site visit.
- Incident response per Chapter 6 and {{organization.doc_prefix}}-MAN-001 Section 9.4.
- Annual full review of the mission library and CONOPS.

## **7.4 Operations Near Aerodromes**

- Default no-fly within 5 km of an aerodrome unless coordinated and approved.
- Where authorized, coordination with ATC or aerodrome operator at all times during flight.
- Direct radio or phone link to aerodrome operator maintained.
- Aircraft remains below the agreed altitude envelope at all times.

## **7.5 Operations Over People**

- Default avoid overflight of uninvolved persons.
- Where unavoidable (urban inspection, event), only conducted under specific regulator authorization, with appropriate aircraft class, parachute, or other mitigation.
- Even with authorization, plan ground tracks to minimize exposure.

## **7.6 Operations in Hot / Dusty / Coastal Environments**

- Hot ambient (above 40°C): reduced battery performance; reduced flight time; thermal envelope of aircraft and payload monitored.
- Dusty / sandy: sensors and motors cleaned after every operating day; air filters where applicable; storage in sealed cases.
- Coastal / humid: corrosion check at end of every operating week; rinsing aircraft with fresh water if salt spray exposure suspected; immediate drying.
- Sand-storm conditions — no flight; activities suspended.

## **7.7 Solar PV Inspection Operations**

Detailed procedure in {{organization.doc_prefix}}-MAN-001 Section 10 and {{organization.doc_prefix}}-SOP-007. Flight-specific elements:

- Pre-coordination with plant operator — confirm export status (modules under load), SCADA contact.
- Conditions per IEC 62446-3:2017 — irradiance ≥600 W/m², wind ≤4 m/s preferred, clear sky preferred.
- Altitude and angle per planning — typically 15–30 m AGL for module-level resolution; imaging angle within ±30° of normal.
- Sidelap 25% minimum for thermal mosaic; tighter for higher-resolution work.
- Reference imagery captured of a known-good module at start and end of each inspection block.
- Site hazards — DC voltage, hot inverters, snakes/scorpions; PPE mandatory.

# **Chapter 8 — Safety Management System**

## **8.1 Safety Policy**

{{organization.trade_name}} is committed to the safe conduct of every flight. Safety has priority over commercial outcomes and schedule. The {{roles.accountable_manager_title}} is responsible for the effectiveness of the safety management system.

## **8.2 Safety Reporting**

- Every employee and contractor is required to report hazards, incidents, near misses, and unsafe acts.
- Reports are made on {{organization.doc_prefix}}-FRM-027 within 24 hours; immediate verbal notification for serious events.
- Just culture — honest reports of error are not punished; reckless conduct, violation, and concealment are.
- Anonymous reporting available via the QHSE channel.

## **8.3 Risk Management**

- Operational risk assessments are held in standing form for each platform and service line.
- Project-specific JSA ({{organization.doc_prefix}}-FRM-025) completed before every site mobilization.
- Hazard hierarchy of control applied — eliminate, substitute, engineering, administrative, PPE.
- Residual risk rated; high-rated risks escalated to MD before flight authorized.

## **8.4 Safety Performance Monitoring**

- Leading indicators — pre-flight checklist completion rate, JSA completion rate, training currency rate, hazard observation rate.
- Lagging indicators — incidents per 1,000 flight hours, lost time injuries, regulator-reportable events.
- Monthly safety review by Ops Manager and QHSE Lead; quarterly leadership review; annual Management Review.

## **8.5 Safety Promotion**

- Periodic safety bulletins — learning from incidents (anonymized where appropriate).
- Annual safety day — workshop, scenarios, refresher.
- Safety recognition — credit given to staff who raise hazards or stop work appropriately.

# **Chapter 9 — Reporting ****&**** Records**

## **9.1 Reporting Matrix**

|**Event**                                    |**Internal**                                                           |**Regulator**                            |**Client**         |**Insurer**                     |
|---------------------------------------------|-----------------------------------------------------------------------|-----------------------------------------|-------------------|--------------------------------|
|Accident (injury, damage, third-party)       |Immediate verbal to MD; {{organization.doc_prefix}}-FRM-027 within 24 h|Per regulator rules (typically immediate)|Same business day  |Per policy (typically immediate)|
|Serious incident (no harm but high potential)|Within 24 h, {{organization.doc_prefix}}-FRM-027                       |Per regulator rules                      |Same business day  |Per policy                      |
|Incident                                     |Within 24 h, {{organization.doc_prefix}}-FRM-027                       |Per regulator rules                      |If client-affecting|If policy-affecting             |
|Near miss                                    |Within 24 h, {{organization.doc_prefix}}-FRM-027                       |Per voluntary scheme                     |Optional           |n/a                             |
|Hazard observation                           |{{organization.doc_prefix}}-FRM-027                                    |n/a                                      |n/a                |n/a                             |
|Regulatory non-compliance                    |Immediate to MD + Compliance                                           |Voluntary self-report considered         |If contractual     |If material                     |

## **9.2 Regulator Reporting Channels**

> **DronOps platform note —** regulator contacts are held as live platform data (occurrence records surface the correct channel and statutory deadline for the binding jurisdiction); the ‘updated every 6 months’ obligation is a review-due item, not a manually maintained list.

- UAE GCAA — GCAA UAS office; phone + email; reporting form per CAR-VI Part X.
- UAE DCAA — DCAA operations centre; phone + email; reporting per DCAA UAS rules.
- KSA GACA — GACA Drones Department; phone + email; reporting per GACAR Part 107.
- Indonesia DGCA — DGCA Kemenhub; per PM 37/2020.
- Contact details maintained in the Legal Register; updated at least every 6 months.

## **9.3 Records Retained**

|**Record**                      |**Retention**                  |**Owner**                   |
|--------------------------------|-------------------------------|----------------------------|
|Pilot logbook entries           |Career + 5 years post departure|Pilot + Ops Manager         |
|Flight logs (per sortie)        |5 years                        |Ops Manager                 |
|Pre-flight checklists           |5 years                        |Ops Manager                 |
|Post-flight reports             |5 years                        |Ops Manager                 |
|Maintenance records             |Asset life + 3 years           |Ops Manager                 |
|Calibration records             |Asset life + 3 years           |Ops Manager                 |
|Incident reports + investigation|10 years                       |QHSE Lead                   |
|Training records                |Employment + 3 years           |HR                          |
|Authorizations / permits        |5 years post expiry            |{{roles.quality_lead_title}}|

## **9.4 FOM Maintenance**

- This FOM is reviewed at least annually by the {{roles.ops_manager_title}}.
- Triggers for off-cycle revision: change in any operating regulator’s rules; introduction of new aircraft type; incident investigation finding; client or audit requirement; introduction of new service line.
- Revisions approved by MD; distributed to all flight-operations staff; previous versions archived per {{organization.doc_prefix}}-MAN-001 Section 6.
- Pilots and observers must acknowledge new revisions in writing or via the training system.

# **Chapter 10 — Annexes**

## **Annex A — Aircraft Type Operating Summary Template**

For each aircraft type in the fleet, the following summary is held as a controlled annex to this FOM. Master copies maintained by the {{roles.ops_manager_title}}.

|**Field**                                     |**Content**|
|----------------------------------------------|-----------|
|Aircraft Type / Model                         |           |
|Manufacturer + Flight Manual Reference        |           |
|MTOW                                          |           |
|Maximum operating wind (steady / gust)        |           |
|Operating temperature range                   |           |
|Maximum altitude AGL (manufacturer)           |           |
|Flight time (typical / max payload)           |           |
|Battery type, capacity, cycle life            |           |
|Lost-link behavior                            |           |
|RTH behavior and altitude setting             |           |
|Payload options and limitations               |           |
|IP rating / weather capability                |           |
|Required pilot qualification                  |           |
|Type-specific emergency procedures (cross-ref)|           |
|Last maintenance date / next due              |           |

## **Annex B — Site Survey Checklist (Autonomous / Dock Deployment)**

- Site address, coordinates, contact, access procedure.
- Dock pad — surface, dimensions, drainage, security.
- Aircraft operating envelope — flight corridor, takeoff/landing zone, obstacle clearance.
- Airspace context — airport proximity, controlled airspace edges, NOTAMs.
- Power — supply, voltage, redundancy, UPS, lightning protection, surge protection.
- Connectivity — primary, backup, bandwidth, latency, monitoring.
- RF environment — survey at the site for interference; GPS signal quality.
- Environmental — temperature range, dust exposure, salt spray, weather extremes.
- Security — physical access, surveillance, tamper detection.
- Regulatory — operator authorization scope, BVLOS approval, mission library approval.
- Client integration — alert channel, escalation, support contacts.
- Pre-acceptance test flight passed.

## **Annex C — BVLOS / Specific Operation CONOPS Template**

Each BVLOS or specific-category authorization requires a Concept of Operations document. Held as a controlled annex per authorization. Required headings:

- Operation description and scope.
- Aircraft and equipment.
- Operating volume — geographic, vertical, ground risk class.
- Crew composition and qualifications.
- Detect-and-avoid means.
- Communications — primary, backup, range, contingencies.
- Normal procedures — including any deviations from the standard FOM.
- Abnormal and emergency procedures — specific to the operation.
- Risk assessment — SORA or equivalent, ground and air risk.
- Mitigations and operational limits.
- Training and currency requirements specific to this operation.
- Authorization reference and validity.

## **Annex D — Cross-Reference to Standards ****&**** Operations Manual ({{organization.doc_prefix}}-MAN-001)**

|**FOM Topic**                             |**Where Detailed in {{organization.doc_prefix}}-MAN-001**|
|------------------------------------------|---------------------------------------------------------|
|Pilot competence framework                |Section 18                                               |
|Asset management & calibration            |Section 11                                               |
|Subcontractor management (pilots)         |Section 12                                               |
|Incident investigation & corrective action|Sections 27, 35                                          |
|Document control                          |Section 6                                                |
|QHSE & site safety                        |Sections 25, 26                                          |
|Battery handling & environment            |Section 28                                               |
|Data handling of flight logs and imagery  |Sections 30, 31                                          |

*— End of Flight Operations Manual —*

Operational & Regulatory Reference  |  Page  of