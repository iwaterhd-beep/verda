/**
 * Borra datos de prueba en Supabase (pedidos, socios, solicitudes, productos…).
 * Conserva clubs y cuentas admin / super admin.
 *
 * Uso: node scripts/reset-test-data.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

function loadEnv() {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    /* .env.local opcional si vars ya están en el entorno */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function deleteAll(table, filterColumn = "id") {
  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .not(filterColumn, "is", null);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table}: ${count ?? 0} filas borradas`);
}

async function main() {
  console.log("🧹 Borrando datos de prueba en Supabase…\n");

  await deleteAll("order_items", "order_id");
  await deleteAll("orders");
  await deleteAll("wallet_movements");
  await deleteAll("member_applications");
  await deleteAll("members");
  await deleteAll("products", "club_id");

  const { data: memberProfiles, error: profErr } = await admin
    .from("profiles")
    .select("id, email")
    .eq("role", "MEMBER");

  if (profErr) throw new Error(`profiles: ${profErr.message}`);

  for (const p of memberProfiles ?? []) {
    const { error } = await admin.auth.admin.deleteUser(p.id);
    if (error) {
      console.warn(`  ⚠ No se pudo borrar usuario ${p.email}: ${error.message}`);
    } else {
      console.log(`  ✓ auth user borrado: ${p.email ?? p.id}`);
    }
  }

  console.log("\n✅ Limpieza completada. Clubs y admins conservados.");
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});
