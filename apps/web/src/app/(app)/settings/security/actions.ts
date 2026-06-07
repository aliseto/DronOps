"use server";

import type {
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { getCurrentUser } from "@/lib/session";
import { beginPasskeyEnrollment, finishPasskeyEnrollment } from "@/server/passkey";

export async function startPasskeyEnrollment() {
  const user = await getCurrentUser();
  if (!user?.id || !user.email) throw new Error("Not authenticated");
  return beginPasskeyEnrollment({ id: user.id, email: user.email });
}

export async function completePasskeyEnrollment(
  response: RegistrationResponseJSON,
  label?: string,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  return finishPasskeyEnrollment({ id: user.id }, response, label);
}
