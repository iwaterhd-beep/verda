"use client";

import * as React from "react";
import { Bitcoin, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clearClubCryptoWalletAction,
  updateClubCryptoWalletAction,
} from "@/app/(dashboard)/configuracion/actions";
import {
  cryptoNetworkOptions,
  type CryptoNetwork,
} from "@/lib/club-crypto";
import { fetchClubPaymentSettings } from "@/lib/data/club-settings";

export function CryptoWalletSettings() {
  const queryClient = useQueryClient();
  const [address, setAddress] = React.useState("");
  const [network, setNetwork] = React.useState<CryptoNetwork>("BTC");
  const [saving, setSaving] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["club-payment-settings"],
    queryFn: fetchClubPaymentSettings,
  });

  React.useEffect(() => {
    if (!settings) return;
    setAddress(settings.cryptoWalletAddress ?? "");
    setNetwork(
      (settings.cryptoWalletNetwork as CryptoNetwork) || "BTC",
    );
  }, [settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateClubCryptoWalletAction({ address, network });
      if (res.error) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }
      toast.success("Cartera cripto guardada");
      await queryClient.invalidateQueries({
        queryKey: ["club-payment-settings"],
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (
      !window.confirm(
        "¿Quitar la cartera cripto? Los socios no verán dirección al pagar con cripto.",
      )
    ) {
      return;
    }
    setClearing(true);
    try {
      const res = await clearClubCryptoWalletAction();
      if (res.error) {
        toast.error("No se pudo quitar", { description: res.error });
        return;
      }
      setAddress("");
      setNetwork("BTC");
      toast.success("Cartera cripto eliminada");
      await queryClient.invalidateQueries({
        queryKey: ["club-payment-settings"],
      });
    } finally {
      setClearing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="h-5 w-5" />
          Cartera cripto
        </CardTitle>
        <CardDescription>
          Dirección donde los socios envían el pago al elegir{" "}
          <strong>Cripto</strong> en el portal o TPV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="crypto-network">Red / moneda</Label>
              <Select
                value={network}
                onValueChange={(v) => setNetwork(v as CryptoNetwork)}
              >
                <SelectTrigger id="crypto-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cryptoNetworkOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="crypto-address">Dirección de la cartera</Label>
              <Input
                id="crypto-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. bc1q… / 0x… / Solana…"
                className="font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Comprueba bien la dirección. Los pagos enviados a otra red se
                pueden perder.
              </p>
            </div>
            {settings?.cryptoWalletAddress && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
                Activa:{" "}
                {cryptoNetworkOptions.find(
                  (o) => o.value === settings.cryptoWalletNetwork,
                )?.label ?? settings.cryptoWalletNetwork}{" "}
                · {settings.cryptoWalletAddress.slice(0, 12)}…
                {settings.cryptoWalletAddress.slice(-8)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cartera
              </Button>
              {settings?.cryptoWalletAddress && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={clearing}
                  onClick={() => void handleClear()}
                >
                  {clearing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Quitar
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
