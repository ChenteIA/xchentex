"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/admin-schemas";
import { allowRequest } from "@/lib/security/rate-limit";
import { clientIp, hashedKey } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

// Siempre el mismo mensaje: no revela si el correo existe (punto 11).
const GENERIC = "Correo o contraseña incorrectos.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = clientIp(h);

  // 5 intentos cada 15 minutos por IP (punto 11). Supabase además aplica sus propios límites.
  if (!(await allowRequest(hashedKey("login-ip", ip), 5, 15 * 60))) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    turnstileToken: formData.get("cf-turnstile-response") ?? formData.get("turnstileToken"),
  });
  if (!parsed.success) return { error: GENERIC };
  const { email, password, turnstileToken } = parsed.data;

  // Límite adicional por cuenta, para frenar ataques repartidos entre muchas IPs.
  if (!(await allowRequest(hashedKey("login-email", email), 10, 60 * 60))) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

  const siteHost = new URL(publicEnv().NEXT_PUBLIC_SITE_URL).hostname;
  if (!(await verifyTurnstile(turnstileToken, ip, siteHost))) {
    return { error: "No pudimos verificar que eres una persona. Recarga la página." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    // Nunca se registra la contraseña; solo el código de error (punto 10).
    console.warn("[login] fallido", error?.code ?? "sin-usuario");
    return { error: GENERIC };
  }

  // Además de la contraseña, debe tener un perfil activo de owner o staff (punto 7).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { error: GENERIC };
  }

  redirect("/admin/pedidos");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  // scope "global": revoca la sesión en el servidor y en todos los dispositivos (punto 9).
  await supabase.auth.signOut({ scope: "global" });
  redirect("/admin/login");
}
