import { Inngest } from "inngest";

/**
 * The DronOps jobs runtime. First lit up for audit-partition roll-forward
 * (P0 hardening); the deadline-escalation and currency-snapshot sweeps register
 * the same way. Event keys are documented as they are added.
 */
export const inngest = new Inngest({ id: "dronops" });
