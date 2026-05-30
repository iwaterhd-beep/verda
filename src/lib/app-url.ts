import { headers } from "next/headers";

/** URL pública de la app (usa el dominio actual, no localhost en producción). */
export async function getAppBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;
  return "http://localhost:3000";
}
