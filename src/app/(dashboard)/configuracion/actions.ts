"use server";

import { createClient } from "@/lib/supabase/server";
import {
  cryptoNetworkValues,
  type CryptoNetwork,
} from "@/lib/club-crypto";

export type { CryptoNetwork };
export { cryptoNetworkOptions } from "@/lib/club-crypto";

export interface ClubPaymentSettings {
  clubName: string;
  cryptoWalletAddress: string | null;
  cryptoWalletNetwork: string | null;
}

async function resolveClubId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();

  let clubId = (profile?.club_id as string | null) ?? null;
  if (!clubId) {
    const { data: member } = await supabase
      .from("members")
      .select("club_id")
      .eq("user_id", user.id)
      .maybeSingle();
    clubId = (member?.club_id as string | null) ?? null;
  }

  if (!clubId) return { error: "Sin club asignado." as const };
  return { clubId, supabase };
}

async function staffClubId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "MEMBER" || !profile.club_id) {
    return { error: "Sin permisos." as const };
  }

  return { clubId: profile.club_id as string, supabase };
}

function isMissingCryptoColumn(message: string) {
  return /crypto_wallet/i.test(message);
}

function toSettings(row: {
  name: string;
  crypto_wallet_address?: string | null;
  crypto_wallet_network?: string | null;
}): ClubPaymentSettings {
  return {
    clubName: row.name,
    cryptoWalletAddress: row.crypto_wallet_address?.trim() || null,
    cryptoWalletNetwork: row.crypto_wallet_network?.trim() || null,
  };
}

export async function getClubPaymentSettingsAction(): Promise<{
  error?: string;
  settings?: ClubPaymentSettings;
}> {
  const auth = await resolveClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("clubs")
    .select("name, crypto_wallet_address, crypto_wallet_network")
    .eq("id", auth.clubId)
    .single();

  if (error) {
    if (isMissingCryptoColumn(error.message)) {
      const { data: basic } = await auth.supabase
        .from("clubs")
        .select("name")
        .eq("id", auth.clubId)
        .single();
      if (basic) {
        return {
          settings: {
            clubName: basic.name,
            cryptoWalletAddress: null,
            cryptoWalletNetwork: null,
          },
        };
      }
    }
    return { error: error.message };
  }

  return { settings: toSettings(data) };
}

export async function updateClubCryptoWalletAction(input: {
  address: string;
  network: string;
}): Promise<{ error?: string; settings?: ClubPaymentSettings }> {
  const address = input.address.trim();
  const network = input.network.trim();

  if (!address) {
    return { error: "Indica la dirección de la cartera." };
  }
  if (address.length < 8) {
    return { error: "La dirección parece demasiado corta." };
  }
  if (!cryptoNetworkValues.includes(network as CryptoNetwork)) {
    return { error: "Red no válida." };
  }

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const payload = {
    crypto_wallet_address: address,
    crypto_wallet_network: network,
  };

  let { data, error } = await auth.supabase
    .from("clubs")
    .update(payload)
    .eq("id", auth.clubId)
    .select("name, crypto_wallet_address, crypto_wallet_network")
    .single();

  if (error && isMissingCryptoColumn(error.message)) {
    return {
      error: "Ejecuta supabase/club-crypto-wallet.sql en Supabase.",
    };
  }
  if (error) return { error: error.message };
  if (!data) return { error: "No se encontró el club." };

  return { settings: toSettings(data) };
}

export async function clearClubCryptoWalletAction(): Promise<{
  error?: string;
  settings?: ClubPaymentSettings;
}> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("clubs")
    .update({
      crypto_wallet_address: null,
      crypto_wallet_network: null,
    })
    .eq("id", auth.clubId)
    .select("name, crypto_wallet_address, crypto_wallet_network")
    .single();

  if (error && isMissingCryptoColumn(error.message)) {
    return {
      error: "Ejecuta supabase/club-crypto-wallet.sql en Supabase.",
    };
  }
  if (error) return { error: error.message };
  if (!data) return { error: "No se encontró el club." };

  return { settings: toSettings(data) };
}
