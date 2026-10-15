// Validación de datos del panel (puntos 10 y 14). Ejecutar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { newUserSchema, productSchema } from "../src/lib/admin-schemas.ts";

const base = {
  name: "Lejía 1 L",
  categoryId: "3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b",
  unitPrice: "3.20",
  packPrice: "34",
  packLabel: "Caja x12",
  sortOrder: "1",
  active: "on",
};

test("acepta precios con punto o coma", () => {
  const r = productSchema.safeParse({ ...base, unitPrice: "3,2" });
  assert.equal(r.success, true);
  assert.equal(r.data!.unitPrice, 3.2);
  assert.equal(r.data!.active, true);
});

test("precios positivos con máximo 2 decimales", () => {
  for (const unitPrice of ["0", "-1", "abc", "3.205", "100000", ""]) {
    assert.equal(productSchema.safeParse({ ...base, unitPrice }).success, false, unitPrice);
  }
});

test("empaque: precio y etiqueta van juntos", () => {
  assert.equal(productSchema.safeParse({ ...base, packPrice: "", packLabel: "" }).success, true);
  assert.equal(productSchema.safeParse({ ...base, packPrice: "", packLabel: "Caja" }).success, false);
  assert.equal(productSchema.safeParse({ ...base, packPrice: "10", packLabel: "" }).success, false);
});

test("checkbox sin marcar = inactivo", () => {
  assert.equal(productSchema.safeParse({ ...base, active: null }).data!.active, false);
});

test("contraseñas de al menos 10 caracteres", () => {
  const u = { email: "a@b.pe", fullName: "", role: "staff", password: "123456789" };
  assert.equal(newUserSchema.safeParse(u).success, false);
  assert.equal(newUserSchema.safeParse({ ...u, password: "1234567890" }).success, true);
  assert.equal(newUserSchema.safeParse({ ...u, role: "admin", password: "1234567890" }).success, false);
});
