import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";
import s from "../../../admin.module.css";

export default async function NuevoProductoPage() {
  const staff = await requireStaff();
  const { data: categories } = await staff.supabase
    .from("categories")
    .select("id, name, active")
    .order("sort_order")
    .order("name");
  return (
    <>
      <Link href="/admin/productos" className={s.small}>
        ‹ Volver a productos
      </Link>
      <h1 className={s.h1}>Nuevo producto</h1>
      <div className={s.card}>
        <ProductForm
          action={createProduct}
          categories={categories ?? []}
          submitLabel="Crear producto"
          initial={{ name: "", categoryId: "", unitPrice: "", packPrice: "", packLabel: "", sortOrder: "0", active: true }}
        />
      </div>
      <p className={s.small}>Podrás subir la foto después de crear el producto.</p>
    </>
  );
}
