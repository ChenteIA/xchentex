import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Límite de intentos guardado en Postgres (funciona entre instancias de Vercel).
 * Devuelve true si la petición está permitida. Si la BD falla, se bloquea (fail-closed).
 */
export async function allowRequest(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] error", error.code, error.message);
    return false;
  }
  return data === true;
}
