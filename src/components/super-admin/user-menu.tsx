"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { avatarUrl, initials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function SuperAdminUserMenu() {
  const router = useRouter();
  const [name, setName] = React.useState("Super Admin");
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setName(
          (data.user.user_metadata?.name as string) ||
            data.user.email?.split("@")[0] ||
            "Super Admin",
        );
      }
    });
  }, []);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl p-1 pr-2 outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl(name)} alt={name} />
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-medium">{name}</p>
          <p className="max-w-[160px] truncate text-xs text-muted-foreground">
            {email || "Super admin"}
          </p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          Plataforma
          <Badge variant="default" className="text-[0.6rem]">
            <Shield className="h-3 w-3" /> Super
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            handleLogout();
          }}
        >
          {loading ? <Loader2 className="animate-spin" /> : <LogOut />} Cerrar
          sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
