import { BottomNav } from "@/components/portal/bottom-nav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-verda-mesh opacity-60" />
      <div className="portal-shell relative mx-auto max-w-md">{children}</div>
      <BottomNav />
    </div>
  );
}
