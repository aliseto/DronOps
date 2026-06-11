"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import {
  createOccurrence,
  updateOccurrence,
  transitionOccurrence,
  markReportedToRegulator,
  escalateToFinding,
  type CreateOccurrenceInput,
} from "@/server/safety";
import type { OccurrenceClass } from "@dronops/shared";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function fileOccurrenceAction(formData: FormData) {
  const c = await ctx();
  const classification = String(formData.get("classification") ?? "") as OccurrenceClass;
  const title = String(formData.get("title") ?? "").trim();
  const jurisdiction = String(formData.get("jurisdiction") ?? "").trim();
  const occurredAt = String(formData.get("occurredAt") ?? "").trim();
  if (!title) throw new Error("A short title is required");
  if (!jurisdiction) throw new Error("A jurisdiction is required");
  if (!occurredAt) throw new Error("When it occurred is required");
  const input: CreateOccurrenceInput = {
    classification,
    title,
    description: String(formData.get("description") ?? "").trim() || undefined,
    jurisdiction,
    occurredAt: new Date(occurredAt),
  };
  // Offline replays carry the device capture timestamp (preserved, UX §10).
  const reportedAt = String(formData.get("reportedAt") ?? "").trim();
  if (reportedAt) input.reportedAt = new Date(reportedAt);
  const id = await createOccurrence(c, input);
  revalidatePath("/safety");
  return id;
}

export async function updateOccurrenceAction(formData: FormData) {
  const c = await ctx();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("An occurrence is required");
  const field = (k: string) => {
    const v = formData.get(k);
    return v == null ? undefined : String(v);
  };
  await updateOccurrence(c, id, {
    investigationSummary: field("investigationSummary"),
    rootCause: field("rootCause"),
  });
  revalidatePath(`/safety/${id}`);
}

export async function transitionOccurrenceAction(id: string, to: "open" | "investigating" | "closed") {
  const c = await ctx();
  await transitionOccurrence(c, id, to);
  revalidatePath(`/safety/${id}`);
  revalidatePath("/safety");
}

export async function markReportedAction(id: string) {
  const c = await ctx();
  await markReportedToRegulator(c, id);
  revalidatePath(`/safety/${id}`);
  revalidatePath("/safety");
}

export async function escalateAction(id: string, level: "major" | "minor" | "observation") {
  const c = await ctx();
  const code = await escalateToFinding(c, id, level);
  revalidatePath(`/safety/${id}`);
  revalidatePath("/safety");
  return code;
}
