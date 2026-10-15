import { z } from "zod";

/**
 * Variables públicas (llegan al navegador). Next.js solo las incrusta si se
 * leen de forma literal (process.env.NEXT_PUBLIC_X), por eso se listan una a una.
 * Se validan al usarse, no al importar, para que `next build` funcione en CI.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().regex(/^\d{8,15}$/, "Solo dígitos con código de país"),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof publicSchema>;

let cached: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  if (cached) return cached;
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) {
    // Solo nombres de variables, nunca valores.
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variables públicas inválidas o faltantes: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
