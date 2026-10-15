import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env.server";
import { formatSoles, toCents } from "@/lib/money";
import { waLink } from "@/lib/whatsapp";
import { STATUS_LABEL, formatDate, type OrderStatus } from "../format";
import { StatusButtons } from "./StatusButtons";
import s from "../../../admin.module.css";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();

  const [{ data: order }, { data: items }] = await Promise.all([
    staff.supabase
      .from("orders")
      .select("id, business_name, total, status, delivery_type, created_at")
      .eq("id", id)
      .maybeSingle(),
    staff.supabase
      .from("order_items")
      .select("id, product_name_snapshot, pack_label_snapshot, form, quantity, unit_price_snapshot, subtotal")
      .eq("order_id", id)
      .order("product_name_snapshot"),
  ]);
  if (!order) notFound();

  // El celular se descifra en la BD; la función verifica que quien pide sea personal.
  const { data: phone } = await staff.supabase.rpc("order_phone", {
    p_order_id: id,
    p_phone_key: serverEnv().PHONE_ENCRYPTION_KEY,
  });

  return (
    <>
      <Link href="/admin/pedidos" className={s.small}>
        ‹ Volver a pedidos
      </Link>
      <div className={s.headRow}>
        <h1 className={s.h1}>{order.business_name}</h1>
        <span className={s.amount}>{formatSoles(toCents(order.total))}</span>
      </div>

      <div className={s.card}>
        <dl className={s.dl}>
          <dt>N.º de pedido</dt>
          <dd>{order.id.slice(0, 8).toUpperCase()}</dd>
          <dt>Fecha</dt>
          <dd>{formatDate(order.created_at)}</dd>
          <dt>Entrega</dt>
          <dd>{order.delivery_type === "reparto" ? "Reparto" : "Recojo en el local"}</dd>
          <dt>Celular</dt>
          <dd>
            {typeof phone === "string" ? (
              <>
                {phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")} ·{" "}
                <a
                  href={waLink(`51${phone}`, `Hola ${order.business_name}, le escribimos de Brillo Sur por su pedido N.º ${order.id.slice(0, 8).toUpperCase()}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Escribir por WhatsApp
                </a>
              </>
            ) : (
              <span className={s.muted}>No disponible</span>
            )}
          </dd>
        </dl>
      </div>

      <section className={s.panel} aria-labelledby="estado-t">
        <h2 id="estado-t" className={s.h2}>
          Estado: {STATUS_LABEL[order.status as OrderStatus]}
        </h2>
        <StatusButtons orderId={order.id} current={order.status as OrderStatus} />
      </section>

      <section className={s.card} aria-labelledby="items-t">
        <h2 id="items-t" className={s.h2}>
          Productos
        </h2>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th className={s.num}>Cant.</th>
                <th className={s.num}>Precio</th>
                <th className={s.num}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((i) => (
                <tr key={i.id}>
                  <td>
                    {i.product_name_snapshot}
                    <br />
                    <span className={s.small}>{i.form === "pack" ? i.pack_label_snapshot : "Unidad"}</span>
                  </td>
                  <td className={s.num}>{i.quantity}</td>
                  <td className={s.num}>{formatSoles(toCents(i.unit_price_snapshot))}</td>
                  <td className={s.num}>{formatSoles(toCents(i.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
