import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Default mission ceiling (metres AGL) per jurisdiction (DRO-REG-001 v2.0 §14).
 * The mission builder (M4) prefills this; operators may set a lower ceiling.
 * Oman = 122 m (AWR 033 / 400 ft).
 */
export const CEILING_DEFAULT_M: Partial<Record<Jurisdiction, number>> = {
  Oman: 122,
};
