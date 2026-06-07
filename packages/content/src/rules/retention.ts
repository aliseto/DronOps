import { z } from "zod";

/**
 * Retention rules (DRO-REG-001 §4 + §15.1). Build-to-strictest: 36-month
 * default on all operational records; clocks are display/blocking metadata —
 * the platform never auto-deletes. UAE-Dubai personnel records additionally
 * run until employment-end + 36 months.
 */
const schema = z.object({
  defaultMonths: z.number().int().positive(),
  clause: z.string().min(1),
  personnelEmploymentEnd: z.record(
    z.string(),
    z.object({ months: z.number().int().positive(), clause: z.string().min(1) }),
  ),
});

export const RETENTION = {
  defaultMonths: 36,
  clause: "DRO-REG-001 §4 / §15.1",
  personnelEmploymentEnd: {
    "UAE-Dubai": { months: 36, clause: "DUOSAM OM" },
  },
} as const;

schema.parse(RETENTION);
