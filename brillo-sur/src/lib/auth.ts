import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "staff";

/**
 * Usuario del panel verificado EN EL SERVIDOR (puntos 6 y 7):
 * - getUser() valida el token con Supabase Auth (no solo lee la cookie).
 * - El rol y el estado se leen de profiles en cada petición, así que
 *   desactivar a alguien surte efecto de inmediato.
 */
export const getStaff = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.active) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name as string | null,
    role: profile.role as Role,
    supabase,
  };
});

/** Para páginas y acciones del panel: sin sesión válida o sin rol → al login. */
export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

/** Solo el dueño (gestión de usuarios). */
export async function requireOwner() {
  const staff = await requireStaff();
  if (staff.role !== "owner") redirect("/admin/pedidos");
  return staff;
}
