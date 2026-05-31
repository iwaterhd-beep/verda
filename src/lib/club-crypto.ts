export const cryptoNetworkOptions = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "SOL", label: "Solana (SOL)" },
  { value: "USDT_TRC20", label: "USDT (TRC-20)" },
  { value: "USDT_ERC20", label: "USDT (ERC-20)" },
  { value: "LTC", label: "Litecoin (LTC)" },
  { value: "OTRO", label: "Otra red" },
] as const;

export type CryptoNetwork = (typeof cryptoNetworkOptions)[number]["value"];

export function cryptoNetworkLabel(network: string | null | undefined) {
  if (!network) return "Cripto";
  return (
    cryptoNetworkOptions.find((o) => o.value === network)?.label ?? network
  );
}

export const cryptoNetworkValues = cryptoNetworkOptions.map((o) => o.value);
