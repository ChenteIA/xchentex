import "server-only";
import { z } from "zod";

/**
 * Variables secretas. `server-only` hace fallar el build si este módulo
 * llega a importarse desde un componente de cliente (punto 1).
 */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  PHONE_ENCRYPTION_KEY: z.string().min(32),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    PHONE_ENCRYPTION_KEY: process.env.PHONE_ENCRYPTION_KEY,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variables de servidor inválidas o faltantes: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
