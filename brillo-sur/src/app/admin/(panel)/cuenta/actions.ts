"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { passwordSchema } from "@/lib/admin-schemas";
import { requireStaff } from "@/lib/auth";
import { allowRequest } from "@/lib/security/rate-limit";
import { clientIp, hashedKey } from "@/lib/security/request";

export type FormState = { error: string | null; ok?: string | null };

const schema = z
  .object({ current: z.string().min(1).max(72), next: passwordSchema, confirm: z.string() })
  .refine((v) => v.next === v.confirm, { message: "Las contraseñas nuevas no coinciden.", path: ["confirm"] });

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  if (!(await allowRequest(hashedKey("pwd-change", clientIp(await headers())), 5, 15 * 60))) {
    return { error: "Demasiados intentos. Espera 15 minutos." };
  }
  const parsed = schema.safeParse({ current: fd.get("current"), next: fd.get("next"), confirm: fd.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  // Confirma la contraseña actual antes de cambiarla.
  const { error: authErr } = await staff.supabase.auth.signInWithPassword({
    email: staff.email,
    password: parsed.data.current,
  });
  if (authErr) return { error: "La contraseña actual no es correcta." };

  const { error } = await staff.supabase.auth.updateUser({ password: parsed.data.next });
  if (error) {
    console.error("[admin] cambiar contraseña", error.code);
    return { error: "No se pudo cambiar la contraseña." };
  }
  return { error: null, ok: "Contraseña actualizada." };
}
