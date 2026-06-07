import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Button, Card, Input } from "@dronops/ui";
import { signIn } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    try {
      await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    } catch (err) {
      if (err instanceof AuthError) redirect("/signin?error=1");
      throw err; // re-throw NEXT_REDIRECT and anything unexpected
    }
  }

  return (
    <Card>
      <h1 className="text-heading font-semibold text-fg-primary">Sign in</h1>
      <form action={action} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Email
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Password
          <Input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && (
          <p role="alert" className="text-small text-status-danger-fg">
            Incorrect email or password.
          </p>
        )}
        <Button type="submit" className="mt-1 w-full">
          Sign in
        </Button>
      </form>
      <p className="mt-4 text-small text-fg-muted">
        No account?{" "}
        <Link href="/signup" className="text-accent">
          Create one
        </Link>
      </p>
    </Card>
  );
}
