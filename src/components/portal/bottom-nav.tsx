"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Leaf, Receipt, User } from "lucide-react";
import { useCart } from "@/store/use-cart";
import { cn } from "@/lib/utils";

const items = [
  { href: "/portal", label: "Inicio", icon: Home },
  { href: "/portal/menu", label: "Menú", icon: Leaf },
  { href: "/portal/pedidos", label: "Pedidos", icon: Receipt },
  { href: "/portal/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const count = useCart((s) => s.count());

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((item) => {
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === "/portal/pedidos" && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] text-primary-foreground">
                    {count}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
