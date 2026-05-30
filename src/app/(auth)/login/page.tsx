import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
