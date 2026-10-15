// Prueba la clave PÚBLICA (anon) contra el proyecto real de Supabase.
// Uso:  npm run test:rls:remote   (lee .env.local)
// No modifica datos: todas las escrituras deben ser rechazadas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const db = createClient(url, anonKey, { auth: { persistSession: false } });
const denied = ({ data, error }) => error !== null || (Array.isArray(data) && data.length === 0);

test("anon NO puede leer pedidos", async () => {
  assert.ok(denied(await db.from("orders").select("id").limit(1)));
});

test("anon NO puede leer ítems de pedidos", async () => {
  assert.ok(denied(await db.from("order_items").select("id").limit(1)));
});

test("anon NO puede leer perfiles", async () => {
  assert.ok(denied(await db.from("profiles").select("id").limit(1)));
});

test("anon NO puede crear productos", async () => {
  const { data: cat } = await db.from("categories").select("id").limit(1).single();
  const res = await db.from("products").insert({ category_id: cat?.id, name: "Hack", unit_price: 1 }).select("id");
  assert.ok(res.error, "el insert debió fallar");
});

test("anon NO puede cambiar precios", async () => {
  const res = await db.from("products").update({ unit_price: 0.01 }).gt("unit_price", 0).select("id");
  assert.ok(denied(res), "el update debió fallar o no afectar filas");
});

test("anon NO puede borrar productos", async () => {
  const res = await db.from("products").delete().gt("unit_price", 0).select("id");
  assert.ok(denied(res));
});

test("anon NO puede llamar create_order", async () => {
  const res = await db.rpc("create_order", {
    p_business_name: "Hack", p_phone: "987654321", p_delivery_type: "reparto", p_items: [], p_phone_key: "x",
  });
  assert.ok(res.error);
});

test("anon NO puede leer columnas internas del producto", async () => {
  assert.ok((await db.from("products").select("created_at").limit(1)).error);
});

test("anon SÍ puede leer el catálogo activo", async () => {
  const { data, error } = await db.from("products").select("id, name, unit_price").limit(1);
  assert.equal(error, null);
  assert.ok(Array.isArray(data));
});
