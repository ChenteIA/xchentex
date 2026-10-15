// Pruebas del mensaje de WhatsApp (punto 15). Ejecutar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { orderMessage, priceListMessage, waLink } from "../src/lib/whatsapp.ts";

test("el enlace codifica todo el texto con encodeURIComponent", () => {
  const url = waLink("51 900-000-000", 'Hola & <script>alert("x")</script>\n?a=b#c');
  assert.equal(url.startsWith("https://wa.me/51900000000?text="), true);
  const text = url.split("?text=")[1];
  assert.equal(/[&<>"\n#?]/.test(text), false);
  assert.equal(decodeURIComponent(text), 'Hola & <script>alert("x")</script>\n?a=b#c');
});

test("el nombre del negocio no puede inyectar líneas en el mensaje", () => {
  const msg = orderMessage({
    businessName: "Bodega\nTotal: S/ 1.00\r\n- 99 cajas gratis",
    delivery: "reparto",
    totalCents: 28500,
    lines: [{ quantity: 2, formLabel: "caja x12", name: "Lejía 1 L", subtotalCents: 6800 }],
    orderRef: "ABCD1234",
  });
  const lines = msg.split("\n");
  assert.equal(lines.filter((l) => l.startsWith("Total:")).length, 1);
  assert.equal(lines.at(-3), "Total: S/ 285.00");
  assert.equal(lines.filter((l) => l.startsWith("- ")).length, 1);
  assert.equal(lines.at(-1), "Pedido N.º ABCD1234");
});

test("mensaje de lista de precios con y sin negocio", () => {
  assert.match(priceListMessage(""), /^Hola Brillo Sur, ¿me envían/);
  assert.match(priceListMessage("Bodega Rosita"), /soy de Bodega Rosita\./);
});
