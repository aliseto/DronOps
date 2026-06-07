import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthError } from "next-auth";
import { Button, Card, Input } from "@dronops/ui";
import { signIn } from "@/auth";
import { createUser, emailExists } from "@/server/users";

const schema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const parsed = schema.safeParse({
      name: formData.get("name") || undefined,
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) redirect("/signup?error=invalid");
    if (await emailExists(parsed.data.email)) redirect("/signup?error=exists");

    await createUser(parsed.data);
    try {
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirectTo: "/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) redirect("/signin");
      throw err;
    }
  }

  return (
    <Card>
      <h1 className="text-heading font-semibold text-fg-primary">Create account</h1>
      <form action={action} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Name
          <Input name="name" type="text" autoComplete="name" />
        </label>
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Email
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1 text-small text-fg-secondary">
          Password
          <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
        </label>
        {error === "exists" && (
          <p role="alert" className="text-small text-status-danger-fg">
            That email is already registered.
          </p>
        )}
        {error === "invalid" && (
          <p role="alert" className="text-small text-status-danger-fg">
            Enter a valid email and a password of at least 8 characters.
          </p>
        )}
        <Button type="submit" className="mt-1 w-full">
          Create account
        </Button>
      </form>
      <p className="mt-4 text-small text-fg-muted">
        Already have an account?{" "}
        <Link href="/signin" className="text-accent">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
