import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { formatSoles, toCents } from "@/lib/money";
import { STATUS_LABEL, formatDate, type OrderStatus } from "./format";
import s from "../../admin.module.css";

const TAG = { pendiente: s.tagPendiente, despachado: s.tagDespachado, cobrado: s.tagCobrado };

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const staff = await requireStaff();
  const { estado } = await searchParams;
  const filter = estado && estado in STATUS_LABEL ? (estado as OrderStatus) : null;

  let query = staff.supabase
    .from("orders")
    .select("id, business_name, total, status, delivery_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter) query = query.eq("status", filter);
  const { data: orders, error } = await query;

  return (
    <>
      <div className={s.headRow}>
        <h1 className={s.h1}>Pedidos</h1>
      </div>
      <nav className={s.filters} aria-label="Filtrar por estado">
        <Link href="/admin/pedidos" className={!filter ? s.filterActive : s.filter}>
          Todos
        </Link>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((k) => (
          <Link key={k} href={`/admin/pedidos?estado=${k}`} className={filter === k ? s.filterActive : s.filter}>
            {STATUS_LABEL[k]}
          </Link>
        ))}
      </nav>

      {error ? (
        <p className={s.error}>No se pudieron cargar los pedidos.</p>
      ) : orders.length === 0 ? (
        <p className={s.muted}>No hay pedidos {filter ? `en estado “${STATUS_LABEL[filter]}”` : "todavía"}.</p>
      ) : (
        <ul className={s.list}>
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/pedidos/${o.id}`} className={s.row}>
                <div className={s.rowMain}>
                  <span className={s.rowTitle}>{o.business_name}</span>
                  <span className={s.small}>
                    N.º {o.id.slice(0, 8).toUpperCase()} · {formatDate(o.created_at)} ·{" "}
                    {o.delivery_type === "reparto" ? "Reparto" : "Recojo"}
                  </span>
                </div>
                <div className={s.rowSide}>
                  <span className={s.amount}>{formatSoles(toCents(o.total))}</span>
                  <span className={TAG[o.status as OrderStatus]}>{STATUS_LABEL[o.status as OrderStatus]}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {orders && orders.length === 100 && <p className={s.small}>Se muestran los 100 pedidos más recientes.</p>}
    </>
  );
}
