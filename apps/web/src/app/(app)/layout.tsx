import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return <AppNav email={user.email}>{children}</AppNav>;
}
