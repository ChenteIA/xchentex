import "server-only";

import { serverEnv } from "@/lib/env.server";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Valida en el servidor el token de Cloudflare Turnstile (punto 12).
 * Cada token sirve una sola vez y caduca a los 5 minutos.
 */
export async function verifyTurnstile(token: string, ip: string, expectedHostname?: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret: serverEnv().TURNSTILE_SECRET_KEY, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[turnstile] HTTP", res.status);
      return false;
    }
    const data = (await res.json()) as { success?: boolean; hostname?: string; "error-codes"?: string[] };
    if (!data.success) {
      console.warn("[turnstile] rechazado", data["error-codes"]);
      return false;
    }
    // Con las claves de prueba de Cloudflare el hostname es "example.com"; se valida solo en producción.
    if (process.env.VERCEL_ENV === "production" && expectedHostname && data.hostname !== expectedHostname) {
      console.warn("[turnstile] hostname inesperado", data.hostname);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[turnstile] error", err);
    return false;
  }
}
