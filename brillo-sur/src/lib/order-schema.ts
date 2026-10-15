import { z } from "zod";
import { ORDER_LIMITS } from "./business.ts";

// Caracteres de control y separadores de línea Unicode (no deben llegar al mensaje).
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/;

/**
 * Lo único que el servidor acepta del navegador al crear un pedido (punto 14).
 * Cualquier otro campo (precio, total, status, id, role…) se descarta en silencio (punto 8).
 */
export const orderRequestSchema = z.object({
  businessName: z
    .string()
    .max(200)
    .transform((v) => v.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(ORDER_LIMITS.businessNameMin)
        .max(ORDER_LIMITS.businessNameMax)
        .refine((v) => !CONTROL_CHARS.test(v)),
    ),
  // Celular peruano: 9 dígitos que empiezan en 9. Se aceptan espacios, guiones y +51.
  phone: z
    .string()
    .max(20)
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?51(?=9\d{8}$)/, ""))
    .pipe(z.string().regex(/^9\d{8}$/)),
  delivery: z.enum(["reparto", "recojo"]),
  items: z
    .array(
      z.object({
        productId: z.guid(),
        form: z.enum(["unit", "pack"]),
        quantity: z.number().int().min(1).max(ORDER_LIMITS.maxQuantity),
      }),
    )
    .min(1)
    .max(ORDER_LIMITS.maxLines)
    .refine((items) => new Set(items.map((i) => `${i.productId}|${i.form}`)).size === items.length, {
      message: "Ítems repetidos",
    }),
  turnstileToken: z.string().min(1).max(2048),
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;

// Respuesta de la función create_order de la base de datos.
export const createOrderResultSchema = z.object({
  order_id: z.guid(),
  total: z.coerce.number(),
  items: z.array(
    z.object({
      name: z.string(),
      form: z.enum(["unit", "pack"]),
      pack_label: z.string().nullable(),
      quantity: z.number().int(),
      unit_price: z.coerce.number(),
      subtotal: z.coerce.number(),
    }),
  ),
});
