import { LoginForm } from "./login-form";

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
