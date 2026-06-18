"use server";

import { revalidatePath } from "next/cache";
import { getActiveContext } from "@/server/context";
import { importDjiLog, parseLog } from "@/server/ingestion";

export async function importLogAction(fd: FormData) {
  const ctx = await getActiveContext();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a DJI .txt log to upload");
  const bytes = new Uint8Array(await file.arrayBuffer());
  await importDjiLog(ctx, file.name, bytes);
  revalidatePath("/evidence");
}

export async function retryParseAction(fd: FormData) {
  const ctx = await getActiveContext();
  await parseLog(ctx, String(fd.get("id")));
  revalidatePath("/evidence");
}
