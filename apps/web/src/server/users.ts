import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getAdminDb } from "@dronops/db/client";
import { users } from "@dronops/db/schema";

/** Create a credentials user with a bcrypt password hash. Identity table → admin client. */
export async function createUser(input: { email: string; password: string; name?: string }) {
  const db = getAdminDb();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [user] = await db
    .insert(users)
    .values({ email: input.email, name: input.name, passwordHash })
    .returning();
  return user;
}

export async function emailExists(email: string): Promise<boolean> {
  const db = getAdminDb();
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return !!row;
}
