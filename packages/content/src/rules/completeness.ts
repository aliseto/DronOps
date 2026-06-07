import { z } from "zod";
import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Flight-record field-level completeness matrix (DRO-REG-001 §5). The platform
 * flight record is the union of all fields; each framework reads its required
 * subset. Required-field validation is jurisdiction-aware at reconcile time.
 */
export const FLIGHT_FIELDS = [
  "dateOfFlight",
  "startEndTime",
  "pilotInCommand",
  "otherCrew",
  "aircraftIdentity",
  "uaWeightColour",
  "routeGps",
  "takeoffLandingAreas",
  "opType",
  "flightRules",
  "observations",
  "airspaceApprovalRef",
  "pilotSignoff",
  "outcome",
  "prePostInspection",
] as const;
export type FlightField = (typeof FLIGHT_FIELDS)[number];

const schema = z.array(z.enum(FLIGHT_FIELDS));

// ● = explicitly required in that regime (DRO-REG-001 §5).
export const FLIGHT_COMPLETENESS: Partial<Record<Jurisdiction, FlightField[]>> = {
  "UAE-Federal": [
    "dateOfFlight",
    "startEndTime",
    "pilotInCommand",
    "aircraftIdentity",
    "uaWeightColour",
    "routeGps",
    "observations",
    "airspaceApprovalRef",
  ],
  "UAE-Dubai": [
    "dateOfFlight",
    "startEndTime",
    "pilotInCommand",
    "otherCrew",
    "aircraftIdentity",
    "takeoffLandingAreas",
    "opType",
    "observations",
    "airspaceApprovalRef",
    "pilotSignoff",
    "prePostInspection",
  ],
  KSA: [
    "dateOfFlight",
    "startEndTime",
    "pilotInCommand",
    "otherCrew",
    "aircraftIdentity",
    "takeoffLandingAreas",
    "opType",
    "flightRules",
    "observations",
    "outcome",
    "prePostInspection",
  ],
  ISO: [],
};

for (const r of Object.values(FLIGHT_COMPLETENESS)) schema.parse(r);
