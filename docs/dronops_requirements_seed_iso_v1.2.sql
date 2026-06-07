-- DronOps requirement_defs seed ADDENDUM v1.2 (2026-06-07) — ISO 9001:2015
-- Quality Management Systems. Summaries are paraphrased operational
-- interpretations authored for compliance tracking; they are NOT the
-- standard's text. The QM should cross-check against Aironov's licensed copy
-- of ISO 9001:2015 (ISO holds copyright in the standard itself).
-- Jurisdiction derivation for converter: framework 'ISO 9001' -> 'ISO'.
-- kind: all 'standard' (normative requirements when ISO mode enabled). If the
-- kind enum is regulation|guidance only, map 'standard' -> 'regulation'.
-- These clauses map onto the platform's own QMS machinery (M1/M2) — ISO
-- compliance is demonstrable from daily operation rather than a separate binder.

insert into requirement_defs (id, framework, clause, title, summary, record_types, version) values

('ISO9001:4.1','ISO 9001','4.1','Understanding the organization and its context',
 'Determine the external and internal issues relevant to the QMS purpose and strategic direction, and monitor and review information about them.',
 array['document','risk_assessment'],'2015'),
('ISO9001:4.2','ISO 9001','4.2','Needs and expectations of interested parties',
 'Determine the interested parties relevant to the QMS and their relevant requirements, and monitor and review this information.',
 array['document'],'2015'),
('ISO9001:4.4','ISO 9001','4.4','Quality management system and its processes',
 'Establish, implement, maintain and continually improve the QMS including the processes needed, their sequence and interaction, criteria and methods, resources, responsibilities, risks, and process performance.',
 array['document'],'2015'),
('ISO9001:5.1','ISO 9001','5.1','Leadership and commitment',
 'Top management must demonstrate leadership and commitment to the QMS and to customer focus, including accountability for effectiveness and integration of QMS requirements into business processes.',
 array['document','management_review'],'2015'),
('ISO9001:5.2','ISO 9001','5.2','Quality policy',
 'Establish, communicate and make available a quality policy appropriate to the organization, providing a framework for objectives and a commitment to satisfy requirements and continual improvement.',
 array['document'],'2015'),
('ISO9001:5.3','ISO 9001','5.3','Organizational roles, responsibilities and authorities',
 'Assign, communicate and maintain responsibilities and authorities for relevant roles, including ensuring QMS conformity, process outputs, reporting on performance, and customer focus.',
 array['document','personnel_record'],'2015'),
('ISO9001:6.1','ISO 9001','6.1','Actions to address risks and opportunities',
 'Plan actions to address the risks and opportunities determined from context and interested parties, integrate them into QMS processes, and evaluate their effectiveness.',
 array['risk_assessment','finding'],'2015'),
('ISO9001:6.2','ISO 9001','6.2','Quality objectives and planning to achieve them',
 'Establish measurable quality objectives at relevant functions and levels, consistent with the policy, and plan how they will be achieved, monitored and updated.',
 array['document','management_review'],'2015'),
('ISO9001:7.1.5','ISO 9001','7.1.5','Monitoring and measuring resources',
 'Provide and maintain suitable monitoring and measuring resources; where measurement traceability is required, calibrate or verify equipment against traceable standards and retain records.',
 array['maintenance_record','document'],'2015'),
('ISO9001:7.2','ISO 9001','7.2','Competence',
 'Determine necessary competence for persons affecting QMS performance, ensure competence on the basis of education, training or experience, take actions to acquire it, and retain evidence.',
 array['training_record','credential','personnel_record'],'2015'),
('ISO9001:7.5','ISO 9001','7.5','Documented information',
 'Create, identify, format, review and approve documented information for adequacy, and control its distribution, access, storage, version, retention and disposition; control documents of external origin.',
 array['document','audit_pack'],'2015'),
('ISO9001:8.4','ISO 9001','8.4','Control of externally provided processes, products and services',
 'Ensure externally provided processes, products and services conform to requirements: evaluate, select, monitor and re-evaluate external providers based on their ability to meet requirements, and retain records.',
 array['document','finding'],'2015'),
('ISO9001:8.5','ISO 9001','8.5','Production and service provision',
 'Control the provision of services under controlled conditions: available documented information, suitable resources, monitoring activities, competent persons, identification and traceability, and control of changes.',
 array['mission_record','flight_record','document'],'2015'),
('ISO9001:8.6','ISO 9001','8.6','Release of products and services',
 'Verify that requirements have been met before releasing products and services to the customer, with evidence of conformity and traceability to the authorizing person.',
 array['mission_record','flight_record'],'2015'),
('ISO9001:8.7','ISO 9001','8.7','Control of nonconforming outputs',
 'Identify and control outputs that do not conform to requirements to prevent unintended use or delivery; take appropriate action (correction, segregation, return, concession) and retain records of the nonconformity and actions.',
 array['finding'],'2015'),
('ISO9001:9.1','ISO 9001','9.1','Monitoring, measurement, analysis and evaluation',
 'Determine what needs monitoring and measuring, the methods, and when; evaluate QMS performance and effectiveness and customer satisfaction; analyse and evaluate the resulting data and retain evidence.',
 array['management_review','audit_pack'],'2015'),
('ISO9001:9.2','ISO 9001','9.2','Internal audit',
 'Conduct internal audits at planned intervals to confirm the QMS conforms to requirements and is effectively implemented; plan a programme, define criteria and scope, ensure auditor objectivity, report results, and act on findings.',
 array['finding','audit_pack','management_review'],'2015'),
('ISO9001:9.3','ISO 9001','9.3','Management review',
 'Top management reviews the QMS at planned intervals against defined inputs (status of actions, changes, performance, audit results, nonconformities, customer feedback, risks) and records decisions on improvement, change and resource needs.',
 array['management_review'],'2015'),
('ISO9001:10.2','ISO 9001','10.2','Nonconformity and corrective action',
 'On a nonconformity, react and correct it, evaluate the need to eliminate the cause through root-cause analysis, implement corrective action, review effectiveness, and retain records of the nonconformity and actions taken. Verifier independence supports objectivity.',
 array['finding'],'2015'),
('ISO9001:10.3','ISO 9001','10.3','Continual improvement',
 'Continually improve the suitability, adequacy and effectiveness of the QMS, using analysis results, management review outputs, and corrective actions to identify improvement opportunities.',
 array['management_review','finding'],'2015');
