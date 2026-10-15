import { requireStaff } from "@/lib/auth";
import { createCategory, deleteCategory, updateCategory } from "./actions";
import { CategoryForm } from "./CategoryForm";
import s from "../../admin.module.css";

export default async function CategoriasPage() {
  const staff = await requireStaff();
  const { data: categories, error } = await staff.supabase
    .from("categories")
    .select("id, name, sort_order, active")
    .order("sort_order")
    .order("name");

  return (
    <>
      <h1 className={s.h1}>Categorías</h1>
      <section className={s.panel} aria-labelledby="nueva-t">
        <h2 id="nueva-t" className={s.h2}>
          Nueva categoría
        </h2>
        <CategoryForm
          action={createCategory}
          initial={{ name: "", sortOrder: String((categories?.length ?? 0) + 1), active: true }}
          submitLabel="Crear"
          resetOnSuccess
        />
      </section>
      {error && <p className={s.error}>No se pudieron cargar las categorías.</p>}
      {(categories ?? []).map((c) => (
        <section key={c.id} className={s.card} aria-label={c.name}>
          <h2 className={s.h2}>
            {c.name} {!c.active && <span className={s.tagInactive}>Oculta</span>}
          </h2>
          <CategoryForm
            action={updateCategory.bind(null, c.id)}
            remove={staff.role === "owner" ? deleteCategory.bind(null, c.id) : undefined}
            initial={{ name: c.name, sortOrder: String(c.sort_order), active: c.active }}
            submitLabel="Guardar"
          />
        </section>
      ))}
    </>
  );
}
