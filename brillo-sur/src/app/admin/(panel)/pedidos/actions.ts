"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { orderStatusSchema } from "@/lib/admin-schemas";
import { requireStaff } from "@/lib/auth";

export async function setOrderStatus(orderId: string, status: string): Promise<{ error: string | null }> {
  const staff = await requireStaff(); // sesión + rol en el servidor (puntos 6 y 7)
  const parsed = z.object({ orderId: z.guid(), status: orderStatusSchema }).safeParse({ orderId, status });
  if (!parsed.success) return { error: "Estado inválido." };

  // Con la sesión del usuario: RLS + permiso de columna solo permiten cambiar "status".
  const { error } = await staff.supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.orderId);
  if (error) {
    console.error("[admin] estado de pedido", error.code);
    return { error: "No se pudo actualizar el estado." };
  }
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${parsed.data.orderId}`);
  return { error: null };
}
