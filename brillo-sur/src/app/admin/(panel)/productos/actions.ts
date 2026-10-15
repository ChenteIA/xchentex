"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { productSchema } from "@/lib/admin-schemas";
import { requireStaff } from "@/lib/auth";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/catalog";
import { MAX_IMAGE_BYTES, detectImage } from "@/lib/image-validation";

export type FormState = { error: string | null; ok?: string | null };

function readProduct(fd: FormData) {
  return productSchema.safeParse({
    name: fd.get("name") ?? "",
    categoryId: fd.get("categoryId") ?? "",
    unitPrice: fd.get("unitPrice") ?? "",
    packPrice: fd.get("packPrice") ?? "",
    packLabel: fd.get("packLabel") ?? "",
    sortOrder: fd.get("sortOrder") ?? "",
    active: fd.get("active"),
  });
}

function firstIssue(e: z.ZodError): string {
  const i = e.issues[0];
  const field: Record<string, string> = {
    name: "Nombre",
    categoryId: "Categoría",
    unitPrice: "Precio por unidad",
    packPrice: "Precio por empaque",
    packLabel: "Etiqueta del empaque",
    sortOrder: "Orden",
  };
  const label = field[String(i.path[0])] ?? "Dato";
  return i.message && !i.message.startsWith("Invalid") && !i.message.startsWith("Too")
    ? i.message
    : `${label}: revisa el valor.`;
}

function refresh() {
  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function createProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = readProduct(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const p = parsed.data;

  const { data, error } = await staff.supabase
    .from("products")
    .insert({
      name: p.name,
      category_id: p.categoryId,
      unit_price: p.unitPrice,
      pack_price: p.packPrice,
      pack_label: p.packLabel,
      sort_order: p.sortOrder,
      active: p.active,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[admin] crear producto", error.code);
    return { error: "No se pudo crear el producto." };
  }
  refresh();
  redirect(`/admin/productos/${data.id}`);
}

export async function updateProduct(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  if (!z.guid().safeParse(id).success) return { error: "Producto inválido." };
  const parsed = readProduct(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const p = parsed.data;

  const { error } = await staff.supabase
    .from("products")
    .update({
      name: p.name,
      category_id: p.categoryId,
      unit_price: p.unitPrice,
      pack_price: p.packPrice,
      pack_label: p.packLabel,
      sort_order: p.sortOrder,
      active: p.active,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] editar producto", error.code);
    return { error: "No se pudo guardar el producto." };
  }
  refresh();
  return { error: null, ok: "Cambios guardados." };
}

/**
 * Sube la foto de un producto (punto 16):
 * - solo personal con sesión (requireStaff + políticas de Storage),
 * - máximo 2 MB, solo JPG/PNG/WebP comprobado por los bytes reales del archivo,
 * - nombre nuevo aleatorio (UUID), nunca el nombre que manda el navegador.
 */
export async function uploadPhoto(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  if (!z.guid().safeParse(id).success) return { error: "Producto inválido." };

  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige una foto." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "La foto pesa más de 2 MB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);
  if (!kind) return { error: "Solo se aceptan fotos JPG, PNG o WebP." };

  const { data: current } = await staff.supabase.from("products").select("image_path").eq("id", id).maybeSingle();
  if (!current) return { error: "Producto no encontrado." };

  const path = `${randomUUID()}.${kind.ext}`;
  const storage = staff.supabase.storage.from(PRODUCT_IMAGES_BUCKET);
  const { error: upErr } = await storage.upload(path, bytes, {
    contentType: kind.mime,
    upsert: false,
    cacheControl: "31536000",
  });
  if (upErr) {
    console.error("[admin] subir foto", upErr.message);
    return { error: "No se pudo subir la foto." };
  }

  const { error } = await staff.supabase.from("products").update({ image_path: path }).eq("id", id);
  if (error) {
    await storage.remove([path]);
    console.error("[admin] guardar foto", error.code);
    return { error: "No se pudo guardar la foto." };
  }
  if (current.image_path) await storage.remove([current.image_path]);

  refresh();
  revalidatePath(`/admin/productos/${id}`);
  return { error: null, ok: "Foto actualizada." };
}

export async function removePhoto(id: string): Promise<FormState> {
  const staff = await requireStaff();
  if (!z.guid().safeParse(id).success) return { error: "Producto inválido." };
  const { data: current } = await staff.supabase.from("products").select("image_path").eq("id", id).maybeSingle();
  if (!current?.image_path) return { error: null };
  const { error } = await staff.supabase.from("products").update({ image_path: null }).eq("id", id);
  if (error) return { error: "No se pudo quitar la foto." };
  await staff.supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([current.image_path]);
  refresh();
  revalidatePath(`/admin/productos/${id}`);
  return { error: null, ok: "Foto eliminada." };
}
