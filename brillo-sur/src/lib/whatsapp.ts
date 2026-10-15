import { formatSoles } from "@/lib/money";

/**
 * Enlaces de WhatsApp. Todo el texto (incluido lo que escribe el cliente)
 * pasa por encodeURIComponent (punto 15).
 */
export function waLink(number: string | undefined, text: string): string {
  const digits = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function priceListMessage(businessName: string): string {
  const name = cleanName(businessName);
  return name
    ? `Hola Brillo Sur, soy de ${name}. ¿Me envían su lista de precios mayoristas?`
    : "Hola Brillo Sur, ¿me envían su lista de precios mayoristas?";
}

export type MessageLine = {
  quantity: number;
  formLabel: string; // "und." o "caja x12"
  name: string;
  subtotalCents: number;
};

export function orderMessage(opts: {
  businessName: string;
  lines: MessageLine[];
  totalCents: number;
  delivery: "reparto" | "recojo";
  orderRef?: string;
}): string {
  const name = cleanName(opts.businessName);
  const out = [`Hola Brillo Sur, quiero hacer un pedido${name ? ` para ${name}` : ""}:`];
  for (const l of opts.lines) {
    out.push(`- ${l.quantity} ${l.formLabel} · ${l.name} (${formatSoles(l.subtotalCents)})`);
  }
  out.push(`Total: ${formatSoles(opts.totalCents)}`);
  out.push(opts.delivery === "reparto" ? "Entrega: reparto" : "Entrega: recojo en el local");
  if (opts.orderRef) out.push(`Pedido N.º ${opts.orderRef}`);
  return out.join("\n");
}

// Quita saltos de línea y espacios repetidos para que el cliente no pueda
// "inyectar" líneas falsas en el mensaje (p. ej. un "Total" distinto).
function cleanName(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 80);
}
