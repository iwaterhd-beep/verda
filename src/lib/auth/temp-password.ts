import { randomBytes } from "node:crypto";

/** Contraseña temporal legible (mín. 8 caracteres). */
export function generateTempPassword() {
  return randomBytes(6).toString("base64url").slice(0, 9) + "7a";
}
