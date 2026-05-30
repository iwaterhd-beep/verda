import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-verda-mesh opacity-60" />
      <header className="relative mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
        <Link href="/">
          <Logo />
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Inicio
        </Link>
      </header>
      <main className="relative mx-auto max-w-2xl px-4 pb-16">{children}</main>
    </div>
  );
}
