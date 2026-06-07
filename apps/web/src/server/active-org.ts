import "server-only";
import { cookies } from "next/headers";
import { listUserOrganizations } from "./org";

const COOKIE = "dronops-active-org";

/** The active org for the request: cookie if set, else the user's first org. */
export async function getActiveOrgId(userId: string): Promise<string | null> {
  const store = await cookies();
  const fromCookie = store.get(COOKIE)?.value;
  if (fromCookie) return fromCookie;
  const orgs = await listUserOrganizations(userId);
  return orgs[0]?.orgId ?? null;
}

export async function setActiveOrgCookie(orgId: string) {
  const store = await cookies();
  store.set(COOKIE, orgId, { httpOnly: true, sameSite: "lax", path: "/" });
}
