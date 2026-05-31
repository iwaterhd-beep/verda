import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MenuPageClient } from "./menu-client";

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MenuPageClient />
    </Suspense>
  );
}
