import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; redirect?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginForm
      rol={params.rol}
      redirect={params.redirect}
    />
  );
}
