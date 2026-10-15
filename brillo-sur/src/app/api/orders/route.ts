import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { toCents } from "@/lib/money";
import { createOrderResultSchema, orderRequestSchema } from "@/lib/order-schema";
import { allowRequest } from "@/lib/security/rate-limit";
import { clientIp, hashedKey, isSameOrigin } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderMessage, waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
// Pedidos por IP: 5 cada 10 minutos (punto 11).
const ORDER_LIMIT = { max: 5, windowSeconds: 10 * 60 };

// Respuestas genéricas: el detalle de cada error solo va a los logs (punto 17).
function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

const MSG = {
  invalid: "Revisa los datos del pedido.",
  bot: "No pudimos verificar que eres una persona. Recarga la página e intenta de nuevo.",
  limit: "Has enviado varios pedidos seguidos. Espera unos minutos e intenta de nuevo.",
  unavailable: "Algún producto ya no está disponible o cambió. Recarga la página para ver el catálogo actualizado.",
  server: "No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp.",
};

export async function POST(request: NextRequest) {
  const env = publicEnv();

  // 1. Solo desde nuestro propio sitio y solo JSON.
  if (!isSameOrigin(request.headers, env.NEXT_PUBLIC_SITE_URL)) return fail(403, MSG.invalid);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return fail(415, MSG.invalid);

  // 2. Límite por IP antes de cualquier trabajo costoso.
  const ip = clientIp(request.headers);
  if (!(await allowRequest(hashedKey("order", ip), ORDER_LIMIT.max, ORDER_LIMIT.windowSeconds))) {
    return fail(429, MSG.limit);
  }

  // 3. Tamaño máximo y JSON válido.
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, MSG.invalid);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, MSG.invalid);
  }

  // 4. Validación estricta con Zod; los campos no previstos se descartan.
  const parsed = orderRequestSchema.safeParse(json);
  if (!parsed.success) {
    console.warn("[orders] validación", parsed.error.issues.map((i) => i.path.join(".")).join(", "));
    return fail(400, MSG.invalid);
  }
  const order = parsed.data;

  // 5. Anti-bot.
  const siteHost = new URL(env.NEXT_PUBLIC_SITE_URL).hostname;
  if (!(await verifyTurnstile(order.turnstileToken, ip, siteHost))) return fail(403, MSG.bot);

  // 6. La base de datos busca los precios reales, recalcula y guarda (punto 8).
  const { data, error } = await createAdminClient().rpc("create_order", {
    p_business_name: order.businessName,
    p_phone: order.phone,
    p_delivery_type: order.delivery,
    p_items: order.items.map((i) => ({ product_id: i.productId, form: i.form, quantity: i.quantity })),
    p_phone_key: serverEnv().PHONE_ENCRYPTION_KEY,
  });

  if (error) {
    console.error("[orders] create_order", error.code, error.message);
    // 22023 = producto inactivo / inexistente / sin empaque; 22P02 = dato con formato inválido.
    if (error.code === "22023" || error.code === "22P02") return fail(422, MSG.unavailable);
    return fail(500, MSG.server);
  }

  const result = createOrderResultSchema.safeParse(data);
  if (!result.success) {
    console.error("[orders] respuesta inesperada de create_order");
    return fail(500, MSG.server);
  }

  // 7. Mensaje de WhatsApp armado con los datos que devolvió la BD, no con los del navegador.
  const { order_id, total, items } = result.data;
  const orderRef = order_id.slice(0, 8).toUpperCase();
  const text = orderMessage({
    businessName: order.businessName,
    delivery: order.delivery,
    totalCents: toCents(total),
    orderRef,
    lines: items.map((i) => ({
      quantity: i.quantity,
      formLabel: i.form === "pack" ? (i.pack_label ?? "").toLowerCase() : "und.",
      name: i.name,
      subtotalCents: toCents(i.subtotal),
    })),
  });

  return NextResponse.json(
    { orderRef, totalCents: toCents(total), whatsappUrl: waLink(env.NEXT_PUBLIC_WHATSAPP_NUMBER, text) },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
