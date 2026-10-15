// Pruebas de validación de pedidos (puntos 8 y 14). Ejecutar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { orderRequestSchema } from "../src/lib/order-schema.ts";

const ID = "3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b";
const valid = {
  businessName: "Bodega Rosita",
  phone: "987654321",
  delivery: "reparto",
  turnstileToken: "token",
  items: [{ productId: ID, form: "unit", quantity: 2 }],
};

test("acepta un pedido válido", () => {
  assert.equal(orderRequestSchema.safeParse(valid).success, true);
});

test("descarta precios, totales, estado, id y rol enviados por el navegador", () => {
  const r = orderRequestSchema.safeParse({
    ...valid,
    total: 0.01,
    status: "cobrado",
    id: "x",
    role: "owner",
    items: [{ ...valid.items[0], unitPrice: 0.01, subtotal: 0 }],
  });
  assert.equal(r.success, true);
  assert.deepEqual(Object.keys(r.data!).sort(), ["businessName", "delivery", "items", "phone", "turnstileToken"]);
  assert.deepEqual(Object.keys(r.data!.items[0]).sort(), ["form", "productId", "quantity"]);
});

test("normaliza el celular (+51, espacios, guiones)", () => {
  for (const phone of ["+51 987 654 321", "51987654321", "987-654-321"]) {
    const r = orderRequestSchema.safeParse({ ...valid, phone });
    assert.equal(r.success, true, phone);
    assert.equal(r.data!.phone, "987654321");
  }
});

test("rechaza celulares inválidos", () => {
  for (const phone of ["887654321", "98765432", "9876543210", "abc", ""]) {
    assert.equal(orderRequestSchema.safeParse({ ...valid, phone }).success, false, phone);
  }
});

test("aplana saltos de línea en el nombre del negocio", () => {
  const r = orderRequestSchema.safeParse({ ...valid, businessName: "Bodega\nTotal: S/ 1.00" });
  assert.equal(r.success, true);
  assert.equal(r.data!.businessName, "Bodega Total: S/ 1.00");
});

test("rechaza nombres muy cortos, muy largos o con caracteres de control", () => {
  for (const businessName of ["A", " ", "x".repeat(81), "Bodega\u0000"]) {
    assert.equal(orderRequestSchema.safeParse({ ...valid, businessName }).success, false, JSON.stringify(businessName));
  }
});

test("cantidades enteras entre 1 y 999", () => {
  for (const quantity of [0, -1, 1000, 1.5, "2"]) {
    const items = [{ productId: ID, form: "unit", quantity }];
    assert.equal(orderRequestSchema.safeParse({ ...valid, items }).success, false, String(quantity));
  }
});

test("máximo 40 líneas, mínimo 1, sin repetidos y con IDs válidos", () => {
  const many = Array.from({ length: 41 }, (_, i) => ({
    productId: `3f2b8c1e-5a4d-4e6f-9a1b-${String(i).padStart(12, "0")}`,
    form: "unit",
    quantity: 1,
  }));
  assert.equal(orderRequestSchema.safeParse({ ...valid, items: many }).success, false);
  assert.equal(orderRequestSchema.safeParse({ ...valid, items: [] }).success, false);
  assert.equal(orderRequestSchema.safeParse({ ...valid, items: [valid.items[0], valid.items[0]] }).success, false);
  assert.equal(
    orderRequestSchema.safeParse({ ...valid, items: [{ productId: "1 OR 1=1", form: "unit", quantity: 1 }] }).success,
    false,
  );
});

test("rechaza formas y entregas desconocidas", () => {
  assert.equal(
    orderRequestSchema.safeParse({ ...valid, items: [{ productId: ID, form: "pallet", quantity: 1 }] }).success,
    false,
  );
  assert.equal(orderRequestSchema.safeParse({ ...valid, delivery: "dron" }).success, false);
});

test("exige token anti-bot", () => {
  const { turnstileToken: _omit, ...rest } = valid;
  void _omit;
  assert.equal(orderRequestSchema.safeParse(rest).success, false);
});
