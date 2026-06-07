"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { ingestFlight, reconcileFlight, sealFlight } from "@/server/flight-evidence";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim() || undefined;

export async function ingestFlightAction(formData: FormData) {
  const c = await ctx();
  const aircraftId = String(formData.get("aircraftId") ?? "");
  const csvText = String(formData.get("csvText") ?? "");
  if (!aircraftId || !csvText.trim()) throw new Error("Aircraft and a flight log are required");
  await ingestFlight(c, {
    aircraftId,
    csvText,
    fileName: str(formData.get("fileName")),
    jurisdiction: str(formData.get("jurisdiction")),
    pilotPersonId: str(formData.get("pilotPersonId")),
  });
  revalidatePath("/evidence");
}

export async function reconcileFlightAction(formData: FormData) {
  const c = await ctx();
  const id = String(formData.get("flightId") ?? "");
  if (!id) throw new Error("Flight is required");
  const ceil = Number(formData.get("ceilingOverrideM") ?? "");
  await reconcileFlight(c, id, {
    jurisdiction: str(formData.get("jurisdiction")),
    pilotPersonId: str(formData.get("pilotPersonId")),
    ceilingOverrideM: Number.isFinite(ceil) && ceil > 0 ? ceil : undefined,
  });
  revalidatePath("/evidence");
}

export async function sealFlightAction(flightId: string) {
  await sealFlight(await ctx(), flightId);
  revalidatePath("/evidence");
}
