import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { productImageUrl } from "@/lib/catalog";
import { formatSoles, toCents } from "@/lib/money";
import s from "../../admin.module.css";

export default async function ProductosPage() {
  const staff = await requireStaff();
  const [{ data: categories }, { data: products, error }] = await Promise.all([
    staff.supabase.from("categories").select("id, name, active").order("sort_order").order("name"),
    staff.supabase
      .from("products")
      .select("id, category_id, name, unit_price, pack_price, pack_label, image_path, active")
      .order("sort_order")
      .order("name"),
  ]);

  return (
    <>
      <div className={s.headRow}>
        <h1 className={s.h1}>Productos</h1>
        <Link href="/admin/productos/nuevo" className={s.btnPrimary}>
          Nuevo producto
        </Link>
      </div>
      {error && <p className={s.error}>No se pudieron cargar los productos.</p>}
      {(categories ?? []).map((c) => {
        const list = (products ?? []).filter((p) => p.category_id === c.id);
        return (
          <section key={c.id} className={s.form} aria-label={c.name}>
            <h2 className={s.h2}>
              {c.name} {!c.active && <span className={s.tagInactive}>Categoría inactiva</span>}
            </h2>
            {list.length === 0 ? (
              <p className={s.small}>Sin productos.</p>
            ) : (
              <ul className={s.list}>
                {list.map((p) => {
                  const img = productImageUrl(p.image_path);
                  return (
                    <li key={p.id}>
                      <Link href={`/admin/productos/${p.id}`} className={s.row}>
                        <div className={s.rowWithThumb}>
                          {img ? (
                            <Image src={img} alt="" width={48} height={48} className={s.thumb} />
                          ) : (
                            <span className={s.thumb} aria-hidden="true" />
                          )}
                          <div className={s.rowMain}>
                            <span className={s.rowTitle}>{p.name}</span>
                            <span className={s.small}>
                              Unidad {formatSoles(toCents(p.unit_price))}
                              {p.pack_price !== null && ` · ${p.pack_label} ${formatSoles(toCents(p.pack_price))}`}
                            </span>
                          </div>
                        </div>
                        {!p.active && <span className={s.tagInactive}>Oculto</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
