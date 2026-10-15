import { z } from "zod";

// Validación de todo lo que llega desde el panel (punto 14).

const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/;
const text = (min: number, max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max).refine((v) => !CONTROL_CHARS.test(v)));

// Precio en soles: acepta "3.20" o "3,20"; positivo, máximo 2 decimales.
const price = z
  .string()
  .transform((v) => v.trim().replace(",", "."))
  .pipe(z.string().regex(/^\d{1,5}(\.\d{1,2})?$/, "Precio inválido"))
  .transform(Number)
  .pipe(z.number().positive().max(99999.99));

const optionalPrice = z
  .string()
  .transform((v) => v.trim())
  .pipe(z.union([z.literal("").transform(() => null), price]));

const checkbox = z
  .union([z.literal("on"), z.literal(""), z.null(), z.undefined()])
  .transform((v) => v === "on");

const sortOrder = z
  .string()
  .transform((v) => (v.trim() === "" ? "0" : v.trim()))
  .pipe(z.string().regex(/^\d{1,4}$/))
  .transform(Number);

export const productSchema = z
  .object({
    name: text(1, 120),
    categoryId: z.guid(),
    unitPrice: price,
    packPrice: optionalPrice,
    packLabel: z
      .string()
      .transform((v) => v.replace(/\s+/g, " ").trim())
      .pipe(z.string().max(30).refine((v) => !CONTROL_CHARS.test(v)))
      .transform((v) => (v === "" ? null : v)),
    sortOrder,
    active: checkbox,
  })
  .refine((p) => (p.packPrice === null) === (p.packLabel === null), {
    message: "El precio por empaque y su etiqueta (ej. Caja x12) van juntos.",
    path: ["packLabel"],
  });

export const categorySchema = z.object({
  name: text(1, 60),
  sortOrder,
  active: checkbox,
});

export const orderStatusSchema = z.enum(["pendiente", "despachado", "cobrado"]);

// Contraseñas: mínimo 10 caracteres (punto 10).
export const passwordSchema = z.string().min(10, "Mínimo 10 caracteres.").max(72, "Máximo 72 caracteres.");

export const newUserSchema = z.object({
  email: z.email().max(254).transform((v) => v.toLowerCase()),
  fullName: text(0, 80),
  role: z.enum(["owner", "staff"]),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
  turnstileToken: z.string().min(1).max(2048),
});
