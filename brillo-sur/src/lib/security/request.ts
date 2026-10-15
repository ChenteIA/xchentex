import "server-only";

import { createHmac } from "node:crypto";
import { serverEnv } from "@/lib/env.server";

/**
 * IP del cliente. En Vercel, x-forwarded-for lo fija la propia plataforma
 * (el primer valor es la IP real), así que no puede falsificarse.
 */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * La IP no se guarda en claro (dato personal): se usa un HMAC con una clave del servidor.
 */
export function hashedKey(scope: string, value: string): string {
  const h = createHmac("sha256", `rate-limit:${serverEnv().PHONE_ENCRYPTION_KEY}`).update(value).digest("hex");
  return `${scope}:${h.slice(0, 40)}`;
}

/**
 * Rechaza peticiones de otros sitios (defensa CSRF para endpoints JSON).
 */
export function isSameOrigin(headers: Headers, siteUrl: string): boolean {
  if (headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = headers.get("origin");
  if (!origin) return false;
  const allowed = new Set<string>([new URL(siteUrl).origin]);
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host) {
    const proto = headers.get("x-forwarded-proto") ?? "https";
    allowed.add(`${proto}://${host}`);
  }
  return allowed.has(origin);
}
