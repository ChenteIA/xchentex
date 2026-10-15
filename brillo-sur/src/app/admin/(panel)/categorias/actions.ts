"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { categorySchema } from "@/lib/admin-schemas";
import { requireOwner, requireStaff } from "@/lib/auth";

export type FormState = { error: string | null; ok?: string | null };

function read(fd: FormData) {
  return categorySchema.safeParse({
    name: fd.get("name") ?? "",
    sortOrder: fd.get("sortOrder") ?? "",
    active: fd.get("active"),
  });
}

function refresh() {
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function createCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = read(fd);
  if (!parsed.success) return { error: "Revisa el nombre (1 a 60 caracteres) y el orden." };
  const { error } = await staff.supabase
    .from("categories")
    .insert({ name: parsed.data.name, sort_order: parsed.data.sortOrder, active: parsed.data.active });
  if (error) {
    console.error("[admin] crear categoría", error.code);
    return { error: "No se pudo crear la categoría." };
  }
  refresh();
  return { error: null, ok: "Categoría creada." };
}

export async function updateCategory(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  if (!z.guid().safeParse(id).success) return { error: "Categoría inválida." };
  const parsed = read(fd);
  if (!parsed.success) return { error: "Revisa el nombre (1 a 60 caracteres) y el orden." };
  const { error } = await staff.supabase
    .from("categories")
    .update({ name: parsed.data.name, sort_order: parsed.data.sortOrder, active: parsed.data.active })
    .eq("id", id);
  if (error) {
    console.error("[admin] editar categoría", error.code);
    return { error: "No se pudo guardar." };
  }
  refresh();
  return { error: null, ok: "Guardado." };
}

export async function deleteCategory(id: string): Promise<FormState> {
  const owner = await requireOwner();
  if (!z.guid().safeParse(id).success) return { error: "Categoría inválida." };
  const { error, count } = await owner.supabase.from("categories").delete({ count: "exact" }).eq("id", id);
  if (error) {
    // 23503: todavía tiene productos (la BD lo impide con on delete restrict).
    return {
      error: error.code === "23503" ? "Tiene productos. Muévelos o desactiva la categoría." : "No se pudo eliminar.",
    };
  }
  if (!count) return { error: "No se pudo eliminar." };
  refresh();
  return { error: null, ok: "Categoría eliminada." };
}
