import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { productImageUrl } from "@/lib/catalog";
import { removePhoto, updateProduct, uploadPhoto } from "../actions";
import { PhotoForm } from "../PhotoForm";
import { ProductForm } from "../ProductForm";
import s from "../../../admin.module.css";

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();

  const [{ data: product }, { data: categories }] = await Promise.all([
    staff.supabase
      .from("products")
      .select("id, category_id, name, unit_price, pack_price, pack_label, image_path, sort_order, active")
      .eq("id", id)
      .maybeSingle(),
    staff.supabase.from("categories").select("id, name, active").order("sort_order").order("name"),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/productos" className={s.small}>
        ‹ Volver a productos
      </Link>
      <h1 className={s.h1}>{product.name}</h1>
      <div className={s.card}>
        <ProductForm
          action={updateProduct.bind(null, product.id)}
          categories={categories ?? []}
          submitLabel="Guardar cambios"
          initial={{
            name: product.name,
            categoryId: product.category_id,
            unitPrice: Number(product.unit_price).toFixed(2),
            packPrice: product.pack_price === null ? "" : Number(product.pack_price).toFixed(2),
            packLabel: product.pack_label ?? "",
            sortOrder: String(product.sort_order),
            active: product.active,
          }}
        />
      </div>
      <section className={s.card} aria-labelledby="foto-t">
        <h2 id="foto-t" className={s.h2}>
          Foto
        </h2>
        <PhotoForm
          name={product.name}
          imageUrl={productImageUrl(product.image_path)}
          upload={uploadPhoto.bind(null, product.id)}
          remove={removePhoto.bind(null, product.id)}
        />
      </section>
    </>
  );
}
