"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@dronops/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await createSupabaseBrowserClient().auth.signOut();
          router.replace("/sign-in");
          router.refresh();
        })
      }
    >
      Sign out
    </Button>
  );
}
