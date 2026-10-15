"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { newUserSchema } from "@/lib/admin-schemas";
import { requireOwner } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type FormState = { error: string | null; ok?: string | null };

/**
 * Crear usuarios es exclusivo del dueño (punto 7). El registro público está
 * desactivado en Supabase, así que esta es la única forma de crear cuentas.
 */
export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireOwner();
  const parsed = newUserSchema.safeParse({
    email: fd.get("email") ?? "",
    fullName: fd.get("fullName") ?? "",
    role: fd.get("role") ?? "",
    password: fd.get("password") ?? "",
  });
  if (!parsed.success) {
    const pw = parsed.error.issues.find((i) => i.path[0] === "password");
    return { error: pw ? "La contraseña debe tener entre 10 y 72 caracteres." : "Revisa el correo y el rol." };
  }
  const u = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password, // Supabase Auth la guarda con bcrypt; nunca pasa por nuestras tablas (punto 10)
    email_confirm: true,
  });
  if (error || !data.user) {
    console.error("[admin] crear usuario", error?.code);
    return {
      error: error?.code === "email_exists" ? "Ya existe un usuario con ese correo." : "No se pudo crear el usuario.",
    };
  }

  const { error: pErr } = await admin
    .from("profiles")
    .insert({ id: data.user.id, role: u.role, full_name: u.fullName || null });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    console.error("[admin] crear perfil", pErr.code);
    return { error: "No se pudo crear el usuario." };
  }
  revalidatePath("/admin/usuarios");
  return { error: null, ok: `Usuario ${u.email} creado. Compártele la contraseña por un canal seguro.` };
}

const updateSchema = z.object({
  id: z.guid(),
  role: z.enum(["owner", "staff"]),
  active: z.boolean(),
});

export async function updateUser(id: string, role: string, active: boolean): Promise<FormState> {
  const owner = await requireOwner();
  const parsed = updateSchema.safeParse({ id, role, active });
  if (!parsed.success) return { error: "Datos inválidos." };
  if (parsed.data.id === owner.id) return { error: "No puedes cambiar tu propio rol ni desactivarte." };

  // Con la sesión del dueño: RLS solo le permite editar a OTROS usuarios.
  const { error, count } = await owner.supabase
    .from("profiles")
    .update({ role: parsed.data.role, active: parsed.data.active }, { count: "exact" })
    .eq("id", parsed.data.id);
  if (error || !count) {
    console.error("[admin] editar usuario", error?.code);
    return { error: "No se pudo guardar." };
  }

  // Desactivar también bloquea el inicio de sesión en Supabase Auth.
  await createAdminClient().auth.admin.updateUserById(parsed.data.id, {
    ban_duration: parsed.data.active ? "none" : "876000h",
  });
  revalidatePath("/admin/usuarios");
  return { error: null, ok: "Guardado." };
}
