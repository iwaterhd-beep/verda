import { BottomNav } from "@/components/portal/bottom-nav";
import { PortalShellClient } from "@/components/portal/portal-shell-client";
import { PortalThemeProvider } from "@/components/portal/portal-theme-provider";
import { PORTAL_THEME_INIT_SCRIPT } from "@/lib/portal-theme";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PORTAL_THEME_INIT_SCRIPT }} />
      <PortalThemeProvider>
        <div className="relative min-h-screen">
          <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-verda-mesh opacity-60" />
          <PortalShellClient>
            <div className="portal-shell relative mx-auto max-w-md">{children}</div>
          </PortalShellClient>
          <BottomNav />
        </div>
      </PortalThemeProvider>
    </>
  );
}
